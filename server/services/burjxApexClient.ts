import WebSocket from "ws";
import { HttpsProxyAgent } from "https-proxy-agent";

const WS_ENDPOINT = "wss://api.burjx.alphaprod.net/wsgateway";

interface ApexFrame {
  m: number;
  i: number;
  n: string;
  o: string;
}

interface ApexSession {
  ws: WebSocket;
  sequenceNumber: number;
  userId: string;
  sessionToken: string;
  accountId: string;
  pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>;
  isAuthenticated: boolean;
  heartbeatInterval?: ReturnType<typeof setInterval>;
}

let session: ApexSession | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 2000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isReconnecting = false;

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
  if (!proxyUrl) {
    console.warn("[BurjX] QUOTAGUARD_URL not set, connecting without proxy");
    return undefined;
  }
  return new HttpsProxyAgent(proxyUrl);
}

function createFrame(session: ApexSession, methodName: string, payload: any): string {
  session.sequenceNumber++;
  const frame: ApexFrame = {
    m: 0,
    i: session.sequenceNumber,
    n: methodName,
    o: JSON.stringify(payload),
  };
  return JSON.stringify(frame);
}

function parseFrame(data: string): ApexFrame | null {
  try {
    const frame = JSON.parse(data);
    if (typeof frame.m === "number" && typeof frame.n === "string") {
      return {
        m: frame.m,
        i: frame.i,
        n: frame.n,
        o: typeof frame.o === "string" ? frame.o : JSON.stringify(frame.o),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function sendRpc(methodName: string, payload: any, timeoutMs: number = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!session || session.ws.readyState !== WebSocket.OPEN) {
      return reject(new Error("WebSocket not connected"));
    }

    const frameStr = createFrame(session, methodName, payload);
    const seqNum = session.sequenceNumber;

    const timeout = setTimeout(() => {
      session?.pendingRequests.delete(seqNum);
      reject(new Error(`RPC timeout for ${methodName} (seq: ${seqNum})`));
    }, timeoutMs);

    session.pendingRequests.set(seqNum, { resolve, reject, timeout });
    session.ws.send(frameStr);
  });
}

function startHeartbeat() {
  if (!session) return;
  if (session.heartbeatInterval) clearInterval(session.heartbeatInterval);

  session.heartbeatInterval = setInterval(() => {
    if (session && session.ws.readyState === WebSocket.OPEN) {
      try {
        session.ws.ping();
      } catch {
        console.error("[BurjX] Heartbeat ping failed");
      }
    }
  }, 30000);
}

export async function connect(): Promise<void> {
  if (session && session.ws.readyState === WebSocket.OPEN && session.isAuthenticated) {
    return;
  }

  await disconnect();

  return new Promise((resolve, reject) => {
    const agent = getProxyAgent();
    const wsOptions: WebSocket.ClientOptions = {};
    if (agent) wsOptions.agent = agent;

    const ws = new WebSocket(WS_ENDPOINT, wsOptions);

    session = {
      ws,
      sequenceNumber: 0,
      userId: "",
      sessionToken: "",
      accountId: "",
      pendingRequests: new Map(),
      isAuthenticated: false,
    };

    const connectTimeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 20000);

    ws.on("open", async () => {
      clearTimeout(connectTimeout);
      console.log("[BurjX] WebSocket connected");

      try {
        const authResult = await authenticate();
        session!.isAuthenticated = true;
        session!.userId = authResult.UserId || authResult.userId || "";
        session!.sessionToken = authResult.SessionToken || authResult.sessionToken || "";
        session!.accountId = authResult.AccountId || authResult.accountId || "";
        startHeartbeat();
        console.log("[BurjX] Authenticated, userId:", session!.userId);
        resolve();
      } catch (err) {
        console.error("[BurjX] Auth failed:", err);
        ws.close();
        reject(err);
      }
    });

    ws.on("message", (data: WebSocket.Data) => {
      const raw = data.toString();
      const frame = parseFrame(raw);
      if (!frame) return;

      const pending = session?.pendingRequests.get(frame.i);
      if (pending) {
        clearTimeout(pending.timeout);
        session?.pendingRequests.delete(frame.i);

        try {
          const payload = JSON.parse(frame.o);
          if (payload.result === false || payload.errormsg) {
            pending.reject(new Error(payload.errormsg || `RPC error in ${frame.n}`));
          } else {
            pending.resolve(payload);
          }
        } catch {
          pending.resolve(frame.o);
        }
      }
    });

    ws.on("error", (err) => {
      console.error("[BurjX] WebSocket error:", err.message);
    });

    ws.on("close", (code, reason) => {
      console.log("[BurjX] WebSocket closed:", code, reason.toString());
      if (session?.heartbeatInterval) clearInterval(session.heartbeatInterval);
      const hadSession = session !== null;
      session = null;

      if (hadSession && !isReconnecting && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
      }
    });
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (isReconnecting) return;

  const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
  console.log(`[BurjX] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

  reconnectTimer = setTimeout(async () => {
    isReconnecting = true;
    reconnectAttempts++;

    try {
      await connect();
      reconnectAttempts = 0;
      console.log("[BurjX] Reconnected successfully");
    } catch (err) {
      console.error("[BurjX] Reconnect failed:", err);
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
      } else {
        console.error("[BurjX] Max reconnect attempts reached, giving up");
      }
    } finally {
      isReconnecting = false;
    }
  }, delay);
}

async function authenticate(): Promise<any> {
  const email = process.env.BURJX_TEST_EMAIL;
  const password = process.env.BURJX_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error("BURJX_TEST_EMAIL and BURJX_TEST_PASSWORD required");
  }

  return sendRpc("WebAuthenticateUser", {
    UserName: email,
    Password: password,
  });
}

export async function disconnect(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;
  isReconnecting = false;

  if (session) {
    if (session.heartbeatInterval) clearInterval(session.heartbeatInterval);
    for (const [, pending] of session.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Disconnected"));
    }
    session.pendingRequests.clear();
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.close();
    }
    session = null;
  }
}

export async function ensureConnected(): Promise<void> {
  if (!session || session.ws.readyState !== WebSocket.OPEN || !session.isAuthenticated) {
    await connect();
  }
}

export async function callRpc(methodName: string, payload: any = {}): Promise<any> {
  await ensureConnected();
  return sendRpc(methodName, payload);
}

export function getSession(): { userId: string; sessionToken: string; accountId: string } | null {
  if (!session || !session.isAuthenticated) return null;
  return {
    userId: session.userId,
    sessionToken: session.sessionToken,
    accountId: session.accountId,
  };
}

export function isConnected(): boolean {
  return session !== null && session.ws.readyState === WebSocket.OPEN && session.isAuthenticated;
}
