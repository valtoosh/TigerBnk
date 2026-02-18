import { callRpc, ensureConnected, getSession } from "./burjxApexClient";

const AED_PRODUCT_ID = 104;

export interface DepositTicket {
  ticketId: string;
  status: string;
  amount: number;
  currency: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    iban?: string;
    reference?: string;
  };
  createdAt?: string;
}

export interface WithdrawRequest {
  amount: number;
  iban: string;
  bankName?: string;
  accountHolderName: string;
}

export async function createDepositTicket(amount: number): Promise<DepositTicket> {
  await ensureConnected();
  const session = getSession();
  if (!session) throw new Error("BurjX session not available");

  const result = await callRpc("CreateDepositTicket", {
    AccountId: session.accountId,
    AssetId: AED_PRODUCT_ID,
    Amount: amount,
    ProductId: AED_PRODUCT_ID,
  });

  return {
    ticketId: result.TicketId || result.ticketId || result.RequestCode || "",
    status: result.Status || result.status || "pending",
    amount,
    currency: "AED",
    bankDetails: {
      bankName: result.BankName || result.bankName,
      accountNumber: result.AccountNumber || result.accountNumber,
      iban: result.IBAN || result.iban,
      reference: result.Reference || result.reference || result.TicketId || result.RequestCode || "",
    },
    createdAt: new Date().toISOString(),
  };
}

export async function getDepositTickets(): Promise<DepositTicket[]> {
  await ensureConnected();
  const session = getSession();
  if (!session) throw new Error("BurjX session not available");

  const result = await callRpc("GetDepositTickets", {
    AccountId: session.accountId,
  });

  const tickets = Array.isArray(result) ? result : (result?.Tickets || result?.tickets || []);

  return tickets.map((t: any) => ({
    ticketId: t.TicketId || t.ticketId || t.RequestCode || "",
    status: t.Status || t.status || "unknown",
    amount: parseFloat(t.Amount || t.amount || "0"),
    currency: "AED",
    bankDetails: {
      bankName: t.BankName || t.bankName,
      accountNumber: t.AccountNumber || t.accountNumber,
      iban: t.IBAN || t.iban,
      reference: t.Reference || t.reference || "",
    },
    createdAt: t.CreatedAt || t.createdAt || t.Timestamp || "",
  }));
}

export async function getDepositStatus(ticketId: string): Promise<{
  status: string;
  amount: number;
  received: boolean;
}> {
  const tickets = await getDepositTickets();
  const ticket = tickets.find((t) => t.ticketId === ticketId);

  if (!ticket) {
    return { status: "not_found", amount: 0, received: false };
  }

  const completedStatuses = ["completed", "Completed", "FullyProcessed", "Accepted"];
  const received = completedStatuses.includes(ticket.status);

  return {
    status: ticket.status,
    amount: ticket.amount,
    received,
  };
}

export async function getWithdrawTemplate(): Promise<any> {
  await ensureConnected();

  return callRpc("GetWithdrawTemplate", {
    ProductId: AED_PRODUCT_ID,
  });
}

export async function createWithdrawal(request: WithdrawRequest): Promise<{
  withdrawId: string;
  status: string;
  amount: number;
}> {
  await ensureConnected();
  const session = getSession();
  if (!session) throw new Error("BurjX session not available");

  const template = await getWithdrawTemplate();

  const result = await callRpc("CreateWithdraw", {
    AccountId: session.accountId,
    ProductId: AED_PRODUCT_ID,
    Amount: request.amount,
    TemplateForm: {
      ...(template?.TemplateForm || {}),
      IBAN: request.iban,
      BankName: request.bankName || "",
      AccountHolderName: request.accountHolderName,
    },
  });

  return {
    withdrawId: result.WithdrawId || result.withdrawId || result.RequestCode || "",
    status: result.Status || result.status || "pending",
    amount: request.amount,
  };
}

export async function pollDepositStatus(
  ticketId: string,
  maxAttempts: number = 20,
  intervalMs: number = 15000
): Promise<{ status: string; received: boolean; amount: number }> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getDepositStatus(ticketId);
    if (result.received || result.status === "not_found") {
      return result;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: "timeout", received: false, amount: 0 };
}
