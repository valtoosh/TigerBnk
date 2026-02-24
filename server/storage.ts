import { db } from "./db";
import { users, transactions, contacts, passwordResetCodes, earlyAccessSubmissions } from "@shared/schema";
import type { User, InsertUser, Transaction, InsertTransaction, InsertEarlyAccess, EarlyAccessSubmission } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; phone?: string; fullName: string; passwordHash: string; country: string; currency: string }): Promise<User>;
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

  async createUser(data: { email: string; phone?: string; fullName: string; passwordHash: string; country: string; currency: string }): Promise<User> {
    const initials = data.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const [user] = await db.insert(users).values({
      email: data.email,
      phone: data.phone || null,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      country: data.country,
      currency: data.currency,
      avatarInitials: initials,
    }).returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: string): Promise<void> {
    await db.update(users)
      .set({ balance: sql`${users.balance}::numeric + ${amount}::numeric` })
      .where(eq(users.id, userId));
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
