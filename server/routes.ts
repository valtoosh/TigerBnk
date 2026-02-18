import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema, sendMoneySchema } from "@shared/schema";

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

const exchangeRateCache: { rates: Record<string, number>; lastFetch: number } = {
  rates: {},
  lastFetch: 0,
};

async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - exchangeRateCache.lastFetch < 10 * 60 * 1000 && Object.keys(exchangeRateCache.rates).length > 0) {
    return exchangeRateCache.rates;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/AED");
    const data = await response.json();
    if (data.rates) {
      exchangeRateCache.rates = data.rates;
      exchangeRateCache.lastFetch = now;
      return data.rates;
    }
  } catch (err) {
    console.error("Failed to fetch exchange rates:", err);
  }

  return exchangeRateCache.rates || { AED: 1, USD: 0.2722, INR: 22.78, PHP: 15.25, GBP: 0.2166, IDR: 4327 };
}

function getFeePercent(from: string, to: string): number {
  if (from === to) return 0;
  const majorCorridors = [
    ["USD", "INR"], ["AED", "INR"], ["GBP", "INR"],
    ["AED", "PHP"], ["USD", "PHP"],
  ];
  for (const [a, b] of majorCorridors) {
    if ((from === a && to === b) || (from === b && to === a)) return 0.99;
  }
  return 1.5;
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
      const user = await storage.getUser((req as any).userId);
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
    const user = await storage.getUser((req as any).userId);
    if (!user) return res.status(404).json({ message: "User not found" });
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

      let convertedAmount = amount;
      let fee = 0;
      const fromCur = currency || sender.currency;
      const toCur = toCurrency || recipient.currency;

      if (fromCur !== toCur) {
        const rates = await getExchangeRates();
        const fromRate = rates[fromCur] || 1;
        const toRate = rates[toCur] || 1;
        const rate = toRate / fromRate;
        const feePercent = getFeePercent(fromCur, toCur);
        fee = amount * (feePercent / 100);
        convertedAmount = (amount - fee) * rate;
      }

      await storage.updateUserBalance(userId, (-amount).toString());
      await storage.updateUserBalance(recipient.id, convertedAmount.toFixed(2));

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
        amount: convertedAmount.toFixed(2),
        currency: toCur,
        recipientId: userId,
        recipientName: sender.fullName,
        source: "TigerPayX",
        description: `Received from ${sender.fullName}`,
        status: "completed",
      });

      return res.json({ success: true, convertedAmount, fee });
    } catch (err: any) {
      console.error("Send error:", err);
      return res.status(500).json({ message: "Transfer failed" });
    }
  });

  // Exchange rate routes
  app.get("/api/exchange-rate", async (req, res) => {
    try {
      const from = (req.query.from as string) || "AED";
      const to = (req.query.to as string) || "USD";
      const amount = parseFloat(req.query.amount as string) || 1;

      const rates = await getExchangeRates();
      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      const rate = toRate / fromRate;
      const feePercent = getFeePercent(from, to);
      const fee = amount * (feePercent / 100);
      const convertedAmount = (amount - fee) * rate;

      return res.json({ rate, convertedAmount, fee, feePercent });
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

  return httpServer;
}
