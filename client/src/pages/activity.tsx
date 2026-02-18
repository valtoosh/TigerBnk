import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@shared/schema";
import type { Transaction } from "@shared/schema";
import { ArrowUpRight, ArrowDownRight, Clock, Filter } from "lucide-react";

const filters = [
  { key: "all", label: "All" },
  { key: "added", label: "Added" },
  { key: "sent", label: "Sent" },
  { key: "pending", label: "Pending" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Activity() {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const filtered = (transactions || []).filter((tx) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "added") return tx.type === "deposit" || tx.type === "receive";
    if (activeFilter === "sent") return tx.type === "send" || tx.type === "withdrawal";
    if (activeFilter === "pending") return tx.status === "pending";
    return true;
  });

  const grouped = groupByDate(filtered);

  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Your complete transaction history</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            data-testid={`button-filter-${f.key}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeFilter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover-elevate"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center mx-auto mb-4">
              <Filter className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No transactions found</p>
            <p className="text-xs text-muted-foreground">
              {activeFilter !== "all" ? "Try a different filter" : "Your transactions will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-medium mb-2 px-1">{date}</p>
              <Card className="overflow-visible">
                <CardContent className="p-2">
                  {txs.map((tx, i) => (
                    <ActivityRow key={tx.id} tx={tx} isLast={i === txs.length - 1} />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ActivityRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
  const isIncoming = tx.type === "receive" || tx.type === "deposit";
  const amount = parseFloat(tx.amount as string);
  const isPending = tx.status === "pending";

  return (
    <div className="flex items-center gap-3 p-3 rounded-md hover-elevate" data-testid={`row-activity-${tx.id}`}>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isIncoming ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
        {isPending ? (
          <Clock className="w-5 h-5 text-amber-500" />
        ) : isIncoming ? (
          <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-red-500 dark:text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
          {isPending && <Badge variant="secondary" className="text-[10px]">Pending</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {tx.recipientName || tx.source} &middot; {new Date(tx.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${isIncoming ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {isIncoming ? "+" : "-"}{formatCurrency(amount, tx.currency)}
      </span>
    </div>
  );
}

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of txs) {
    const date = new Date(tx.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }
  return groups;
}
