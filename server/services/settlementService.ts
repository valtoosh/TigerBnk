import { db } from "../db";
import { settlementLedger } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import { storage } from "../storage";
import { SETTLEMENT_WALLET_ADDRESS, BRIDGE_TOKEN, BRIDGE_NETWORK } from "./bridgeConfig";

const C2C_PROVIDER_MAP: Record<string, string> = {
  AE: "burjx",
  IN: "onmeta",
  PH: "onmeta",
  ID: "onmeta",
};

const B2B_PROVIDER = "tazapay";

export function getProviderForCountry(country: string, role?: string): string {
  if (role === "merchant") return B2B_PROVIDER;
  return C2C_PROVIDER_MAP[country] || "none";
}

export function isCrossProviderTransfer(senderCountry: string, recipientCountry: string, senderRole?: string, recipientRole?: string): boolean {
  const senderProvider = getProviderForCountry(senderCountry, senderRole);
  const recipientProvider = getProviderForCountry(recipientCountry, recipientRole);
  return senderProvider !== recipientProvider && senderProvider !== "none" && recipientProvider !== "none";
}

export async function recordSettlement(params: {
  transactionId: number;
  senderProvider: string;
  recipientProvider: string;
  amountUsd: number;
  senderCurrency: string;
  senderAmount: number;
  recipientCurrency: string;
  recipientAmount: number;
}) {
  return storage.createSettlementEntry({
    transactionId: params.transactionId,
    senderProvider: params.senderProvider,
    recipientProvider: params.recipientProvider,
    amountUsd: params.amountUsd.toFixed(6),
    senderCurrency: params.senderCurrency,
    senderAmount: params.senderAmount.toFixed(2),
    recipientCurrency: params.recipientCurrency,
    recipientAmount: params.recipientAmount.toFixed(2),
  });
}

export async function getPendingSettlements() {
  return storage.getPendingSettlements();
}

export async function getSettlementSummary() {
  const [pending] = await db.select({
    count: sql<number>`count(*)::int`,
    totalUsd: sql<string>`coalesce(sum(amount_usd::numeric), 0)`,
  }).from(settlementLedger).where(eq(settlementLedger.status, "pending"));

  const [settled] = await db.select({
    count: sql<number>`count(*)::int`,
    totalUsd: sql<string>`coalesce(sum(amount_usd::numeric), 0)`,
  }).from(settlementLedger).where(eq(settlementLedger.status, "settled"));

  return {
    pendingCount: pending?.count || 0,
    pendingTotalUsd: parseFloat(pending?.totalUsd || "0"),
    settledCount: settled?.count || 0,
    settledTotalUsd: parseFloat(settled?.totalUsd || "0"),
  };
}

export async function markSettled(settlementId: number, txHash: string) {
  return storage.updateSettlementStatus(settlementId, "settled", txHash);
}

// Bridge-aware settlement: records cross-provider transfer with stablecoin bridge details
export async function recordBridgeSettlement(params: {
  transactionId: number;
  senderProvider: string;
  recipientProvider: string;
  amountAed: number;
  amountUsdc: number;
  amountRecipient: number;
  senderCurrency: string;
  recipientCurrency: string;
  bridgeTxHash: string;
  offrampOrderId?: string;
}) {
  const entry = await storage.createSettlementEntry({
    transactionId: params.transactionId,
    senderProvider: params.senderProvider,
    recipientProvider: params.recipientProvider,
    amountUsd: params.amountUsdc.toFixed(6), // stablecoin amount represented as USD-equivalent
    senderCurrency: params.senderCurrency,
    senderAmount: params.amountAed.toFixed(2),
    recipientCurrency: params.recipientCurrency,
    recipientAmount: params.amountRecipient.toFixed(2),
  });

  // Auto-mark as settled with the bridge tx hash
  if (entry?.id) {
    await storage.updateSettlementStatus(entry.id, "settled", params.bridgeTxHash);
  }

  return entry;
}

// Returns bridge info for a given settlement
export function getBridgeInfo() {
  return {
    wallet: SETTLEMENT_WALLET_ADDRESS,
    token: BRIDGE_TOKEN,
    network: BRIDGE_NETWORK,
    explorerUrl: "https://explorer.solana.com",
  };
}
