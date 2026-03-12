import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, ArrowLeft, Globe, CreditCard, ShieldCheck, Zap,
  Wifi, Snowflake, Percent, Lock, Smartphone, Bell, Menu, X,
  Banknote, QrCode, Receipt, Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/tigerbnklogo.png";

const ORANGE = "#FF4D00";
const ease = [0.16, 1, 0.3, 1] as const;

const animateIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease },
};

const cardFeatures = [
  { icon: Wifi, title: "Contactless", desc: "Tap to pay anywhere in the world with NFC technology." },
  { icon: Snowflake, title: "Instant Freeze", desc: "Lock your card in one tap. Unfreeze just as fast." },
  { icon: Percent, title: "Cashback", desc: "Earn rewards on every transaction automatically." },
  { icon: Lock, title: "Bank-Grade Security", desc: "256-bit encryption with real-time fraud monitoring." },
  { icon: Smartphone, title: "Digital First", desc: "Use your virtual card instantly, physical card follows." },
  { icon: Globe, title: "No FX Fees", desc: "Spend globally without hidden currency charges." },
  { icon: Banknote, title: "Multi-Currency", desc: "Hold and spend in USD, EUR, GBP, AED and more." },
  { icon: QrCode, title: "QR Payments", desc: "Scan to pay at millions of merchants worldwide." },
  { icon: Receipt, title: "Instant Receipts", desc: "Real-time transaction notifications and digital receipts." },
  { icon: Fingerprint, title: "Biometric Auth", desc: "Face ID and fingerprint for every sensitive action." },
  { icon: ShieldCheck, title: "3D Secure", desc: "Extra verification layer for online transactions." },
  { icon: Zap, title: "Instant Top-Up", desc: "Add funds from any bank account in seconds." },
];

/* ─── Navbar ─── */
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
        background: scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(0,0,0,0.03)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt="TigerBnk" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-lg tracking-tight text-gray-900">TigerBnk</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="rounded-full px-5 text-gray-600 hover:text-gray-900">
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button
              asChild size="sm"
              className="rounded-full px-6 py-2 font-medium text-white border-0 h-auto"
              style={{ background: ORANGE }}
            >
              <Link href="/auth?mode=register" className="inline-flex items-center gap-1.5">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-gray-600"
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
            className="md:hidden overflow-hidden bg-white border-t border-gray-100"
          >
            <div className="px-6 py-4 space-y-3">
              <a href="#features" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#how-it-works" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>How It Works</a>
              <Link href="/" className="block text-gray-500 text-sm py-2" onClick={() => setMobileOpen(false)}>Home</Link>
              <div className="flex gap-3 pt-2">
                <Button asChild size="sm" className="flex-1 rounded-full text-white border-0" style={{ background: ORANGE }}>
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
  const [notified, setNotified] = useState(false);

  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 bg-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
              className="mb-6"
            >
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.15 }}
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full"
                style={{ color: ORANGE, background: "rgba(255,77,0,0.06)", border: "1px solid rgba(255,77,0,0.1)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE, animation: "pulseGlow 2s ease-in-out infinite" }} />
                Coming Soon
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.2 }}
              className="font-black tracking-tight leading-[1.05] mb-6 text-gray-900"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              The Card That<br />
              <span style={{ color: ORANGE }}>Powers</span> Your Business.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.35 }}
              className="text-gray-400 text-base sm:text-lg max-w-md leading-relaxed mb-8"
            >
              Spend globally, freeze instantly, earn cashback on every transaction. Virtual and physical — your financial power, in your pocket.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Button
                size="lg"
                className="rounded-full px-8 font-semibold text-base gap-2 border-0"
                style={{
                  background: notified ? "#22c55e" : ORANGE,
                  color: notified ? "#fff" : "#fff",
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
                    Get Early Access
                  </>
                )}
              </Button>
              {!notified && (
                <span className="text-gray-400 text-sm">Be first to know.</span>
              )}
            </motion.div>

            {/* Quick feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap gap-2 mt-8"
            >
              {[
                { icon: Globe, label: "Global" },
                { icon: CreditCard, label: "Virtual & Physical" },
                { icon: ShieldCheck, label: "Secure" },
                { icon: Zap, label: "Cashback" },
              ].map((f, i) => (
                <motion.span
                  key={f.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease, delay: 0.65 + i * 0.06 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100"
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Right — floating card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="flex justify-center lg:justify-end"
            style={{ perspective: "1200px" }}
          >
            <div className="relative">
              {/* Glow behind card */}
              <div
                className="absolute -inset-8 rounded-3xl opacity-20 blur-3xl"
                style={{ background: `radial-gradient(ellipse, ${ORANGE}, transparent 70%)` }}
              />

              <motion.div
                className="relative w-80 sm:w-[24rem] h-48 sm:h-56 rounded-2xl flex flex-col justify-between p-7 select-none overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${ORANGE} 0%, #FF8C00 100%)`,
                  transform: "perspective(1200px) rotateY(-8deg) rotateX(4deg)",
                  boxShadow: `0 30px 80px rgba(255, 77, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset`,
                  animation: "float 6s ease-in-out infinite",
                }}
              >
                {/* Shimmer */}
                <div
                  className="absolute top-0 h-full w-1/2 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                    animation: "shimmerSweep 4s ease-in-out 1.5s infinite",
                  }}
                />

                {/* Top row */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase">TigerBnk</span>
                    <span className="text-white/40 text-[9px] mt-0.5">PLATINUM</span>
                  </div>
                  <div className="w-10 h-8 rounded-sm" style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.2))",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }} />
                </div>

                {/* Card number */}
                <div className="relative z-10">
                  <p className="text-white/70 font-mono text-sm tracking-[0.25em] mb-3">
                    **** **** **** 4289
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-[0.15em] mb-0.5">Cardholder</p>
                      <p className="text-white text-sm font-semibold">YOUR NAME</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/80" />
                      <div className="w-8 h-8 rounded-full bg-orange-400/80" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features Grid ─── */
