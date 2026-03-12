import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEarlyAccessSchema } from "@shared/schema";
import {
  ArrowRight, Clock, Globe, Lock, CreditCard, TrendingUp, Repeat,
  DollarSign, CheckCircle2, Zap, BarChart3, Menu, X,
  ShoppingCart, Users, Ship, Monitor, Store, Plus,
  CircleDollarSign, Building2, Smartphone, Landmark, IndianRupee
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";
import logoImg from "@assets/tigerbnklogo.png";
import faqImg from "@assets/faq.png";
import AnimatedWorldMap from "@/components/animated-world-map";

const ORANGE = "#FF4D00";
const ease = [0.16, 1, 0.3, 1] as const;

const earlyAccessFormSchema = insertEarlyAccessSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  country: z.string().min(2, "Country is required"),
  monthlyVolume: z.string().min(1, "Monthly volume is required"),
});
type EarlyAccessForm = z.infer<typeof earlyAccessFormSchema>;

const animateIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease },
};

function useCounter(target: number, duration = 2000, start = 0, trigger = false) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    if (!trigger) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [trigger, target, duration, start]);
  return value;
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navbar sits inside the hero — dark transparent overlay
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
      }}
      data-testid="nav-landing"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2.5" data-testid="text-logo">
            <img src={logoImg} alt="TigerBnk" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight text-gray-900">TigerBnk</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="transition-colors hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-gray-900">How It Works</a>
            <Link href="/cards" className="transition-colors hover:text-gray-900">Cards</Link>
            <a href="#faq" className="transition-colors hover:text-gray-900">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild size="sm"
              className="rounded-full px-6 py-2 font-medium text-gray-900 border-0 h-auto"
              style={{ background: ORANGE }}
              data-testid="link-nav-signup"
            >
              <Link href="/auth?mode=register" className="inline-flex items-center gap-1.5">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-6 py-4 space-y-3">
              <a href="#features" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#how-it-works" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>How It Works</a>
              <Link href="/cards" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Cards</Link>
              <a href="#faq" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>FAQ</a>
              <div className="flex gap-3 pt-2">
                <Button asChild size="sm" className="flex-1 rounded-full text-gray-900 border-0" style={{ background: ORANGE }}>
                  <Link href="/auth?mode=register">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  const tpv = useCounter(20000000, 2400, 0, true);

  const clipReveal = {
    hidden: { y: "100%", opacity: 0, filter: "blur(8px)" },
    visible: { y: "0%", opacity: 1, filter: "blur(0px)" },
  };

  return (
    <section className="bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8" data-testid="section-hero">
      <div className="max-w-[1320px] mx-auto rounded-3xl overflow-hidden border border-gray-200/50 relative" style={{ minHeight: "78vh" }}>
        <AnimatedWorldMap />

        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(255,255,255,0.5) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-end h-full px-8 md:px-14 pb-14 pt-20" style={{ minHeight: "78vh" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            className="mb-6"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-md text-sm font-semibold tabular-nums"
              style={{ background: ORANGE, color: "#000" }}
              data-testid="badge-tpv"
            >
              ${tpv.toLocaleString()}+ TPV
            </span>
          </motion.div>

          <div className="mb-6 max-w-3xl">
            {["Global Payments,", "Simplified."].map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.div
                  variants={clipReveal}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.8, ease, delay: 0.5 + i * 0.15 }}
                >
                  <h1
                    className="text-gray-900 font-black tracking-tight leading-[1.05]"
                    style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
                    data-testid="text-hero-headline"
                  >
                    {line}
                  </h1>
                </motion.div>
              </div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease, delay: 0.9 }}
            className="text-gray-500 text-base sm:text-lg max-w-md leading-relaxed mb-8"
            data-testid="text-hero-subheadline"
          >
            Collect and pay globally with{" "}
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "#C9A84C", color: "#1a1a1a", border: "1px solid rgba(201, 168, 76, 0.5)" }}
            >
              T+0 settlement
            </span>
            , powered by TigerBnk.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 1.2 }}
          >
            <Link href="/auth?mode=register">
              <button
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300"
                style={{
                  background: ORANGE,
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(255, 77, 0, 0.25)",
                }}
                data-testid="button-hero-cta"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 30px rgba(255, 77, 0, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(255, 77, 0, 0.25)";
                }}
              >
                Get Started <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[2]"
          style={{ background: "linear-gradient(to top, rgba(255,255,255,0.8), transparent)" }}
        />
      </div>
    </section>
  );
}

