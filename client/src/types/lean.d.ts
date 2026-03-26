interface LeanLinkOptions {
  app_token: string;
  customer_id: string;
  permissions: string[];
  access_token: string;
  callback: (response: { status: string; message?: string }) => void;
}

interface LeanPayOptions {
  app_token: string;
  payment_intent_id: string;
  access_token: string;
  callback: (response: { status: string; message?: string }) => void;
}

interface Window {
  Lean: {
    link(options: LeanLinkOptions): void;
    pay(options: LeanPayOptions): void;
  };
}
