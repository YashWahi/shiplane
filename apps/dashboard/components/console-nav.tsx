"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Rocket,
  Plus,
  LayoutGrid,
  Database,
  Settings,
  BookOpen,
  Layers,
  Terminal,
  Activity,
  GitBranch,
  Gauge,
  LogOut,
  User,
  Menu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

interface ConsoleNavProps {
  children?: React.ReactNode;
}

export function ConsoleNav({ children }: ConsoleNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Extract selected appId if URL is /apps/[id]...
  const appMatch = pathname.match(/^\/apps\/([^/]+)/);
  const selectedAppId = appMatch && appMatch[1] !== "new" ? appMatch[1] : null;

  const mainNavItems = [
    { label: "Apps", href: "/apps", icon: LayoutGrid },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Pricing", href: "/pricing", icon: Gauge },
    { label: "Docs", href: "/agent.md", icon: BookOpen, external: true },
  ];

  const appSubNavItems = selectedAppId
    ? [
        { label: "Overview", href: `/apps/${selectedAppId}`, icon: Activity, exact: true },
        { label: "Deployments", href: `/apps/${selectedAppId}/deployments`, icon: Layers },
        { label: "Databases", href: `/apps/${selectedAppId}/databases`, icon: Database },
        { label: "Previews", href: `/apps/${selectedAppId}/previews`, icon: GitBranch },
        { label: "Scaling", href: `/apps/${selectedAppId}/scaling`, icon: Gauge },
        { label: "Logs", href: `/apps/${selectedAppId}/logs`, icon: Terminal },
        { label: "Settings", href: `/apps/${selectedAppId}/settings`, icon: Settings },
      ]
    : [];

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-5">
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-4">
          <Link
            href="/apps"
            className="flex items-center gap-2.5 font-semibold text-lg tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>ShipLane</span>
          </Link>
          <ThemeToggle className="h-9 w-9 rounded-lg text-muted-foreground" />
        </div>

        {/* New App Button */}
        <div className="px-4">
          <Button asChild className="h-10 w-full justify-start gap-2 rounded-lg shadow-sm" size="sm">
            <Link href="/apps/new" onClick={() => setMobileOpen(false)}>
              <Plus className="h-4 w-4" />
              <span>New App</span>
            </Link>
          </Button>
        </div>

        <Separator className="mx-4 my-2" />

        {/* Global Nav Links */}
        <div className="space-y-1 px-2">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = !item.external && (
              item.href === "/apps"
                ? pathname === "/apps" || pathname === "/apps/new"
                : isLinkActive(item.href)
            );

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border border-primary/15 bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* App Context Sub-Menu */}
        {selectedAppId && (
          <div className="space-y-1 px-2 pt-2">
            <Separator className="my-2" />
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              App Context
            </div>
            {appSubNavItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href, item.exact);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border border-primary/15 bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Profile / Account */}
      <div className="space-y-2 px-3 pt-4">
        <Separator className="my-2" />
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/80 p-2.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate text-xs">
              <p className="font-medium truncate">Developer</p>
              <p className="text-muted-foreground truncate">Free Tier</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-background/75 backdrop-blur-xl md:block">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-border/80 bg-background/85 px-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                {navContent}
              </SheetContent>
            </Sheet>
            <Link href="/apps" className="flex items-center gap-2 font-bold">
              <Rocket className="h-4 w-4 text-primary" />
              <span>ShipLane</span>
            </Link>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/apps/new">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Link>
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

