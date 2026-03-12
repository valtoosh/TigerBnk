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
import heroBg from "@assets/background.png";
import faqImg from "@assets/faq.png";

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
            <span className={`font-bold text-lg tracking-tight transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}>TigerBnk</span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-sm transition-colors duration-300 ${scrolled ? "text-gray-500" : "text-white/60"}`}>
            <a href="#features" className={`transition-colors ${scrolled ? "hover:text-gray-900" : "hover:text-white"}`}>Features</a>
            <a href="#how-it-works" className={`transition-colors ${scrolled ? "hover:text-gray-900" : "hover:text-white"}`}>How It Works</a>
            <Link href="/cards" className={`transition-colors ${scrolled ? "hover:text-gray-900" : "hover:text-white"}`}>Cards</Link>
            <a href="#faq" className={`transition-colors ${scrolled ? "hover:text-gray-900" : "hover:text-white"}`}>FAQ</a>
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

          <button className={`md:hidden p-2 transition-colors duration-300 ${scrolled ? "text-gray-600" : "text-white/70"}`} onClick={() => setMobileOpen(!mobileOpen)}>
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
            style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-6 py-4 space-y-3">
              <a href="#features" className="block text-white/60 text-sm py-2" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#how-it-works" className="block text-white/60 text-sm py-2" onClick={() => setMobileOpen(false)}>How It Works</a>
              <Link href="/cards" className="block text-white/60 text-sm py-2" onClick={() => setMobileOpen(false)}>Cards</Link>
              <a href="#faq" className="block text-white/60 text-sm py-2" onClick={() => setMobileOpen(false)}>FAQ</a>
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
  const [statsVisible, setStatsVisible] = useState(false);
  const merchants = useCounter(800, 2000, 0, statsVisible);
  const processed = useCounter(20, 1800, 0, statsVisible);

  return (
    <section className="relative min-h-screen overflow-hidden" data-testid="section-hero">
      {/* Full-bleed background image — no filter, sharp */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
          style={{ imageRendering: "auto" }}
          loading="eager"
          decoding="async"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Hero content — left aligned like credible */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-end min-h-screen pb-20 pt-32">
        {/* TPV badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="mb-6"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-md text-sm font-semibold"
            style={{ background: ORANGE, color: "#000" }}
          >
            $20,000,000+ TPV
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="text-white font-black tracking-tight leading-[1.05] mb-6 max-w-3xl"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
          data-testid="text-hero-headline"
        >
          Global Payments,<br />
          Simplified.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.35 }}
          className="text-white/60 text-base sm:text-lg max-w-md leading-relaxed"
          data-testid="text-hero-subheadline"
        >
          Collect and pay globally with{" "}
          <span className="text-white font-medium">T+0 settlement</span>,
          powered by TigerBnk.
        </motion.p>
      </div>

      {/* Bottom fog fade into white content below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to top, #f5f5f5, transparent)" }}
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
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-6">
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

/* ─── Feature Bento Grid ─── */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-gray-50">
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
        <div className="grid md:grid-cols-3 gap-5">
          {/* Large card — spans 2 cols */}
          <motion.div
            {...animateIn}
            className="md:col-span-2 p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Settlement.</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Get paid instantly. No more waiting 2–7 days for funds to clear. Settlement happens in real-time, directly to your account.
            </p>
            {/* Visual: flow diagram */}
            <div className="flex items-center justify-center gap-3 py-6">
              {["Payment", "Verification", "Settlement"].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm font-medium text-gray-700">{step}</div>
                  {i < 2 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Small card */}
          <motion.div
            {...animateIn}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Transparency.</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Track payments, customers and onchain transactions.
            </p>
            <div className="space-y-3">
              {[
                { label: "USD Deposit", status: "Processing", color: "text-gray-500" },
                { label: "EUR Account", status: "Ready", color: "text-green-600" },
                { label: "KYC Submitted", status: "In Review", color: "text-amber-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                  <span className={`text-xs font-medium ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bottom row — 2 equal */}
          <motion.div
            {...animateIn}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
            className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Roar Score Credit.</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              A 300–900 credit score built automatically from your business activity. No paperwork required.
            </p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-gray-900">742</div>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full w-3/4" style={{ background: "linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)" }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            {...animateIn}
            transition={{ duration: 0.5, ease, delay: 0.2 }}
            className="md:col-span-2 p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Settlement in Multiple Currencies.</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Receive settlement across 15+ countries with competitive FX and same-day liquidity.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              {["USD", "EUR", "GBP", "AED", "INR"].map((c) => (
                <div key={c} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-700">{c}</div>
              ))}
            </div>
          </motion.div>
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
                background: "linear-gradient(135deg, #374151 0%, #111827 50%, #374151 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const Icon = industries[active].icon;
                    return <Icon className="w-8 h-8 text-white/60" />;
                  })()}
                </div>
                <p className="text-white/40 text-sm font-medium">{industries[active].title}</p>
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
                    borderBottom: "1px solid #f3f4f6",
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
    <section id="how-it-works" className="py-24 sm:py-32 bg-gray-50" data-testid="section-how-it-works">
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
              <span className="text-5xl font-black text-gray-100 absolute top-4 right-4 select-none">{s.num}</span>
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-5">
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
