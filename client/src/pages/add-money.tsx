import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@shared/schema";
import { Building2, CreditCard, Check, ArrowLeft, Landmark, Info, Loader2, Wallet, Smartphone, Globe, Copy, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function getPresetsForCurrency(currency: string): number[] {
  switch (currency) {
    case "INR": return [500, 2000, 5000, 10000];
    case "PHP": return [500, 1000, 5000, 10000];
    case "IDR": return [100000, 500000, 1000000, 5000000];
    default: return [100, 500, 1000, 5000];
  }
}

function getMinAmount(currency: string): number {
  switch (currency) {
    case "INR": return 50;
    case "PHP": return 50;
    case "IDR": return 50000;
    default: return 10;
  }
}

function PaymentMethodIcon({ method }: { method: string }) {
  switch (method) {
    case "upi": return <Smartphone className="w-5 h-5" />;
    case "gcash": case "paymaya": case "grabpay": return <Wallet className="w-5 h-5" />;
    case "bank_transfer": case "imps": case "neft": return <Landmark className="w-5 h-5" />;
    default: return <Globe className="w-5 h-5" />;
  }
}

function getMethodDescription(method: string): string {
  switch (method) {
    case "upi": return "Instant via UPI";
    case "gcash": return "Via GCash wallet";
    case "paymaya": return "Via PayMaya";
    case "grabpay": return "Via GrabPay";
    case "bank_transfer": return "1-2 business days";
    case "imps": return "Instant bank transfer";
    case "neft": return "Within 2 hours";
    default: return "";
  }
}

export default function AddMoney() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [step, setStep] = useState<"amount" | "confirm" | "processing" | "success">("amount");
  const [depositResult, setDepositResult] = useState<any>(null);
  const currency = user?.currency || "AED";
  const presets = getPresetsForCurrency(currency);
  const minAmount = getMinAmount(currency);

  const { data: providerInfo, isLoading: providerLoading } = useQuery<{
    provider: string;
    country: string;
    currency: string;
    paymentMethods: { id: string; label: string }[];
  }>({
    queryKey: ["/api/payment-provider"],
  });

  useEffect(() => {
    if (providerInfo?.paymentMethods?.[0] && !selectedMethod) {
      setSelectedMethod(providerInfo.paymentMethods[0].id);
    }
  }, [providerInfo, selectedMethod]);

  const provider = providerInfo?.provider || "manual";

  const burjxDepositMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/burjx/deposit", {
        amount: parseFloat(amount),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setDepositResult(data);
      setStep("processing");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: any) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const onmetaDepositMutation = useMutation({
    mutationFn: async () => {
      const loginRes = await apiRequest("POST", "/api/onmeta/login", {});
      const loginData = await loginRes.json();

      const res = await fetch("/api/onmeta/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-onmeta-token": loginData.token,
        },
        credentials: "include",
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: selectedMethod,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Deposit failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setDepositResult(data);
      setStep("processing");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: any) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const manualDepositMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/deposit", {
        amount: parseFloat(amount),
        source: selectedMethod === "card" ? "Card Payment" : "Bank Transfer",
        description: `Deposit via ${selectedMethod === "card" ? "Card" : "Bank Transfer"}`,
      });
      return res.json();
    },
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: any) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  function handleDeposit() {
    if (provider === "burjx") {
      burjxDepositMutation.mutate();
    } else if (provider === "onmeta") {
      onmetaDepositMutation.mutate();
    } else {
      manualDepositMutation.mutate();
    }
  }

  const isPending = burjxDepositMutation.isPending || onmetaDepositMutation.isPending || manualDepositMutation.isPending;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  }

  if (step === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[60vh]">
        <Card className="overflow-visible">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Deposit Successful</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {formatCurrency(parseFloat(amount), currency)} has been added to your account
            </p>
            <Button onClick={() => navigate("/dashboard")} data-testid="button-back-home">Back to Home</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (step === "processing") {
    const ticket = depositResult?.ticket;
    const order = depositResult?.order;

    return (
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
        <button onClick={() => setStep("amount")} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="button-back-amount">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div>
          <h1 className="text-xl font-semibold">Complete Your Transfer</h1>
          <p className="text-sm text-muted-foreground mt-1">{depositResult?.message || "Follow the instructions below to complete your deposit"}</p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">Transfer Details</p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold" data-testid="text-processing-amount">{formatCurrency(parseFloat(amount), currency)}</span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="secondary" className="text-xs" data-testid="badge-deposit-status">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Waiting for payment
              </Badge>
            </div>

            {ticket?.bankDetails && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-3 text-sm">
                  {ticket.bankDetails.bankName && (
                    <div className="flex justify-between gap-4 flex-wrap">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-medium">{ticket.bankDetails.bankName}</span>
                    </div>
                  )}
                  {ticket.bankDetails.iban && (
                    <div className="flex justify-between gap-4 flex-wrap items-center">
                      <span className="text-muted-foreground">IBAN</span>
                      <button onClick={() => copyToClipboard(ticket.bankDetails.iban)} className="flex items-center gap-1.5 font-medium font-mono text-xs" data-testid="button-copy-iban">
                        {ticket.bankDetails.iban}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {ticket.bankDetails.accountNumber && (
                    <div className="flex justify-between gap-4 flex-wrap items-center">
                      <span className="text-muted-foreground">Account Number</span>
                      <button onClick={() => copyToClipboard(ticket.bankDetails.accountNumber)} className="flex items-center gap-1.5 font-medium font-mono text-xs" data-testid="button-copy-account">
                        {ticket.bankDetails.accountNumber}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {ticket.bankDetails.reference && (
                    <div className="flex justify-between gap-4 flex-wrap items-center">
                      <span className="text-muted-foreground">Reference</span>
                      <button onClick={() => copyToClipboard(ticket.bankDetails.reference)} className="flex items-center gap-1.5 font-medium font-mono text-xs" data-testid="button-copy-reference">
                        {ticket.bankDetails.reference}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {order?.paymentUrl && (
              <>
                <div className="h-px bg-border" />
                <Button className="w-full" onClick={() => window.open(order.paymentUrl, "_blank")} data-testid="button-open-payment">
                  Complete Payment
                </Button>
              </>
            )}

            {order?.paymentDetails && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-3 text-sm">
                  {order.paymentDetails.upiId && (
                    <div className="flex justify-between gap-4 flex-wrap items-center">
                      <span className="text-muted-foreground">UPI ID</span>
                      <button onClick={() => copyToClipboard(order.paymentDetails.upiId)} className="flex items-center gap-1.5 font-medium font-mono text-xs" data-testid="button-copy-upi">
                        {order.paymentDetails.upiId}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {order.paymentDetails.accountNumber && (
                    <div className="flex justify-between gap-4 flex-wrap items-center">
                      <span className="text-muted-foreground">Account Number</span>
                      <button onClick={() => copyToClipboard(order.paymentDetails.accountNumber)} className="flex items-center gap-1.5 font-medium font-mono text-xs">
                        {order.paymentDetails.accountNumber}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {order.paymentDetails.reference && (
                    <div className="flex justify-between gap-4 flex-wrap items-center">
                      <span className="text-muted-foreground">Reference</span>
                      <button onClick={() => copyToClipboard(order.paymentDetails.reference)} className="flex items-center gap-1.5 font-medium font-mono text-xs">
                        {order.paymentDetails.reference}
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Your balance will be updated once the payment is confirmed</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")} data-testid="button-done-processing">
            Done
          </Button>
        </div>
      </motion.div>
    );
  }

  if (step === "confirm") {
    const methodLabel = providerInfo?.paymentMethods?.find(m => m.id === selectedMethod)?.label || selectedMethod;

    return (
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
        <button onClick={() => setStep("amount")} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="button-back-amount">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div>
          <h1 className="text-xl font-semibold">Confirm Deposit</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your deposit details</p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold" data-testid="text-confirm-amount">{formatCurrency(parseFloat(amount), currency)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Method</span>
              <span className="text-sm font-medium" data-testid="text-confirm-method">{methodLabel}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Provider</span>
              <Badge variant="secondary" className="text-xs" data-testid="badge-provider">
                {provider === "burjx" ? "Secure Banking (UAE)" : provider === "onmeta" ? "Secure Payment" : "TigerPayX"}
              </Badge>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Processing Fee</span>
              <Badge variant="secondary" className="text-xs">Free</Badge>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(amount), currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={handleDeposit} disabled={isPending} data-testid="button-confirm-deposit">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Confirm ${formatCurrency(parseFloat(amount), currency)}`
          )}
        </Button>
      </motion.div>
    );
  }

  if (providerLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Add Money</h1>
        <p className="text-sm text-muted-foreground mt-1">Fund your TigerPayX account</p>
      </div>

      <Card className="overflow-visible">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-medium">Enter Amount ({currency})</p>
          <Input
            type="number"
            step="0.01"
            min={minAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-2xl font-bold text-center h-14"
            data-testid="input-deposit-amount"
          />
          <div className="flex gap-2 flex-wrap">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p.toString())}
                data-testid={`button-preset-${p}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  amount === p.toString() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover-elevate"
                }`}
              >
                {currency} {p.toLocaleString()}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-medium mb-3">Payment Method</p>
        <div className={`grid gap-3 ${(providerInfo?.paymentMethods?.length || 0) > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {providerInfo?.paymentMethods?.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              data-testid={`button-method-${method.id}`}
              className={`p-4 rounded-md border transition-all text-left ${
                selectedMethod === method.id ? "border-primary bg-primary/5" : "border-border hover-elevate"
              }`}
            >
              <div className={selectedMethod === method.id ? "text-primary" : "text-muted-foreground"}>
                <PaymentMethodIcon method={method.id} />
              </div>
              <p className="text-sm font-medium mt-2">{method.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getMethodDescription(method.id)}</p>
            </button>
          ))}

          {(!providerInfo?.paymentMethods || providerInfo.paymentMethods.length === 0) && (
            <>
              <button
                onClick={() => setSelectedMethod("bank_transfer")}
                data-testid="button-method-bank"
                className={`p-4 rounded-md border transition-all text-left ${
                  selectedMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border hover-elevate"
                }`}
              >
                <Landmark className={`w-5 h-5 mb-2 ${selectedMethod === "bank_transfer" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium">Bank Transfer</p>
                <p className="text-xs text-muted-foreground mt-0.5">1-2 business days</p>
              </button>
              <button
                onClick={() => setSelectedMethod("card")}
                data-testid="button-method-card"
                className={`p-4 rounded-md border transition-all text-left ${
                  selectedMethod === "card" ? "border-primary bg-primary/5" : "border-border hover-elevate"
                }`}
              >
                <CreditCard className={`w-5 h-5 mb-2 ${selectedMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium">Debit/Credit Card</p>
                <p className="text-xs text-muted-foreground mt-0.5">Instant</p>
              </button>
            </>
          )}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!amount || parseFloat(amount) < minAmount || !selectedMethod}
        onClick={() => setStep("confirm")}
        data-testid="button-continue-deposit"
      >
        Continue
      </Button>

      {parseFloat(amount) > 0 && parseFloat(amount) < minAmount && (
        <p className="text-xs text-destructive text-center">Minimum deposit is {currency} {minAmount.toLocaleString()}</p>
      )}
    </motion.div>
  );
}
