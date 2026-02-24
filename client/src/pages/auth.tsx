import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES, loginSchema, registerSchema } from "@shared/schema";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Building2, User } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import logoImg from "@assets/Group_95_1771930128528.png";

const ORANGE = "#FF4D00";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function AuthPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialMode = params.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [accountType, setAccountType] = useState<"individual" | "merchant" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (params.get("mode") === "register") setMode("register");
    else if (params.get("mode") === "login") setMode("login");
  }, [search]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", country: "AE", accountType: "individual" },
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      await registerUser({ ...data, accountType: accountType || "individual" });
      if (accountType === "merchant") {
        navigate("/merchant");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Could not create account", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <img src={logoImg} alt="TigerBnk" className="w-14 h-14 rounded-xl" data-testid="img-auth-logo" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-app-title">TigerBnk</h1>
          <p className="text-sm text-muted-foreground mt-1">Your premium digital wallet</p>
        </motion.div>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex gap-1 mb-6 p-1 bg-muted rounded-md">
              <button
                onClick={() => { setMode("login"); setAccountType(null); }}
                data-testid="button-switch-login"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("register"); setAccountType(null); }}
                data-testid="button-switch-register"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div key="login" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="you@example.com" data-testid="input-login-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input {...field} type={showPassword ? "text" : "password"} placeholder="Enter your password" data-testid="input-login-password" />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting} style={{ background: ORANGE, color: "white" }} data-testid="button-login">
                        {isSubmitting ? "Signing in..." : "Sign In"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              ) : accountType === null ? (
                <motion.div key="account-type" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <p className="text-sm text-muted-foreground text-center mb-6">Choose your account type</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setAccountType("individual")}
                      className="p-6 rounded-xl border border-border bg-card text-center transition-all hover:border-[#FF4D00]/50"
                      data-testid="button-type-individual"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${ORANGE}15` }}>
                        <User className="w-6 h-6" style={{ color: ORANGE }} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Individual</h3>
                      <p className="text-xs text-muted-foreground mt-1">Personal wallet & transfers</p>
                    </button>
                    <button
                      onClick={() => setAccountType("merchant")}
                      className="p-6 rounded-xl border border-border bg-card text-center transition-all hover:border-[#FF4D00]/50"
                      data-testid="button-type-merchant"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${ORANGE}15` }}>
                        <Building2 className="w-6 h-6" style={{ color: ORANGE }} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Merchant</h3>
                      <p className="text-xs text-muted-foreground mt-1">Accept payments & capital</p>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="register" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setAccountType(null)} className="text-muted-foreground" data-testid="button-back-type">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {accountType === "merchant" ? "Merchant" : "Individual"} Account
                    </span>
                  </div>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={accountType === "merchant" ? "Business Name" : "John Doe"} data-testid="input-register-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="you@example.com" data-testid="input-register-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+971 50 123 4567" data-testid="input-register-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-register-country">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((c) => (
                                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input {...field} type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" data-testid="input-register-password" />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting} style={{ background: ORANGE, color: "white" }} data-testid="button-register">
                        {isSubmitting ? "Creating account..." : "Create Account"}
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
