import { useLocation, Link } from "wouter";
import { Home, Send, Plus, Clock, User } from "lucide-react";

const navItems = [
  { title: "Home", path: "/", icon: Home },
  { title: "Send", path: "/send", icon: Send },
  { title: "Add", path: "/add-money", icon: Plus },
  { title: "Activity", path: "/activity", icon: Clock },
  { title: "Profile", path: "/profile", icon: User },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden" data-testid="mobile-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.title}
              href={item.path}
              data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-md transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
