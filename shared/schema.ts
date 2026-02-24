import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  country: text("country").notNull().default("AE"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("AED"),
  roarScore: integer("roar_score").notNull().default(350),
  role: text("role").notNull().default("individual"),
  kycStatus: text("kyc_status").notNull().default("pending"),
  avatarInitials: text("avatar_initials"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("AED"),
  recipientId: integer("recipient_id"),
  recipientName: text("recipient_name"),
  source: text("source").notNull().default("TigerPayX"),
  description: text("description"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  contactUserId: integer("contact_user_id").notNull(),
  nickname: text("nickname"),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const earlyAccessSubmissions = pgTable("early_access_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull(),
  monthlyVolume: text("monthly_volume").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEarlyAccessSchema = createInsertSchema(earlyAccessSubmissions).omit({
  id: true,
  createdAt: true,
});

export type EarlyAccessSubmission = typeof earlyAccessSubmissions.$inferSelect;
export type InsertEarlyAccess = z.infer<typeof insertEarlyAccessSchema>;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  roarScore: true,
  role: true,
  kycStatus: true,
  avatarInitials: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.enum(["AE", "IN", "PH", "ID"]),
  accountType: z.enum(["individual", "merchant"]).default("individual"),
});

export const sendMoneySchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("AED"),
  toCurrency: z.string().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Contact = typeof contacts.$inferSelect;

export const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates", currency: "AED", flag: "AE" },
  { code: "IN", name: "India", currency: "INR", flag: "IN" },
  { code: "PH", name: "Philippines", currency: "PHP", flag: "PH" },
  { code: "ID", name: "Indonesia", currency: "IDR", flag: "ID" },
] as const;

export const CURRENCIES = [
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "INR", name: "Indian Rupee", symbol: "INR" },
  { code: "PHP", name: "Philippine Peso", symbol: "PHP" },
  { code: "USD", name: "US Dollar", symbol: "USD" },
  { code: "GBP", name: "British Pound", symbol: "GBP" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "IDR" },
] as const;

export function getRoarTier(score: number): { name: string; color: string } {
  if (score <= 300) return { name: "Cub", color: "#94a3b8" };
  if (score <= 550) return { name: "Tiger", color: "#f59e0b" };
  if (score <= 700) return { name: "Alpha", color: "#8b5cf6" };
  return { name: "Apex", color: "#10b981" };
}

export function formatCurrency(amount: number | string, currency: string = "AED"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
