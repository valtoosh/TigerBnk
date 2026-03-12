import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";

const ORANGE = "#FF4D00";
const kxEase = [0.16, 1, 0.3, 1] as const;

const CARD_W = 380;
const CARD_H = 235;
const PX = 6;
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
      const dist = 100 + Math.random() * 220;
      const sx = tx + Math.cos(angle) * dist;
      const sy = ty + Math.sin(angle) * dist;

      const centerDist = Math.sqrt(
        Math.pow((tx - CARD_W / 2) / CARD_W, 2) +
        Math.pow((ty - CARD_H / 2) / CARD_H, 2)
      );
      const delay = centerDist * 0.35 + Math.random() * 0.12;

      pixels.push({ tx, ty, sx, sy, x: sx, y: sy, color, delay });
    }
  }
  return pixels;
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
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 16);
  ctx.fill();

  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 13px Inter, system-ui, sans-serif";
  drawSpacedText(ctx, "TIGERBNK", 26, 44, 2.5);

  ctx.fillStyle = "#999";
  ctx.font = "9px Inter, system-ui, sans-serif";
  ctx.fillText("PLATINUM", 26, 60);

  ctx.fillStyle = "#D4CFC5";
  roundRect(ctx, CARD_W - 66, 24, 40, 30, 4);
  ctx.fill();

  ctx.fillStyle = "#AAAAAA";
  ctx.font = "14px 'JetBrains Mono', monospace";
  drawSpacedText(ctx, "••••  ••••  ••••  ****", 26, 142, 2);

  ctx.fillStyle = "#999";
  ctx.font = "8px Inter, system-ui, sans-serif";
  drawSpacedText(ctx, "CARDHOLDER", 26, 185, 1.2);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 14px Inter, system-ui, sans-serif";
  ctx.fillText("VALTOOSH", 26, 203);

  ctx.fillStyle = "#E8E0D0";
  ctx.beginPath();
  ctx.arc(CARD_W - 46, CARD_H - 32, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D0C8B8";
  ctx.beginPath();
  ctx.arc(CARD_W - 32, CARD_H - 32, 15, 0, Math.PI * 2);
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

function PixelCard() {
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
    const dur = 2.0;
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
      style={{ width: CARD_W, height: CARD_H }}
      data-testid="canvas-pixel-card"
    />
  );
}

const featureSteps = [
  {
    num: "01",
    heading: "Instant Issuance",
    description: "Virtual card ready the moment you sign up. Start spending globally in seconds.",
  },
  {
    num: "02",
    heading: "Zero-Fee Spending",
    description: "No FX markups, no hidden fees. Spend in any currency at the real exchange rate.",
  },
  {
    num: "03",
    heading: "Total Control",
    description: "Freeze, unfreeze, set limits, and get real-time alerts.",
  },
];

export default function Cards() {
  const [notified, setNotified] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col px-4 py-8 -mx-4 md:-mx-6"
    >
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: kxEase, delay: 0.1 }}
            className="mb-4"
          >
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 border"
              style={{ color: "#888", borderColor: "#ddd", background: "transparent" }}
              data-testid="badge-coming-soon"
            >
              Coming Soon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: kxEase, delay: 0.15 }}
            className="font-black tracking-tight leading-[0.95] mb-6 text-foreground"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            TigerBnk<br />
            <span style={{ color: ORANGE }}>Card</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: kxEase, delay: 0.3 }}
            className="text-muted-foreground text-base max-w-sm leading-relaxed mb-8"
          >
            Your financial power, in your pocket. Spend globally, freeze instantly, earn on every transaction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: kxEase, delay: 0.4 }}
            className="mb-12"
          >
            <Button
              size="lg"
              className="rounded-none px-8 font-semibold text-sm gap-2 h-11"
              style={{
                background: notified ? "#22c55e" : "#1a1a1a",
                color: "#fff",
                border: "none",
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
                  Notify Me
                </>
              )}
            </Button>
            {!notified && (
              <p className="text-muted-foreground text-xs mt-3">
                Be the first to know when TigerBnk Card launches.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: kxEase }}
              >
                <h3 className="text-lg font-bold text-foreground mb-1.5">
                  {featureSteps[activeStep].heading}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                  {featureSteps[activeStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-shrink-0 flex flex-col items-center lg:items-end gap-6 w-full lg:w-auto"
        >
          <PixelCard />

          <div className="flex items-center gap-5">
            {featureSteps.map((s, i) => (
              <button
                key={s.num}
                onClick={() => setActiveStep(i)}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  fontWeight: i === activeStep ? 700 : 400,
                  color: i === activeStep ? ORANGE : "hsl(var(--muted-foreground))",
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
        </motion.div>
      </div>
    </motion.div>
  );
}
