import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEarlyAccessSchema } from "@shared/schema";
import {
  ArrowRight, Clock, Globe, Lock, CreditCard, TrendingUp, Repeat,
  DollarSign, CheckCircle2, Zap, BarChart3, Menu, X,
  ShoppingCart, Users, Ship, Monitor, Store, Plus
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
    <section className="relative min-h-screen overflow-hidden" data-testid="section-hero">
      <AnimatedWorldMap />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(255,255,255,0.6) 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-end min-h-screen pb-20 pt-32">
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
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to top, #FFF8E7, transparent)" }}
      />
    </section>
  );
}

/* ─── Problem Section ─── */
function ProblemSection() {
  const problems = [
    { icon: Clock, title: "2–7 Day Settlement Delays", desc: "Revenue sits in limbo while your business needs it now." },
    { icon: Globe, title: "No Portable Credit Across Borders", desc: "Your track record doesn't travel with you." },
    { icon: Lock, title: "Working Capital Locked in Transit", desc: "Funds trapped in payment pipelines, unavailable when needed." },
  ];

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
          {problems.map((p, i) => (
            <motion.div
              key={i}
              {...animateIn}
              transition={{ duration: 0.5, ease, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              data-testid={`card-problem-${i}`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFF8E7] flex items-center justify-center mb-6">
                <p.icon className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3" data-testid={`text-problem-title-${i}`}>{p.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed" data-testid={`text-problem-desc-${i}`}>{p.desc}</p>
            </motion.div>
          ))}
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

/* ─── Settlement Pipeline Card ─── */
function SettlementCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });
  const [feedIdx, setFeedIdx] = useState(0);
  const [newestKey, setNewestKey] = useState("");

  const feed = [
    { flag: "🇵🇰", label: "PKR 250,000", sub: "to Al Maktoum Corp",  status: "Settled",    fg: "#16a34a" },
    { flag: "🇮🇳", label: "INR 1,200,000", sub: "via Razorpay",      status: "Processing", fg: "#d97706" },
    { flag: "🇨🇳", label: "CNY 80,000",  sub: "from UnionPay",       status: "Settled",    fg: "#16a34a" },
    { flag: "🇮🇩", label: "IDR 50M",     sub: "to BCA Jakarta",      status: "Confirming", fg: "#4f46e5" },
    { flag: "🇭🇰", label: "HKD 92,400",  sub: "from HSBC HK",       status: "Sent",       fg: "#16a34a" },
    { flag: "🇦🇪", label: "AED 180,000", sub: "Emirates NBD",        status: "Settled",    fg: "#16a34a" },
    { flag: "🇷🇺", label: "RUB 4,200,000", sub: "to Sberbank",      status: "Processing", fg: "#d97706" },
  ];

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setFeedIdx((i) => {
        const next = (i + 1) % feed.length;
        setNewestKey(`${feed[next % feed.length].flag}-${feed[next % feed.length].label}-${next}`);
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [inView]);

  useEffect(() => {
    if (!newestKey) return;
    const t = setTimeout(() => setNewestKey(""), 1000);
    return () => clearTimeout(t);
  }, [newestKey]);

  const visibleRows = Array.from({ length: 4 }, (_, i) => ({
    ...feed[(feedIdx + i) % feed.length],
    rowKey: `${feed[(feedIdx + i) % feed.length].flag}-${feed[(feedIdx + i) % feed.length].label}-${(feedIdx + i) % feed.length}`,
  }));

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
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleRows.map((row, i) => {
            const isNewest = row.rowKey === newestKey;
            return (
              <motion.div
                key={row.rowKey}
                layout
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.5, ease }}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom: i < 3 ? "1px solid #f0ebe0" : "none",
                  borderLeft: isNewest ? `3px solid ${ORANGE}` : "3px solid transparent",
                  paddingLeft: "8px",
                  transition: "border-left-color 1s ease",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none flex-shrink-0">{row.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{row.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{row.sub}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-sm flex-shrink-0 border"
                  style={{ borderColor: row.fg, color: row.fg }}
                >
                  {row.status === "Settled" || row.status === "Sent" ? "✓ " : "⟳ "}{row.status}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #f0ebe0" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-[10px] text-gray-400 font-medium">Live feed</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Transaction Transparency Card ─── */
function TransparencyCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });

  const statusCycle = [
    { status: "Processing", fg: "#d97706" },
    { status: "Confirmed",  fg: "#4f46e5" },
    { status: "Settled",    fg: "#16a34a" },
  ] as const;

  const baseRows = [
    { initials: "AE", label: "AED Deposit",    sub: "from Al Maktoum Corp",   defaultStatus: "Settled",    defaultFg: "#16a34a" },
    { initials: "IN", label: "INR Collection", sub: "via Razorpay",           defaultStatus: "Processing", defaultFg: "#d97706" },
    { initials: "PK", label: "PKR Transfer",   sub: "to HBL Karachi",        defaultStatus: "Sent",       defaultFg: "#16a34a" },
    { initials: "HK", label: "HKD Payment",    sub: "from HSBC HK",          defaultStatus: "Ready",      defaultFg: "#16a34a" },
  ];

  const [updatedRow, setUpdatedRow] = useState<{ idx: number; statusIdx: number } | null>(null);
  const [flashIdx, setFlashIdx] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      const rowIdx = Math.floor(Math.random() * baseRows.length);
      const statusIdx = Math.floor(Math.random() * statusCycle.length);
      setUpdatedRow({ idx: rowIdx, statusIdx });
      setFlashIdx(rowIdx);
      setTimeout(() => setFlashIdx(-1), 1200);
    }, 5000);
    return () => clearInterval(id);
  }, [inView]);

  const rows = baseRows.map((row, i) => {
    if (updatedRow && updatedRow.idx === i) {
      const s = statusCycle[updatedRow.statusIdx];
      return { ...row, status: s.status, fg: s.fg };
    }
    return { ...row, status: row.defaultStatus, fg: row.defaultFg };
  });

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
      <div className="px-8 pb-8">
        {rows.map((row, i) => (
          <motion.div
            key={row.initials}
            initial={{ backgroundColor: "rgba(255,255,255,0)" }}
            animate={{
              backgroundColor: flashIdx === i ? "rgba(255,77,0,0.04)" : "rgba(255,255,255,0)",
            }}
            transition={{ duration: 0.4, ease }}
            className="flex items-center justify-between py-3 px-2 -mx-2 rounded-sm"
            style={{ borderBottom: i < rows.length - 1 ? "1px solid #f0ebe0" : "none" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: row.fg }}
              >
                {row.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{row.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{row.sub}</p>
              </div>
            </div>
            <motion.span
              key={`${row.initials}-${row.status}`}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease }}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-sm flex-shrink-0 border"
              style={{ borderColor: row.fg, color: row.fg }}
            >
              {row.status === "Settled" || row.status === "Sent" || row.status === "Ready" || row.status === "Confirmed" ? "✓ " : "⟳ "}{row.status}
            </motion.span>
          </motion.div>
        ))}
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
    <section id="features" className="py-24 sm:py-32 bg-[#FFF8E7]">
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
    <section id="how-it-works" className="py-24 sm:py-32 bg-[#FFF8E7]" data-testid="section-how-it-works">
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
