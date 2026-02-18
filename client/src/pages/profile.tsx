import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COUNTRIES, getRoarTier } from "@shared/schema";
import { User, Mail, Phone, Globe, Shield, Bell, Moon, LogOut, ChevronRight } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const country = COUNTRIES.find((c) => c.code === user.country);
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tier = getRoarTier(user.roarScore);

  const profileItems = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "Not set" },
    { icon: Globe, label: "Country", value: country?.name || user.country },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Card className="overflow-visible">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate" data-testid="text-profile-name">{user.fullName}</h2>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: tier.color, color: tier.color }}
                  >
                    {tier.name} ({user.roarScore})
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <h3 className="text-sm font-semibold mb-3">Account Information</h3>
        <Card className="overflow-visible">
          <CardContent className="p-2">
            {profileItems.map((item, i) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-md">
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <h3 className="text-sm font-semibold mb-3">Verification</h3>
        <Card className="overflow-visible">
          <CardContent className="p-2">
            <div className="flex items-center gap-3 p-3 rounded-md hover-elevate">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">KYC Verification</p>
                <p className="text-xs text-muted-foreground">Identity verification status</p>
              </div>
              <Badge
                variant={user.kycStatus === "verified" ? "default" : "secondary"}
                className="text-xs capitalize"
                data-testid="badge-kyc-status"
              >
                {user.kycStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <h3 className="text-sm font-semibold mb-3">Preferences</h3>
        <Card className="overflow-visible">
          <CardContent className="p-2">
            <div className="flex items-center gap-3 p-3 rounded-md">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                <Moon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Dark Mode</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode"
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Notifications</p>
              </div>
              <Switch defaultChecked data-testid="switch-notifications" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Button
          variant="destructive"
          className="w-full"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  );
}
