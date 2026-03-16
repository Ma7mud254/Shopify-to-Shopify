"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftRight,
  CreditCard,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  Store,
  FileBarChart,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/app/actions/auth";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stores", label: "Connected Stores", icon: Store },
  { type: "separator" as const },
  { href: "/migrations/new", label: "New Migration", icon: Plus },
  { href: "/migrations", label: "Migration History", icon: History },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { type: "separator" as const },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNavigation({ user }: { user: any }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Nav Links */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item, i) => {
            if ("type" in item && item.type === "separator") {
              return <Separator key={`sep-${i}`} className="my-3 bg-sidebar-border" />;
            }
            if (!("href" in item)) return null;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {item.href === "/migrations/new" && (
                    <ArrowLeftRight className="ml-auto h-3.5 w-3.5 opacity-40" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="border-t border-sidebar-border p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {user && (
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            {user.image ? (
              <img src={user.image} alt="Avatar" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary uppercase">
                {user.email?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name || user.email?.split("@")[0] || "User"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
