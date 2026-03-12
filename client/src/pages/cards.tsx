import { motion } from "framer-motion";
import { CreditCard, Globe, ShieldCheck, Zap, Bell, Wifi, Snowflake, Percent, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ORANGE = "#FF4D00";
const ORANGE_LIGHT = "#FF8C00";
const kxEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: kxEase } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const features = [
  { icon: Globe, label: "Global Payments" },
  { icon: CreditCard, label: "Virtual & Physical" },
  { icon: ShieldCheck, label: "Instant Freeze" },
  { icon: Zap, label: "Cashback Rewards" },
];

const cardFeatures = [
  { icon: Wifi, title: "Contactless", desc: "Tap to pay anywhere in the world" },
  { icon: Snowflake, title: "Instant Freeze", desc: "Lock your card in one tap" },
  { icon: Percent, title: "Cashback", desc: "Earn on every transaction" },
  { icon: Lock, title: "Secure", desc: "Bank-grade encryption" },
  { icon: Smartphone, title: "Digital First", desc: "Use before your physical card arrives" },
  { icon: Globe, title: "No FX Fees", desc: "Spend globally without hidden charges" },
];

export default function Cards() {
  const [notified, setNotified] = useState(false);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center text-center px-4 py-8 -mx-4 md:-mx-6"
    >
      {/* Heading */}
      <motion.div variants={fadeUp} className="mb-3">
        <span
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full"
          style={{ color: ORANGE, background: "rgba(255,77,0,0.08)", border: "1px solid rgba(255,77,0,0.12)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE, animation: "pulseGlow 2s ease-in-out infinite" }} />
          Coming Soon
        </span>
      </motion.div>

      <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-foreground mb-3 tracking-tight">
        TigerBnk{" "}
        <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})` }}>
          Card
        </span>
      </motion.h1>

      <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-10 max-w-sm">
        Your financial power, in your pocket.
      </motion.p>

      {/* Card mockup with float + shimmer */}
      <motion.div
        variants={fadeUp}
        className="relative mb-12"
        style={{ perspective: "900px" }}
      >
        <motion.div
          className="relative w-80 sm:w-[22rem] h-48 sm:h-52 rounded-2xl flex flex-col justify-between p-6 select-none overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_LIGHT} 100%)`,
            transform: "perspective(900px) rotateY(-5deg) rotateX(3deg)",
            boxShadow: `0 20px 60px rgba(255, 77, 0, 0.2), 0 0 80px rgba(255, 77, 0, 0.08)`,
            animation: "float 6s ease-in-out infinite",
          }}
        >
          {/* Shimmer */}
          <div
            className="absolute top-0 h-full w-1/2 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              animation: "shimmerSweep 4s ease-in-out 1.5s infinite",
            }}
          />

          {/* Top row */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex flex-col">
              <span className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase">TigerBnk</span>
            </div>
            {/* Chip */}
            <div className="w-9 h-7 rounded-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))", border: "1px solid rgba(255,255,255,0.3)" }} />
          </div>

          {/* Card number */}
          <div className="relative z-10">
            <p className="text-white/70 font-mono text-sm tracking-[0.25em] mb-3">
              **** **** **** ****
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-[0.15em] mb-0.5">Cardholder</p>
                <p className="text-white text-sm font-semibold">YOUR NAME</p>
              </div>
              {/* Mastercard circles */}
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-red-500/80" />
                <div className="w-7 h-7 rounded-full bg-orange-400/80" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Feature pills */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: kxEase, delay: 0.5 + i * 0.08 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-default"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px rgba(255,77,0,0.1)` }}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 mb-16">
        <Button
          size="lg"
          className="rounded-full px-8 font-semibold text-base gap-2 border-0"
          style={{
            background: notified ? "#22c55e" : ORANGE,
            color: notified ? "#fff" : "#000",
            animation: notified ? "none" : "btnGlow 3s ease-in-out infinite",
          }}
          onClick={() => setNotified(true)}
          data-testid="button-notify-cards"
        >
          {notified ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              You're on the list!
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              Notify Me
            </>
          )}
        </Button>
        {!notified && (
          <p className="text-muted-foreground text-sm">
            Be the first to know when TigerBnk Card launches.
          </p>
        )}
      </motion.div>

      {/* Card Features Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="w-full max-w-2xl"
      >
        <h3 className="text-lg font-bold text-foreground mb-6">Card Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cardFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: kxEase, delay: 0.7 + i * 0.06 }}
              className="p-4 rounded-xl text-left transition-all duration-200 cursor-default"
              style={{ background: "hsl(var(--card))" }}
              whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(255,77,0,0.08)" }}>
                <f.icon className="w-4 h-4" style={{ color: ORANGE }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
