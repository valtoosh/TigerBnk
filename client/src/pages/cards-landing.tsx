import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Bell, ShieldCheck, Menu, X, Globe, Lock, Zap, CreditCard, Smartphone, Shield,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import logoImg from "@assets/tigerbnklogo.png";

const ORANGE = "#FF4D00";
const DARK = "#0f0f0f";
const ease = [0.16, 1, 0.3, 1] as const;

/* ─── PixelCard (canvas animation) ─── */
const CARD_W = 420;
const CARD_H = 260;
const PX = 7;
const COLS = Math.ceil(CARD_W / PX);
const ROWS = Math.ceil(CARD_H / PX);

interface Pixel {
  tx: number; ty: number; sx: number; sy: number;
  x: number; y: number; color: string; delay: number;
}

function buildPixels(): Pixel[] {
  const pixels: Pixel[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tx = c * PX, ty = r * PX;
      const nx = c / COLS, ny = r / ROWS;
      let color = "#F5F0E8";
      if (ny < 0.32 && nx < 0.45) color = "#1a1a1a";
      else if (ny > 0.75) color = "#E8E0D0";
      else if (nx > 0.78 && ny < 0.25) color = "#D4CFC5";
      if (ny > 0.58 && ny < 0.64 && nx > 0.05 && nx < 0.65) color = "#CCCCC4";
      if (ny > 0.78 && nx < 0.35) color = "#B0ACA2";
      if (ny > 0.85 && nx > 0.75) color = "#D0CBC0";
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 250;
      const sx = tx + Math.cos(angle) * dist;
      const sy = ty + Math.sin(angle) * dist;
      const centerDist = Math.sqrt(
        Math.pow((tx - CARD_W / 2) / CARD_W, 2) + Math.pow((ty - CARD_H / 2) / CARD_H, 2)
      );
      const delay = centerDist * 0.4 + Math.random() * 0.15;
      pixels.push({ tx, ty, sx, sy, x: sx, y: sy, color, delay });
    }
  }
  return pixels;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x;
  for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
}

function drawFinalCard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#F5F0E8";
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 18); ctx.fill();
  ctx.fillStyle = "#1a1a1a"; ctx.font = "bold 14px Inter, system-ui, sans-serif";
  drawSpacedText(ctx, "TIGERBNK", 30, 50, 3);
  ctx.fillStyle = "#999"; ctx.font = "10px Inter, system-ui, sans-serif"; ctx.fillText("PLATINUM", 30, 68);
  ctx.fillStyle = "#D4CFC5"; roundRect(ctx, CARD_W - 72, 28, 42, 32, 5); ctx.fill();
  ctx.strokeStyle = "#C0BAB0"; ctx.lineWidth = 1; roundRect(ctx, CARD_W - 72, 28, 42, 32, 5); ctx.stroke();
  ctx.fillStyle = "#AAAAAA"; ctx.font = "16px 'JetBrains Mono', monospace";
  drawSpacedText(ctx, "••••  ••••  ••••  4289", 30, 160, 2.5);
  ctx.fillStyle = "#999"; ctx.font = "9px Inter, system-ui, sans-serif";
  drawSpacedText(ctx, "CARDHOLDER", 30, 205, 1.5);
  ctx.fillStyle = "#1a1a1a"; ctx.font = "bold 15px Inter, system-ui, sans-serif"; ctx.fillText("YOUR NAME", 30, 225);
  ctx.fillStyle = "#E8E0D0"; ctx.beginPath(); ctx.arc(CARD_W - 52, CARD_H - 36, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#D0C8B8"; ctx.beginPath(); ctx.arc(CARD_W - 36, CARD_H - 36, 17, 0, Math.PI * 2); ctx.fill();
}

function PixelCard({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>(buildPixels());
  const startTime = useRef<number>(0);
  const animDone = useRef(false);
  const rafId = useRef<number>(0);
  const initialized = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    if (!initialized.current) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = CARD_W * dpr; canvas.height = CARD_H * dpr;
      ctx.scale(dpr, dpr); initialized.current = true;
    }
    const elapsed = (performance.now() - startTime.current) / 1000;
    const dur = 2.2; let allDone = true;
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    for (const p of pixelsRef.current) {
      const t = Math.max(0, Math.min(1, (elapsed - p.delay) / dur));
      if (t < 1) allDone = false;
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      p.x = p.sx + (p.tx - p.sx) * easeT; p.y = p.sy + (p.ty - p.sy) * easeT;
      ctx.globalAlpha = Math.min(1, t * 1.5); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, PX - 0.5, PX - 0.5);
    }
    ctx.globalAlpha = 1;
    if (allDone && !animDone.current) { animDone.current = true; ctx.clearRect(0, 0, CARD_W, CARD_H); drawFinalCard(ctx); return; }
    if (!animDone.current) rafId.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    startTime.current = performance.now(); pixelsRef.current = buildPixels();
    animDone.current = false; initialized.current = false;
    rafId.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId.current);
  }, [draw]);

  return (
    <canvas ref={canvasRef} className={className}
      style={{ width: "100%", height: "auto", aspectRatio: `${CARD_W}/${CARD_H}` }} />
  );
}

