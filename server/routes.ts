import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { registerSchema, loginSchema, sendMoneySchema, leanDepositSchema, insertEarlyAccessSchema, updateProfileSchema, onmetaQuotationSchema, onmetaDepositSchema, onmetaWithdrawSchema, burjxDepositSchema, burjxWithdrawSchema, onmetaBankAccountSchema, tazapayDepositSchema, tazapayWithdrawSchema, createBeneficiarySchema } from "@shared/schema";
import { getExchangeRates, getFeePercent, convertCurrency } from "./services/exchangeRateService";
import * as burjxService from "./services/burjxService";
import * as burjxOnramp from "./services/burjxOnrampService";
import * as onmetaService from "./services/onmetaService";
import * as tazapayService from "./services/tazapayService";
import * as leanService from "./services/leanService";
import * as settlementService from "./services/settlementService";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set and at least 32 characters");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// KYC enforcement middleware — blocks deposits/withdrawals for unverified users
async function requireKyc(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.kycStatus !== "verified") {
      return res.status(403).json({ message: "KYC verification required before making transactions" });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const cookieParser = (await import("cookie-parser")).default;
  app.use(cookieParser());

  // Auth routes
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, fullName, phone, country, accountType } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const currencyMap: Record<string, string> = { AE: "AED", IN: "INR", PH: "PHP", ID: "IDR" };
      const currency = currencyMap[country] || "AED";
      const role = accountType || "individual";

      const user = await storage.createUser({ email, phone, fullName, passwordHash, country, currency, role });
      const token = generateToken(user.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      const { passwordHash: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
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
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
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
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

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
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { passwordHash: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  app.put("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { fullName, phone } = parsed.data;
      const updated = await storage.updateUser(userId, { fullName, phone });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash: _, ...safeUser } = updated;
      return res.json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Update failed" });
    }
  });

  // Manual deposit removed — all deposits must go through a real provider (Lean, BurjX, OnMeta, Tazapay)

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

  app.post("/api/transactions/send", apiLimiter, authenticateToken, requireKyc, async (req, res) => {
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

      const fromCur = currency || sender.currency;
      const toCur = toCurrency || recipient.currency;
      const { convertedAmount, fee } = await convertCurrency(amount, fromCur, toCur);
      const finalAmount = fromCur !== toCur ? convertedAmount : amount;

      // Atomic balance check + debit (prevents race condition)
      const debited = await storage.debitBalance(userId, amount);
      if (!debited) return res.status(400).json({ message: "Insufficient balance" });

      await storage.updateUserBalance(recipient.id, finalAmount.toFixed(2));

      const senderTx = await storage.createTransaction({
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

      // Track cross-provider settlement with USDC bridge
      let bridge: any = null;
      if (settlementService.isCrossProviderTransfer(sender.country, recipient.country, sender.role, recipient.role)) {
        try {
          // Bridge: AED → USDC on Solana → OnMeta → recipient fiat
          const bridgeResult = await burjxOnramp.convertAndBridgeToSettlement(amount);

          await settlementService.recordBridgeSettlement({
            transactionId: senderTx.id,
            senderProvider: settlementService.getProviderForCountry(sender.country, sender.role),
            recipientProvider: settlementService.getProviderForCountry(recipient.country, recipient.role),
            amountAed: amount,
            amountUsdc: bridgeResult.amountUsdc,
            amountRecipient: finalAmount,
            senderCurrency: fromCur,
            recipientCurrency: toCur,
            bridgeTxHash: bridgeResult.bridgeTxHash,
          });

          bridge = {
            txHash: bridgeResult.bridgeTxHash,
            amountUsdc: bridgeResult.amountUsdc,
            wallet: bridgeResult.wallet,
            network: bridgeResult.network,
            token: bridgeResult.token,
          };
        } catch (err) {
          console.error("Bridge settlement error (non-blocking):", err);
        }
      }

      return res.json({ success: true, convertedAmount: finalAmount, fee, bridge });
    } catch (err: any) {
      console.error("Send error:", err);
      return res.status(500).json({ message: "Transfer failed" });
    }
  });

  // Exchange rate routes (using service)
  app.get("/api/exchange-rate", apiLimiter, async (req, res) => {
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
      return res.json({ connected: false, authenticated: false, userId: null });
    }
  });

  app.post("/api/burjx/connect", authenticateToken, async (_req, res) => {
    try {
      const session = await burjxService.authenticateUser();
      return res.json({ success: true, userId: session.userId, accountId: session.accountId });
    } catch (err: any) {
      console.error("[BurjX] Connect error:", err);
      return res.status(500).json({ message: "Failed to connect to payment provider" });
    }
  });

  app.get("/api/burjx/account", authenticateToken, async (_req, res) => {
    try {
      const balance = await burjxService.getAccountBalance();
      return res.json(balance);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get account info" });
    }
  });

  app.post("/api/burjx/deposit", authenticateToken, requireKyc, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const parsed = burjxDepositSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { amount } = parsed.data;

      const ticket = await burjxOnramp.createDepositTicket(amount);

      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: "AED",
        source: "BurjX Bank Transfer",
        description: `Deposit via bank transfer (Ref: ${ticket.ticketId})`,
        status: "pending",
        providerRef: ticket.ticketId,
      });

      return res.json({
        success: true,
        ticket,
        accountId: ticket.accountId || null,
        walletManagedBy: "burjx",
        message: "Bank transfer details generated by BurjX. BurjX creates and manages the AED wallet/account when your deposit is processed.",
      });
    } catch (err: any) {
      console.error("[BurjX] Deposit error:", err);
      return res.status(500).json({ message: "Failed to create deposit" });
    }
  });

  app.get("/api/burjx/deposits", authenticateToken, async (_req, res) => {
    try {
      const userId = (_req as any).userId;
      const userDeposits = (await storage.getTransactions(userId))
        .filter((tx) =>
          tx.type === "deposit" &&
          tx.source === "BurjX Bank Transfer" &&
          !!tx.providerRef
        );

      if (userDeposits.length === 0) {
        return res.json([]);
      }

      const tickets = await burjxOnramp.getDepositTickets();
      const ticketMap = new Map(tickets.map((t) => [t.ticketId, t]));

      const enriched = userDeposits.map((tx) => {
        const providerRef = tx.providerRef as string;
        const ticket = ticketMap.get(providerRef);
        const providerStatus = ticket?.status || "unknown";
        const received = ticket ? burjxOnramp.isDepositCompletedStatus(ticket.status) : tx.status === "completed";

        return {
          ticketId: providerRef,
          accountId: ticket?.accountId || null,
          amount: ticket?.amount ?? parseFloat(tx.amount),
          currency: "AED",
          providerStatus,
          received,
          localTransactionStatus: tx.status,
          createdAt: ticket?.createdAt || tx.createdAt,
          walletManagedBy: "burjx",
        };
      });

      return res.json(enriched);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get deposits" });
    }
  });

  app.get("/api/burjx/deposit/:ticketId/status", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const ticketId = String(req.params.ticketId || "").trim();
      if (!ticketId) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      const userTxs = await storage.getTransactions(userId);
      const depositTx = userTxs.find(
        (tx) =>
          tx.type === "deposit" &&
          tx.source === "BurjX Bank Transfer" &&
          tx.providerRef === ticketId
      );

      if (!depositTx) {
        return res.status(404).json({ message: "Deposit ticket not found for this user" });
      }

      const result = await burjxOnramp.getDepositStatus(ticketId);
      let localTransactionStatus = depositTx.status;

      if (result.received) {
        const { db } = await import("./db");
        const { transactions } = await import("@shared/schema");
        const { and, eq } = await import("drizzle-orm");

        const transitioned = await db.update(transactions)
          .set({ status: "completed" })
          .where(and(eq(transactions.id, depositTx.id), eq(transactions.status, "pending")))
          .returning({ id: transactions.id });

        if (transitioned.length > 0) {
          await storage.updateUserBalance(userId, result.amount.toFixed(2));
        }
        localTransactionStatus = "completed";
      }

      return res.json({
        ticketId,
        amount: result.amount,
        providerStatus: result.status,
        received: result.received,
        localTransactionStatus,
        walletManagedBy: "burjx",
      });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to check deposit status" });
    }
  });

  app.post("/api/burjx/deposits/sync", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const userDeposits = (await storage.getTransactions(userId))
        .filter((tx) =>
          tx.type === "deposit" &&
          tx.source === "BurjX Bank Transfer" &&
          tx.status === "pending" &&
          !!tx.providerRef
        );

      if (userDeposits.length === 0) {
        return res.json({ updated: 0, creditedAmount: "0.00" });
      }

      const tickets = await burjxOnramp.getDepositTickets();
      const ticketMap = new Map(tickets.map((t) => [t.ticketId, t]));
      const { db } = await import("./db");
      const { transactions } = await import("@shared/schema");
      const { and, eq } = await import("drizzle-orm");

      let updated = 0;
      let totalCredited = 0;

      for (const tx of userDeposits) {
        const providerRef = tx.providerRef as string;
        const ticket = ticketMap.get(providerRef);
        if (!ticket || !burjxOnramp.isDepositCompletedStatus(ticket.status)) {
          continue;
        }

        const transitioned = await db.update(transactions)
          .set({ status: "completed" })
          .where(and(eq(transactions.id, tx.id), eq(transactions.status, "pending")))
          .returning({ id: transactions.id });

        if (transitioned.length === 0) {
          continue;
        }

        const amountToCredit = Number.isFinite(ticket.amount) && ticket.amount > 0
          ? ticket.amount
          : parseFloat(tx.amount);

        await storage.updateUserBalance(userId, amountToCredit.toFixed(2));
        totalCredited += amountToCredit;
        updated += 1;
      }

      return res.json({
        updated,
        creditedAmount: totalCredited.toFixed(2),
        walletManagedBy: "burjx",
      });
    } catch (err: any) {
      console.error("[BurjX] Deposit sync error:", err);
      return res.status(500).json({ message: "Failed to sync BurjX deposits" });
    }
  });

  app.post("/api/burjx/withdraw", authenticateToken, requireKyc, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const parsed = burjxWithdrawSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { amount, iban, bankName, accountHolderName } = parsed.data;

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
      return res.status(500).json({ message: "Withdrawal failed" });
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
      return res.status(500).json({ message: "Failed to get KYC status" });
    }
  });

  app.post("/api/burjx/kyc/submit", authenticateToken, async (req, res) => {
    try {
      const result = await burjxService.submitKyc(req.body);
      return res.json(result);
    } catch (err: any) {
      console.error("[BurjX] KYC submit error:", err);
      return res.status(500).json({ message: "KYC submission failed" });
    }
  });

  // ==========================================
  // OnMeta API Routes (India, Philippines, Indonesia)
  // ==========================================

  // Internal helper: get OnMeta token for a user (never exposed to client)
  async function getOnmetaToken(user: { email: string; phone: string | null; fullName: string; country: string }) {
    const result = await onmetaService.customerLogin({
      email: user.email,
      phone: user.phone || undefined,
      name: user.fullName,
      country: user.country,
    });
    return result.token;
  }

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

      // Only return non-sensitive fields — token stays server-side
      return res.json({
        customerId: result.customerId,
        kycRequired: result.kycRequired,
      });
    } catch (err: any) {
      console.error("[OnMeta] Login error:", err);
      return res.status(500).json({ message: "Failed to connect to payment provider" });
    }
  });

  app.get("/api/onmeta/kyc/status", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);
      const status = await onmetaService.getKycStatus(authToken);
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get KYC status" });
    }
  });

  app.post("/api/onmeta/kyc/submit", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);
      const result = await onmetaService.submitKyc(authToken, req.body);
      return res.json(result);
    } catch (err: any) {
      console.error("[OnMeta] KYC submit error:", err);
      return res.status(500).json({ message: "KYC submission failed" });
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
      const parsed = onmetaQuotationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { currency, amount, type } = parsed.data;
      const result = await onmetaService.getQuotation({
        currency,
        amount,
        type,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get quotation" });
    }
  });

  app.post("/api/onmeta/deposit", authenticateToken, requireKyc, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);

      const parsed = onmetaDepositSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { amount, paymentMethod } = parsed.data;

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
      return res.status(500).json({ message: "Deposit failed" });
    }
  });

  app.post("/api/onmeta/withdraw", authenticateToken, requireKyc, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);

      const parsed = onmetaWithdrawSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { amount, bankAccountId } = parsed.data;

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
      return res.status(500).json({ message: "Withdrawal failed" });
    }
  });

  app.get("/api/onmeta/orders", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);
      const page = parseInt(req.query.page as string) || 1;
      const result = await onmetaService.getOrderHistory(authToken, page);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/onmeta/order/:orderId/status", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);
      const result = await onmetaService.getOrderStatus(authToken, req.params.orderId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get order status" });
    }
  });

  app.post("/api/onmeta/bank-account", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const parsed = onmetaBankAccountSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const authToken = await getOnmetaToken(user);
      const result = await onmetaService.addBankAccount(authToken, parsed.data);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to add bank account" });
    }
  });

  app.get("/api/onmeta/bank-accounts", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const authToken = await getOnmetaToken(user);
      const accounts = await onmetaService.getBankAccounts(authToken);
      return res.json(accounts);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get bank accounts" });
    }
  });

  // ==========================================
  // Unified KYC Verification
  // ==========================================

  app.post("/api/kyc/verify", apiLimiter, authenticateToken, async (req, res) => {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.kycStatus === "verified") {
      return res.json({ verified: true, message: "Already verified" });
    }

    if (user.kycStatus === "submitted") {
      return res.json({ verified: false, submitted: true, message: "KYC already submitted. Under review." });
    }

    // Mark as submitted — actual verification is manual/admin-driven
    await storage.updateUser(userId, { kycStatus: "submitted" });
    return res.json({
      verified: false,
      submitted: true,
      message: "KYC submitted for review. You'll be notified once verified.",
    });
  });

  // Admin-only endpoint to approve a user's KYC
  app.post("/api/admin/kyc/approve/:targetId", authenticateToken, async (req, res) => {
    const adminId = (req as any).userId;
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const targetId = parseInt(req.params.targetId);
    if (isNaN(targetId)) return res.status(400).json({ message: "Invalid user ID" });
    const target = await storage.getUser(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });
    await storage.updateUser(targetId, { kycStatus: "verified" });
    return res.json({ success: true, message: `KYC approved for ${target.email}` });
  });

  // ==========================================
  // Early Access (Landing Page)
  // ==========================================

  app.post("/api/early-access", async (req, res) => {
    try {
      const parsed = insertEarlyAccessSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const submission = await storage.createEarlyAccess(parsed.data);
      return res.json({ success: true, id: submission.id });
    } catch (err: any) {
      console.error("Early access error:", err);
      return res.status(500).json({ message: "Submission failed" });
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

      // B2B (merchant) → Tazapay for all countries
      if (user.role === "merchant") {
        provider = "tazapay";
        paymentMethods = tazapayService.getSupportedPaymentMethods(user.country);
      } else if (user.country === "AE") {
        provider = "burjx";
        paymentMethods = [
          { id: "bank_transfer", label: "Bank Transfer (AED)" },
          { id: "lean_open_banking", label: "Open Banking (Instant)" },
        ];
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

  // ==========================================
  // Lean Payment Routes (UAE - Open Banking)
  // ==========================================

  app.get("/api/v1/lean/payment-sources", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const customer = await storage.getLeanCustomer(userId);
      if (!customer) return res.json([]);

      const [sources, banks] = await Promise.all([
        leanService.getPaymentSources(customer.leanCustomerId),
        leanService.getBanks(),
      ]);

      const bankMap = new Map(banks.map((b: any) => [b.identifier || b.id, b]));
      const enriched = sources.map((s: any) => ({
        ...s,
        bankInfo: bankMap.get(s.bank_identifier) || null,
      }));

      return res.json(enriched);
    } catch (err: any) {
      console.error("Lean payment sources error:", err);
      return res.status(500).json({ message: "Failed to fetch payment sources" });
    }
  });

  app.delete("/api/v1/lean/payment-sources/:paymentSourceId", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { paymentSourceId } = req.params;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(paymentSourceId)) {
        return res.status(400).json({ message: "Invalid payment source ID" });
      }

      const customer = await storage.getLeanCustomer(userId);
      if (!customer) return res.status(404).json({ message: "No Lean customer found" });

      await leanService.deletePaymentSource(customer.leanCustomerId, paymentSourceId);
      return res.status(204).send();
    } catch (err: any) {
      console.error("Lean delete payment source error:", err);
      return res.status(500).json({ message: "Failed to unlink bank account" });
    }
  });

  app.post("/api/v1/lean/create-bank-account", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      let customer = await storage.getLeanCustomer(userId);

      if (!customer) {
        const { customerId } = await leanService.createCustomer(userId.toString());
        customer = await storage.createLeanCustomer(userId, customerId);
      }

      const accessToken = await leanService.getCustomerToken(customer.leanCustomerId);
      return res.json({ customerId: customer.leanCustomerId, accessToken, appToken: process.env.LEAN_API_KEY });
    } catch (err: any) {
      console.error("Lean create bank account error:", err);
      return res.status(500).json({ message: "Failed to initiate bank linking" });
    }
  });

  app.post("/api/v1/lean/deposit", authenticateToken, requireKyc, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const parsed = leanDepositSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { amount, currency, customerId, description } = parsed.data;

      const { paymentIntentId } = await leanService.createPaymentIntent({
        amount, currency, customerId, description,
      });

      const accessToken = await leanService.getCustomerToken(customerId);

      // Create pending transaction
      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency,
        source: "Lean",
        description: description || "Open Banking Deposit",
        status: "pending",
        providerRef: paymentIntentId,
      });

      return res.json({ paymentIntentId, accessToken, appToken: process.env.LEAN_API_KEY });
    } catch (err: any) {
      console.error("Lean deposit error:", err);
      return res.status(500).json({ message: "Failed to create deposit" });
    }
  });

  // ==========================================
  // Lean Webhooks (signature-verified, no auth)
  // ==========================================

  app.post("/api/webhooks/lean/entity-created", async (req, res) => {
    try {
      const signature = req.headers["lean-signature"] as string || "";
      const rawBody = (req as any).rawBody;

      if (rawBody && process.env.LEAN_WEBHOOK_SECRET) {
        if (!leanService.verifyWebhookSignature(rawBody, signature)) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const { customer_id, payment_source_id, bank_identifier } = req.body.payload || req.body;

      if (customer_id && payment_source_id) {
        const leanCustomer = await storage.getLeanCustomerByLeanId(customer_id);
        if (leanCustomer) {
          const existing = await storage.getLeanPaymentSource(payment_source_id);
          if (!existing) {
            await storage.createLeanPaymentSource({
              userId: leanCustomer.userId,
              leanCustomerId: customer_id,
              paymentSourceId: payment_source_id,
              bankIdentifier: bank_identifier,
            });
          }
        }

        // Notify APEX about the linked bank (non-blocking)
        try {
          const { callRpc } = await import("./services/burjxApexClient");
          await callRpc("SetUserConfig", {
            UserName: leanCustomer?.userId?.toString(),
            Config: JSON.stringify({ leanCustomerId: customer_id, paymentSourceId: payment_source_id }),
          });
        } catch (err) {
          console.error("APEX SetUserConfig failed (non-blocking):", err);
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Lean entity webhook error:", err);
      return res.json({ received: true }); // Always 200 to prevent retries
    }
  });

  app.post("/api/webhooks/lean/payment-created", async (req, res) => {
    try {
      const signature = req.headers["lean-signature"] as string || "";
      const rawBody = (req as any).rawBody;

      // Signature verification if secret is available
      if (rawBody && process.env.LEAN_WEBHOOK_SECRET) {
        if (!leanService.verifyWebhookSignature(rawBody, signature)) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const { payment_intent_id, amount, currency, customer_id } = req.body.payload || req.body;

      if (!payment_intent_id) {
        return res.json({ received: true });
      }

      // API callback verification — confirm payment status directly with Lean
      try {
        const intent = await leanService.getPaymentIntent(payment_intent_id);
        const intentStatus = intent.status || intent.payment_intent_status;
        if (intentStatus !== "PAYMENT_PROCESSED" && intentStatus !== "completed") {
          console.log("Lean payment webhook: intent not confirmed via API:", intentStatus);
          return res.json({ received: true });
        }
      } catch (err) {
        console.error("Lean payment verification failed:", err);
        return res.status(500).json({ message: "Payment verification failed" });
      }

      // Idempotency check — find pending transaction with this providerRef
      const leanCustomer = await storage.getLeanCustomerByLeanId(customer_id);
      if (!leanCustomer) {
        console.error("Lean payment webhook: customer not found:", customer_id);
        return res.json({ received: true });
      }

      const userTxs = await storage.getTransactions(leanCustomer.userId);
      const pendingTx = userTxs.find(
        (t) => t.providerRef === payment_intent_id && t.status === "pending"
      );

      if (!pendingTx) {
        console.log("Lean payment webhook: no pending transaction for intent:", payment_intent_id);
        return res.json({ received: true });
      }

      const user = await storage.getUser(leanCustomer.userId);
      if (!user) {
        console.error("Lean payment webhook: user not found:", leanCustomer.userId);
        return res.json({ received: true });
      }

      const depositAmount = parseFloat(String(amount || pendingTx.amount));
      if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
        console.error("Lean payment webhook: invalid deposit amount:", amount, pendingTx.amount);
        return res.json({ received: true });
      }

      const transferIntentId = String(payment_intent_id);
      let stage = await storage.getLeanTransferStageByIntentId(transferIntentId);
      if (!stage) {
        stage = await storage.createLeanTransferStage({
          transactionId: pendingTx.id,
          userId: leanCustomer.userId,
          leanPaymentIntentId: transferIntentId,
          fiatAmount: depositAmount.toFixed(2),
          senderCurrency: pendingTx.currency,
          recipientCurrency: user.currency === "AED" ? "INR" : user.currency,
          stablecoinToken: process.env.BRIDGE_TOKEN || "USDT",
        });
      }

      // Stage 1 + 2: BurjX custody + conversion
      if (stage.stage === "lean_confirmed") {
        try {
          const conversion = await burjxOnramp.createCustodyConversionForLeanDeposit({
            amountAed: depositAmount,
            leanPaymentIntentId: transferIntentId,
          });

          stage = (await storage.updateLeanTransferStageByIntentId(transferIntentId, {
            stage: "burjx_converted_to_stablecoin",
            burjxAccountId: conversion.burjxAccountId || null,
            burjxDepositTicketId: conversion.burjxDepositTicketId,
            burjxWalletId: conversion.burjxWalletId,
            bridgeTxHash: conversion.bridgeTxHash,
            stablecoinAmount: conversion.stablecoinAmount.toFixed(6),
            stablecoinToken: conversion.stablecoinToken,
            errorMessage: null,
          })) || stage;

          console.log(
            `[Lean Webhook] BurjX custody+conversion complete intent=${transferIntentId} token=${conversion.stablecoinToken} amount=${conversion.stablecoinAmount} tx=${conversion.bridgeTxHash}`
          );
        } catch (err) {
          console.error("Lean payment webhook: BurjX custody/conversion failed:", err);
          await storage.updateLeanTransferStageByIntentId(transferIntentId, {
            stage: "lean_confirmed",
            errorMessage: err instanceof Error ? err.message : "BurjX conversion failed",
          });
          return res.json({ received: true });
        }
      }

      // Stage 3: Move to OnMeta offramp and create order
      if (stage.stage === "burjx_converted_to_stablecoin") {
        try {
          const auth = await onmetaService.customerLogin({
            email: user.email,
            phone: user.phone || undefined,
            name: user.fullName,
            country: user.country,
          });

          const offramp = await onmetaService.createOfframpForSettlement(auth.token, {
            recipientCurrency: stage.recipientCurrency || "INR",
            fiatAmount: depositAmount,
          });

          stage = (await storage.updateLeanTransferStageByIntentId(transferIntentId, {
            stage: "onmeta_offramp_created",
            onmetaOfframpOrderId: offramp.orderId,
            onmetaStatus: offramp.status,
            errorMessage: null,
          })) || stage;

          // Track pending recipient payout via transaction providerRef.
          const { db } = await import("./db");
          const { transactions } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(transactions)
            .set({
              providerRef: offramp.orderId,
              description: `Lean AED transfer routed via BurjX -> OnMeta offramp (Order: ${offramp.orderId})`,
            })
            .where(eq(transactions.id, pendingTx.id));

          console.log(`[Lean Webhook] OnMeta offramp created order=${offramp.orderId} intent=${transferIntentId}`);
        } catch (err) {
          console.error("Lean payment webhook: OnMeta offramp creation failed:", err);
          await storage.updateLeanTransferStageByIntentId(transferIntentId, {
            stage: "burjx_converted_to_stablecoin",
            errorMessage: err instanceof Error ? err.message : "OnMeta offramp creation failed",
          });
          return res.json({ received: true });
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Lean payment webhook error:", err);
      return res.json({ received: true }); // Always 200 to prevent retries
    }
  });

  // ==========================================
  // OnMeta Webhooks (signature-verified, no auth)
  // ==========================================

  app.post("/api/webhooks/onmeta/onramp", async (req, res) => {
    try {
      const signature = req.headers["x-onmeta-signature"] as string || "";
      if (process.env.ONMETA_API_KEY && !onmetaService.verifyWebhookSignature(req.body, signature)) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }

      const { orderId, status, fiat, currency, customer, eventType } = req.body;
      if (eventType !== "onramp" || !orderId) {
        return res.json({ received: true });
      }

      console.log(`[OnMeta Webhook] onramp ${orderId}: ${status}`);

      // On completed deposit, credit user balance
      if (status === "completed" && customer?.email) {
        const user = await storage.getUserByEmail(customer.email);
        if (user) {
          // Check idempotency — look for existing completed transaction with this orderId
          const userTxs = await storage.getTransactions(user.id);
          const alreadyProcessed = userTxs.find(
            (t) => t.providerRef === orderId && t.status === "completed"
          );
          if (!alreadyProcessed) {
            await storage.updateUserBalance(user.id, fiat.toString());
            await storage.createTransaction({
              userId: user.id,
              type: "deposit",
              amount: fiat.toString(),
              currency: currency || user.currency,
              source: "OnMeta",
              description: "Deposit via OnMeta",
              status: "completed",
              providerRef: orderId,
            });
          }
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("OnMeta onramp webhook error:", err);
      return res.json({ received: true });
    }
  });

  app.post("/api/webhooks/onmeta/offramp", async (req, res) => {
    try {
      const signature = req.headers["x-onmeta-signature"] as string || "";
      if (process.env.ONMETA_API_KEY && !onmetaService.verifyWebhookSignature(req.body, signature)) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }

      const { orderId, status, fiat, currency, customer, eventType } = req.body;
      if (eventType !== "offramp" || !orderId) {
        return res.json({ received: true });
      }

      console.log(`[OnMeta Webhook] offramp ${orderId}: ${status}`);

      const stage = await storage.getLeanTransferStageByOnmetaOrderId(orderId);
      if (stage) {
        const { db } = await import("./db");
        const { transactions } = await import("@shared/schema");
        const { eq, and } = await import("drizzle-orm");

        if (status === "PayoutSuccess" || status === "completed") {
          const transitioned = await db.update(transactions)
            .set({ status: "completed" })
            .where(and(eq(transactions.id, stage.transactionId), eq(transactions.status, "pending")))
            .returning({ id: transactions.id });

          if (transitioned.length > 0) {
            await storage.updateUserBalance(stage.userId, stage.fiatAmount as string);
          }

          await storage.updateLeanTransferStageByIntentId(stage.leanPaymentIntentId, {
            stage: "onmeta_offramp_completed",
            onmetaStatus: status,
            completedAt: new Date(),
            errorMessage: null,
          });
        } else if (status === "refunded" || status === "failed" || status === "expired") {
          await storage.updateLeanTransferStageByIntentId(stage.leanPaymentIntentId, {
            stage: "onmeta_offramp_created",
            onmetaStatus: status,
            errorMessage: `Offramp status: ${status}`,
          });
          await db.update(transactions)
            .set({ status: "failed" })
            .where(and(eq(transactions.id, stage.transactionId), eq(transactions.status, "pending")));
        }

        return res.json({ received: true });
      }

      // Existing OnMeta consumer flow fallback
      if (status === "PayoutSuccess" && customer?.email) {
        const user = await storage.getUserByEmail(customer.email);
        if (user) {
          const { db } = await import("./db");
          const { transactions } = await import("@shared/schema");
          const { eq, and } = await import("drizzle-orm");
          await db.update(transactions)
            .set({ status: "completed" })
            .where(and(
              eq(transactions.providerRef, orderId),
              eq(transactions.status, "pending"),
            ));
        }
      }

      if (status === "refunded" && customer?.email) {
        const user = await storage.getUserByEmail(customer.email);
        if (user && fiat) {
          await storage.updateUserBalance(user.id, fiat.toString());
          await storage.createTransaction({
            userId: user.id,
            type: "deposit",
            amount: fiat.toString(),
            currency: currency || user.currency,
            source: "OnMeta",
            description: "Refund from OnMeta withdrawal",
            status: "completed",
            providerRef: `refund-${orderId}`,
          });
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("OnMeta offramp webhook error:", err);
      return res.json({ received: true });
    }
  });

  // ==========================================
  // Tazapay Routes (B2B — merchant accounts only)
  // ==========================================

  // Helper: ensure user is a merchant
  function requireMerchant(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).userId;
    storage.getUser(userId).then((user) => {
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.role !== "merchant") return res.status(403).json({ message: "Business account required for this feature" });
      (req as any).user = user;
      next();
    }).catch(() => res.status(500).json({ message: "Auth error" }));
  }

  // Helper: get or create Tazapay customer for a merchant user
  async function ensureTazapayCustomer(user: { id: number; email: string; fullName: string; country: string }) {
    let customer = await storage.getTazapayCustomer(user.id);
    if (!customer) {
      const nameParts = user.fullName.split(" ");
      const firstName = nameParts[0] || user.fullName;
      const lastName = nameParts.slice(1).join(" ") || firstName;
      const result = await tazapayService.createCustomer({
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        country: user.country,
        ind_bus_type: "business",
      });
      customer = await storage.createTazapayCustomer({
        userId: user.id,
        tazapayCustomerId: result.account_id,
      });
    }
    return customer;
  }

  // Get available payment methods for merchant
  app.get("/api/tazapay/payment-methods", authenticateToken, requireMerchant, async (req, res) => {
    try {
      const user = (req as any).user;
      const methods = tazapayService.getSupportedPaymentMethods(user.country);
      return res.json(methods);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get payment methods" });
    }
  });

  // Create deposit (returns checkout URL)
  app.post("/api/tazapay/deposit", authenticateToken, requireMerchant, requireKyc, async (req, res) => {
    try {
      const user = (req as any).user;
      const parsed = tazapayDepositSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { amount, currency, paymentMethod } = parsed.data;

      const customer = await ensureTazapayCustomer(user);

      const checkout = await tazapayService.createCheckout({
        amount,
        currency,
        customer_id: customer.tazapayCustomerId,
        payment_methods: [paymentMethod],
      });

      const tx = await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        amount: amount.toString(),
        currency,
        source: "Tazapay",
        description: `B2B deposit via Tazapay (${paymentMethod})`,
        status: "pending",
        providerRef: checkout.checkout_id,
      });

      await storage.createTazapayCollection({
        userId: user.id,
        transactionId: tx.id,
        tazapayPayinId: checkout.checkout_id,
        amountCents: Math.round(amount * 100),
        currency,
        paymentMethod,
        checkoutUrl: checkout.checkout_url,
      });

      return res.json({
        success: true,
        checkoutUrl: checkout.checkout_url,
        checkoutId: checkout.checkout_id,
        message: "Redirect to complete payment.",
      });
    } catch (err: any) {
      console.error("[Tazapay] Deposit error:", err);
      return res.status(500).json({ message: "Deposit failed" });
    }
  });

  // Check deposit status
  app.get("/api/tazapay/deposit/:id/status", authenticateToken, requireMerchant, async (req, res) => {
    try {
      const collection = await storage.getTazapayCollection(req.params.id);
      if (!collection) return res.status(404).json({ message: "Deposit not found" });
      return res.json({ status: collection.status, checkoutUrl: collection.checkoutUrl });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to check status" });
    }
  });

  // Create beneficiary (bank account for payouts)
  app.post("/api/tazapay/beneficiary", authenticateToken, requireMerchant, async (req, res) => {
    try {
      const user = (req as any).user;
      const parsed = createBeneficiarySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

      const customer = await ensureTazapayCustomer(user);
      const result = await tazapayService.createBeneficiary({
        customer_id: customer.tazapayCustomerId,
        account_holder_name: parsed.data.accountHolderName,
        bank_name: parsed.data.bankName,
        account_number: parsed.data.accountNumber,
        ifsc_code: parsed.data.ifscCode,
        country: parsed.data.country,
        currency: parsed.data.currency,
        payout_type: parsed.data.payoutType,
      });

      const beneficiary = await storage.createTazapayBeneficiary({
        userId: user.id,
        tazapayBeneficiaryId: result.beneficiary_id,
        accountHolderName: parsed.data.accountHolderName,
        bankName: parsed.data.bankName,
        accountNumber: parsed.data.accountNumber,
        ifscCode: parsed.data.ifscCode,
        country: parsed.data.country,
        currency: parsed.data.currency,
        payoutType: parsed.data.payoutType,
      });

      return res.json({ success: true, beneficiary });
    } catch (err: any) {
      console.error("[Tazapay] Create beneficiary error:", err);
      return res.status(500).json({ message: "Failed to create beneficiary" });
    }
  });

  // List beneficiaries
  app.get("/api/tazapay/beneficiaries", authenticateToken, requireMerchant, async (req, res) => {
    try {
      const user = (req as any).user;
      const beneficiaries = await storage.getTazapayBeneficiaries(user.id);
      return res.json(beneficiaries);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get beneficiaries" });
    }
  });

  // Initiate withdrawal (create + confirm + fund payout)
  app.post("/api/tazapay/withdraw", authenticateToken, requireMerchant, requireKyc, async (req, res) => {
    try {
      const user = (req as any).user;
      const parsed = tazapayWithdrawSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const { amount, beneficiaryId, currency } = parsed.data;

      const balance = parseFloat(user.balance as string);
      if (balance < amount) return res.status(400).json({ message: "Insufficient balance" });

      const beneficiary = await storage.getTazapayBeneficiaryById(beneficiaryId);
      if (!beneficiary || beneficiary.userId !== user.id) {
        return res.status(404).json({ message: "Beneficiary not found" });
      }

      // Create payout on Tazapay
      const payout = await tazapayService.createPayout({
        beneficiary_id: beneficiary.tazapayBeneficiaryId,
        amount: Math.round(amount * 100), // cents
        currency,
        description: `B2B withdrawal to ${beneficiary.bankName}`,
      });

      // Confirm payout
      await tazapayService.confirmPayout(payout.payout_id);
      // Fund payout
      await tazapayService.fundPayout(payout.payout_id);

      // Debit user balance
      await storage.updateUserBalance(user.id, (-amount).toString());

      const tx = await storage.createTransaction({
        userId: user.id,
        type: "send",
        amount: amount.toString(),
        currency,
        source: "Tazapay Withdrawal",
        description: `B2B withdrawal to ${beneficiary.bankName} (****${beneficiary.accountNumber.slice(-4)})`,
        status: "pending",
        providerRef: payout.payout_id,
      });

      await storage.createTazapayPayout({
        transactionId: tx.id,
        beneficiaryId: beneficiary.id,
        tazapayPayoutId: payout.payout_id,
        amountCents: Math.round(amount * 100),
        currency,
      });

      return res.json({ success: true, payoutId: payout.payout_id, status: "processing" });
    } catch (err: any) {
      console.error("[Tazapay] Withdraw error:", err);
      return res.status(500).json({ message: "Withdrawal failed" });
    }
  });

  // Check withdrawal status
  app.get("/api/tazapay/withdraw/:id/status", authenticateToken, requireMerchant, async (req, res) => {
    try {
      const payout = await storage.getTazapayPayout(req.params.id);
      if (!payout) return res.status(404).json({ message: "Withdrawal not found" });
      return res.json({ status: payout.status, errorMessage: payout.errorMessage });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to check status" });
    }
  });

  // FX quote
  app.get("/api/tazapay/fx-quote", authenticateToken, requireMerchant, async (req, res) => {
    try {
      const from = (req.query.from as string) || "USD";
      const to = (req.query.to as string) || "INR";
      const amount = parseFloat(req.query.amount as string) || 1;
      const quote = await tazapayService.getFxQuote(from, to, amount);
      return res.json(quote);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to get FX quote" });
    }
  });

  // ==========================================
  // Tazapay Webhooks (signature-verified, no user auth)
  // ==========================================

  app.post("/api/webhooks/tazapay/payin", async (req, res) => {
    try {
      const signature = req.headers["x-tazapay-signature"] as string || "";
      const rawBody = (req as any).rawBody;
      if (rawBody && process.env.TAZAPAY_WEBHOOK_SECRET) {
        if (!tazapayService.verifyWebhookSignature(rawBody, signature)) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const { checkout_id, payin_id, status, amount, currency } = req.body.data || req.body;
      const refId = checkout_id || payin_id;
      if (!refId) return res.json({ received: true });

      console.log(`[Tazapay Webhook] payin ${refId}: ${status}`);

      if (status === "completed" || status === "paid") {
        const collection = await storage.getTazapayCollection(refId);
        if (collection && collection.status !== "completed") {
          await storage.updateTazapayCollectionStatus(collection.id, "completed");

          // Credit user balance
          const depositAmount = (amount || collection.amountCents / 100).toString();
          await storage.updateUserBalance(collection.userId, depositAmount);

          // Update transaction status
          const { db: dbImport } = await import("./db");
          const { transactions: txTable } = await import("@shared/schema");
          const { eq: eqImport } = await import("drizzle-orm");
          await dbImport.update(txTable).set({ status: "completed" }).where(eqImport(txTable.id, collection.transactionId));
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Tazapay payin webhook error:", err);
      return res.json({ received: true });
    }
  });

  app.post("/api/webhooks/tazapay/payout", async (req, res) => {
    try {
      const signature = req.headers["x-tazapay-signature"] as string || "";
      const rawBody = (req as any).rawBody;
      if (rawBody && process.env.TAZAPAY_WEBHOOK_SECRET) {
        if (!tazapayService.verifyWebhookSignature(rawBody, signature)) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const { payout_id, status, error_message } = req.body.data || req.body;
      if (!payout_id) return res.json({ received: true });

      console.log(`[Tazapay Webhook] payout ${payout_id}: ${status}`);

      const payout = await storage.getTazapayPayout(payout_id);
      if (!payout) return res.json({ received: true });

      if (status === "completed") {
        await storage.updateTazapayPayoutStatus(payout.id, "completed");
        const { db: dbImport } = await import("./db");
        const { transactions: txTable } = await import("@shared/schema");
        const { eq: eqImport } = await import("drizzle-orm");
        await dbImport.update(txTable).set({ status: "completed" }).where(eqImport(txTable.id, payout.transactionId));
      } else if (status === "failed" || status === "reversed") {
        await storage.updateTazapayPayoutStatus(payout.id, status, error_message);
        // Reverse the balance deduction on failure
        const amountStr = (payout.amountCents / 100).toString();
        const { db: dbImport } = await import("./db");
        const { transactions: txTable } = await import("@shared/schema");
        const { eq: eqImport } = await import("drizzle-orm");
        // Find the user from the transaction
        const [tx] = await dbImport.select().from(txTable).where(eqImport(txTable.id, payout.transactionId)).limit(1);
        if (tx) {
          await storage.updateUserBalance(tx.userId, amountStr);
          await dbImport.update(txTable).set({ status: "failed" }).where(eqImport(txTable.id, tx.id));
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Tazapay payout webhook error:", err);
      return res.json({ received: true });
    }
  });

  // ==========================================
  // Admin Settlement Routes
  // ==========================================

  app.get("/api/admin/settlements", authenticateToken, async (req, res) => {
    const adminId = (req as any).userId;
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const settlements = await settlementService.getPendingSettlements();
    return res.json(settlements);
  });

  app.get("/api/admin/settlements/summary", authenticateToken, async (req, res) => {
    const adminId = (req as any).userId;
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const summary = await settlementService.getSettlementSummary();
    return res.json(summary);
  });

  app.post("/api/admin/settlements/:id/settle", authenticateToken, async (req, res) => {
    const adminId = (req as any).userId;
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const settlementId = parseInt(req.params.id);
    if (isNaN(settlementId)) return res.status(400).json({ message: "Invalid settlement ID" });
    const { txHash } = req.body;
    if (!txHash) return res.status(400).json({ message: "Transaction hash required" });
    await settlementService.markSettled(settlementId, txHash);
    return res.json({ success: true, message: "Settlement marked as completed" });
  });

  // ==========================================
  // Bridge info endpoints
  // ==========================================

  app.get("/api/bridge/config", authenticateToken, async (_req, res) => {
    return res.json(settlementService.getBridgeInfo());
  });

  app.get("/api/bridge/status/:transactionId", authenticateToken, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      if (isNaN(transactionId)) return res.status(400).json({ message: "Invalid transaction ID" });

      const { db } = await import("./db");
      const { settlementLedger } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [entry] = await db.select().from(settlementLedger)
        .where(eq(settlementLedger.transactionId, transactionId));

      if (!entry) {
        return res.status(404).json({ message: "No bridge settlement found for this transaction" });
      }

      const bridgeInfo = settlementService.getBridgeInfo();
      return res.json({
        ...bridgeInfo,
        transactionId: entry.transactionId,
        senderProvider: entry.senderProvider,
        recipientProvider: entry.recipientProvider,
        amountUsdc: entry.amountUsd, // USDC ≈ USD
        senderCurrency: entry.senderCurrency,
        senderAmount: entry.senderAmount,
        recipientCurrency: entry.recipientCurrency,
        recipientAmount: entry.recipientAmount,
        status: entry.status,
        txHash: entry.settlementTxHash,
      });
    } catch (err) {
      console.error("Bridge status error:", err);
      return res.status(500).json({ message: "Failed to fetch bridge status" });
    }
  });

  return httpServer;
}
