import { useLocation, Link } from "wouter";
import { Home, Send, Plus, Clock, CreditCard, User } from "lucide-react";

const ORANGE = "#FF4D00";

const navItems = [
  { title: "Home", path: "/dashboard", icon: Home },
  { title: "Send", path: "/dashboard/send", icon: Send },
  { title: "Add", path: "/dashboard/add-money", icon: Plus },
  { title: "Activity", path: "/dashboard/activity", icon: Clock },
  { title: "Cards", path: "/dashboard/cards", icon: CreditCard },
  { title: "Profile", path: "/dashboard/profile", icon: User },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "hsl(var(--background) / 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "inset 0 1px 0 hsl(var(--border) / 0.5), 0 -4px 20px rgba(0,0,0,0.08)",
      }}
      data-testid="mobile-nav"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.title}
              href={item.path}
              data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-md transition-all duration-200"
              style={{
                color: isActive ? ORANGE : "hsl(var(--muted-foreground))",
              }}
            >
              <item.icon
                className="w-5 h-5 transition-transform duration-200"
                style={{
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  filter: isActive ? `drop-shadow(0 0 6px rgba(255,77,0,0.3))` : "none",
                }}
              />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