/* ─── CSS Card Component (for fanned display) ─── */
function CSSCard({ variant, style: extraStyle, className = "" }: {
  variant: "platinum" | "black" | "orange" | "virtual";
  style?: React.CSSProperties;
  className?: string;
}) {
  const themes = {
    platinum: { bg: "linear-gradient(135deg, #F5F0E8 0%, #E8E0D0 100%)", text: "#1a1a1a", muted: "#999", chip: "#D4CFC5" },
    black: { bg: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)", text: "#fff", muted: "#666", chip: "#444" },
    orange: { bg: `linear-gradient(135deg, ${ORANGE} 0%, #ff7a33 100%)`, text: "#fff", muted: "rgba(255,255,255,0.6)", chip: "rgba(255,255,255,0.25)" },
    virtual: { bg: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", text: "#fff", muted: "rgba(255,255,255,0.6)", chip: "rgba(255,255,255,0.25)" },
  };
  const t = themes[variant];
  const label = variant === "virtual" ? "VIRTUAL" : variant === "orange" ? "STANDARD" : variant === "black" ? "BLACK" : "PLATINUM";

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ aspectRatio: "420/260", background: t.bg, ...extraStyle }}
    >
      <div className="w-full h-full p-5 sm:p-7 flex flex-col justify-between relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-[3px]" style={{ color: t.text }}>TIGERBNK</div>
            <div className="text-[9px] mt-0.5 tracking-wider" style={{ color: t.muted }}>{label}</div>
          </div>
          <div className="w-8 h-6 rounded" style={{ background: t.chip, border: `1px solid ${variant === "platinum" ? "#C0BAB0" : "transparent"}` }} />
        </div>
        <div>
          <div className="text-[11px] tracking-[2px] font-mono mb-3" style={{ color: t.muted }}>
            ••••  ••••  ••••  4289
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[8px] tracking-[1.5px] mb-0.5" style={{ color: t.muted }}>CARDHOLDER</div>
              <div className="text-[11px] font-bold" style={{ color: t.text }}>YOUR NAME</div>
            </div>
            <div className="flex -space-x-1.5">
              <div className="w-5 h-5 rounded-full" style={{ background: variant === "platinum" ? "#E8E0D0" : "rgba(255,255,255,0.15)" }} />
              <div className="w-5 h-5 rounded-full" style={{ background: variant === "platinum" ? "#D0C8B8" : "rgba(255,255,255,0.25)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar (dark variant) ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToSection = (hash: string) => {
    setLocation("/");
    setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(15,15,15,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="TigerBnk" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight text-white">TigerBnk</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <button onClick={() => goToSection("#features")} className="transition-colors hover:text-white cursor-pointer bg-transparent border-none text-sm" style={{ color: "inherit" }}>Features</button>
            <Link href="/cards" className="transition-colors text-white font-medium">Cards</Link>
            <button onClick={() => goToSection("#faq")} className="transition-colors hover:text-white cursor-pointer bg-transparent border-none text-sm" style={{ color: "inherit" }}>FAQ</button>
          </div>

          <div className="hidden md:block">
            <Link href="/auth?mode=register">
              <button
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Get Started
              </button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
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
            style={{ background: "rgba(15,15,15,0.97)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-6 py-4 space-y-1 border-t border-white/5">
              <Link href="/" className="block text-white/60 text-sm py-2.5" onClick={() => setMobileOpen(false)}>Home</Link>
              <button onClick={() => { setMobileOpen(false); goToSection("#features"); }} className="block text-white/60 text-sm py-2.5 w-full text-left bg-transparent border-none cursor-pointer">Features</button>
              <Link href="/cards" className="block text-white text-sm py-2.5 font-medium" onClick={() => setMobileOpen(false)}>Cards</Link>
              <button onClick={() => { setMobileOpen(false); goToSection("#faq"); }} className="block text-white/60 text-sm py-2.5 w-full text-left bg-transparent border-none cursor-pointer">FAQ</button>
              <div className="pt-3">
                <Link href="/auth?mode=register" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-3 rounded-full text-sm font-semibold text-white" style={{ background: ORANGE }}>
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

/* ─── Hero: Revolut-style card showcase with Physical/Virtual toggle ─── */
function HeroSection() {
  const [cardType, setCardType] = useState<"physical" | "virtual">("physical");

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20" style={{ background: DARK }}>
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "80vw", height: "60vh",
          background: cardType === "physical"
            ? "radial-gradient(ellipse, rgba(245,240,232,0.06) 0%, transparent 70%)"
            : "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          transition: "background 0.6s ease",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="font-semibold text-white mb-5"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", letterSpacing: "-2px", lineHeight: 1.05 }}
        >
          Elevate your spend
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.15 }}
          className="text-base sm:text-lg max-w-xl mx-auto mb-4"
          style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}
        >
          Spend globally at real exchange rates with no hidden fees.
          Virtual card instant, physical card ships to your door.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs mb-8"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Cards launching soon. Join the waitlist for early access.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.35 }}
          className="mb-12"
        >
          <Link href="/auth?mode=register">
            <button
              className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{ background: "#fff", color: DARK }}
            >
              Join the Waitlist
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Fanned card display */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.3 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-6"
        style={{ height: "clamp(280px, 40vw, 420px)" }}
      >
        <AnimatePresence mode="wait">
          {cardType === "physical" ? (
            <motion.div
              key="physical"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* 5 fanned cards */}
              {(["orange", "black", "platinum", "black", "platinum"] as const).map((v, i) => {
                const total = 5;
                const mid = Math.floor(total / 2);
                const offset = i - mid;
                const rotate = offset * 8;
                const tx = offset * 60;
                const z = total - Math.abs(offset);
                const scale = 1 - Math.abs(offset) * 0.04;
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      width: "clamp(200px, 28vw, 300px)",
                      transform: `translateX(${tx}px) rotate(${rotate}deg) scale(${scale})`,
                      zIndex: z,
                      transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    <CSSCard
                      variant={v}
                      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}
                    />
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="virtual"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Virtual cards floating */}
              <div className="absolute" style={{ width: "clamp(200px, 28vw, 300px)", transform: "translateX(-80px) rotate(-6deg)", zIndex: 1 }}>
                <CSSCard variant="virtual" style={{ boxShadow: "0 20px 60px rgba(99,102,241,0.3)" }} />
              </div>
              <div className="absolute" style={{ width: "clamp(220px, 30vw, 320px)", zIndex: 3 }}>
                <CSSCard variant="virtual" style={{ boxShadow: "0 25px 80px rgba(99,102,241,0.4)" }} />
              </div>
              <div className="absolute" style={{ width: "clamp(200px, 28vw, 300px)", transform: "translateX(80px) rotate(6deg)", zIndex: 1 }}>
                <CSSCard variant="orange" style={{ boxShadow: "0 20px 60px rgba(255,77,0,0.3)" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Physical / Virtual toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.6 }}
        className="relative z-20 flex gap-2 mt-8 mb-16"
        style={{ padding: "4px", borderRadius: "100px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {(["physical", "virtual"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setCardType(type)}
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer"
            style={{
              background: cardType === type ? "rgba(255,255,255,0.12)" : "transparent",
              color: cardType === type ? "#fff" : "rgba(255,255,255,0.45)",
              border: cardType === type ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
            }}
          >
            {type === "physical" ? "Physical cards" : "Virtual cards"}
          </button>
        ))}
      </motion.div>
    </section>
  );
}