/* ─── Problem Section ─── */

function CurrencyRoutingCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const currencies = [
    { code: "INR", flag: "🇮🇳", color: "#FF9933" },
    { code: "BRL", flag: "🇧🇷", color: "#009739" },
    { code: "PHP", flag: "🇵🇭", color: "#0038A8" },
    { code: "NGN", flag: "🇳🇬", color: "#008751" },
  ];

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      transition={{ duration: 0.5, ease, delay: 0 }}
      className="p-8 bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
      data-testid="card-problem-0"
    >
      <div className="flex-1 flex flex-col items-center">
        <div className="flex justify-between w-full mb-6">
          {currencies.map((c, i) => (
            <motion.div
              key={c.code}
              initial={{ opacity: 0, scale: 0.5, y: -16 }}
              animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12, type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                className="w-11 h-11 bg-white border-2 flex items-center justify-center text-lg shadow-sm"
                style={{ borderColor: c.color }}
                animate={inView ? { boxShadow: [`0 0 0px ${c.color}00`, `0 0 12px ${c.color}30`, `0 0 4px ${c.color}15`] } : {}}
                transition={{ duration: 1.5, delay: 0.8 + i * 0.12 }}
              >
                {c.flag}
              </motion.div>
              <span className="text-[10px] font-bold text-gray-500 tracking-wide">{c.code}</span>
            </motion.div>
          ))}
        </div>

        <svg width="100%" height="130" viewBox="0 0 240 130" className="mb-2">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5E7EB" />
              <stop offset="100%" stopColor={ORANGE} stopOpacity={0.4} />
            </linearGradient>
            <filter id="hubGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <motion.path
              key={`line-top-${i}`}
              d={`M${30 + i * 60},0 Q${30 + i * 60 + (120 - (30 + i * 60)) * 0.3},25 120,55`}
              stroke="url(#lineGrad)"
              strokeWidth={1.5}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: [0.4, 0, 0.2, 1] }}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <motion.circle
              key={`dot-${i}`}
              r={2.5}
              fill={ORANGE}
              initial={{ opacity: 0 }}
              animate={inView ? {
                opacity: [0, 1, 1, 0],
                cx: [30 + i * 60, 30 + i * 60 + (120 - (30 + i * 60)) * 0.5, 120, 120],
                cy: [0, 25, 50, 55],
              } : {}}
              transition={{ duration: 1.2, delay: 1.3 + i * 0.2, ease: "easeInOut" }}
            />
          ))}
          <motion.circle
            cx={120}
            cy={55}
            r={20}
            fill="#FFF8E7"
            stroke={ORANGE}
            strokeWidth={2}
            filter="url(#hubGlow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.0, type: "spring", stiffness: 180, damping: 12 }}
          />
          <motion.text
            x={120}
            y={59}
            textAnchor="middle"
            fontSize={9}
            fontWeight={800}
            fill={ORANGE}
            letterSpacing="1"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 1.4 }}
          >
            HUB
          </motion.text>
          <motion.line
            x1={120}
            y1={75}
            x2={120}
            y2={115}
            stroke="url(#lineGrad)"
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.6, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.circle
            r={2.5}
            fill={ORANGE}
            initial={{ opacity: 0 }}
            animate={inView ? {
              opacity: [0, 1, 1, 0],
              cx: [120, 120, 120, 120],
              cy: [75, 90, 105, 115],
            } : {}}
            transition={{ duration: 0.8, delay: 2.0, ease: "easeInOut" }}
          />
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 2.1, type: "spring", stiffness: 200, damping: 14 }}
          >
            <circle cx={120} cy={118} r={12} fill="#FFF8E7" stroke={ORANGE} strokeWidth={1.5} strokeOpacity={0.5} />
            <g transform="translate(112, 110)">
              <rect x="1" y="3" width="14" height="10" rx="1" stroke={ORANGE} strokeWidth="1.2" fill="none" strokeOpacity={0.7} />
              <path d="M3 3V2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" stroke={ORANGE} strokeWidth="1.2" fill="none" strokeOpacity={0.7} />
              <circle cx="11" cy="8" r="1" fill={ORANGE} fillOpacity={0.7} />
            </g>
          </motion.g>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3" data-testid="text-problem-title-0">2–7 Day Settlement Delays</h3>
      <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-problem-desc-0">Revenue sits in limbo while your business needs it now.</p>
    </motion.div>
  );
}

function LiveBalanceCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const balance = useCounter(284930, 2200, 0, inView);
  const payoutRails = [
    { icon: Building2, label: "Bank" },
    { icon: Smartphone, label: "Smartphone" },
    { icon: Landmark, label: "Landmark" },
    { icon: IndianRupee, label: "Rupee" },
  ];

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      transition={{ duration: 0.5, ease, delay: 0.1 }}
      className="p-8 bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
      data-testid="card-problem-1"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={inView ? { scale: 1, rotate: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 160, damping: 12 }}
          className="mb-5 relative"
        >
          <motion.div
            animate={inView ? { boxShadow: [`0 0 0px ${ORANGE}00`, `0 0 30px ${ORANGE}25`, `0 0 15px ${ORANGE}15`] } : {}}
            transition={{ duration: 2, delay: 0.8 }}
            className="rounded-full p-3"
          >
            <CircleDollarSign className="w-14 h-14" style={{ color: ORANGE }} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 120 }}
          className="text-center mb-6"
        >
          <span className="text-3xl font-black text-gray-900 tabular-nums" data-testid="text-balance-counter">
            ${balance.toLocaleString()}
          </span>
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: "60%" } : {}}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="h-[2px] mx-auto mt-2 mb-1"
            style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}40, transparent)` }}
          />
          <p className="text-xs text-gray-400 mt-1">Available Balance</p>
        </motion.div>

        <div className="flex justify-between w-full mb-4 gap-2">
          {payoutRails.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 16, scale: 0.8 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.12, type: "spring", stiffness: 180, damping: 14 }}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <motion.div
                className="w-9 h-9 bg-white border border-gray-200 flex items-center justify-center shadow-sm"
                whileHover={{ scale: 1.1, borderColor: ORANGE }}
                transition={{ duration: 0.2 }}
              >
                <r.icon className="w-4 h-4 text-gray-500" />
              </motion.div>
              <span className="text-[9px] font-semibold text-gray-400">{r.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="text-[11px] text-gray-400 text-center leading-snug"
        >
          Payout in 30+ currencies across Americas, Asia, Africa & Europe.
        </motion.p>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6" data-testid="text-problem-title-1">No Portable Credit Across Borders</h3>
      <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-problem-desc-1">Your track record doesn't travel with you.</p>
    </motion.div>
  );
}

function AccountLedgerCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const balance1 = useCounter(42500, 2200, 0, inView);
  const balance2 = useCounter(180200, 2800, 0, inView);

  const accounts = [
    { name: "Roar.Finance", type: "IBAN", masked: "•••• 4821", balance: balance1, accent: ORANGE },
    { name: "Solana", type: "Wallet", masked: "•••• 8296", balance: balance2, accent: "#9945FF" },
  ];

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      transition={{ duration: 0.5, ease, delay: 0.2 }}
      className="p-8 bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
      data-testid="card-problem-2"
    >
      <div className="flex-1 flex flex-col justify-center gap-3 mb-6">
        {accounts.map((acc, i) => (
          <motion.div
            key={acc.name}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.25, type: "spring", stiffness: 120, damping: 14 }}
            className="bg-gray-50 border border-gray-100 p-4 flex items-center justify-between relative overflow-hidden"
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: acc.accent }}
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.25 }}
            />
            <div className="flex flex-col pl-2">
              <span className="text-sm font-bold text-gray-900">{acc.name}</span>
              <span className="text-[11px] text-gray-400">{acc.type} {acc.masked}</span>
            </div>
            <span className="text-lg font-black text-gray-900 tabular-nums" data-testid={`text-ledger-balance-${i}`}>
              ${acc.balance.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3" data-testid="text-problem-title-2">Working Capital Locked in Transit</h3>
      <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-problem-desc-2">Funds trapped in payment pipelines, unavailable when needed.</p>
    </motion.div>
  );
}

function ProblemSection() {
  return (
    <section className="py-24 sm:py-32 bg-white" data-testid="section-problem">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight" data-testid="text-problem-headline">
            Global Commerce.{" "}
            <span className="text-gray-300">Broken Finance.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <CurrencyRoutingCard />
          <LiveBalanceCard />
          <AccountLedgerCard />
        </div>
      </div>
    </section>
  );
}

/* ─── Shared focus-market data ─── */
const MARKETS = [
  { flag: "🇦🇪", code: "AED", country: "UAE",       rate: "3.6725", dir: 1,  color: "#16a34a" },
  { flag: "🇮🇳", code: "INR", country: "India",     rate: "83.42",  dir: 1,  color: "#2563eb" },
  { flag: "🇵🇰", code: "PKR", country: "Pakistan",  rate: "278.50", dir: -1, color: "#059669" },
  { flag: "🇭🇰", code: "HKD", country: "Hong Kong", rate: "7.8210", dir: 1,  color: "#dc2626" },
  { flag: "🇮🇩", code: "IDR", country: "Indonesia", rate: "15820",  dir: -1, color: "#d97706" },
  { flag: "🇨🇳", code: "CNY", country: "China",     rate: "7.2340", dir: 1,  color: "#dc2626" },
  { flag: "🇷🇺", code: "RUB", country: "Russia",    rate: "92.10",  dir: -1, color: "#2563eb" },
];

const CARD_STYLE = "rounded-sm bg-white border border-gray-200/80 hover:border-gray-300 transition-colors duration-300 overflow-hidden";

/* ─── Settlement Card — Animated Receipt ─── */
function SettlementCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const [txIdx, setTxIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [settled, setSettled] = useState(false);

  const txs = [
    { from: "\u{1F1F5}\u{1F1F0} PKR 250,000",    to: "\u{1F1E6}\u{1F1EA} AED 3,312",   rate: "PKR/AED 0.01325",  time: "14:32:07" },
    { from: "\u{1F1EE}\u{1F1F3} INR 1,200,000",   to: "\u{1F1ED}\u{1F1F0} HKD 11,320",  rate: "INR/HKD 0.00943",  time: "14:38:51" },
    { from: "\u{1F1E8}\u{1F1F3} CNY 80,000",      to: "\u{1F1E6}\u{1F1EA} AED 40,360",   rate: "CNY/AED 0.5045",   time: "14:45:22" },
    { from: "\u{1F1EE}\u{1F1E9} IDR 50,000,000",  to: "\u{1F1EE}\u{1F1F3} INR 266,120",  rate: "IDR/INR 0.005322", time: "14:52:09" },
  ];

  useEffect(() => {
    if (!inView) { setStep(0); setSettled(false); return; }

    const delays = [0, 400, 700, 1000, 1300, 1700, 2100, 3400];
    const timers: ReturnType<typeof setTimeout>[] = [];

    delays.forEach((d, i) => {
      timers.push(setTimeout(() => setStep(i + 1), d));
    });

    timers.push(setTimeout(() => setSettled(true), 3400));

    timers.push(setTimeout(() => {
      setStep(0);
      setSettled(false);
      setTxIdx((prev) => (prev + 1) % txs.length);
    }, 5200));

    return () => timers.forEach(clearTimeout);
  }, [inView, txIdx]);

  const tx = txs[txIdx];

  const lineVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0 },
  } as const;

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      className={`md:col-span-2 ${CARD_STYLE}`}
    >
      <div className="p-8 pb-4">
        <h3 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight tracking-tight" data-testid="text-settlement-title">
          Instant Settlement.
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mt-2">
          Real-time cross-border settlement across 7 markets.
        </p>
      </div>

      <div className="px-8 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={txIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease }}
            className="rounded-sm border border-gray-100 p-5"
            style={{ backgroundColor: "#f9f7f2" }}
          >
            <motion.p
              variants={lineVariants}
              initial="hidden"
              animate={step >= 1 ? "visible" : "hidden"}
              transition={{ duration: 0.3, ease }}
              className="font-mono text-[10px] text-gray-400 mb-4"
            >
              {tx.time} UTC
            </motion.p>

            <div className="space-y-2.5">
              <motion.div
                variants={lineVariants}
                initial="hidden"
                animate={step >= 2 ? "visible" : "hidden"}
                transition={{ duration: 0.3, ease }}
                className="flex items-baseline gap-3"
              >
                <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">From</span>
                <span className="text-sm font-semibold text-gray-900">{tx.from}</span>
              </motion.div>

              <motion.div
                variants={lineVariants}
                initial="hidden"
                animate={step >= 3 ? "visible" : "hidden"}
                transition={{ duration: 0.3, ease }}
                className="flex items-baseline gap-3"
              >
                <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">To</span>
                <span className="text-sm font-semibold text-gray-900">{tx.to}</span>
              </motion.div>

              <motion.div
                variants={lineVariants}
                initial="hidden"
                animate={step >= 4 ? "visible" : "hidden"}
                transition={{ duration: 0.3, ease }}
                className="flex items-baseline gap-3"
              >
                <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">Rate</span>
                <span className="text-sm font-mono text-gray-700">{tx.rate}</span>
              </motion.div>

              <motion.div
                variants={lineVariants}
                initial="hidden"
                animate={step >= 5 ? "visible" : "hidden"}
                transition={{ duration: 0.3, ease }}
                className="flex items-baseline gap-3"
              >
                <span className="text-xs text-gray-400 font-medium w-10 flex-shrink-0">Fee</span>
                <span className="text-sm font-mono text-gray-700">0.00 <span className="text-gray-400">(waived)</span></span>
              </motion.div>
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step >= 6 ? 1 : 0 }}
              transition={{ duration: 0.4, ease }}
              className="h-px my-4"
              style={{ backgroundColor: "#e0dbd0", transformOrigin: "left" }}
            />

            <div className="flex items-center gap-3">
              <motion.span
                variants={lineVariants}
                initial="hidden"
                animate={step >= 7 ? "visible" : "hidden"}
                transition={{ duration: 0.2, ease }}
                className="text-xs text-gray-400 font-medium w-10 flex-shrink-0"
              >
                Status
              </motion.span>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e8e3d8" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: step >= 7 ? "100%" : "0%" }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: settled ? "#16a34a" : ORANGE, transition: "background-color 0.4s ease" }}
                  />
                </div>
                <AnimatePresence mode="wait">
                  {step >= 8 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="text-xs font-bold flex-shrink-0"
                      style={{ color: "#16a34a" }}
                    >
                      SETTLED ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid #f0ebe0" }}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Live</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">Avg: 12s · Last: 8.2s · 99.9% uptime</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Transaction Transparency Card — Continuous Scroller ─── */
function TransparencyCard() {
  const ref = useRef<HTMLDivElement>(null);

  const rows = [
    { icon: "AE", iconBg: "#16a34a", title: "AED Deposit",       sub: "Al Maktoum Corp",        status: "Settled",    positive: true  },
    { icon: "IN", iconBg: "#2563eb", title: "INR Collection",    sub: "via Razorpay",            status: "Credited",   positive: true  },
    { icon: "PK", iconBg: "#059669", title: "PKR Transfer",      sub: "to HBL Karachi",         status: "Sent",       positive: true  },
    { icon: "HK", iconBg: "#dc2626", title: "HKD Payment",       sub: "from HSBC HK",           status: "Completed",  positive: true  },
    { icon: "ID", iconBg: "#d97706", title: "IDR Payout",        sub: "to BCA Jakarta",         status: "Confirming", positive: false },
    { icon: "CN", iconBg: "#dc2626", title: "CNY Exchange",      sub: "via UnionPay",           status: "Processing", positive: false },
    { icon: "RU", iconBg: "#2563eb", title: "RUB Settlement",    sub: "to Sberbank",            status: "Pending",    positive: false },
    { icon: "KY", iconBg: "#0891b2", title: "KYC Submitted",     sub: "Steven Kirk, London UK", status: "Completed",  positive: true  },
    { icon: "US", iconBg: "#7c3aed", title: "USD Deposit (ACH)", sub: "$500,000 from J. Kirk",  status: "Credited",   positive: true  },
    { icon: "PY", iconBg: "#0284c7", title: "+$500 PYUSD",       sub: "from U80a\u20267D0a",     status: "Confirming", positive: false },
  ];

  const allRows = [...rows, ...rows];

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      transition={{ duration: 0.6, ease, delay: 0.1 }}
      className={CARD_STYLE}
    >
      <div className="p-8 pb-4">
        <h3 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight tracking-tight">
          Transaction<br />Transparency.
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mt-2">
          Track payments, customers and onchain transactions.
        </p>
      </div>
      <div
        className="px-8 pb-2 overflow-hidden"
        style={{
          height: "260px",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          {allRows.map((row, i) => (
            <div
              key={`${row.icon}-${i}`}
              className="flex items-center justify-between py-3 px-1"
              style={{ borderBottom: "1px solid #f0ebe0" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: row.iconBg }}
                >
                  {row.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{row.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{row.sub}</p>
                </div>
              </div>
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: row.positive ? "#dcfce7" : "#f3f4f6",
                  color: row.positive ? "#16a34a" : "#6b7280",
                }}
              >
                {row.positive ? "✓ " : "⟳ "}{row.status}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Roar Score Card ─── */
function RoarScoreCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });

  const profiles = [
    { name: "Dubai Exports LLC",  country: "🇦🇪", score: 812, notches: 8 },
    { name: "Mumbai Tech Pvt.",   country: "🇮🇳", score: 756, notches: 7 },
    { name: "HK Capital Ltd.",    country: "🇭🇰", score: 891, notches: 9 },
    { name: "Jakarta Retail Co.", country: "🇮🇩", score: 634, notches: 5 },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % profiles.length), 5000);
    return () => clearInterval(id);
  }, [inView]);

  const profile = profiles[idx];
  const score = useCounter(profile.score, 1800, 300, inView);
  const label = profile.notches >= 8 ? "Excellent" : profile.notches >= 7 ? "Good" : "Fair";

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      transition={{ duration: 0.6, ease, delay: 0.15 }}
      className={CARD_STYLE}
    >
      <div className="p-8 pb-4">
        <h3 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight tracking-tight">
          Roar Score<br />Credit.
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mt-2">
          Business credit built from payment activity.
        </p>
      </div>
      <div className="px-8 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{profile.country}</span>
              <span className="text-xs text-gray-400 font-medium">{profile.name}</span>
            </div>
            <div className="flex items-end justify-between mb-5">
              <div className="text-6xl font-black text-gray-900 tabular-nums leading-none tracking-tight">
                {Math.min(score, profile.score)}
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-sm border"
                style={{
                  borderColor: profile.notches >= 8 ? "#16a34a" : profile.notches >= 7 ? "#d97706" : "#dc2626",
                  color: profile.notches >= 8 ? "#16a34a" : profile.notches >= 7 ? "#d97706" : "#dc2626",
                }}
              >
                {label}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, ease, delay: i * 0.06 }}
                  className="flex-1 h-3 rounded-[2px]"
                  style={{
                    backgroundColor: i < profile.notches ? ORANGE : "#f0ebe0",
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-300 font-medium">300</span>
              <span className="text-[10px] text-gray-300 font-medium">900</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Multi-Currency Card ─── */
function CurrencyCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const [highlightIdx, setHighlightIdx] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      const next = Math.floor(Math.random() * MARKETS.length);
      setHighlightIdx(next);
      setTimeout(() => setHighlightIdx(-1), 1500);
    }, 3000);
    return () => { clearInterval(id); };
  }, [inView]);

  const features = [
    "T+0 Settlement",
    "7 Target Markets",
    "Same-day Liquidity",
    "Competitive FX",
    "Multi-currency Wallets",
  ];

  return (
    <motion.div
      ref={ref}
      {...animateIn}
      transition={{ duration: 0.6, ease, delay: 0.2 }}
      className={`md:col-span-2 ${CARD_STYLE}`}
    >
      <div className="p-8 pb-4">
        <h3 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight tracking-tight">
          Settlement in 7 Markets.
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mt-2">
          Receive settlement on-chain or to bank with competitive FX and same-day liquidity.
        </p>
      </div>

      <div className="px-8 pb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            {MARKETS.map((m, i) => (
              <motion.div
                key={m.code}
                initial={{ backgroundColor: "rgba(255,255,255,0)" }}
                animate={{
                  backgroundColor: highlightIdx === i ? "rgba(255,77,0,0.03)" : "rgba(255,255,255,0)",
                }}
                transition={{ duration: 0.3, ease }}
                className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-sm"
                style={{ borderBottom: i < MARKETS.length - 1 ? "1px solid #f0ebe0" : "none" }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{m.flag}</span>
                  <span className="text-sm font-semibold text-gray-900">{m.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-500">{m.rate}</span>
                  <span style={{ color: m.dir > 0 ? "#16a34a" : "#ef4444" }} className="text-xs">
                    {m.dir > 0 ? "▲" : "▼"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col justify-center">
            {features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: 8 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
                transition={{ delay: 0.08 * i, duration: 0.5, ease }}
                className="flex items-center gap-2.5 py-2"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ORANGE }} />
                <span className="text-sm font-medium text-gray-700">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Feature Bento Grid ─── */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Built for modern commerce.
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-lg mx-auto">
            Built to power global payments across industries with seamless cross-border infrastructure and liquidity.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <SettlementCard />
          <TransparencyCard />
          <RoarScoreCard />
          <CurrencyCard />
        </div>
      </div>
    </section>
  );
}

/* ─── Solutions / Industries ─── */
function SolutionsSection() {
  const industries = [
    { icon: ShoppingCart, title: "E-commerce", desc: "Accept payments globally and settle instantly to fuel your growth." },
    { icon: Users, title: "Freelancers", desc: "Get paid from anywhere without delays or hidden FX fees." },
    { icon: Ship, title: "Cross-border Trade", desc: "Settle international trade payments with competitive FX and same-day liquidity." },
    { icon: Monitor, title: "SaaS Platforms", desc: "Monetize global users instantly with local collections and real-time payouts." },
    { icon: Store, title: "Marketplaces", desc: "Collect locally and pay out globally with high approval rates and instant settlement." },
  ];

  const [active, setActive] = useState(0);

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Built for every industry.
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-lg mx-auto">
            Built to power global payments across industries with seamless cross-border infrastructure and liquidity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left — visual */}
          <motion.div
            {...animateIn}
            className="relative rounded-2xl overflow-hidden aspect-[4/5] hidden md:block"
          >
            <div
              className="absolute inset-0"
              style={{
                background: "#FFF8E7",
              }}
            />
            <div className="absolute inset-0 border border-gray-200/60 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4" style={{ boxShadow: "inset 0 1px 4px rgba(0,0,0,0.05)" }}>
                  {(() => {
                    const Icon = industries[active].icon;
                    return <Icon className="w-8 h-8 text-gray-400" />;
                  })()}
                </div>
                <p className="text-gray-400 text-sm font-medium">{industries[active].title}</p>
              </div>
            </div>
          </motion.div>

          {/* Right — list */}
          <motion.div {...animateIn} transition={{ duration: 0.5, ease, delay: 0.1 }}>
            <div className="space-y-0">
              {industries.map((ind, i) => (
                <motion.div
                  key={ind.title}
                  className="py-6 cursor-pointer transition-all duration-300"
                  style={{
                    borderLeft: i === active ? `3px solid ${ORANGE}` : "3px solid transparent",
                    paddingLeft: "24px",
                    borderBottom: "1px solid #e8e0d0",
                  }}
                  onClick={() => setActive(i)}
                  onViewportEnter={() => setActive(i)}
                  viewport={{ amount: 0.8 }}
                >
                  <div className="flex items-start gap-3">
                    <ind.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors duration-300 ${i === active ? "text-gray-900" : "text-gray-300"}`} />
                    <div>
                      <h4 className={`font-bold transition-colors duration-300 ${i === active ? "text-gray-900" : "text-gray-300"}`}>{ind.title}</h4>
                      <p className={`text-sm leading-relaxed mt-1 transition-colors duration-300 ${i === active ? "text-gray-500" : "text-gray-300"}`}>{ind.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Accept Payments", desc: "Receive payments from anywhere. Settled instantly.", icon: CreditCard },
    { num: "02", title: "Build Credit Automatically", desc: "Every transaction builds your Roar Score.", icon: TrendingUp },
    { num: "03", title: "Unlock Working Capital", desc: "Access credit based on your real business performance.", icon: DollarSign },
    { num: "04", title: "Repay From Revenue", desc: "Flexible repayment directly from your payment flow.", icon: Repeat },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white" data-testid="section-how-it-works">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight" data-testid="text-hiw-headline">
            Four Steps to Capital.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              {...animateIn}
              transition={{ duration: 0.5, ease, delay: i * 0.1 }}
              className="relative p-7 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              data-testid={`card-step-${i}`}
            >
              <span className="text-5xl font-black text-[#e8e0d0] absolute top-4 right-4 select-none">{s.num}</span>
              <div className="w-10 h-10 rounded-xl bg-[#FFF8E7] flex items-center justify-center mb-5">
                <s.icon className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2" data-testid={`text-step-title-${i}`}>{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed" data-testid={`text-step-desc-${i}`}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const faqs = [
    { q: "What is TigerBnk?", a: "TigerBnk is a financial operating system for global merchants. We provide instant settlement, portable credit scoring, and working capital — all powered by your real business performance." },
    { q: "How does instant settlement work?", a: "When your customers pay, we settle funds to your account in real-time instead of the traditional 2–7 day waiting period. No more cash flow gaps." },
    { q: "What is the Roar Score?", a: "The Roar Score is a 300–900 credit identity built automatically from your transaction history, volume consistency, repayment behavior, and wallet balance. No paperwork or credit bureaus required." },
    { q: "How do I get started?", a: "Sign up for early access, complete a simple onboarding flow, and start accepting payments. Your Roar Score begins building from day one." },
    { q: "Is my money safe?", a: "Yes. TigerBnk uses bank-grade encryption and security infrastructure. Your funds are held with licensed financial partners with regulatory compliance across all operating jurisdictions." },
    { q: "Which countries do you support?", a: "We currently operate across 15+ countries with expanding coverage. Our infrastructure supports multi-currency settlement in USD, EUR, GBP, AED, INR, and more." },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div {...animateIn}>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              You got questions?<br />We got your back.
            </h2>
            {/* FAQ visual */}
            <div className="mt-8 rounded-2xl overflow-hidden max-w-sm">
              <img src={faqImg} alt="Guidance to the Future" className="w-full h-full object-cover rounded-2xl" />
            </div>
          </motion.div>

          {/* Right — Accordion */}
          <motion.div {...animateIn} transition={{ duration: 0.5, ease, delay: 0.1 }}>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-gray-100">
                  <AccordionTrigger className="text-left text-gray-900 font-semibold hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer (Dark) ─── */
function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="bg-gray-950 text-white" data-testid="footer-landing">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-16 mb-16">
          {/* Left — newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-2">Stay connected</h3>
            <p className="text-gray-400 text-sm mb-6">Sign up to stay up to-date on the latest announcements.</p>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="jane@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 rounded-lg flex-1"
              />
              <Button
                onClick={() => { if (email) setSubmitted(true); }}
                className="rounded-lg px-6 font-medium text-black border-0"
                style={{ background: submitted ? "#22c55e" : ORANGE, color: submitted ? "#fff" : "#000" }}
              >
                {submitted ? "Done!" : "Submit"}
              </Button>
            </div>
          </div>

          {/* Right — links */}
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold mb-4 text-sm">Product</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <a href="#features" className="block hover:text-white transition-colors">Payments</a>
                <a href="#features" className="block hover:text-white transition-colors">Settlement</a>
                <Link href="/cards" className="block hover:text-white transition-colors">Cards</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Resources</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
                <a href="#how-it-works" className="block hover:text-white transition-colors">How It Works</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Solutions</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <span className="block">E-commerce</span>
                <span className="block">Freelancers</span>
                <span className="block">SaaS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="TigerBnk" className="w-6 h-6 rounded" />
            <span className="text-gray-400 text-sm font-semibold" data-testid="text-footer-copyright">TigerBnk</span>
          </div>
          <p className="text-gray-500 text-xs" data-testid="text-footer-tagline">&copy; {new Date().getFullYear()} TigerBnk. Financial infrastructure for global commerce.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  useEffect(() => {
    document.title = "TigerBnk — Financial OS for Global Merchants";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", "Turn payment flow into instant settlement, portable credit, and programmable capital. Join 800+ merchants on TigerBnk.");

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); }
    ogTitle.setAttribute("content", "TigerBnk — Financial OS for Global Merchants");

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property", "og:description"); document.head.appendChild(ogDesc); }
    ogDesc.setAttribute("content", "Turn payment flow into instant settlement, portable credit, and programmable capital.");

    return () => { document.title = "TigerBnk"; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <SolutionsSection />
      <HowItWorksSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