function FeaturesGrid() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Everything you need.
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-lg mx-auto">
            A card designed for the modern global business. Every feature built with purpose.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cardFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              {...animateIn}
              transition={{ duration: 0.5, ease, delay: i * 0.05 }}
              className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-orange-50 transition-colors duration-300">
                <f.icon className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors duration-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Sign Up", desc: "Create your TigerBnk account in minutes. Simple KYC, instant verification." },
    { num: "02", title: "Get Your Card", desc: "Virtual card issued instantly. Physical card delivered to your door." },
    { num: "03", title: "Load & Spend", desc: "Top up from any account. Spend anywhere Mastercard is accepted." },
    { num: "04", title: "Earn Rewards", desc: "Cashback on every purchase. Roar Score builds your credit identity." },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Get started in minutes.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              {...animateIn}
              transition={{ duration: 0.5, ease, delay: i * 0.1 }}
              className="relative p-7 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-5xl font-black text-gray-100 absolute top-4 right-4 select-none">{s.num}</span>
              <div className="relative">
                <h3 className="text-base font-bold text-gray-900 mb-2 mt-8">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison ─── */
function ComparisonSection() {
  const rows = [
    { feature: "Global Spending", tiger: true, traditional: false },
    { feature: "Instant Freeze/Unfreeze", tiger: true, traditional: false },
    { feature: "Zero FX Fees", tiger: true, traditional: false },
    { feature: "Real-time Notifications", tiger: true, traditional: true },
    { feature: "Virtual + Physical", tiger: true, traditional: false },
    { feature: "Cashback Rewards", tiger: true, traditional: true },
    { feature: "Roar Score Credit Building", tiger: true, traditional: false },
    { feature: "Multi-Currency Wallet", tiger: true, traditional: false },
  ];

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div {...animateIn} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Why TigerBnk Card?
          </h2>
          <p className="text-gray-400 text-lg mt-4">See how we compare.</p>
        </motion.div>

        <motion.div {...animateIn} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-5 border-b border-gray-100 bg-gray-50">
            <div className="text-sm font-semibold text-gray-500">Feature</div>
            <div className="text-sm font-bold text-center" style={{ color: ORANGE }}>TigerBnk</div>
            <div className="text-sm font-semibold text-gray-400 text-center">Traditional</div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease, delay: i * 0.04 }}
              className={`grid grid-cols-3 gap-4 p-5 ${i < rows.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="text-sm text-gray-700 font-medium">{row.feature}</div>
              <div className="flex justify-center">
                {row.tiger ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,77,0,0.08)" }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                  </div>
                ) : (
                  <span className="text-gray-300 text-sm">—</span>
                )}
              </div>
              <div className="flex justify-center">
                {row.traditional ? (
                  <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                ) : (
                  <span className="text-gray-300 text-sm">—</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  const [notified, setNotified] = useState(false);

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div {...animateIn}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Ready to get yours?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            Join the waitlist and be among the first to experience the TigerBnk Card.
          </p>
          <Button
            size="lg"
            className="rounded-full px-10 py-6 font-semibold text-base gap-2 border-0"
            style={{
              background: notified ? "#22c55e" : ORANGE,
              color: "#fff",
              animation: notified ? "none" : "btnGlow 3s ease-in-out infinite",
            }}
            onClick={() => setNotified(true)}
          >
            {notified ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                You're on the list!
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Join the Waitlist
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
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

/* ─── Main Page ─── */
export default function CardsLandingPage() {
  useEffect(() => {
    document.title = "TigerBnk Card — Your Financial Power, In Your Pocket";
    window.scrollTo(0, 0);
    return () => { document.title = "TigerBnk"; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <ComparisonSection />
      <CTASection />
      <Footer />
    </div>
  );
}