/* ─── Features Grid ─── */
const FEATURES = [
  { icon: Globe, title: "Real Exchange Rates", desc: "No hidden FX fees. What you see is what you get. 0.99% transparent fee." },
  { icon: Lock, title: "Instant Freeze", desc: "Lock your card in one tap from the app. Unfreeze when you're ready." },
  { icon: Zap, title: "Smart Alerts", desc: "Get notified for every transaction in real time. Full visibility, always." },
  { icon: CreditCard, title: "Multi-Currency", desc: "Spend in AED, INR, PHP, IDR, USD — automatically converted at real rates." },
  { icon: Shield, title: "Secure by Design", desc: "Virtual card numbers, biometric auth, and end-to-end encryption." },
  { icon: Smartphone, title: "Physical + Virtual", desc: "Get a virtual card instantly. Physical card ships to your door." },
];

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="py-24 sm:py-32" style={{ background: "#111" }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-16"
        >
          <h2
            className="font-semibold text-white mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-1.2px", lineHeight: 1.1 }}
          >
            Everything you'd expect, and more
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            A card designed for the way you actually spend.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.07 }}
              className="rounded-2xl p-6 sm:p-7 transition-colors duration-200"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex items-center justify-center mb-5"
                style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.05)" }}
              >
                <f.icon className="w-5 h-5" style={{ color: ORANGE }} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
