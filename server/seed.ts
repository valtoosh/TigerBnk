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
    balance: "0.00",
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
    balance: "0.00",
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
    balance: "0.00",
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
    balance: "0.00",
    currency: "AED",
    roarScore: 720,
    role: "individual",
    kycStatus: "verified",
    avatarInitials: "SJ",
  }).returning();

  console.log("Database seeded successfully (zero balances)");
}
