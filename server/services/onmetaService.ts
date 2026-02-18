const ONMETA_PROD_URL = "https://stg.api.onmeta.in";

const INTERNAL_SETTLEMENT_TOKEN = "USDT";
const INTERNAL_SETTLEMENT_NETWORK = "polygon";

function getBaseUrl(): string {
  return ONMETA_PROD_URL;
}

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-key": process.env.ONMETA_API_KEY || "",
  };
}

async function onmetaRequest(
  path: string,
  method: string = "GET",
  body?: any,
  authToken?: string
): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const headers: Record<string, string> = getHeaders();

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Payment provider error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function customerLogin(data: {
  email: string;
  phone?: string;
  name?: string;
  country: string;
}): Promise<{ token: string; customerId: string; kycRequired: boolean }> {
  const result = await onmetaRequest("/v1/users/login", "POST", {
    email: data.email,
  });

  return {
    token: result.data?.token || result.token || "",
    customerId: result.data?.customerId || result.customerId || result.data?.userId || "",
    kycRequired: result.data?.kycRequired ?? result.kycRequired ?? true,
  };
}

export async function submitKyc(
  authToken: string,
  kycData: {
    panNumber?: string;
    aadhaarNumber?: string;
    dateOfBirth?: string;
    fullName: string;
    country: string;
  }
): Promise<{ status: string; message: string }> {
  const result = await onmetaRequest("/v1/users/upload/kyc", "POST", kycData, authToken);
  return {
    status: result.data?.status || result.status || "submitted",
    message: result.data?.message || result.message || "Verification submitted",
  };
}

export async function getKycStatus(authToken: string): Promise<{
  status: string;
  verified: boolean;
}> {
  const result = await onmetaRequest("/v1/users/kyc/status", "GET", undefined, authToken);
  const status = result.data?.status || result.status || "pending";
  return {
    status,
    verified: status === "verified" || status === "approved",
  };
}

export async function getQuotation(params: {
  currency: string;
  amount: number;
  type: "deposit" | "withdrawal";
}): Promise<{
  amount: number;
  fee: number;
  totalAmount: number;
}> {
  const endpoint = params.type === "deposit" ? "/v1/onramp/quote" : "/v1/offramp/quote";

  const result = await onmetaRequest(endpoint, "POST", {
    fiatCurrency: params.currency,
    fiatAmount: params.amount,
    cryptoCurrency: INTERNAL_SETTLEMENT_TOKEN,
    network: INTERNAL_SETTLEMENT_NETWORK,
  });

  const data = result.data || result;
  return {
    amount: parseFloat(data.fiatAmount || params.amount),
    fee: parseFloat(data.fee || data.platformFee || "0"),
    totalAmount: parseFloat(data.totalAmount || data.total || params.amount.toString()),
  };
}

export async function createDepositOrder(
  authToken: string,
  params: {
    currency: string;
    amount: number;
    paymentMethod: string;
  }
): Promise<{
  orderId: string;
  status: string;
  paymentUrl?: string;
  paymentDetails?: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    reference?: string;
  };
}> {
  const result = await onmetaRequest("/v1/onramp/order", "POST", {
    fiatCurrency: params.currency,
    fiatAmount: params.amount,
    cryptoCurrency: INTERNAL_SETTLEMENT_TOKEN,
    network: INTERNAL_SETTLEMENT_NETWORK,
    paymentMethod: params.paymentMethod,
  }, authToken);

  const data = result.data || result;
  return {
    orderId: data.orderId || data.orderCode || data.id || "",
    status: data.status || "created",
    paymentUrl: data.paymentUrl || data.redirectUrl,
    paymentDetails: data.paymentDetails || {
      upiId: data.upiId,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      bankName: data.bankName,
      reference: data.reference || data.orderId,
    },
  };
}

export async function createWithdrawalOrder(
  authToken: string,
  params: {
    currency: string;
    amount: number;
    bankAccountId?: string;
  }
): Promise<{
  orderId: string;
  status: string;
}> {
  const result = await onmetaRequest("/v1/offramp/order", "POST", {
    fiatCurrency: params.currency,
    fiatAmount: params.amount,
    cryptoCurrency: INTERNAL_SETTLEMENT_TOKEN,
    network: INTERNAL_SETTLEMENT_NETWORK,
    bankAccountId: params.bankAccountId,
  }, authToken);

  const data = result.data || result;
  return {
    orderId: data.orderId || data.orderCode || data.id || "",
    status: data.status || "created",
  };
}

export async function getOrderStatus(
  authToken: string,
  orderId: string
): Promise<{ status: string; completedAt?: string }> {
  const result = await onmetaRequest(`/v1/orders/${orderId}`, "GET", undefined, authToken);
  const data = result.data || result;
  return {
    status: data.status || "unknown",
    completedAt: data.completedAt,
  };
}

export async function getOrderHistory(
  authToken: string,
  page: number = 1,
  limit: number = 20
): Promise<{ orders: any[]; total: number }> {
  const result = await onmetaRequest(
    `/v1/orders?page=${page}&limit=${limit}`,
    "GET",
    undefined,
    authToken
  );

  const data = result.data || result;
  return {
    orders: data.orders || data.results || [],
    total: data.total || data.count || 0,
  };
}

export async function addBankAccount(
  authToken: string,
  bankData: {
    accountNumber: string;
    ifscCode?: string;
    bankName: string;
    accountHolderName: string;
    country: string;
  }
): Promise<{ bankAccountId: string; status: string }> {
  const result = await onmetaRequest("/v1/users/bank-account", "POST", bankData, authToken);
  const data = result.data || result;
  return {
    bankAccountId: data.bankAccountId || data.id || "",
    status: data.status || "added",
  };
}

export async function getBankAccounts(authToken: string): Promise<any[]> {
  const result = await onmetaRequest("/v1/users/bank-accounts", "GET", undefined, authToken);
  return result.data?.accounts || result.accounts || result.data || [];
}

export function getSupportedPaymentMethods(country: string): string[] {
  switch (country) {
    case "IN":
      return ["upi", "bank_transfer", "imps", "neft"];
    case "PH":
      return ["gcash", "paymaya", "grabpay", "bank_transfer"];
    case "ID":
      return ["bank_transfer"];
    default:
      return ["bank_transfer"];
  }
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    imps: "IMPS",
    neft: "NEFT",
    gcash: "GCash",
    paymaya: "PayMaya",
    grabpay: "GrabPay",
  };
  return labels[method] || method;
}
