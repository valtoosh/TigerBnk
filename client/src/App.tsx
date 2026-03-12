import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingScreen } from "@/components/loading-screen";
import { useLocation } from "wouter";
import { Sun, Moon } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import SendMoney from "@/pages/send-money";
import Activity from "@/pages/activity";
import AddMoney from "@/pages/add-money";
import Cards from "@/pages/cards";
import Profile from "@/pages/profile";
import LandingPage from "@/pages/landing";
import MerchantComingSoon from "@/pages/merchant-coming-soon";
import CardsLandingPage from "@/pages/cards-landing";
import logoImg from "@assets/tigerbnklogo.png";

function DashboardRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/send" component={SendMoney} />
      <Route path="/dashboard/activity" component={Activity} />
      <Route path="/dashboard/add-money" component={AddMoney} />
      <Route path="/dashboard/cards" component={Cards} />
      <Route path="/dashboard/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
      data-testid="button-theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-3 border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden md:flex" data-testid="button-sidebar-toggle" />
              <div className="md:hidden flex items-center gap-2">
                <img src={logoImg} alt="TigerBnk" className="w-6 h-6 rounded" />
                <p className="text-sm font-semibold">TigerBnk</p>
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-6 md:p-6">
              <DashboardRouter />
            </div>
          </main>
        </div>
      </div>
      <MobileNav />
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (location === "/" || location === "/landing") {
    return <LandingPage />;
  }

  if (location === "/cards") {
    return <CardsLandingPage />;
  }

  if (location === "/auth" || location.startsWith("/auth?")) {
    return <AuthPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <img src={logoImg} alt="TigerBnk" className="w-14 h-14 rounded-xl mx-auto" />
          <Skeleton className="w-32 h-5 mx-auto" />
          <Skeleton className="w-24 h-3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === "merchant") {
    return <MerchantComingSoon />;
  }

  if (location.startsWith("/dashboard")) {
    return <AuthenticatedLayout />;
  }

  if (location === "/merchant") {
    return <MerchantComingSoon />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
            {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
