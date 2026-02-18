import { HttpsProxyAgent } from "https-proxy-agent";
import { getSession, ensureConnected, callRpc } from "./burjxApexClient";

const KYC_BASE_URL = "https://kyc.burjx.com";

function buildProxyUrl(): string | undefined {
  const rawUrl = process.env.QUOTAGUARD_URL;
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  const user = process.env.QUOTAGUARD_USER;
  const pass = process.env.QUOTAGUARD_PASS;

  if (user && pass) {
    return `http://${user}:${pass}@${rawUrl}`;
  }

  return `http://${rawUrl}`;
}

function getProxyAgent(): HttpsProxyAgent<string> | undefined {
  const proxyUrl = buildProxyUrl();
  if (!proxyUrl) return undefined;
  return new HttpsProxyAgent(proxyUrl);
}

function getKycHeaders(): Record<string, string> {
  const session = getSession();
  if (!session) throw new Error("BurjX session not available");

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.sessionToken}`,
    "x-api-key": process.env.BURJX_API_KEY || "",
    "x-api-secret": process.env.BURJX_API_SECRET || "",
    "user-id": session.userId,
  };
}

async function kycRequest(path: string, method: string = "GET", body?: any): Promise<any> {
  const url = `${KYC_BASE_URL}${path}`;
  const headers = getKycHeaders();
  const agent = getProxyAgent();

  const options: RequestInit = {
    method,
    headers,
    ...(agent ? { agent } as any : {}),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KYC API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function authenticateUser(): Promise<{
  userId: string;
  sessionToken: string;
  accountId: string;
}> {
  await ensureConnected();
  const session = getSession();
  if (!session) throw new Error("Failed to establish BurjX session");
  return session;
}

export async function getUserInfo(): Promise<any> {
  return callRpc("GetUserInfo", {});
}

export async function getUserAccounts(): Promise<any> {
  return callRpc("GetUserAccounts", {});
}

export async function getProducts(): Promise<any> {
  return callRpc("GetProducts", {});
}

export async function submitKyc(kycData: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  documentFrontBase64?: string;
  documentBackBase64?: string;
  selfieBase64?: string;
}): Promise<any> {
  return kycRequest("/api/v1/kyc/submit", "POST", kycData);
}

export async function getKycStatus(): Promise<any> {
  return kycRequest("/api/v1/kyc/status", "GET");
}

export async function getAccountBalance(): Promise<{
  available: number;
  currency: string;
  accountId: string;
}> {
  const accounts = await getUserAccounts();

  if (Array.isArray(accounts)) {
    const aedAccount = accounts.find(
      (a: any) => a.ProductId === 104 || a.AssetId === 104 || a.Currency === "AED"
    );
    if (aedAccount) {
      return {
        available: parseFloat(aedAccount.Amount || aedAccount.Balance || "0"),
        currency: "AED",
        accountId: aedAccount.AccountId || aedAccount.accountId || "",
      };
    }
  }

  return { available: 0, currency: "AED", accountId: "" };
}

export async function getConnectionStatus(): Promise<{
  connected: boolean;
  authenticated: boolean;
  userId: string | null;
}> {
  const session = getSession();
  return {
    connected: session !== null,
    authenticated: session !== null,
    userId: session?.userId || null,
  };
}