const STEPS = [
  { num: "01", title: "Sign up & verify", desc: "Create your account and complete KYC. Get your virtual card instantly." },
  { num: "02", title: "Load from your bank", desc: "Bank transfer, UPI, GCash — load your card however you normally pay." },
  { num: "03", title: "Spend anywhere", desc: "Online and in-store, globally. Real exchange rates, every time." },
];

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} className="py-24 sm:py-32" style={{ background: DARK }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-16"
        >
          <h2
            className="font-semibold text-white mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-1.2px", lineHeight: 1.1 }}
          >
            Get started in minutes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease, delay: 0.15 + i * 0.12 }}
              className="text-center"
            >
              <div
                className="text-3xl font-bold mb-4 tabular-nums"
                style={{ color: ORANGE, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {s.num}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Card Showcase (PixelCard animation) ─── */
function CardShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-20 sm:py-28" style={{ background: "#111" }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
          >
            <h2
              className="font-semibold text-white mb-5"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", letterSpacing: "-1px", lineHeight: 1.1 }}
            >
              Designed to stand out
            </h2>
            <p className="text-base mb-6" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              Premium materials, clean design, zero clutter. The TigerBnk card is built to be as functional as it is beautiful.
            </p>
            <div className="space-y-4">
              {[
                "Contactless payments worldwide",
                "Premium metal card option",
                "Minimal, brandless design",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ORANGE }} />
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
            className="flex justify-center"
          >
            <div className="w-full max-w-[420px]">
              <PixelCard className="rounded-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const CARD_FAQS = [
  { q: "When will cards be available?", a: "We're currently in closed beta. Join the waitlist to get early access when we launch in UAE, India, Philippines, and Indonesia." },
  { q: "What currencies can I spend in?", a: "You can spend in any currency. We convert at real exchange rates with a transparent 0.99% fee. No hidden markups." },
  { q: "Is there a monthly fee?", a: "No monthly fees. No hidden charges. You only pay the transparent FX fee when you spend in a foreign currency." },
  { q: "Can I get both physical and virtual?", a: "Yes. Your virtual card is issued instantly upon signup. Physical cards ship to your registered address — currently available in UAE with more countries coming soon." },
];

function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} className="py-24 sm:py-32" style={{ background: DARK }}>
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-14"
        >
          <h2
            className="font-semibold text-white mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-1.2px", lineHeight: 1.1 }}
          >
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {CARD_FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <AccordionTrigger className="text-left text-white font-semibold text-base hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-[15px] pb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
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

/* ─── CTA Banner ─── */
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await apiRequest("POST", "/api/early-access", {
        email, name: "Cards Waitlist", country: "N/A", monthlyVolume: "N/A",
      });
      setSubmitted(true);
    } catch { setSubmitted(true); }
  };

  return (
    <section ref={ref} className="py-24 sm:py-32" style={{ background: "#111" }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
        >
          <h2
            className="font-semibold text-white mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-1.2px", lineHeight: 1.1 }}
          >
            Be the first to get the TigerBnk Card.
          </h2>
          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Join the waitlist and get notified when we launch.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <ShieldCheck className="w-4 h-4" />
              You're on the list. We'll notify you.
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3.5 rounded-full text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/20"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                type="submit"
                className="px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{ background: "#fff", color: DARK }}
              >
                Join Waitlist
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{ background: DARK }} className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="TigerBnk" className="w-6 h-6 rounded" />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>TigerBnk</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            &copy; {new Date().getFullYear()} TigerBnk. Financial infrastructure for global commerce.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function CardsLandingPage() {
  useEffect(() => {
    document.title = "TigerBnk Card — Spend Globally at Real Exchange Rates";
    window.scrollTo(0, 0);
    return () => { document.title = "TigerBnk"; };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: DARK }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CardShowcase />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
