import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getRoarTier } from "@shared/schema";
import type { Transaction } from "@shared/schema";
import { Plus, Send, ArrowDownLeft, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { useLocation } from "wouter";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: roarData } = useQuery<{ score: number; tier: string }>({
    queryKey: ["/api/roar-score"],
  });

  const balance = user ? parseFloat(user.balance as string) : 0;
  const currency = user?.currency || "AED";
  const roarScore = roarData?.score ?? user?.roarScore ?? 350;
  const tier = getRoarTier(roarScore);
  const recentTx = transactions?.slice(0, 5) || [];

  const quickActions = [
    { icon: Plus, label: "Add Money", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", onClick: () => navigate("/add-money") },
    { icon: Send, label: "Send", color: "bg-primary/10 text-primary", onClick: () => navigate("/send") },
    { icon: ArrowDownLeft, label: "Request", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", onClick: () => {} },
    { icon: CreditCard, label: "Pay", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400", onClick: () => {} },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Card className="overflow-visible">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                <h2 className="text-3xl font-bold tracking-tight" data-testid="text-balance">
                  {formatCurrency(balance, currency)}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs font-normal" data-testid="badge-currency">
                    {currency}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Individual Account</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">+2.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 p-3 rounded-md hover-elevate active-elevate-2 transition-all"
              data-testid={`button-action-${action.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className={`w-11 h-11 rounded-md flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="overflow-visible">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <h3 className="text-sm font-semibold">Roar Score</h3>
              <Badge
                variant="outline"
                style={{ borderColor: tier.color, color: tier.color }}
                data-testid="badge-roar-tier"
              >
                {tier.name}
              </Badge>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-2xl font-bold" data-testid="text-roar-score">{roarScore}</span>
              <span className="text-xs text-muted-foreground mb-1">/ 850</span>
            </div>
            <Progress value={(roarScore / 850) * 100} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">0</span>
              <span className="text-[10px] text-muted-foreground">850</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/activity")} data-testid="button-view-all-transactions">
            View All
          </Button>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start by adding money to your account</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-visible">
            <CardContent className="p-2">
              {recentTx.map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} isLast={i === recentTx.length - 1} />
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

function TransactionRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
  const isIncoming = tx.type === "receive" || tx.type === "deposit";
  const amount = parseFloat(tx.amount as string);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-md hover-elevate ${!isLast ? "" : ""}`} data-testid={`row-transaction-${tx.id}`}>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isIncoming ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
        {isIncoming ? (
          <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-red-500 dark:text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
        <p className="text-xs text-muted-foreground">
          {tx.recipientName || tx.source} &middot; {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${isIncoming ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {isIncoming ? "+" : "-"}{formatCurrency(amount, tx.currency)}
      </span>
    </div>
  );
}
