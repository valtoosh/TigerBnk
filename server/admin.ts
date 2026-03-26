import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { storage } from "./storage";
import { users, transactions, settlementLedger, tazapayPayouts, tazapayBeneficiaries } from "@shared/schema";
import { desc, sql, eq } from "drizzle-orm";
import * as settlementService from "./services/settlementService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set and at least 32 characters");
}

// Admin auth middleware
function adminAuth(req: any, res: any, next: any) {
  const token = req.cookies?.token || (req.headers.authorization?.replace("Bearer ", "") || "");
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: number };
    req.userId = decoded.userId;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  storage.getUser(req.userId).then((user) => {
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = user;
    next();
  }).catch(() => res.status(500).json({ message: "Auth error" }));
}

// Serve dashboard HTML
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin-dashboard.html"));
});

// API: All settlements
app.get("/api/settlements", adminAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(settlementLedger)
      .orderBy(desc(settlementLedger.createdAt))
      .limit(200);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch settlements" });
  }
});

// API: Settlement summary
app.get("/api/settlements/summary", adminAuth, async (_req, res) => {
  try {
    const summary = await settlementService.getSettlementSummary();
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch summary" });
  }
});

// API: Mark settled
app.post("/api/settlements/:id/settle", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const { txHash } = req.body;
    if (!txHash) return res.status(400).json({ message: "Transaction hash required" });
    await settlementService.markSettled(id, txHash);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to settle" });
  }
});

// API: All users
app.get("/api/users", adminAuth, async (_req, res) => {
  try {
    const rows = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      country: users.country,
      currency: users.currency,
      balance: users.balance,
      role: users.role,
      kycStatus: users.kycStatus,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// API: Recent transactions (all users)
app.get("/api/transactions", adminAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(100);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// API: Tazapay payouts (with beneficiary info)
app.get("/api/tazapay-payouts", adminAuth, async (_req, res) => {
  try {
    const rows = await db.select({
      id: tazapayPayouts.id,
      tazapayPayoutId: tazapayPayouts.tazapayPayoutId,
      transactionId: tazapayPayouts.transactionId,
      amountCents: tazapayPayouts.amountCents,
      currency: tazapayPayouts.currency,
      status: tazapayPayouts.status,
      errorMessage: tazapayPayouts.errorMessage,
      createdAt: tazapayPayouts.createdAt,
      completedAt: tazapayPayouts.completedAt,
      beneficiaryName: tazapayBeneficiaries.accountHolderName,
      beneficiaryBank: tazapayBeneficiaries.bankName,
    }).from(tazapayPayouts)
      .leftJoin(tazapayBeneficiaries, eq(tazapayPayouts.beneficiaryId, tazapayBeneficiaries.id))
      .orderBy(desc(tazapayPayouts.createdAt))
      .limit(200);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch Tazapay payouts" });
  }
});

const port = parseInt(process.env.ADMIN_PORT || "5002", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`Admin dashboard running on http://localhost:${port}`);
});
