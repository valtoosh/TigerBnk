// Demo bridge configuration — Solana stablecoin settlement wallet
// In production, these would be environment variables

export const SETTLEMENT_WALLET_ADDRESS =
  process.env.SETTLEMENT_WALLET || "6Gy3RAHJCg325TPURWfq6kYy8Qy6GpnjUAi1HRKjii31";

export const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "USDT";
export const BRIDGE_NETWORK = process.env.BRIDGE_NETWORK || "solana";

export const SOLANA_EXPLORER_BASE = "https://explorer.solana.com/tx";
