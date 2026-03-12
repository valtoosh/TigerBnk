import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Bell, ShieldCheck, Menu, X, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/tigerbnklogo.png";

const ORANGE = "#FF4D00";
const ease = [0.16, 1, 0.3, 1] as const;

const CARD_W = 420;
const CARD_H = 260;
const PX = 7;
const COLS = Math.ceil(CARD_W / PX);
const ROWS = Math.ceil(CARD_H / PX);

interface Pixel {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

function buildPixels(): Pixel[] {
  const pixels: Pixel[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tx = c * PX;
      const ty = r * PX;

      const nx = c / COLS;
      const ny = r / ROWS;
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
        Math.pow((tx - CARD_W / 2) / CARD_W, 2) +
        Math.pow((ty - CARD_H / 2) / CARD_H, 2)
      );
      const delay = centerDist * 0.4 + Math.random() * 0.15;

      pixels.push({ tx, ty, sx, sy, x: sx, y: sy, color, delay });
    }
  }
  return pixels;
}

function PixelCard({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>(buildPixels());
  const startTime = useRef<number>(0);
  const animDone = useRef(false);
  const rafId = useRef<number>(0);
  const initialized = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!initialized.current) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = CARD_W * dpr;
      canvas.height = CARD_H * dpr;
      ctx.scale(dpr, dpr);
      initialized.current = true;
    }

    const elapsed = (performance.now() - startTime.current) / 1000;
    const dur = 2.2;
    let allDone = true;

    ctx.clearRect(0, 0, CARD_W, CARD_H);

    for (const p of pixelsRef.current) {
      const t = Math.max(0, Math.min(1, (elapsed - p.delay) / dur));
      if (t < 1) allDone = false;

      const easeT = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      p.x = p.sx + (p.tx - p.sx) * easeT;
      p.y = p.sy + (p.ty - p.sy) * easeT;

      ctx.globalAlpha = Math.min(1, t * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, PX - 0.5, PX - 0.5);
    }

    ctx.globalAlpha = 1;

    if (allDone && !animDone.current) {
      animDone.current = true;
      ctx.clearRect(0, 0, CARD_W, CARD_H);
      drawFinalCard(ctx);
      return;
    }

    if (!animDone.current) {
      rafId.current = requestAnimationFrame(draw);
    }
  }, []);

  useEffect(() => {
    startTime.current = performance.now();
    pixelsRef.current = buildPixels();
    animDone.current = false;
    initialized.current = false;
    rafId.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "auto", aspectRatio: `${CARD_W}/${CARD_H}` }}
      data-testid="canvas-pixel-card"
    />
  );
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function drawFinalCard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#F5F0E8";
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 18);
  ctx.fill();

  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 14px Inter, system-ui, sans-serif";
  drawSpacedText(ctx, "TIGERBNK", 30, 50, 3);

  ctx.fillStyle = "#999";
  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.fillText("PLATINUM", 30, 68);

  ctx.fillStyle = "#D4CFC5";
  roundRect(ctx, CARD_W - 72, 28, 42, 32, 5);
  ctx.fill();
  ctx.strokeStyle = "#C0BAB0";
  ctx.lineWidth = 1;
  roundRect(ctx, CARD_W - 72, 28, 42, 32, 5);
  ctx.stroke();

  ctx.fillStyle = "#AAAAAA";
  ctx.font = "16px 'JetBrains Mono', monospace";
  drawSpacedText(ctx, "••••  ••••  ••••  4289", 30, 160, 2.5);

  ctx.fillStyle = "#999";
  ctx.font = "9px Inter, system-ui, sans-serif";
  drawSpacedText(ctx, "CARDHOLDER", 30, 205, 1.5);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 15px Inter, system-ui, sans-serif";
  ctx.fillText("VALTOOSH", 30, 225);

  ctx.fillStyle = "#E8E0D0";
  ctx.beginPath();
  ctx.arc(CARD_W - 52, CARD_H - 36, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D0C8B8";
  ctx.beginPath();
  ctx.arc(CARD_W - 36, CARD_H - 36, 17, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
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

const steps = [
  {
    num: "01",
    heading: "Instant Issuance",
    description: "Your virtual card is ready the moment you sign up. Start spending globally in seconds, not days.",
  },
  {
    num: "02",
    heading: "Zero-Fee Global Spending",
    description: "No FX markups, no hidden fees. Spend in any currency at the real exchange rate.",
  },
  {
    num: "03",
    heading: "Total Control",
    description: "Freeze, unfreeze, set limits, and get real-time alerts. Your card, your rules.",
  },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255, 248, 231, 0.97)" : "rgba(255, 248, 231, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="TigerBnk" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight text-gray-900">TigerBnk</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <Link href="/" className="transition-colors hover:text-gray-900">Home</Link>
            <a href="/#features" className="transition-colors hover:text-gray-900">Features</a>
            <Link href="/cards" className="transition-colors hover:text-gray-900">Cards</Link>
            <a href="/#faq" className="transition-colors hover:text-gray-900">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild size="sm"
              className="rounded-full px-6 py-2 font-medium text-gray-900 border-0 h-auto"
              style={{ background: "#FF4D00" }}
            >
              <Link href="/auth?mode=register" className="inline-flex items-center gap-1.5" data-testid="link-get-started">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
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
            className="md:hidden overflow-hidden border-t border-gray-200/50"
            style={{ background: "#FFF8E7" }}
          >
            <div className="px-6 py-4 space-y-3">
              <Link href="/" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Home</Link>
              <a href="/#features" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Features</a>
              <Link href="/cards" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Cards</Link>
              <a href="/#faq" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>FAQ</a>
              <div className="flex gap-3 pt-2">
                <Button asChild size="sm" className="flex-1 rounded-full text-gray-900 border-0" style={{ background: "#FF4D00" }}>
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

function HeroSection() {
  const [notified, setNotified] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startAutoRotate = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
  }, []);

  useEffect(() => {
    startAutoRotate();
    return () => clearInterval(timerRef.current);
  }, [startAutoRotate]);

  return (
    <section className="relative min-h-screen pt-28 pb-20 sm:pt-36 overflow-hidden" style={{ background: "#FFF8E7" }}>
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="mb-6"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="pt-4">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="font-black tracking-tight leading-[0.95] mb-8 text-gray-900"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
            >
              The card<br />
              built for<br />
              <span style={{ color: ORANGE }}>what's next.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.35 }}
              className="text-gray-500 text-base sm:text-lg max-w-sm leading-relaxed mb-10"
            >
              Spend globally, freeze instantly, earn on every transaction. Virtual and physical — your financial power, redesigned.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4 mb-16"
            >
              <Button
                size="lg"
                className="rounded-none px-8 font-semibold text-base gap-2 border-0 h-12"
                style={{
                  background: notified ? "#22c55e" : "#1a1a1a",
                  color: "#fff",
                }}
                onClick={() => setNotified(true)}
                data-testid="button-notify-cards"
              >
                {notified ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    You're on the list
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Join the Waitlist
                  </>
                )}
              </Button>
              {!notified && (
                <span className="text-gray-400 text-sm">Be first to know.</span>
              )}
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center lg:items-end gap-8"
          >
            <div className="w-full max-w-[420px]">
              <PixelCard className="rounded-2xl" />
            </div>

            <div className="flex items-center gap-6">
              {steps.map((s, i) => (
                <button
                  key={s.num}
                  onClick={() => { setActiveStep(i); startAutoRotate(); }}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "14px",
                    fontWeight: i === activeStep ? 700 : 400,
                    color: i === activeStep ? ORANGE : "#aaa",
                    letterSpacing: "0.05em",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                  data-testid={`button-step-${s.num}`}
                >
                  {s.num}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease }}
                className="text-center lg:text-right max-w-[420px] w-full"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {steps[activeStep].heading}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {steps[activeStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: "#1a1a1a" }} className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="TigerBnk" className="w-6 h-6 rounded" />
            <span className="text-gray-400 text-sm font-semibold">TigerBnk</span>
          </div>
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} TigerBnk. Financial infrastructure for global commerce.</p>
        </div>
      </div>
    </footer>
  );
}

export default function CardsLandingPage() {
  useEffect(() => {
    document.title = "TigerBnk Card — Your Financial Power, In Your Pocket";
    window.scrollTo(0, 0);
    return () => { document.title = "TigerBnk"; };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#FFF8E7" }}>
      <Navbar />
      <HeroSection />
      <Footer />
    </div>
  );
}
