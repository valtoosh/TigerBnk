import { db } from "./db";
import { pool } from "./db";
import { users, transactions, contacts, earlyAccessSubmissions } from "@shared/schema";
import type { User, InsertUser, Transaction, InsertTransaction, InsertEarlyAccess, EarlyAccessSubmission } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; phone?: string; fullName: string; passwordHash: string; country: string; currency: string; role?: string }): Promise<User>;
  updateUserBalance(userId: number, amount: string): Promise<void>;
  updateUser(userId: number, data: Partial<User>): Promise<User | undefined>;
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getUserContacts(userId: number): Promise<User[]>;
  createEarlyAccess(data: InsertEarlyAccess): Promise<EarlyAccessSubmission>;
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
      // Lock the row to prevent concurrent balance modifications
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

  async updateUser(userId: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return user;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(or(eq(transactions.userId, userId), eq(transactions.recipientId, userId)))
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
}

export const storage = new DatabaseStorage();
