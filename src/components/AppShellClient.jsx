"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { cn } from "@/lib/utils";
import { Bell, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useWebSocketSubscription } from "@/lib/hooks/useWebSocketSubscription";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
const PUBLIC_ROUTES = ["/login", "/guide"];

const ROUTE_TITLES = {
  "/dashboard": "Dashboard",
  "/purchase-requests": "Purchase Requests",
  "/inbound": "Inbound",
  "/outbound": "Outbound",
  "/putaway": "Putaway",
  "/inventory": "Inventory",
  "/orders": "Orders",
  "/picking": "Picking",
  "/trolleys": "Trolleys",
  "/packing": "Packing",
  "/shipping": "Shipping",
  "/reports": "Reports",
  "/labels": "Labels",
  "/users": "Users",
  "/roles": "Roles",
  "/roles/access": "Role Access",
  "/settings": "Settings",
  "/master/warehouses": "Warehouse Master",
  "/master/zones": "Zone Master",
  "/master/aisles": "Aisle Master",
  "/master/racks": "Rack Master",
  "/master/bins": "Bin Master",
  "/returns": "Returns / RMA",
};

export default function AppShellClient({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const [isAuthorized, setIsAuthorized] = useState(isPublicRoute);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      setIsNavigating(false);
      previousPathname.current = pathname;
    }
  }, [pathname]);
  useEffect(() => {
    const handleNavigationClick = (event) => {
      // Ignore modified clicks
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target.closest("a");

      if (!link) return;
      if (link.hasAttribute("download")) {
        return;
      }
      const href = link.getAttribute("href");

      if (!href) return;
      if (href.startsWith("blob:") || href.startsWith("data:")) {
        return;
      }
      // Ignore external links
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("#")
      ) {
        return;
      }

      // Don't show loader for current page
      if (href === pathname) return;

      setIsNavigating(true);
    };

    document.addEventListener("click", handleNavigationClick);

    return () => {
      document.removeEventListener("click", handleNavigationClick);
    };
  }, [pathname]);

  useEffect(() => {
    if (!showNotifications) return;
    const onPointerDown = (event) => {
      if (notificationsRef.current?.contains?.(event.target)) return;
      setShowNotifications(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showNotifications]);

  const { data: kpis } = useQuery({
    queryKey: ["dashboardKpis-header"],
    queryFn: () => api.get("/dashboard/kpis").then((r) => r.data),
    retry: false,
    // refetchInterval: 20000,
    // staleTime: 30000,
    // gcTime: 300000,
    refetchOnWindowFocus: false,
    enabled: isAuthorized && !isPublicRoute,
  });

  const pendingPicks = kpis?.pendingPicks ?? 0;
  const openOrders = kpis?.openOrders ?? 0;
  const binUtilization = Number(kpis?.binUtilizationPct ?? 0);
  const notifItems = [
    pendingPicks > 0 && {
      key: "picks",
      tone: "amber",
      title: "Picking queue",
      detail: `${pendingPicks} task${pendingPicks !== 1 ? "s" : ""} waiting`,
      href: "/picking",
    },
    openOrders > 0 && {
      key: "orders",
      tone: "blue",
      title: "Open orders",
      detail: `${openOrders} order${openOrders !== 1 ? "s" : ""} need attention`,
      href: "/orders",
    },
    binUtilization > 85 && {
      key: "bins",
      tone: "rose",
      title: "Bin utilization",
      detail: `${binUtilization.toFixed(1)}% usage across storage`,
      href: "/dashboard",
    },
  ].filter(Boolean);
  const notifCount = notifItems.length;

  const { connected } = useWebSocketSubscription("/topic/alerts", (msg) => {
    console.log("WS Global Alert:", msg);
    try {
      const alertData = typeof msg === "string" ? JSON.parse(msg) : msg;
      toast(alertData.message || "System alert received", {
        description: alertData.type || "CRITICAL",
        icon: "⚠️",
      });
    } catch (e) {
      toast(String(msg));
    }
  });

  const shellTitle = useMemo(() => {
    if (!pathname) return "WMS Pro";
    const exact = ROUTE_TITLES[pathname];
    if (exact) return exact;
    const base = pathname.split("/").filter(Boolean)[0];
    if (!base) return "WMS Pro";
    return base.charAt(0).toUpperCase() + base.slice(1);
  }, [pathname]);

  useEffect(() => {
    if (isPublicRoute) {
      setIsAuthorized(true);
      return;
    }

    const token = localStorage.getItem("wms_token");
    if (!token) {
      setIsAuthorized(false);
      router.replace("/login");
      return;
    }

    setIsAuthorized(true);

    // Dynamic database roles & permissions synchronization
    api
      .get("/auth/me")
      .then((res) => {
        const { username, role, permissions } = res.data;
        const currentPerms = localStorage.getItem("wms_permissions");
        const nextPerms = JSON.stringify(permissions ?? []);
        if (currentPerms !== nextPerms) {
          localStorage.setItem("wms_username", username);
          localStorage.setItem("wms_role", role);
          localStorage.setItem("wms_permissions", nextPerms);
          // Refresh the window to cleanly apply new route gates/sidebar items
          window.location.reload();
        }
      })
      .catch((err) => {
        console.error("Failed to sync session with database:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("wms_token");
          localStorage.removeItem("wms_username");
          localStorage.removeItem("wms_role");
          localStorage.removeItem("wms_permissions");
          router.replace("/login");
        }
      });
  }, [isPublicRoute, router, pathname]);

  if (isPublicRoute) return <>{children}</>;

  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-3 shadow-xl">
            <Loader2 className="size-5 animate-spin text-primary" />

            <div>
              <p className="text-sm font-semibold text-foreground">
                Loading...
              </p>
              <p className="text-[11px] text-muted-foreground">Please wait</p>
            </div>
          </div>
        </div>
      )}
      <CommandPalette onNavigate={(href) => router.push(href)} />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header
          className={cn(
            "!sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75",
          )}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Warehouse software
              </p>
              <h1 className="truncate text-sm font-semibold text-foreground">
                {shellTitle}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground shadow-sm uppercase tracking-wider">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    connected ? "bg-emerald-500" : "bg-slate-400 animate-pulse",
                  )}
                />
                <span>{connected ? "Connected" : "Offline"}</span>
              </div>
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((value) => !value)}
                  className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm hover:bg-muted/40 transition-colors"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <div className="relative">
                    <Bell className="size-3.5 text-primary" />
                    {notifCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold leading-none text-white shadow-xs">
                        {notifCount}
                      </span>
                    )}
                  </div>
                  <span>Live notifications</span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Operational alerts from live KPIs
                      </p>
                    </div>
                    <div className="max-h-80 overflow-auto p-2">
                      {notifItems.length ? (
                        notifItems.map((item) => (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                          >
                            <span
                              className={cn(
                                "mt-1 size-2.5 shrink-0 rounded-full",
                                item.tone === "amber" && "bg-amber-500",
                                item.tone === "blue" && "bg-sky-500",
                                item.tone === "rose" && "bg-rose-500",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>
                              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                {item.detail}
                              </p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No notifications right now.
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border bg-muted/40 px-4 py-3 text-center text-[10px] text-muted-foreground">
                      Syncs with dashboard KPIs every 20 seconds.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-screen px-4 pt-3 pb-5 sm:px-6 sm:pt-3 sm:pb-6 md:px-8 md:pt-3 md:pb-7">
          {children}
        </div>
      </main>
    </div>
  );
}
