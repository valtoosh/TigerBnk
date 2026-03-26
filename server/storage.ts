import { db } from "./db";
import { pool } from "./db";
import { users, transactions, contacts, earlyAccessSubmissions, leanCustomers, leanPaymentSources, settlementLedger, leanTransferStages, tazapayCustomers, tazapayBeneficiaries, tazapayPayouts, tazapayCollections } from "@shared/schema";
import type { User, InsertUser, Transaction, InsertTransaction, InsertEarlyAccess, EarlyAccessSubmission, LeanCustomer, LeanPaymentSource, SettlementEntry, LeanTransferStage, TazapayCustomer, TazapayBeneficiary, TazapayPayout, TazapayCollection } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; phone?: string; fullName: string; passwordHash: string; country: string; currency: string; role?: string }): Promise<User>;
  updateUserBalance(userId: number, amount: string): Promise<void>;
  debitBalance(userId: number, amount: number): Promise<boolean>;
  updateUser(userId: number, data: Partial<User>): Promise<User | undefined>;
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getUserContacts(userId: number): Promise<User[]>;
  createEarlyAccess(data: InsertEarlyAccess): Promise<EarlyAccessSubmission>;
  getLeanCustomer(userId: number): Promise<LeanCustomer | undefined>;
  getLeanCustomerByLeanId(leanCustomerId: string): Promise<LeanCustomer | undefined>;
  createLeanCustomer(userId: number, leanCustomerId: string): Promise<LeanCustomer>;
  createLeanPaymentSource(data: { userId: number; leanCustomerId: string; paymentSourceId: string; bankIdentifier?: string }): Promise<LeanPaymentSource>;
  getLeanPaymentSource(paymentSourceId: string): Promise<LeanPaymentSource | undefined>;
  createSettlementEntry(data: { transactionId: number; senderProvider: string; recipientProvider: string; amountUsd: string; senderCurrency: string; senderAmount: string; recipientCurrency: string; recipientAmount: string }): Promise<SettlementEntry>;
  getPendingSettlements(): Promise<SettlementEntry[]>;
  updateSettlementStatus(id: number, status: string, txHash?: string): Promise<void>;
  getLeanTransferStageByIntentId(leanPaymentIntentId: string): Promise<LeanTransferStage | undefined>;
  createLeanTransferStage(data: {
    transactionId: number;
    userId: number;
    leanPaymentIntentId: string;
    fiatAmount: string;
    senderCurrency: string;
    recipientCurrency: string;
    stablecoinToken: string;
  }): Promise<LeanTransferStage>;
  updateLeanTransferStageByIntentId(leanPaymentIntentId: string, data: Partial<LeanTransferStage>): Promise<LeanTransferStage | undefined>;
  getLeanTransferStageByOnmetaOrderId(orderId: string): Promise<LeanTransferStage | undefined>;

  // Tazapay Customers
  getTazapayCustomer(userId: number): Promise<TazapayCustomer | undefined>;
  createTazapayCustomer(data: { userId: number; tazapayCustomerId: string; status?: string }): Promise<TazapayCustomer>;

  // Tazapay Beneficiaries
  createTazapayBeneficiary(data: { userId: number; tazapayBeneficiaryId: string; accountHolderName: string; bankName: string; accountNumber: string; ifscCode?: string; country: string; currency: string; payoutType: string }): Promise<TazapayBeneficiary>;
  getTazapayBeneficiaries(userId: number): Promise<TazapayBeneficiary[]>;
  getTazapayBeneficiaryById(id: number): Promise<TazapayBeneficiary | undefined>;

  // Tazapay Payouts
  createTazapayPayout(data: { transactionId: number; beneficiaryId: number; tazapayPayoutId: string; amountCents: number; currency: string; settlementId?: number }): Promise<TazapayPayout>;
  getTazapayPayout(tazapayPayoutId: string): Promise<TazapayPayout | undefined>;
  updateTazapayPayoutStatus(id: number, status: string, errorMessage?: string): Promise<void>;

  // Tazapay Collections
  createTazapayCollection(data: { userId: number; transactionId: number; tazapayPayinId: string; amountCents: number; currency: string; paymentMethod: string; checkoutUrl?: string }): Promise<TazapayCollection>;
  getTazapayCollection(tazapayPayinId: string): Promise<TazapayCollection | undefined>;
  updateTazapayCollectionStatus(id: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(data: { email: string; phone?: string; fullName: string; passwordHash: string; country: string; currency: string; role?: string }): Promise<User> {
    const initials = data.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const [user] = await db.insert(users).values({
      email: data.email,
      phone: data.phone || null,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      country: data.country,
      currency: data.currency,
      role: data.role || "individual",
      avatarInitials: initials,
    }).returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
      await client.query(
        "UPDATE users SET balance = balance::numeric + $1::numeric WHERE id = $2",
        [amount, userId]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async debitBalance(userId: number, amount: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "SELECT balance FROM users WHERE id = $1 FOR UPDATE",
        [userId]
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      const currentBalance = parseFloat(result.rows[0].balance);
      if (currentBalance < amount) {
        await client.query("ROLLBACK");
        return false;
      }
      await client.query(
        "UPDATE users SET balance = balance::numeric - $1::numeric WHERE id = $2",
        [amount, userId]
      );
      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User | undefined> {
    // Whitelist: never allow direct modification of these fields
    const { id, balance, passwordHash, createdAt, email, ...safe } = data as any;
    if (Object.keys(safe).length === 0) return this.getUser(userId);
    const [user] = await db.update(users).set(safe).where(eq(users.id, userId)).returning();
    return user;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50);
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(tx).returning();
    return transaction;
  }

  async getUserContacts(userId: number): Promise<User[]> {
    const contactRows = await db.select().from(contacts).where(eq(contacts.userId, userId));
    if (contactRows.length === 0) return [];
    const contactIds = contactRows.map(c => c.contactUserId);
    return db.select().from(users).where(
      sql`${users.id} = ANY(${contactIds})`
    );
  }

  async createEarlyAccess(data: InsertEarlyAccess): Promise<EarlyAccessSubmission> {
    const [submission] = await db.insert(earlyAccessSubmissions).values(data).returning();
    return submission;
  }

  async getLeanCustomer(userId: number): Promise<LeanCustomer | undefined> {
    const [customer] = await db.select().from(leanCustomers).where(eq(leanCustomers.userId, userId)).limit(1);
    return customer;
  }

  async getLeanCustomerByLeanId(leanCustomerId: string): Promise<LeanCustomer | undefined> {
    const [customer] = await db.select().from(leanCustomers).where(eq(leanCustomers.leanCustomerId, leanCustomerId)).limit(1);
    return customer;
  }

  async createLeanCustomer(userId: number, leanCustomerId: string): Promise<LeanCustomer> {
    const [customer] = await db.insert(leanCustomers).values({ userId, leanCustomerId }).returning();
    return customer;
  }

  async createLeanPaymentSource(data: { userId: number; leanCustomerId: string; paymentSourceId: string; bankIdentifier?: string }): Promise<LeanPaymentSource> {
    const [source] = await db.insert(leanPaymentSources).values(data).returning();
    return source;
  }

  async getLeanPaymentSource(paymentSourceId: string): Promise<LeanPaymentSource | undefined> {
    const [source] = await db.select().from(leanPaymentSources).where(eq(leanPaymentSources.paymentSourceId, paymentSourceId)).limit(1);
    return source;
  }

  async createSettlementEntry(data: { transactionId: number; senderProvider: string; recipientProvider: string; amountUsd: string; senderCurrency: string; senderAmount: string; recipientCurrency: string; recipientAmount: string }): Promise<SettlementEntry> {
    const [entry] = await db.insert(settlementLedger).values(data).returning();
    return entry;
  }

  async getPendingSettlements(): Promise<SettlementEntry[]> {
    return db.select().from(settlementLedger)
      .where(eq(settlementLedger.status, "pending"))
      .orderBy(desc(settlementLedger.createdAt));
  }

  async updateSettlementStatus(id: number, status: string, txHash?: string): Promise<void> {
    const updates: any = { status };
    if (txHash) updates.settlementTxHash = txHash;
    if (status === "settled") updates.settledAt = new Date();
    await db.update(settlementLedger).set(updates).where(eq(settlementLedger.id, id));
  }

  async getLeanTransferStageByIntentId(leanPaymentIntentId: string): Promise<LeanTransferStage | undefined> {
    const [stage] = await db.select().from(leanTransferStages)
      .where(eq(leanTransferStages.leanPaymentIntentId, leanPaymentIntentId))
      .limit(1);
    return stage;
  }

  async createLeanTransferStage(data: {
    transactionId: number;
    userId: number;
    leanPaymentIntentId: string;
    fiatAmount: string;
    senderCurrency: string;
    recipientCurrency: string;
    stablecoinToken: string;
  }): Promise<LeanTransferStage> {
    const [stage] = await db.insert(leanTransferStages).values({
      transactionId: data.transactionId,
      userId: data.userId,
      leanPaymentIntentId: data.leanPaymentIntentId,
      fiatAmount: data.fiatAmount,
      senderCurrency: data.senderCurrency,
      recipientCurrency: data.recipientCurrency,
      stablecoinToken: data.stablecoinToken,
    }).returning();
    return stage;
  }

  async updateLeanTransferStageByIntentId(leanPaymentIntentId: string, data: Partial<LeanTransferStage>): Promise<LeanTransferStage | undefined> {
    const [stage] = await db.update(leanTransferStages)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(eq(leanTransferStages.leanPaymentIntentId, leanPaymentIntentId))
      .returning();
    return stage;
  }

  async getLeanTransferStageByOnmetaOrderId(orderId: string): Promise<LeanTransferStage | undefined> {
    const [stage] = await db.select().from(leanTransferStages)
      .where(eq(leanTransferStages.onmetaOfframpOrderId, orderId))
      .limit(1);
    return stage;
  }

  // ==========================================
  // Tazapay Customers
  // ==========================================

  async getTazapayCustomer(userId: number): Promise<TazapayCustomer | undefined> {
    const [customer] = await db.select().from(tazapayCustomers).where(eq(tazapayCustomers.userId, userId)).limit(1);
    return customer;
  }

  async createTazapayCustomer(data: { userId: number; tazapayCustomerId: string; status?: string }): Promise<TazapayCustomer> {
    const [customer] = await db.insert(tazapayCustomers).values({
      userId: data.userId,
      tazapayCustomerId: data.tazapayCustomerId,
      status: data.status || "active",
    }).returning();
    return customer;
  }

  // ==========================================
  // Tazapay Beneficiaries
  // ==========================================

  async createTazapayBeneficiary(data: { userId: number; tazapayBeneficiaryId: string; accountHolderName: string; bankName: string; accountNumber: string; ifscCode?: string; country: string; currency: string; payoutType: string }): Promise<TazapayBeneficiary> {
    const [beneficiary] = await db.insert(tazapayBeneficiaries).values(data).returning();
    return beneficiary;
  }

  async getTazapayBeneficiaries(userId: number): Promise<TazapayBeneficiary[]> {
    return db.select().from(tazapayBeneficiaries)
      .where(and(eq(tazapayBeneficiaries.userId, userId), eq(tazapayBeneficiaries.status, "active")))
      .orderBy(desc(tazapayBeneficiaries.createdAt));
  }

  async getTazapayBeneficiaryById(id: number): Promise<TazapayBeneficiary | undefined> {
    const [beneficiary] = await db.select().from(tazapayBeneficiaries).where(eq(tazapayBeneficiaries.id, id)).limit(1);
    return beneficiary;
  }

  // ==========================================
  // Tazapay Payouts
  // ==========================================

  async createTazapayPayout(data: { transactionId: number; beneficiaryId: number; tazapayPayoutId: string; amountCents: number; currency: string; settlementId?: number }): Promise<TazapayPayout> {
    const [payout] = await db.insert(tazapayPayouts).values(data).returning();
    return payout;
  }

  async getTazapayPayout(tazapayPayoutId: string): Promise<TazapayPayout | undefined> {
    const [payout] = await db.select().from(tazapayPayouts).where(eq(tazapayPayouts.tazapayPayoutId, tazapayPayoutId)).limit(1);
    return payout;
  }

  async updateTazapayPayoutStatus(id: number, status: string, errorMessage?: string): Promise<void> {
    const updates: any = { status };
    if (errorMessage) updates.errorMessage = errorMessage;
    if (status === "completed") updates.completedAt = new Date();
    await db.update(tazapayPayouts).set(updates).where(eq(tazapayPayouts.id, id));
  }

  // ==========================================
  // Tazapay Collections
  // ==========================================

  async createTazapayCollection(data: { userId: number; transactionId: number; tazapayPayinId: string; amountCents: number; currency: string; paymentMethod: string; checkoutUrl?: string }): Promise<TazapayCollection> {
    const [collection] = await db.insert(tazapayCollections).values(data).returning();
    return collection;
  }

  async getTazapayCollection(tazapayPayinId: string): Promise<TazapayCollection | undefined> {
    const [collection] = await db.select().from(tazapayCollections).where(eq(tazapayCollections.tazapayPayinId, tazapayPayinId)).limit(1);
    return collection;
  }

  async updateTazapayCollectionStatus(id: number, status: string): Promise<void> {
    const updates: any = { status };
    if (status === "completed") updates.completedAt = new Date();
    await db.update(tazapayCollections).set(updates).where(eq(tazapayCollections.id, id));
  }
}

export const storage = new DatabaseStorage();
