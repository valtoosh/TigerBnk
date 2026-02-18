import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@shared/schema";
import { Building2, CreditCard, Check, ArrowLeft, Landmark, Info } from "lucide-react";
import { useLocation } from "wouter";

const presets = [100, 500, 1000, 5000];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AddMoney() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "card">("bank");
  const [step, setStep] = useState<"amount" | "confirm" | "success">("amount");
  const currency = user?.currency || "AED";

  const depositMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/deposit", {
        amount: parseFloat(amount),
        source: method === "bank" ? "Bank Transfer" : "Card Payment",
        description: `Deposit via ${method === "bank" ? "Bank Transfer" : "Card"}`,
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

  if (step === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[60vh]">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Deposit Successful</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {formatCurrency(parseFloat(amount), currency)} has been added to your account
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-back-home">Back to Home</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (step === "confirm") {
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
              <span className="text-sm font-medium">{method === "bank" ? "Bank Transfer" : "Card Payment"}</span>
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

        {method === "bank" && (
          <Card className="overflow-visible">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Bank Transfer Details</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 flex-wrap"><span className="text-muted-foreground">Account Name</span><span className="font-medium">TigerPayX LLC</span></div>
                <div className="flex justify-between gap-4 flex-wrap"><span className="text-muted-foreground">Bank</span><span className="font-medium">Emirates NBD</span></div>
                <div className="flex justify-between gap-4 flex-wrap"><span className="text-muted-foreground">IBAN</span><span className="font-medium font-mono text-xs">AE12 0340 0000 1234 5678 901</span></div>
                <div className="flex justify-between gap-4 flex-wrap"><span className="text-muted-foreground">SWIFT</span><span className="font-medium font-mono text-xs">EBILAEADXXX</span></div>
                <div className="flex justify-between gap-4 flex-wrap"><span className="text-muted-foreground">Reference</span><span className="font-medium font-mono text-xs">TPX-{user?.id || "0"}-{Date.now()}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full" onClick={() => depositMutation.mutate()} disabled={depositMutation.isPending} data-testid="button-confirm-deposit">
          {depositMutation.isPending ? "Processing..." : `Confirm ${formatCurrency(parseFloat(amount), currency)}`}
        </Button>
      </motion.div>
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
            min="10"
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
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMethod("bank")}
            data-testid="button-method-bank"
            className={`p-4 rounded-md border transition-all text-left ${
              method === "bank" ? "border-primary bg-primary/5" : "border-border hover-elevate"
            }`}
          >
            <Landmark className={`w-5 h-5 mb-2 ${method === "bank" ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">Bank Transfer</p>
            <p className="text-xs text-muted-foreground mt-0.5">1-2 business days</p>
          </button>
          <button
            onClick={() => setMethod("card")}
            data-testid="button-method-card"
            className={`p-4 rounded-md border transition-all text-left ${
              method === "card" ? "border-primary bg-primary/5" : "border-border hover-elevate"
            }`}
          >
            <CreditCard className={`w-5 h-5 mb-2 ${method === "card" ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">Debit/Credit Card</p>
            <p className="text-xs text-muted-foreground mt-0.5">Instant</p>
          </button>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!amount || parseFloat(amount) < 10}
        onClick={() => setStep("confirm")}
        data-testid="button-continue-deposit"
      >
        Continue
      </Button>

      {parseFloat(amount) > 0 && parseFloat(amount) < 10 && (
        <p className="text-xs text-destructive text-center">Minimum deposit is {currency} 10</p>
      )}
    </motion.div>
  );
}
