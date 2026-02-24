import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Rocket, ArrowLeft } from "lucide-react";
import logoImg from "@assets/Group_95_1771930128528.png";

const ORANGE = "#FF4D00";

export default function MerchantComingSoon() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center"
      >
        <div className="flex justify-center mb-8">
          <img src={logoImg} alt="TigerBnk" className="w-16 h-16 rounded-xl" data-testid="img-logo" />
        </div>

        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: `${ORANGE}15` }}>
          <Rocket className="w-10 h-10" style={{ color: ORANGE }} />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-coming-soon-title">
          Merchant Platform Coming Soon
        </h1>

        <p className="text-muted-foreground text-lg mb-3" data-testid="text-coming-soon-desc">
          We're building something powerful for merchants like you.
        </p>

        <p className="text-muted-foreground mb-8" data-testid="text-coming-soon-sub">
          Welcome, <span className="text-foreground font-medium">{user?.fullName}</span>. Your merchant account has been created.
          We'll notify you at <span className="text-foreground font-medium">{user?.email}</span> when the platform is ready.
        </p>

        <div className="p-6 rounded-2xl border border-border bg-card mb-8" data-testid="card-features">
          <h3 className="text-sm font-semibold text-foreground mb-4">What's coming for merchants:</h3>
          <div className="grid gap-3 text-left">
            {[
              "Accept payments from anywhere in the world",
              "Instant settlement to your bank account",
              "Build your Roar Score for credit access",
              "Working capital based on your revenue",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ORANGE }} />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={logout}
            className="gap-2"
            data-testid="button-logout"
          >
            <ArrowLeft className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
