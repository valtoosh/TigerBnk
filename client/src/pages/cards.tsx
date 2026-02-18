import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Cards() {
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cards</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your virtual and physical cards</p>
      </div>

      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="p-10 text-center max-w-sm">
            <div className="relative mx-auto mb-6 w-64 h-40">
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/80 to-primary/40 flex flex-col justify-between p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-primary-foreground/80">TigerPayX</span>
                  <Sparkles className="w-4 h-4 text-primary-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-mono text-primary-foreground/70 tracking-widest mb-2">**** **** **** 4829</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-primary-foreground/60">COMING SOON</span>
                    <CreditCard className="w-5 h-5 text-primary-foreground/40" />
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-2">Cards Coming Soon</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Virtual and physical cards are on the way. Get notified when they launch.
            </p>
            <Button variant="secondary" data-testid="button-notify-cards">
              Notify Me
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
