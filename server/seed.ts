import { db } from "./db";
import { users, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  const existing = await db.select().from(users).where(eq(users.email, "demo@tigerpay.com")).limit(1);
  if (existing.length > 0) return;

  console.log("Seeding database...");

  const hash = await bcrypt.hash("demo123", 12);

  const [demoUser] = await db.insert(users).values({
    email: "demo@tigerpay.com",
    phone: "+971 50 123 4567",
    fullName: "Ahmad Al Rashid",
    passwordHash: hash,
    country: "AE",
    balance: "12450.75",
    currency: "AED",
    roarScore: 620,
    role: "individual",
    kycStatus: "verified",
    avatarInitials: "AA",
  }).returning();

  const [user2] = await db.insert(users).values({
    email: "priya@tigerpay.com",
    phone: "+91 98765 43210",
    fullName: "Priya Sharma",
    passwordHash: hash,
    country: "IN",
    balance: "85000.00",
    currency: "INR",
    roarScore: 480,
    role: "individual",
    kycStatus: "verified",
    avatarInitials: "PS",
  }).returning();

  const [user3] = await db.insert(users).values({
    email: "marco@tigerpay.com",
    phone: "+63 917 123 4567",
    fullName: "Marco Santos",
    passwordHash: hash,
    country: "PH",
    balance: "25000.00",
    currency: "PHP",
    roarScore: 350,
    role: "individual",
    kycStatus: "pending",
    avatarInitials: "MS",
  }).returning();

  const [user4] = await db.insert(users).values({
    email: "sarah@tigerpay.com",
    phone: "+971 55 987 6543",
    fullName: "Sarah Johnson",
    passwordHash: hash,
    country: "AE",
    balance: "8200.50",
    currency: "AED",
    roarScore: 720,
    role: "individual",
    kycStatus: "verified",
    avatarInitials: "SJ",
  }).returning();

  const now = new Date();
  const seedTxs = [
    { userId: demoUser.id, type: "deposit", amount: "5000.00", currency: "AED", source: "Bank Transfer", description: "Initial deposit via Bank Transfer", status: "completed", createdAt: new Date(now.getTime() - 7 * 86400000) },
    { userId: demoUser.id, type: "deposit", amount: "3000.00", currency: "AED", source: "Card Payment", description: "Deposit via Card", status: "completed", createdAt: new Date(now.getTime() - 5 * 86400000) },
    { userId: demoUser.id, type: "send", amount: "500.00", currency: "AED", recipientId: user2.id, recipientName: "Priya Sharma", source: "TigerPayX", description: "Sent to Priya Sharma", status: "completed", createdAt: new Date(now.getTime() - 3 * 86400000) },
    { userId: demoUser.id, type: "receive", amount: "1200.00", currency: "AED", recipientId: user4.id, recipientName: "Sarah Johnson", source: "TigerPayX", description: "Received from Sarah Johnson", status: "completed", createdAt: new Date(now.getTime() - 2 * 86400000) },
    { userId: demoUser.id, type: "send", amount: "250.00", currency: "AED", recipientId: user3.id, recipientName: "Marco Santos", source: "TigerPayX", description: "Sent to Marco Santos", status: "completed", createdAt: new Date(now.getTime() - 1 * 86400000) },
    { userId: demoUser.id, type: "deposit", amount: "4000.75", currency: "AED", source: "Bank Transfer", description: "Salary deposit", status: "completed", createdAt: new Date(now.getTime() - 12 * 3600000) },
    { userId: demoUser.id, type: "send", amount: "100.00", currency: "AED", recipientId: user4.id, recipientName: "Sarah Johnson", source: "TigerPayX", description: "Sent to Sarah Johnson", status: "pending", createdAt: new Date(now.getTime() - 3600000) },
  ];

  await db.insert(transactions).values(seedTxs);

  console.log("Database seeded successfully");
}
