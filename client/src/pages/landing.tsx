import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEarlyAccessSchema } from "@shared/schema";
import { ArrowRight, Clock, Globe, Lock, CreditCard, TrendingUp, Repeat, DollarSign, CheckCircle2, ChevronRight, Zap, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import logoImg from "@assets/tgbnk_1771913028352.png";
import heroImg from "@assets/hero1_1771913028351.png";

const ORANGE = "#FF4D00";
const BG = "#0B0B0B";

const earlyAccessFormSchema = insertEarlyAccessSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  country: z.string().min(2, "Country is required"),
  monthlyVolume: z.string().min(1, "Monthly volume is required"),
});

type EarlyAccessForm = z.infer<typeof earlyAccessFormSchema>;

function useAnimateInView(threshold = 0.2) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return { ref, isInView };
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const landingInputClass = "!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 focus:!border-[#FF4D00]/50 !rounded-xl";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0B0B]/80 border-b border-white/5" data-testid="nav-landing">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" data-testid="text-logo">
          <img src={logoImg} alt="TigerBnk" className="w-8 h-8 rounded-lg" />
          <span className="text-white font-bold text-xl tracking-tight">TigerBnk</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="!text-white/70 hidden sm:inline-flex" data-testid="link-nav-signin">
            <Link href="/auth?mode=login">Sign In</Link>
          </Button>
          <Button asChild className="rounded-full" style={{ background: ORANGE, color: "white" }} data-testid="link-nav-signup">
            <Link href="/auth?mode=register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const { ref, isInView } = useAnimateInView();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden pt-20" data-testid="section-hero">
      <div className="absolute inset-0">
        <div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${ORANGE}40 0%, transparent 70%)` }}
        />
      </div>

      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center"
      >
        <div>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8" data-testid="text-badge">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ORANGE }} />
            <span className="text-white/60 text-sm">Now accepting early access applications</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6" data-testid="text-hero-headline">
            Financial OS for{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${ORANGE}, #FF8C00)` }}>
              Global Merchants
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-lg mb-10 leading-relaxed" data-testid="text-hero-subheadline">
            Turn payment flow into instant settlement, portable credit, and programmable capital.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start gap-4 mb-12">
            <Button asChild size="lg" className="rounded-full text-base font-semibold" style={{ background: ORANGE, color: "white" }} data-testid="link-hero-cta">
              <Link href="/auth?mode=register" className="inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full text-base font-semibold !text-white/70 !border-white/10 !bg-transparent" data-testid="link-hero-secondary">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-8 sm:gap-12">
            {[
              { value: "800+", label: "Merchants" },
              { value: "$20M+", label: "Processed" },
              { value: "$1.5M", label: "Deployed" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white" data-testid={`text-stat-${stat.label.toLowerCase()}`}>{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-[60px] opacity-30" style={{ background: `radial-gradient(circle, ${ORANGE}50 0%, transparent 70%)` }} />
            <img
              src={heroImg}
              alt="TigerBnk"
              className="relative w-full max-w-[280px] sm:max-w-sm lg:max-w-lg rounded-2xl"
              data-testid="img-hero"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ProblemSection() {
  const { ref, isInView } = useAnimateInView();

  const problems = [
    { icon: Clock, title: "2–7 Day Settlement Delays", desc: "Revenue sits in limbo while your business needs it now." },
    { icon: Globe, title: "No Portable Credit Across Borders", desc: "Your track record doesn't travel with you." },
    { icon: Lock, title: "Working Capital Locked in Transit", desc: "Funds trapped in payment pipelines, unavailable when needed." },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32" data-testid="section-problem">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-6xl mx-auto px-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: ORANGE }} data-testid="text-problem-label">The Problem</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4" data-testid="text-problem-headline">
            Global Commerce.{" "}
            <span className="text-white/30">Broken Finance.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="group relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300"
              data-testid={`card-problem-${i}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: `${ORANGE}15` }}>
                <p.icon className="w-6 h-6" style={{ color: ORANGE }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3" data-testid={`text-problem-title-${i}`}>{p.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed" data-testid={`text-problem-desc-${i}`}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function SolutionSection() {
  const { ref, isInView } = useAnimateInView();

  const steps = [
    { label: "Customer Pays", icon: CreditCard },
    { label: "Instant Settlement", icon: Zap },
    { label: "Roar Score", icon: BarChart3 },
    { label: "Credit Access", icon: DollarSign },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32" data-testid="section-solution">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-6xl mx-auto px-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-20">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: ORANGE }} data-testid="text-solution-label">The Solution</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4" data-testid="text-solution-headline">
            From Payments to{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${ORANGE}, #FF8C00)` }}>
              Capital
            </span>
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeUp} className="flex items-center gap-4" data-testid={`card-solution-step-${i}`}>
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border border-white/10"
                  style={{ background: i === steps.length - 1 ? ORANGE : "rgba(255,255,255,0.03)" }}
                >
                  <step.icon className="w-7 h-7" style={{ color: i === steps.length - 1 ? "#fff" : ORANGE }} />
                </div>
                <span className="text-sm font-medium text-white/70 w-24" data-testid={`text-solution-step-${i}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-white/20 hidden md:block mb-6" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function RoarScoreSection() {
  const { ref, isInView } = useAnimateInView();
  const [score, setScore] = useState(0);
  const targetScore = 742;

  useEffect(() => {
    if (isInView) {
      const start = 300;
      const duration = 2000;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setScore(Math.round(start + (targetScore - start) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isInView]);

  const factors = [
    "Transaction history",
    "Volume consistency",
    "Repayment behavior",
    "Wallet balance",
  ];

  const scorePercent = ((score - 300) / 600) * 100;

  return (
    <section ref={ref} className="py-24 sm:py-32" data-testid="section-roar-score">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-6xl mx-auto px-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: ORANGE }} data-testid="text-roar-label">Credit Identity</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4" data-testid="text-roar-headline">
            Roar Score
          </h2>
          <p className="text-white/40 text-lg mt-4 max-w-xl mx-auto" data-testid="text-roar-subtitle">Your Global Business Credit Identity</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp} className="relative">
            <div className="relative p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
              <div className="text-center mb-8">
                <div className="text-6xl sm:text-7xl font-bold text-white tabular-nums" data-testid="text-roar-score">{score}</div>
                <div className="text-sm text-white/40 mt-2" data-testid="text-roar-range">out of 900</div>
              </div>

              <div className="relative h-3 rounded-full bg-white/5 overflow-hidden mb-4" data-testid="progress-roar-meter">
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)",
                    width: `${scorePercent}%`,
                  }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${scorePercent}%` } : {}}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between text-xs text-white/30">
                <span>300</span>
                <span>600</span>
                <span>900</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <p className="text-white/50 mb-8 leading-relaxed" data-testid="text-roar-description">
              A 300–900 score built automatically from your business activity. No paperwork. No credit bureaus. Just your real performance.
            </p>
            <div className="space-y-4">
              {factors.map((f, i) => (
                <div key={i} className="flex items-center gap-3" data-testid={`text-roar-factor-${i}`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ORANGE}20` }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                  </div>
                  <span className="text-white/70 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function HowItWorksSection() {
  const { ref, isInView } = useAnimateInView();

  const steps = [
    { num: "01", title: "Accept Payments", desc: "Receive payments from anywhere. Settled instantly.", icon: CreditCard },
    { num: "02", title: "Build Credit Automatically", desc: "Every transaction builds your Roar Score.", icon: TrendingUp },
    { num: "03", title: "Unlock Working Capital", desc: "Access credit based on your real business performance.", icon: DollarSign },
    { num: "04", title: "Repay From Revenue", desc: "Flexible repayment directly from your payment flow.", icon: Repeat },
  ];

  return (
    <section ref={ref} id="how-it-works" className="py-24 sm:py-32" data-testid="section-how-it-works">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-6xl mx-auto px-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: ORANGE }} data-testid="text-hiw-label">How It Works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4" data-testid="text-hiw-headline">
            Four Steps to Capital
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300 group"
              data-testid={`card-step-${i}`}
            >
              <span className="text-4xl font-bold text-white/[0.04] absolute top-4 right-4">{s.num}</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${ORANGE}15` }}>
                <s.icon className="w-5 h-5" style={{ color: ORANGE }} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2" data-testid={`text-step-title-${i}`}>{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed" data-testid={`text-step-desc-${i}`}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function SocialProofSection() {
  const { ref, isInView } = useAnimateInView();

  const metrics = [
    { value: "800+", label: "Active Merchants", sub: "Across 15+ countries" },
    { value: "$20M+", label: "Volume Processed", sub: "And growing monthly" },
    { value: "2+", label: "Years Live", sub: "Battle-tested infrastructure" },
    { value: "$1.5M", label: "Capital Deployed", sub: "To qualified merchants" },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32" data-testid="section-social-proof">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-6xl mx-auto px-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: ORANGE }} data-testid="text-proof-label">Traction</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4" data-testid="text-proof-headline">
            Built for Scale. Proven in Production.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]"
              data-testid={`card-metric-${i}`}
            >
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: ORANGE }} data-testid={`text-metric-value-${i}`}>{m.value}</div>
              <div className="text-white font-medium mb-1" data-testid={`text-metric-label-${i}`}>{m.label}</div>
              <div className="text-white/30 text-sm" data-testid={`text-metric-sub-${i}`}>{m.sub}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function CTASection() {
  const { ref, isInView } = useAnimateInView();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<EarlyAccessForm>({
    resolver: zodResolver(earlyAccessFormSchema),
    defaultValues: { name: "", email: "", country: "", monthlyVolume: "" },
  });

  const onSubmit = async (data: EarlyAccessForm) => {
    setServerError("");
    try {
      await apiRequest("POST", "/api/early-access", data);
      setSubmitted(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <section ref={ref} id="early-access" className="py-24 sm:py-32" data-testid="section-cta">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
        className="max-w-3xl mx-auto px-6"
      >
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" data-testid="text-cta-headline">
            Turn Revenue Into{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${ORANGE}, #FF8C00)` }}>
              Capital
            </span>
          </h2>
          <p className="text-white/40 mt-4" data-testid="text-cta-subtitle">Join 800+ merchants already building their financial future.</p>
        </motion.div>

        {submitted ? (
          <motion.div
            variants={fadeUp}
            className="text-center p-12 rounded-3xl border border-white/10 bg-white/[0.02]"
            data-testid="card-success"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${ORANGE}20` }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: ORANGE }} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2" data-testid="text-success-title">You're on the list!</h3>
            <p className="text-white/40" data-testid="text-success-desc">We'll reach out soon with your early access details.</p>
          </motion.div>
        ) : (
          <Form {...form}>
            <motion.form
              variants={fadeUp}
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-8 sm:p-10 rounded-3xl border border-white/5 bg-white/[0.02]"
              data-testid="form-early-access"
            >
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/40">Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" className={landingInputClass} data-testid="input-name" />
                      </FormControl>
                      <FormMessage className="text-red-400" data-testid="text-error-name" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/40">Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@company.com" className={landingInputClass} data-testid="input-email" />
                      </FormControl>
                      <FormMessage className="text-red-400" data-testid="text-error-email" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/40">Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="United Arab Emirates" className={landingInputClass} data-testid="input-country" />
                      </FormControl>
                      <FormMessage className="text-red-400" data-testid="text-error-country" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthlyVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/40">Monthly Volume</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="$10,000 - $50,000" className={landingInputClass} data-testid="input-volume" />
                      </FormControl>
                      <FormMessage className="text-red-400" data-testid="text-error-volume" />
                    </FormItem>
                  )}
                />
              </div>

              {serverError && <p className="text-red-400 text-sm mb-4" data-testid="text-form-error">{serverError}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={form.formState.isSubmitting}
                className="w-full rounded-xl text-base font-semibold"
                style={{ background: ORANGE, color: "white" }}
                data-testid="button-submit-early-access"
              >
                {form.formState.isSubmitting ? "Submitting..." : "Join Early Access"}
              </Button>
            </motion.form>
          </Form>
        )}
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-8" data-testid="footer-landing">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="TigerBnk" className="w-6 h-6 rounded" />
          <span className="text-white/40 text-sm" data-testid="text-footer-copyright">TigerBnk &copy; {new Date().getFullYear()}</span>
        </div>
        <p className="text-white/20 text-xs" data-testid="text-footer-tagline">Financial infrastructure for the next generation of global commerce.</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.title = "TigerBnk — Financial OS for Global Merchants";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Turn payment flow into instant settlement, portable credit, and programmable capital. Join 800+ merchants on TigerBnk.");

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", "TigerBnk — Financial OS for Global Merchants");

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", "Turn payment flow into instant settlement, portable credit, and programmable capital.");

    return () => {
      document.title = "TigerBnk";
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <RoarScoreSection />
      <HowItWorksSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </div>
  );
}
