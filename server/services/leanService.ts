import crypto from "crypto";

const LEAN_BASE_URL = process.env.LEAN_BASE_URL || "https://api.leantech.me";
const LEAN_AUTH_URL = process.env.LEAN_AUTH_URL || "https://auth.leantech.me";
const LEAN_API_KEY = process.env.LEAN_API_KEY || "";
const LEAN_DESTINATION_ID = process.env.LEAN_DESTINATION_ID || "";

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "lean-app-token": LEAN_API_KEY,
  };
}

async function leanRequest(
  path: string,
  method: string = "GET",
  body?: any,
  baseUrl?: string
): Promise<any> {
  const url = `${baseUrl || LEAN_BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: getHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (method === "DELETE" && response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Lean API error ${response.status}: ${text}`);
  }

  return response.json();
}

// Banks
export async function getBanks(): Promise<any[]> {
  const result = await leanRequest("/banks/v1");
  return result.banks || result;
}

// Customers
export async function createCustomer(appUserId: string): Promise<{ customerId: string }> {
  const result = await leanRequest("/customers/v1", "POST", { app_user_id: appUserId });
  return { customerId: result.customer_id || result.id };
}

export async function getCustomer(customerId: string): Promise<any> {
  return leanRequest(`/customers/v1/${customerId}`);
}

export async function getCustomerByAppId(appUserId: string): Promise<any> {
  return leanRequest(`/customers/v1/app-user-id/${appUserId}`);
}

export async function getCustomerToken(customerId: string): Promise<string> {
  const result = await leanRequest("/oauth2/token", "POST", {
    grant_type: "client_credentials",
    customer_id: customerId,
  }, LEAN_AUTH_URL);
  return result.access_token;
}

// Payment Sources
export async function getPaymentSources(customerId: string): Promise<any[]> {
  const result = await leanRequest(`/customers/v1/${customerId}/payment-sources`);
  return result.payment_sources || result;
}

export async function deletePaymentSource(customerId: string, paymentSourceId: string): Promise<void> {
  await leanRequest(
    `/customers/v1/${customerId}/payment-sources/${paymentSourceId}`,
    "DELETE",
    { reason: "USER_REQUESTED" }
  );
}

// Payments
export async function createPaymentIntent(data: {
  amount: number;
  currency: string;
  customerId: string;
  description?: string;
}): Promise<{ paymentIntentId: string }> {
  const result = await leanRequest("/payments/v1/intents", "POST", {
    amount: data.amount,
    currency: data.currency,
    customer_id: data.customerId,
    payment_destination_id: LEAN_DESTINATION_ID,
    description: data.description || "TigerPayX Deposit",
  });
  return { paymentIntentId: result.payment_intent_id || result.id };
}

// Payment Intent status lookup (used to verify webhooks via API callback)
export async function getPaymentIntent(paymentIntentId: string): Promise<any> {
  return leanRequest(`/payments/v1/intents/${paymentIntentId}`);
}

// Webhook signature verification (if secret is available)
export function verifyWebhookSignature(
  payload: Buffer | string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret || process.env.LEAN_WEBHOOK_SECRET || "";
  if (!webhookSecret) return false;
  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(typeof payload === "string" ? payload : payload.toString("utf8"));
  const expected = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
