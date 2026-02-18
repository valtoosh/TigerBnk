import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, formatCurrency } from "@shared/schema";
import { ArrowRight, ArrowDown, Send, RefreshCw, Check } from "lucide-react";
import { useLocation } from "wouter";

const sendSchema = z.object({
  recipientEmail: z.string().email("Enter a valid email"),
  amount: z.string().min(1, "Amount is required").refine((v) => parseFloat(v) > 0, "Must be positive"),
  fromCurrency: z.string().default("AED"),
  toCurrency: z.string().default("AED"),
});

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SendMoney() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof sendSchema>>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      recipientEmail: "",
      amount: "",
      fromCurrency: user?.currency || "AED",
      toCurrency: "AED",
    },
  });

  const fromCurrency = form.watch("fromCurrency");
  const toCurrency = form.watch("toCurrency");
  const amount = form.watch("amount");
  const numAmount = parseFloat(amount) || 0;

  const { data: rateData, isLoading: rateLoading } = useQuery<{ rate: number; convertedAmount: number; fee: number; feePercent: number }>({
    queryKey: ["/api/exchange-rate", `?from=${fromCurrency}&to=${toCurrency}&amount=${numAmount || 1}`],
    enabled: fromCurrency !== toCurrency && numAmount > 0,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sendSchema>) => {
      const res = await apiRequest("POST", "/api/transactions/send", {
        recipientEmail: data.recipientEmail,
        amount: parseFloat(data.amount),
        currency: data.fromCurrency,
        toCurrency: data.toCurrency,
      });
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: any) => {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    },
  });

  const convertedAmount = rateData?.convertedAmount || numAmount;
  const rate = rateData?.rate || 1;
  const fee = rateData?.fee || 0;
  const feePercent = rateData?.feePercent || 0;
  const isSameCurrency = fromCurrency === toCurrency;

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[60vh]">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Transfer Sent</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {formatCurrency(numAmount, fromCurrency)} has been sent successfully
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-back-home">Back to Home</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Send Money</h1>
        <p className="text-sm text-muted-foreground mt-1">Transfer to any TigerPayX user instantly</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => sendMutation.mutate(data))} className="space-y-4">
          <Card className="overflow-visible">
            <CardContent className="p-5 space-y-4">
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="recipient@example.com" data-testid="input-recipient-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <p className="text-sm font-medium">You Send</p>
                <div className="flex gap-3">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" className="text-lg font-semibold" data-testid="input-send-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fromCurrency"
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-from-currency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Recipient Gets</p>
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center px-3 bg-muted rounded-md min-h-[44px]">
                    <span className="text-lg font-semibold tabular-nums" data-testid="text-converted-amount">
                      {numAmount > 0 ? (isSameCurrency ? numAmount.toFixed(2) : convertedAmount.toFixed(2)) : "0.00"}
                    </span>
                  </div>
                  <FormField
                    control={form.control}
                    name="toCurrency"
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-to-currency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {!isSameCurrency && numAmount > 0 && (
            <Card className="overflow-visible">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium flex items-center gap-1" data-testid="text-exchange-rate">
                    {rateLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap text-sm mt-2">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium" data-testid="text-fee">
                    {feePercent === 0 ? (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    ) : (
                      `${feePercent}% (${formatCurrency(fee, fromCurrency)})`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={sendMutation.isPending} data-testid="button-send-money">
            {sendMutation.isPending ? (
              "Sending..."
            ) : numAmount > 0 && !isSameCurrency ? (
              <>Send {formatCurrency(numAmount, fromCurrency)} → {formatCurrency(convertedAmount, toCurrency)}</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Money
              </>
            )}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
