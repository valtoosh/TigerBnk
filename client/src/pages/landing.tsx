import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, CheckCircle2, Menu, X, Globe, Zap, Lock, CreditCard, Shield, BellRing } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import logoImg from "@assets/tigerbnklogo.png";
import heroBgImg from "@assets/hero-bg.png";
import featureSettlementImg from "@assets/feature-settlement.png";
import featureCreditImg from "@assets/feature-credit.png";
import ecommerceImg from "@assets/ecommerce.png";
import freelancersImg from "@assets/freelancers.png";
import saasImg from "@assets/saas.png";
import crossborderImg from "@assets/crossborder.png";

const ORANGE = "#FF4D00";
const DARK = "#0f0f0f";
const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Hooks ─── */
function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const [atHero, setAtHero] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      setAtHero(y < window.innerHeight * 0.75);
      if (y < 80) {
        setVisible(true);
      } else if (y > lastY.current + 8) {
        setVisible(false);
      } else if (y < lastY.current - 8) {
        setVisible(true);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return { visible, atHero };
}

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
  const { visible, atHero } = useScrollDirection();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease, background-color 0.3s ease, backdrop-filter 0.3s ease",
        backgroundColor: atHero ? "transparent" : "rgba(255,255,255,0.95)",
        backdropFilter: atHero ? "none" : "blur(20px)",
        borderBottom: atHero ? "none" : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="TigerBnk" className="w-7 h-7 rounded-lg" />
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: atHero ? "#fff" : "#111" }}
            >
              TigerBnk
            </span>
          </Link>

          <div
            className="hidden md:flex items-center gap-8 text-sm font-medium"
            style={{ color: atHero ? "rgba(255,255,255,0.75)" : "#505A63" }}
          >
            <Link href="/" className="hover:opacity-100 opacity-80 transition-opacity">Home</Link>
            <button onClick={() => scrollTo("features")} className="hover:opacity-100 opacity-80 transition-opacity cursor-pointer bg-transparent border-none text-sm font-medium" style={{ color: "inherit" }}>Features</button>
            <Link href="/cards" className="hover:opacity-100 opacity-80 transition-opacity">Cards</Link>
            <button onClick={() => scrollTo("faq")} className="hover:opacity-100 opacity-80 transition-opacity cursor-pointer bg-transparent border-none text-sm font-medium" style={{ color: "inherit" }}>FAQ</button>
          </div>

          <div className="hidden md:block">
            <Link href="/auth?mode=register">
              <button
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: atHero ? "rgba(255,255,255,0.15)" : DARK,
                  color: "#fff",
                  border: atHero ? "1px solid rgba(255,255,255,0.3)" : "none",
                }}
              >
                Get Started
              </button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            style={{ color: atHero ? "#fff" : "#111" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
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
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-6 py-4 space-y-1 border-t border-gray-100">
              <Link href="/" className="block text-gray-700 text-sm py-2.5 font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
              <button onClick={() => { setMobileOpen(false); scrollTo("features"); }} className="block text-gray-700 text-sm py-2.5 font-medium w-full text-left bg-transparent border-none cursor-pointer">Features</button>
              <Link href="/cards" className="block text-gray-700 text-sm py-2.5 font-medium" onClick={() => setMobileOpen(false)}>Cards</Link>
              <button onClick={() => { setMobileOpen(false); scrollTo("faq"); }} className="block text-gray-700 text-sm py-2.5 font-medium w-full text-left bg-transparent border-none cursor-pointer">FAQ</button>
              <div className="pt-3">
                <Link href="/auth?mode=register" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-3 rounded-full text-sm font-semibold text-white" style={{ background: DARK }}>
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── Revolut-style Card ─── */
function RevolutCard({
  img,
  label,
  balance,
  toastLabel,
  toastTime,
  toastAmount,
  toastColor,
}: {
  img: string;
  label: string;
  balance: string;
  toastLabel: string;
  toastTime: string;
  toastAmount: string;
  toastColor: string;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden w-full" style={{ aspectRatio: "4/5" }}>
      <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }}
      />
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-1.5 z-10">
        <span className="text-white/70 text-xs font-medium">{label}</span>
        <span className="text-white text-2xl font-bold tracking-tight">{balance}</span>
        <span className="mt-0.5 px-4 py-1 rounded-full text-[11px] font-semibold bg-white text-gray-900">
          Accounts
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div
          className="flex items-center gap-2.5 px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: "14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 28, height: 28, borderRadius: "50%", background: toastColor }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#fff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-gray-800">{toastLabel}</div>
            <div className="text-[10px] text-gray-400">{toastTime}</div>
          </div>
          <div className="text-xs font-semibold text-gray-900">{toastAmount}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero + Section 2 — Full-screen shrinks to card (Revolut effect) ─── */
function HeroAndFeatures() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end start"] });

  // Viewport dimensions for pixel-accurate transforms
  const [dims, setDims] = useState({ w: 1440, h: 900 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    update();
    setMounted(true);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Card grid math — 3 cards in a centered container
  const containerW = Math.min(1100, dims.w * 0.84);
  const gap = 20;
  const cardW = (containerW - gap * 2) / 3;
  const cardH = cardW * 1.25; // aspect 4:5
  const containerLeft = (dims.w - containerW) / 2;
  const cardsTop = dims.h * 0.42;

  // Absolute positions for each card
  const middleCardLeft = containerLeft + cardW + gap;
  const leftCardLeft = containerLeft;
  const rightCardLeft = containerLeft + (cardW + gap) * 2;

  // Scale to fill viewport from card size
  const scaleX = dims.w / cardW;
  const scaleY = dims.h / cardH;
  const fullScale = Math.max(scaleX, scaleY);

  // --- Scroll-driven transforms (GPU-accelerated) ---

  // Card shrink: fullScale → 1
  const cardScale = useTransform(scrollYProgress, [0, 0.15, 0.55], [fullScale, fullScale, 1]);
  const cardRadius = useTransform(scrollYProgress, [0, 0.15, 0.55], [0, 0, 16]);

  // Dark gradient on card (for hero text readability)
  const gradientOpacity = useTransform(scrollYProgress, [0, 0.15, 0.40], [1, 1, 0]);

  // Hero text
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15, 0.30], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.30], [0, -60]);

  // Card content (label, balance, toast) — hidden at full scale, fades in at card size
  const cardContentOpacity = useTransform(scrollYProgress, [0.40, 0.55], [0, 1]);

  // Section 2 heading
  const headingOpacity = useTransform(scrollYProgress, [0.45, 0.60], [0, 1]);
  const headingY = useTransform(scrollYProgress, [0.45, 0.60], [30, 0]);

  // Side cards (slide in from sides)
  const leftOpacity = useTransform(scrollYProgress, [0.50, 0.65], [0, 1]);
  const leftX = useTransform(scrollYProgress, [0.50, 0.65], [-60, 0]);
  const rightOpacity = useTransform(scrollYProgress, [0.53, 0.68], [0, 1]);
  const rightX = useTransform(scrollYProgress, [0.53, 0.68], [60, 0]);

  const clipReveal = {
    hidden: { y: "105%", opacity: 0 },
    visible: { y: "0%", opacity: 1 },
  };

  return (
    <div ref={wrapperRef} id="features" style={{ minHeight: "300vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-white">

        {mounted && (
          <>
            {/* === LAYER 1: The scaling card (IS the hero background) === */}
            <div
              className="absolute z-10 hidden md:block"
              style={{
                top: cardsTop,
                left: middleCardLeft,
                width: cardW,
                height: cardH,
              }}
            >
              <motion.div
                className="w-full h-full will-change-transform overflow-hidden"
                style={{
                  scale: cardScale,
                  borderRadius: cardRadius,
                }}
              >
                {/* Background image — always visible, object-cover */}
                <img
                  src={heroBgImg}
                  alt="Business"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: "center right 20%" }}
                />

                {/* Dark gradient for hero text readability — fades during shrink */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    opacity: gradientOpacity,
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.18) 100%)",
                  }}
                />

                {/* Card content overlay (label, balance, toast) — fades in at card size */}
                <motion.div className="absolute inset-0 z-10" style={{ opacity: cardContentOpacity }}>
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }}
                  />
                  <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-1.5 z-10">
                    <span className="text-white/70 text-xs font-medium">Multi-currency</span>
                    <span className="text-white text-2xl font-bold tracking-tight">AED 45,200</span>
                    <span className="mt-0.5 px-4 py-1 rounded-full text-[11px] font-semibold bg-white text-gray-900">
                      Accounts
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <div
                      className="flex items-center gap-2.5 px-3 py-2.5"
                      style={{
                        background: "rgba(255,255,255,0.95)",
                        borderRadius: "14px",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366f1" }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#fff" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-gray-800">Deposit</div>
                        <div className="text-[10px] text-gray-400">Today, 11:28</div>
                      </div>
                      <div className="text-xs font-semibold text-gray-900">+AED 5,000</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* === LAYER 2: Hero text (centered left, fades out early) === */}
            <motion.div
              className="absolute z-20 hidden md:flex items-center h-full left-0 right-0 will-change-transform"
              style={{ opacity: heroOpacity, y: heroY }}
            >
              <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
                <div className="max-w-2xl">
                  <div className="mb-7">
                    {["Your money should", "move as fast as", "your business."].map((line, i) => (
                      <div key={i} className="overflow-hidden">
                        <motion.div
                          variants={clipReveal}
                          initial="hidden"
                          animate="visible"
                          transition={{ duration: 0.9, ease, delay: 0.15 + i * 0.14 }}
                        >
                          <h1
                            className="font-semibold text-white leading-[1.04]"
                            style={{ fontSize: "clamp(2.8rem, 6vw, 4.8rem)", letterSpacing: "-2.5px" }}
                          >
                            {line}
                          </h1>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.55 }}
                    className="text-lg leading-relaxed mb-10 max-w-md"
                    style={{ color: "rgba(255,255,255,0.72)", fontWeight: 400 }}
                  >
                    Near-instant cross-border transfers across 4 countries. Multi-currency accounts. Build your credit score from day one.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease, delay: 0.75 }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <Link href="/auth?mode=register">
                      <button
                        className="px-8 py-4 rounded-full text-base font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors duration-200"
                        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.22)" }}
                      >
                        Get Started
                      </button>
                    </Link>
                    <Link href="/cards">
                      <button
                        className="px-7 py-4 rounded-full text-base font-medium text-white transition-colors duration-200 hover:bg-white/10"
                        style={{ border: "1px solid rgba(255,255,255,0.28)" }}
                      >
                        View Cards
                      </button>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* === LAYER 3: Section 2 heading (fades in) === */}
            <motion.div
              className="absolute z-10 left-0 right-0 text-center px-6 hidden md:block"
              style={{ opacity: headingOpacity, y: headingY, top: "6vh" }}
            >
              <h2
                className="font-semibold text-gray-900 mb-4"
                style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", letterSpacing: "-1.5px", lineHeight: 1.08 }}
              >
                Three tools. One platform.
              </h2>
              <p className="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
                Everything you need to send money globally, settle locally, and build credit.
              </p>
              <Link href="/auth?mode=register">
                <button
                  className="mt-6 px-7 py-3.5 rounded-full text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ background: DARK }}
                >
                  Open an account <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* === LAYER 4: Left card (slides in from left) === */}
            <motion.div
              className="absolute z-10 will-change-transform hidden md:block"
              style={{
                opacity: leftOpacity,
                x: leftX,
                top: cardsTop,
                left: leftCardLeft,
                width: cardW,
              }}
            >
              <RevolutCard
                img={featureSettlementImg}
                label="Transfers · AED"
                balance="AED 12,500"
                toastLabel="Sent to India"
                toastTime="Today, 09:02"
                toastAmount="+AED 12,500"
                toastColor="#6366f1"
              />
            </motion.div>

            {/* === LAYER 5: Right card (slides in from right) === */}
            <motion.div
              className="absolute z-10 will-change-transform hidden md:block"
              style={{
                opacity: rightOpacity,
                x: rightX,
                top: cardsTop,
                left: rightCardLeft,
                width: cardW,
              }}
            >
              <RevolutCard
                img={featureCreditImg}
                label="Roar Score"
                balance="756"
                toastLabel="Score Updated"
                toastTime="Today, 14:35"
                toastAmount="+12 pts"
                toastColor="#22c55e"
              />
            </motion.div>
          </>
        )}

      </div>

      {/* Mobile fallback */}
      <div className="md:hidden bg-white py-16 px-6">
        <div className="text-center mb-10">
          <h2
            className="font-semibold text-gray-900 mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-1px", lineHeight: 1.1 }}
          >
            Three tools. One platform.
          </h2>
          <p className="text-base text-gray-500 max-w-sm mx-auto">
            Everything you need to send money globally, settle locally, and build credit.
          </p>
        </div>
        <div className="grid gap-4 max-w-sm mx-auto">
          <RevolutCard img={featureSettlementImg} label="Transfers · AED" balance="AED 12,500" toastLabel="Sent to India" toastTime="Today, 09:02" toastAmount="+AED 12,500" toastColor="#6366f1" />
          <RevolutCard img={heroBgImg} label="Multi-currency" balance="AED 45,200" toastLabel="Deposit" toastTime="Today, 11:28" toastAmount="+AED 5,000" toastColor="#6366f1" />
          <RevolutCard img={featureCreditImg} label="Roar Score" balance="756" toastLabel="Score Updated" toastTime="Today, 14:35" toastAmount="+12 pts" toastColor="#22c55e" />
        </div>
      </div>
    </div>
  );
}

