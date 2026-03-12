import { useLocation, Link } from "wouter";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { Home, Send, Plus, Clock, CreditCard, User } from "lucide-react";
import logoImg from "@assets/tigerbnklogo.png";

const navItems = [
  { title: "Home", path: "/dashboard", icon: Home },
  { title: "Add Money", path: "/dashboard/add-money", icon: Plus },
  { title: "Send", path: "/dashboard/send", icon: Send },
  { title: "Activity", path: "/dashboard/activity", icon: Clock },
  { title: "Cards", path: "/dashboard/cards", icon: CreditCard },
  { title: "Profile", path: "/dashboard/profile", icon: User },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="TigerBnk" className="w-9 h-9 rounded-md" data-testid="img-sidebar-logo" />
          <div>
            <p className="text-sm font-semibold">TigerBnk</p>
            <p className="text-[10px] text-muted-foreground">Digital Wallet</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                    >
                      <Link href={item.path} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.fullName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
