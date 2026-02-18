import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema, sendMoneySchema } from "@shared/schema";
import { getExchangeRates, getFeePercent, convertCurrency } from "./services/exchangeRateService";
import * as burjxService from "./services/burjxService";
import * as burjxOnramp from "./services/burjxOnrampService";
import * as onmetaService from "./services/onmetaService";

const JWT_SECRET = process.env.SESSION_SECRET!;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const cookieParser = (await import("cookie-parser")).default;
  app.use(cookieParser());

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, fullName, phone, country } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const currencyMap: Record<string, string> = { AE: "AED", IN: "INR", PH: "PHP", ID: "IDR" };
      const currency = currencyMap[country] || "AED";

      const user = await storage.createUser({ email, phone, fullName, passwordHash, country, currency });
      const token = generateToken(user.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { passwordHash: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(user.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { passwordHash: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      let user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.kycStatus !== "verified" && user.country === "AE") {
        try {
          const kycResult = await burjxService.getKycStatus();
          if (kycResult.verified) {
            await storage.updateUser(userId, { kycStatus: "verified" });
            user = (await storage.getUser(userId))!;
          }
        } catch {
        }
      }

      const { passwordHash: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token");
    return res.json({ success: true });
  });

  // User routes
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    const userId = (req as any).userId;
    let user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.kycStatus !== "verified" && user.country === "AE") {
      try {
        const kycResult = await burjxService.getKycStatus();
        if (kycResult.verified && user.kycStatus !== "verified") {
          await storage.updateUser(userId, { kycStatus: "verified" });
          user = (await storage.getUser(userId))!;
        }
      } catch (err: any) {
        console.log("[Profile] BurjX KYC check skipped:", err.message);
      }
    }

    const { passwordHash: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  app.put("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { fullName, phone } = req.body;
      const updated = await storage.updateUser(userId, { fullName, phone });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash: _, ...safeUser } = updated;
      return res.json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Update failed" });
    }
  });

  app.post("/api/user/deposit", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { amount, source, description } = req.body;

      if (!amount || amount < 10) {
        return res.status(400).json({ message: "Minimum deposit is 10" });
      }

      await storage.updateUserBalance(userId, amount.toString());

      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: (await storage.getUser(userId))?.currency || "AED",
        source: source || "Bank Transfer",
        description: description || "Deposit",
        status: "completed",
      });

      const user = await storage.getUser(userId);
      const { passwordHash: _, ...safeUser } = user!;
      return res.json({ user: safeUser, success: true });
    } catch (err) {
      console.error("Deposit error:", err);
      return res.status(500).json({ message: "Deposit failed" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const txs = await storage.getTransactions(userId);
      return res.json(txs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions/send", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { recipientEmail, amount, currency, toCurrency } = req.body;

      if (!recipientEmail || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid transfer details" });
      }

      const sender = await storage.getUser(userId);
      if (!sender) return res.status(404).json({ message: "Sender not found" });

      const recipient = await storage.getUserByEmail(recipientEmail);
      if (!recipient) return res.status(404).json({ message: "Recipient not found on TigerPayX" });
      if (recipient.id === userId) return res.status(400).json({ message: "Cannot send to yourself" });

      const senderBalance = parseFloat(sender.balance as string);
      if (senderBalance < amount) return res.status(400).json({ message: "Insufficient balance" });

      const fromCur = currency || sender.currency;
      const toCur = toCurrency || recipient.currency;
      const { convertedAmount, fee } = await convertCurrency(amount, fromCur, toCur);
      const finalAmount = fromCur !== toCur ? convertedAmount : amount;

      await storage.updateUserBalance(userId, (-amount).toString());
      await storage.updateUserBalance(recipient.id, finalAmount.toFixed(2));

      await storage.createTransaction({
        userId,
        type: "send",
        amount: amount.toString(),
        currency: fromCur,
        recipientId: recipient.id,
        recipientName: recipient.fullName,
        source: "TigerPayX",
        description: `Sent to ${recipient.fullName}`,
        status: "completed",
      });

      await storage.createTransaction({
        userId: recipient.id,
        type: "receive",
        amount: finalAmount.toFixed(2),
        currency: toCur,
        recipientId: userId,
        recipientName: sender.fullName,
        source: "TigerPayX",
        description: `Received from ${sender.fullName}`,
        status: "completed",
      });

      return res.json({ success: true, convertedAmount: finalAmount, fee });
    } catch (err: any) {
      console.error("Send error:", err);
      return res.status(500).json({ message: "Transfer failed" });
    }
  });

  // Exchange rate routes (using service)
  app.get("/api/exchange-rate", async (req, res) => {
    try {
      const from = (req.query.from as string) || "AED";
      const to = (req.query.to as string) || "USD";
      const amount = parseFloat(req.query.amount as string) || 1;

      const result = await convertCurrency(amount, from, to);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  app.get("/api/supported-currencies", (_req, res) => {
    return res.json([
      { code: "AED", name: "UAE Dirham", symbol: "AED" },
      { code: "INR", name: "Indian Rupee", symbol: "INR" },
      { code: "PHP", name: "Philippine Peso", symbol: "PHP" },
      { code: "USD", name: "US Dollar", symbol: "USD" },
      { code: "GBP", name: "British Pound", symbol: "GBP" },
      { code: "IDR", name: "Indonesian Rupiah", symbol: "IDR" },
    ]);
  });

  // Roar Score
  app.get("/api/roar-score", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const score = user.roarScore;
      let tier = "Cub";
      if (score > 700) tier = "Apex";
      else if (score > 550) tier = "Alpha";
      else if (score > 300) tier = "Tiger";
      return res.json({ score, tier });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ==========================================
  // BurjX API Routes (UAE - AED)
  // ==========================================

  app.get("/api/burjx/status", authenticateToken, async (_req, res) => {
    try {
      const status = await burjxService.getConnectionStatus();
      return res.json(status);
    } catch (err: any) {
      return res.json({ connected: false, authenticated: false, userId: null, error: err.message });
    }
  });

  app.post("/api/burjx/connect", authenticateToken, async (_req, res) => {
    try {
      const session = await burjxService.authenticateUser();
      return res.json({ success: true, userId: session.userId, accountId: session.accountId });
    } catch (err: any) {
      console.error("[BurjX] Connect error:", err);
      return res.status(500).json({ message: "Failed to connect to payment provider", error: err.message });
    }
  });

  app.get("/api/burjx/account", authenticateToken, async (_req, res) => {
    try {
      const balance = await burjxService.getAccountBalance();
      return res.json(balance);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get account info", error: err.message });
    }
  });

  app.post("/api/burjx/deposit", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { amount } = req.body;

      if (!amount || amount < 10) {
        return res.status(400).json({ message: "Minimum deposit is 10 AED" });
      }

      const ticket = await burjxOnramp.createDepositTicket(amount);

      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: "AED",
        source: "BurjX Bank Transfer",
        description: `Deposit via bank transfer (Ref: ${ticket.ticketId})`,
        status: "pending",
      });

      return res.json({
        success: true,
        ticket,
        message: "Bank transfer details generated. Please complete the transfer to fund your account.",
      });
    } catch (err: any) {
      console.error("[BurjX] Deposit error:", err);
      return res.status(500).json({ message: "Failed to create deposit", error: err.message });
    }
  });

  app.get("/api/burjx/deposits", authenticateToken, async (_req, res) => {
    try {
      const tickets = await burjxOnramp.getDepositTickets();
      return res.json(tickets);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get deposits", error: err.message });
    }
  });

  app.get("/api/burjx/deposit/:ticketId/status", authenticateToken, async (req, res) => {
    try {
      const result = await burjxOnramp.getDepositStatus(req.params.ticketId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to check deposit status", error: err.message });
    }
  });

  app.post("/api/burjx/withdraw", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { amount, iban, bankName, accountHolderName } = req.body;

      if (!amount || amount < 10) {
        return res.status(400).json({ message: "Minimum withdrawal is 10 AED" });
      }
      if (!iban) {
        return res.status(400).json({ message: "IBAN is required" });
      }
      if (!accountHolderName) {
        return res.status(400).json({ message: "Account holder name is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const balance = parseFloat(user.balance as string);
      if (balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const result = await burjxOnramp.createWithdrawal({ amount, iban, bankName, accountHolderName });

      await storage.updateUserBalance(userId, (-amount).toString());

      await storage.createTransaction({
        userId,
        type: "send",
        amount: amount.toString(),
        currency: "AED",
        source: "BurjX Withdrawal",
        description: `Withdrawal to bank (IBAN: ...${iban.slice(-4)})`,
        status: "pending",
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[BurjX] Withdraw error:", err);
      return res.status(500).json({ message: "Withdrawal failed", error: err.message });
    }
  });

  app.get("/api/burjx/kyc/status", authenticateToken, async (req, res) => {
    try {
      const kycResult = await burjxService.getKycStatus();
      const userId = (req as any).userId;
      if (kycResult.verified) {
        await storage.updateUser(userId, { kycStatus: "verified" });
      }
      return res.json(kycResult);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get KYC status", error: err.message });
    }
  });

  app.post("/api/burjx/kyc/submit", authenticateToken, async (req, res) => {
    try {
      const result = await burjxService.submitKyc(req.body);
      return res.json(result);
    } catch (err: any) {
      console.error("[BurjX] KYC submit error:", err);
      return res.status(500).json({ message: "KYC submission failed", error: err.message });
    }
  });

  // ==========================================
  // OnMeta API Routes (India, Philippines, Indonesia)
  // ==========================================

  app.post("/api/onmeta/login", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const result = await onmetaService.customerLogin({
        email: user.email,
        phone: user.phone || undefined,
        name: user.fullName,
        country: user.country,
      });

      return res.json(result);
    } catch (err: any) {
      console.error("[OnMeta] Login error:", err);
      return res.status(500).json({ message: "Failed to connect to payment provider", error: err.message });
    }
  });

  app.get("/api/onmeta/kyc/status", authenticateToken, async (req, res) => {
    try {
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const status = await onmetaService.getKycStatus(authToken);
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get KYC status", error: err.message });
    }
  });

  app.post("/api/onmeta/kyc/submit", authenticateToken, async (req, res) => {
    try {
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const result = await onmetaService.submitKyc(authToken, req.body);
      return res.json(result);
    } catch (err: any) {
      console.error("[OnMeta] KYC submit error:", err);
      return res.status(500).json({ message: "KYC submission failed", error: err.message });
    }
  });

  app.get("/api/onmeta/payment-methods", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const methods = onmetaService.getSupportedPaymentMethods(user.country);
      return res.json(methods.map(m => ({
        id: m,
        label: onmetaService.getPaymentMethodLabel(m),
      })));
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get payment methods" });
    }
  });

  app.post("/api/onmeta/quotation", authenticateToken, async (req, res) => {
    try {
      const { currency, amount, type } = req.body;
      const result = await onmetaService.getQuotation({
        currency: currency || "INR",
        amount: amount || 0,
        type: type || "deposit",
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get quotation", error: err.message });
    }
  });

  app.post("/api/onmeta/deposit", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { amount, paymentMethod } = req.body;
      if (!amount || amount < 50) {
        return res.status(400).json({ message: "Minimum deposit varies by currency" });
      }

      const order = await onmetaService.createDepositOrder(authToken, {
        currency: user.currency,
        amount,
        paymentMethod: paymentMethod || "bank_transfer",
      });

      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: user.currency,
        source: `OnMeta ${onmetaService.getPaymentMethodLabel(paymentMethod || "bank_transfer")}`,
        description: `Deposit via ${onmetaService.getPaymentMethodLabel(paymentMethod || "bank_transfer")} (Ref: ${order.orderId})`,
        status: "pending",
      });

      return res.json({
        success: true,
        order,
        message: "Payment initiated. Please complete the payment to fund your account.",
      });
    } catch (err: any) {
      console.error("[OnMeta] Deposit error:", err);
      return res.status(500).json({ message: "Deposit failed", error: err.message });
    }
  });

  app.post("/api/onmeta/withdraw", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { amount, bankAccountId } = req.body;
      if (!amount || amount < 50) {
        return res.status(400).json({ message: "Minimum withdrawal varies by currency" });
      }

      const balance = parseFloat(user.balance as string);
      if (balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const order = await onmetaService.createWithdrawalOrder(authToken, {
        currency: user.currency,
        amount,
        bankAccountId,
      });

      await storage.updateUserBalance(userId, (-amount).toString());

      await storage.createTransaction({
        userId,
        type: "send",
        amount: amount.toString(),
        currency: user.currency,
        source: "OnMeta Withdrawal",
        description: `Withdrawal to bank (Ref: ${order.orderId})`,
        status: "pending",
      });

      return res.json({ success: true, ...order });
    } catch (err: any) {
      console.error("[OnMeta] Withdraw error:", err);
      return res.status(500).json({ message: "Withdrawal failed", error: err.message });
    }
  });

  app.get("/api/onmeta/orders", authenticateToken, async (req, res) => {
    try {
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const page = parseInt(req.query.page as string) || 1;
      const result = await onmetaService.getOrderHistory(authToken, page);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get orders", error: err.message });
    }
  });

  app.get("/api/onmeta/order/:orderId/status", authenticateToken, async (req, res) => {
    try {
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const result = await onmetaService.getOrderStatus(authToken, req.params.orderId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get order status", error: err.message });
    }
  });

  app.post("/api/onmeta/bank-account", authenticateToken, async (req, res) => {
    try {
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const result = await onmetaService.addBankAccount(authToken, req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to add bank account", error: err.message });
    }
  });

  app.get("/api/onmeta/bank-accounts", authenticateToken, async (req, res) => {
    try {
      const authToken = req.headers["x-onmeta-token"] as string;
      if (!authToken) return res.status(400).json({ message: "OnMeta token required" });

      const accounts = await onmetaService.getBankAccounts(authToken);
      return res.json(accounts);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get bank accounts", error: err.message });
    }
  });

  // ==========================================
  // Provider routing - auto-selects BurjX or OnMeta based on country
  // ==========================================

  app.get("/api/payment-provider", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      let provider: string;
      let paymentMethods: { id: string; label: string }[] = [];

      if (user.country === "AE") {
        provider = "burjx";
        paymentMethods = [{ id: "bank_transfer", label: "Bank Transfer (AED)" }];
      } else if (["IN", "PH", "ID"].includes(user.country)) {
        provider = "onmeta";
        const methods = onmetaService.getSupportedPaymentMethods(user.country);
        paymentMethods = methods.map(m => ({
          id: m,
          label: onmetaService.getPaymentMethodLabel(m),
        }));
      } else {
        provider = "manual";
        paymentMethods = [{ id: "bank_transfer", label: "Bank Transfer" }];
      }

      return res.json({
        provider,
        country: user.country,
        currency: user.currency,
        paymentMethods,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to determine payment provider" });
    }
  });

  return httpServer;
}
