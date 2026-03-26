import crypto from "crypto";

const SANDBOX_URL = "https://service-sandbox.tazapay.com";
const PRODUCTION_URL = "https://service.tazapay.com";

function getBaseUrl(): string {
  return process.env.TAZAPAY_ENVIRONMENT === "production" ? PRODUCTION_URL : SANDBOX_URL;
}

function getAuthHeader(): string {
  const key = process.env.TAZAPAY_API_KEY || "";
  const secret = process.env.TAZAPAY_API_SECRET || "";
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

async function tazapayRequest(
  path: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tazapay API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ==========================================
// Customer Management
// ==========================================

export async function createCustomer(data: {
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  ind_bus_type: "business" | "individual";
}): Promise<{ account_id: string; status: string }> {
  const result = await tazapayRequest("/v3/user", "POST", data);
  return {
    account_id: result.data?.account_id || result.account_id || "",
    status: result.data?.status || result.status || "created",
  };
}

export async function getCustomer(accountId: string): Promise<any> {
  return tazapayRequest(`/v3/user/${accountId}`);
}

// ==========================================
// Collections (On-Ramp / Deposits)
// ==========================================

export async function createPayin(params: {
  amount: number;
  currency: string;
  payment_method: string;
  customer_id: string;
  transaction_description?: string;
}): Promise<{ payin_id: string; status: string }> {
  const result = await tazapayRequest("/v3/payin", "POST", {
    invoice_currency: params.currency,
    invoice_amount: params.amount,
    payment_method: params.payment_method,
    buyer_id: params.customer_id,
    transaction_description: params.transaction_description || "Deposit",
  });
  const data = result.data || result;
  return {
    payin_id: data.payin_id || data.id || "",
    status: data.status || "created",
  };
}

export async function confirmPayin(payinId: string): Promise<{ status: string }> {
  const result = await tazapayRequest(`/v3/payin/${payinId}/confirm`, "POST");
  return { status: result.data?.status || result.status || "confirmed" };
}

export async function getPayin(payinId: string): Promise<any> {
  return tazapayRequest(`/v3/payin/${payinId}`);
}

export async function createCheckout(params: {
  amount: number;
  currency: string;
  customer_id: string;
  payment_methods?: string[];
  success_url?: string;
  cancel_url?: string;
}): Promise<{ checkout_id: string; checkout_url: string; status: string }> {
  const result = await tazapayRequest("/v3/checkout_session", "POST", {
    invoice_currency: params.currency,
    invoice_amount: params.amount,
    buyer_id: params.customer_id,
    payment_methods: params.payment_methods,
    complete_url: params.success_url,
    cancel_url: params.cancel_url,
  });
  const data = result.data || result;
  return {
    checkout_id: data.checkout_id || data.id || "",
    checkout_url: data.checkout_url || data.url || "",
    status: data.status || "created",
  };
}

export async function getCheckout(checkoutId: string): Promise<any> {
  return tazapayRequest(`/v3/checkout_session/${checkoutId}`);
}

// ==========================================
// Payouts (Off-Ramp / Withdrawals)
// ==========================================

export async function createBeneficiary(data: {
  customer_id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code?: string;
  country: string;
  currency: string;
  payout_type: string;
}): Promise<{ beneficiary_id: string; status: string }> {
  const result = await tazapayRequest("/v3/beneficiary", "POST", data);
  const d = result.data || result;
  return {
    beneficiary_id: d.beneficiary_id || d.id || "",
    status: d.status || "created",
  };
}

export async function getBeneficiary(beneficiaryId: string): Promise<any> {
  return tazapayRequest(`/v3/beneficiary/${beneficiaryId}`);
}

export async function createPayout(params: {
  beneficiary_id: string;
  amount: number;
  currency: string;
  description?: string;
}): Promise<{ payout_id: string; status: string }> {
  const result = await tazapayRequest("/v3/payout", "POST", {
    beneficiary_id: params.beneficiary_id,
    amount: params.amount,
    currency: params.currency,
    description: params.description || "Withdrawal",
  });
  const data = result.data || result;
  return {
    payout_id: data.payout_id || data.id || "",
    status: data.status || "created",
  };
}

export async function confirmPayout(payoutId: string): Promise<{ status: string }> {
  const result = await tazapayRequest(`/v3/payout/${payoutId}/confirm`, "POST");
  return { status: result.data?.status || result.status || "confirmed" };
}

export async function fundPayout(payoutId: string): Promise<{ status: string }> {
  const result = await tazapayRequest(`/v3/payout/${payoutId}/fund`, "POST");
  return { status: result.data?.status || result.status || "processing" };
}

export async function getPayoutStatus(payoutId: string): Promise<{ status: string; completed_at?: string }> {
  const result = await tazapayRequest(`/v3/payout/${payoutId}`);
  const data = result.data || result;
  return {
    status: data.status || "unknown",
    completed_at: data.completed_at,
  };
}

// ==========================================
// Utility
// ==========================================

export async function getBalance(currency?: string): Promise<{ available: number; pending: number; currency: string }> {
  const path = currency ? `/v3/balance?currency=${currency}` : "/v3/balance";
  const result = await tazapayRequest(path);
  const data = result.data || result;
  return {
    available: parseFloat(data.available || "0"),
    pending: parseFloat(data.pending || "0"),
    currency: data.currency || currency || "USD",
  };
}

export async function getFxQuote(from: string, to: string, amount: number): Promise<{
  rate: number;
  convertedAmount: number;
  from: string;
  to: string;
}> {
  const result = await tazapayRequest("/v3/quote", "POST", {
    from_currency: from,
    to_currency: to,
    amount,
  });
  const data = result.data || result;
  return {
    rate: parseFloat(data.rate || data.exchange_rate || "1"),
    convertedAmount: parseFloat(data.converted_amount || data.to_amount || amount.toString()),
    from,
    to,
  };
}

export async function getCollectionMethods(currency: string): Promise<{ id: string; name: string }[]> {
  const result = await tazapayRequest(`/v3/metadata/collection_methods?currency=${currency}`);
  const data = result.data || result;
  const methods = data.collection_methods || data.methods || data || [];
  return Array.isArray(methods) ? methods.map((m: any) => ({
    id: m.id || m.payment_method || m.method,
    name: m.name || m.label || m.payment_method || m.method,
  })) : [];
}

export function getSupportedPaymentMethods(country: string): { id: string; label: string }[] {
  switch (country) {
    case "IN":
      return [
        { id: "bank_transfer", label: "Bank Transfer" },
        { id: "upi", label: "UPI" },
      ];
    case "PH":
      return [
        { id: "bank_transfer", label: "Bank Transfer" },
        { id: "e_wallet", label: "E-Wallet" },
      ];
    case "ID":
      return [
        { id: "bank_transfer", label: "Bank Transfer" },
        { id: "virtual_account", label: "Virtual Account" },
      ];
    default:
      return [{ id: "bank_transfer", label: "Bank Transfer" }];
  }
}

// ==========================================
// Webhook Verification
// ==========================================

export function verifyWebhookSignature(body: string | Buffer, signature: string): boolean {
  const secret = process.env.TAZAPAY_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(typeof body === "string" ? body : body.toString("utf8"));
  const expected = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