/* ─── Credit Section (dark, tabbed) ─── */
const TABS = [
  {
    label: "E-commerce",
    img: ecommerceImg,
    headline: "Send money globally, receive in local currency.",
    desc: "Transfer payments in local currencies across UAE, India, Philippines, and Indonesia. Near-instant settlement with transparent fees.",
    score: 812,
    scoreLabel: "Excellent",
  },
  {
    label: "Freelancers",
    img: freelancersImg,
    headline: "Get paid from clients abroad, directly to your bank.",
    desc: "Receive international payments without delays or hidden FX fees. Build your credit history from your first invoice.",
    score: 756,
    scoreLabel: "Good",
  },
  {
    label: "Cross-border",
    img: crossborderImg,
    headline: "Move money across borders with transparent fees.",
    desc: "Transfer funds across 4 countries with real exchange rates. AED, INR, PHP, IDR, USD, and GBP — all from one platform.",
    score: 891,
    scoreLabel: "Excellent",
  },
] as const;

function CreditSection() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const tab = TABS[active];

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ minHeight: "100svh", background: DARK }}>
      {/* Switching background photo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease }}
          className="absolute inset-0"
        >
          <img src={tab.img} alt={tab.label} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.28) 100%)",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex items-center" style={{ minHeight: "100svh" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full py-24">
          <div className="max-w-lg">
            {/* Tab pills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex gap-2 mb-10 flex-wrap"
            >
              {TABS.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => setActive(i)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: active === i ? "#fff" : "transparent",
                    color: active === i ? DARK : "rgba(255,255,255,0.72)",
                    border: `1px solid ${active === i ? "#fff" : "rgba(255,255,255,0.32)"}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </motion.div>

            {/* Headline */}
            <AnimatePresence mode="wait">
              <motion.h2
                key={`h-${active}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.38, ease }}
                className="font-semibold text-white mb-5"
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
                  letterSpacing: "-1.2px",
                  lineHeight: 1.08,
                }}
              >
                {tab.headline}
              </motion.h2>
            </AnimatePresence>

            {/* Description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`d-${active}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="text-lg mb-9"
                style={{ color: "rgba(255,255,255,0.68)", lineHeight: 1.65 }}
              >
                {tab.desc}
              </motion.p>
            </AnimatePresence>

            {/* Roar Score card — Revolut-style */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`s-${active}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, delay: 0.12 }}
                className="inline-block"
                style={{ width: "240px" }}
              >
                <RevolutCard
                  img={tab.img}
                  label={`Roar Score · ${tab.label}`}
                  balance={String(tab.score)}
                  toastLabel={tab.scoreLabel}
                  toastTime={`${tab.label} score`}
                  toastAmount={`${tab.score}/900`}
                  toastColor={tab.score >= 800 ? ORANGE : "#6366f1"}
                />
              </motion.div>
            </AnimatePresence>

            <div className="mt-9">
              <Link href="/auth?mode=register">
                <button className="px-7 py-3.5 rounded-full text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                  Build your Roar Score →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stat Item (avoids hooks-in-loop issue) ─── */
function StatItem({
  value,
  suffix,
  label,
  isText,
  inView,
}: {
  value: number;
  suffix: string;
  label: string;
  isText?: boolean;
  inView: boolean;
}) {
  const count = useCounter(value, 1600, 0, inView);
  return (
    <div className="text-center">
      <div
        className="font-bold text-gray-900 mb-1 tabular-nums"
        style={{ fontSize: "3rem", letterSpacing: "-1.5px", lineHeight: 1 }}
      >
        {isText ? suffix : `${count}${suffix}`}
      </div>
      <div className="text-sm text-gray-400 mt-2">{label}</div>
    </div>
  );
}

/* ─── Global Section ─── */
function GlobalSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} className="py-28 sm:py-36 overflow-hidden" style={{ background: "linear-gradient(180deg, #fff 0%, #f8f6f1 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-20"
        >
          <h2
            className="font-semibold text-gray-900 mb-5"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", letterSpacing: "-1.5px", lineHeight: 1.08 }}
          >
            Global infrastructure, local speed.
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Near-instant settlement across UAE, India, Philippines, and Indonesia. Transparent fees. No intermediaries.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {(
            [
              { value: 4, suffix: "", label: "Countries" },
              { value: 6, suffix: "", label: "Currencies" },
              { value: 0, suffix: "Near-instant", label: "Settlement Speed", isText: true },
              { value: 0, suffix: "0.99%", label: "FX Fee", isText: true },
            ] as const
          ).map(({ value, suffix, label, isText }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease, delay: 0.15 + i * 0.1 }}
              className="relative"
            >
              <StatItem
                value={value}
                suffix={suffix}
                label={label}
                isText={isText}
                inView={inView}
              />
              {i < 3 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gray-200" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Cards Section (homepage teaser) ─── */
function CardsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  const features = [
    { icon: Globe, text: "Real FX rates, no markup" },
    { icon: Lock, text: "Freeze & unfreeze instantly" },
    { icon: BellRing, text: "Real-time spending alerts" },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ background: DARK, minHeight: "80vh" }}>
      <div className="relative z-10 flex items-center" style={{ minHeight: "80vh" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full py-24">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease }}
            >
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-wide"
                style={{ background: "rgba(255,77,0,0.15)", color: ORANGE }}
              >
                COMING SOON
              </span>
              <h2
                className="font-semibold text-white mb-5"
                style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", letterSpacing: "-1.5px", lineHeight: 1.08 }}
              >
                The TigerBnk Card
              </h2>
              <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                Spend globally at real exchange rates. Virtual card instant, physical card ships to your door.
              </p>

              <div className="space-y-5 mb-10">
                {features.map((f, i) => (
                  <motion.div
                    key={f.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.06)" }}
                    >
                      <f.icon className="w-4.5 h-4.5" style={{ color: ORANGE }} />
                    </div>
                    <span className="text-white text-sm font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>

              <Link href="/cards">
                <button className="px-7 py-3.5 rounded-full text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors duration-200 cursor-pointer inline-flex items-center gap-2">
                  Join the Waitlist <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Right: Card visual */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative w-full max-w-[420px]">
                {/* Glow */}
                <div
                  className="absolute -inset-8 rounded-3xl"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(255,77,0,0.12) 0%, transparent 70%)",
                    filter: "blur(30px)",
                  }}
                />
                {/* Card */}
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    aspectRatio: "420/260",
                    background: "linear-gradient(135deg, #F5F0E8 0%, #E8E0D0 100%)",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="absolute inset-0 p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold tracking-[3px] text-gray-800">TIGERBNK</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 tracking-wider">PLATINUM</div>
                        </div>
                        <div
                          className="w-10 h-7 rounded"
                          style={{ background: "#D4CFC5", border: "1px solid #C0BAB0" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 tracking-[2.5px] font-mono mb-4">
                        ••••  ••••  ••••  4289
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[9px] text-gray-400 tracking-[1.5px] mb-0.5">CARDHOLDER</div>
                          <div className="text-xs font-bold text-gray-800">YOUR NAME</div>
                        </div>
                        <div className="flex -space-x-2">
                          <div className="w-7 h-7 rounded-full" style={{ background: "#E8E0D0" }} />
                          <div className="w-7 h-7 rounded-full" style={{ background: "#D0C8B8" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Second card peek */}
                <div
                  className="absolute -bottom-4 left-4 right-4 h-12 rounded-b-2xl -z-10"
                  style={{
                    background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Section ─── */
const FAQS = [
  { q: "What is TigerBnk?", a: "TigerBnk is a cross-border remittance platform for individuals and merchants. Send and receive money across UAE, India, Philippines, and Indonesia with near-instant settlement, transparent FX rates, and a portable credit score that grows with your activity." },
  { q: "How does settlement work?", a: "When you send money, we convert and settle via stablecoin rails on the backend — you only deal in local fiat currency. Funds arrive near-instantly instead of the traditional 2–7 day waiting period." },
  { q: "What is the Roar Score?", a: "The Roar Score is a 300–900 credit identity built automatically from your transaction history, volume consistency, repayment behaviour, and wallet balance. No paperwork or credit bureaus required." },
  { q: "How do I get started?", a: "Sign up, complete KYC verification, and start sending money. Your Roar Score begins building from day one." },
  { q: "Is my money safe?", a: "Yes. TigerBnk uses bank-grade encryption and security infrastructure. Your funds are held with licensed financial partners with regulatory compliance across all operating jurisdictions." },
  { q: "Which countries and currencies do you support?", a: "We currently operate across 4 countries — UAE, India, Philippines, and Indonesia. We support 6 currencies: AED, INR, PHP, IDR, USD, and GBP." },
];

function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} id="faq" className="py-24 sm:py-32 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-14"
        >
          <h2
            className="font-semibold text-gray-900 mb-4"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", letterSpacing: "-1.5px", lineHeight: 1.08 }}
          >
            Questions? We got you.
          </h2>
          <p className="text-lg text-gray-500">Everything you need to know about TigerBnk.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-gray-100">
                <AccordionTrigger className="text-left text-gray-900 font-semibold text-base hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 leading-relaxed text-[15px] pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await apiRequest("POST", "/api/early-access", {
        email,
        name: "Newsletter",
        country: "N/A",
        monthlyVolume: "N/A",
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <footer style={{ background: DARK }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid md:grid-cols-2 gap-16 mb-16">
          <div>
            <h3 className="text-xl font-bold mb-2">Stay connected</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              Get updates on new features, markets, and product launches.
            </p>
            {submitted ? (
              <p className="text-green-400 text-sm font-medium">You're on the list. ✓</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/20"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors duration-200"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                title: "Product",
                links: [
                  { label: "Payments", href: "#features" },
                  { label: "Settlement", href: "#features" },
                  { label: "Cards", href: "/cards" },
                ],
              },
              { title: "Resources", links: [{ label: "FAQ", href: "#faq" }] },
              {
                title: "Solutions",
                links: [
                  { label: "E-commerce", href: "#" },
                  { label: "Freelancers", href: "#" },
                  { label: "SaaS", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-4"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="TigerBnk" className="w-6 h-6 rounded-md" />
            <span className="text-sm font-semibold">TigerBnk</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            © {new Date().getFullYear()} TigerBnk. Financial infrastructure for global commerce.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  useEffect(() => {
    document.title = "TigerBnk — The Payment Infrastructure for Global Business";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Cross-border remittance platform with near-instant settlement across UAE, India, Philippines, and Indonesia. Multi-currency transfers with transparent fees."
    );
    return () => {
      document.title = "TigerBnk";
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroAndFeatures />
      <GlobalSection />
      <CreditSection />
      <CardsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
