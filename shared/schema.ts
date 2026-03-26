import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
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
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("AED"),
  recipientId: integer("recipient_id").references(() => users.id),
  recipientName: text("recipient_name"),
  source: text("source").notNull().default("TigerPayX"),
  description: text("description"),
  status: text("status").notNull().default("completed"),
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_transactions_user_id").on(table.userId),
  index("idx_transactions_recipient_id").on(table.recipientId),
  index("idx_transactions_status").on(table.status),
  index("idx_transactions_provider_ref").on(table.providerRef),
]);

export const contacts = pgTable("contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactUserId: integer("contact_user_id").notNull().references(() => users.id),
  nickname: text("nickname"),
}, (table) => [
  index("idx_contacts_user_id").on(table.userId),
]);

export const earlyAccessSubmissions = pgTable("early_access_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull(),
  monthlyVolume: text("monthly_volume").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leanCustomers = pgTable("lean_customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  leanCustomerId: text("lean_customer_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lean_customers_user_id").on(table.userId),
]);

export const leanPaymentSources = pgTable("lean_payment_sources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  leanCustomerId: text("lean_customer_id").notNull(),
  paymentSourceId: text("payment_source_id").notNull().unique(),
  bankIdentifier: text("bank_identifier"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lean_payment_sources_user_id").on(table.userId),
]);

export const settlementLedger = pgTable("settlement_ledger", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  senderProvider: text("sender_provider").notNull(),
  recipientProvider: text("recipient_provider").notNull(),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 6 }).notNull(),
  senderCurrency: text("sender_currency").notNull(),
  senderAmount: decimal("sender_amount", { precision: 12, scale: 2 }).notNull(),
  recipientCurrency: text("recipient_currency").notNull(),
  recipientAmount: decimal("recipient_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  settlementTxHash: text("settlement_tx_hash"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_settlement_transaction_id").on(table.transactionId),
  index("idx_settlement_status").on(table.status),
]);

// Lean -> BurjX -> OnMeta transfer pipeline state
export const leanTransferStages = pgTable("lean_transfer_stages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  leanPaymentIntentId: text("lean_payment_intent_id").notNull().unique(),
  stage: text("stage").notNull().default("lean_confirmed"),
  senderCurrency: text("sender_currency").notNull().default("AED"),
  recipientCurrency: text("recipient_currency").notNull().default("INR"),
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }).notNull(),
  stablecoinToken: text("stablecoin_token").notNull().default("USDT"),
  stablecoinAmount: decimal("stablecoin_amount", { precision: 12, scale: 6 }),
  burjxAccountId: text("burjx_account_id"),
  burjxDepositTicketId: text("burjx_deposit_ticket_id"),
  burjxWalletId: text("burjx_wallet_id"),
  bridgeTxHash: text("bridge_tx_hash"),
  onmetaOfframpOrderId: text("onmeta_offramp_order_id").unique(),
  onmetaStatus: text("onmeta_status"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_lean_transfer_stages_transaction_id").on(table.transactionId),
  index("idx_lean_transfer_stages_user_id").on(table.userId),
  index("idx_lean_transfer_stages_stage").on(table.stage),
  index("idx_lean_transfer_stages_onmeta_order_id").on(table.onmetaOfframpOrderId),
]);

// ==========================================
// Tazapay Tables (B2B only — merchant accounts)
// ==========================================

export const tazapayCustomers = pgTable("tazapay_customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  tazapayCustomerId: text("tazapay_customer_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tazapay_customers_user_id").on(table.userId),
]);

export const tazapayBeneficiaries = pgTable("tazapay_beneficiaries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  tazapayBeneficiaryId: text("tazapay_beneficiary_id").notNull().unique(),
  accountHolderName: text("account_holder_name").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  ifscCode: text("ifsc_code"),
  country: text("country").notNull(),
  currency: text("currency").notNull(),
  payoutType: text("payout_type").notNull().default("local"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tazapay_beneficiaries_user_id").on(table.userId),
]);

export const tazapayPayouts = pgTable("tazapay_payouts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  settlementId: integer("settlement_id").references(() => settlementLedger.id),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  beneficiaryId: integer("beneficiary_id").notNull().references(() => tazapayBeneficiaries.id),
  tazapayPayoutId: text("tazapay_payout_id").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("created"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_tazapay_payouts_transaction_id").on(table.transactionId),
  index("idx_tazapay_payouts_status").on(table.status),
]);

export const tazapayCollections = pgTable("tazapay_collections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  tazapayPayinId: text("tazapay_payin_id").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  paymentMethod: text("payment_method").notNull(),
  checkoutUrl: text("checkout_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_tazapay_collections_user_id").on(table.userId),
  index("idx_tazapay_collections_status").on(table.status),
]);

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

export const leanDepositSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  customerId: z.string().uuid("Customer ID must be a valid UUID"),
  description: z.string().max(32).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).optional(),
  phone: z.string().max(20).optional(),
});

export const manualDepositSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum deposit is 10"),
  source: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
});

export const onmetaQuotationSchema = z.object({
  currency: z.string().length(3, "Currency must be 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["deposit", "withdrawal"]),
});

export const onmetaDepositSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(50, "Minimum deposit is 50"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export const onmetaWithdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(50, "Minimum withdrawal is 50"),
  bankAccountId: z.string().optional(),
});

export const burjxDepositSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum deposit is 10 AED"),
});

export const burjxWithdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum withdrawal is 10 AED"),
  iban: z.string().min(15, "IBAN must be at least 15 characters").max(34),
  bankName: z.string().max(100).optional(),
  accountHolderName: z.string().min(2, "Account holder name is required").max(100),
});

export const onmetaBankAccountSchema = z.object({
  accountNumber: z.string().min(5, "Account number is required").max(30),
  ifscCode: z.string().max(20).optional(),
  bankName: z.string().min(1, "Bank name is required").max(100),
  accountHolderName: z.string().min(2, "Account holder name is required").max(100),
  country: z.string().length(2, "Country must be a 2-letter code"),
});

export const createBeneficiarySchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required").max(100),
  bankName: z.string().min(1, "Bank name is required").max(100),
  accountNumber: z.string().min(5, "Account number is required").max(30),
  ifscCode: z.string().max(20).optional(),
  country: z.enum(["IN", "PH", "ID"]),
  currency: z.string().length(3, "Currency must be 3 characters"),
  payoutType: z.enum(["local", "swift"]).default("local"),
});

export const tazapayDepositSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum deposit is 10"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export const tazapayWithdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum withdrawal is 10"),
  beneficiaryId: z.number().int().positive("Beneficiary ID is required"),
  currency: z.string().length(3, "Currency must be 3 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Contact = typeof contacts.$inferSelect;
export type LeanCustomer = typeof leanCustomers.$inferSelect;
export type LeanPaymentSource = typeof leanPaymentSources.$inferSelect;
export type SettlementEntry = typeof settlementLedger.$inferSelect;
export type LeanTransferStage = typeof leanTransferStages.$inferSelect;
export type TazapayCustomer = typeof tazapayCustomers.$inferSelect;
export type TazapayBeneficiary = typeof tazapayBeneficiaries.$inferSelect;
export type TazapayPayout = typeof tazapayPayouts.$inferSelect;
export type TazapayCollection = typeof tazapayCollections.$inferSelect;

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
