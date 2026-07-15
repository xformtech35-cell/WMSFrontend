"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { P } from "@/lib/permissions";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Truck,
  Warehouse,
  ShoppingCart,
  ScanLine,
  Boxes,
  Ship,
  Database,
  Settings,
  Moon,
  Sun,
  BarChart3,
  Tag,
  PackageCheck,
  LogOut,
  Users,
  ShieldCheck,
  Search,
  X,
  Star,
  Activity,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ClipboardList,
  RotateCcw,
} from "lucide-react";

const SIDEBAR_MIN = 60;
const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_DEFAULT = 260;
const SIDEBAR_MAX = 380;
const LS_KEY = "wms-sidebar-width";
const LS_EXPANDED_KEY = "wms-sidebar-expanded-groups";
const LS_FAVORITES_KEY = "wms-sidebar-favorites";

const ALL_MENU_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Overview",
    permission: P.DASHBOARD_VIEW,
  },
  {
    href: "/purchase-requests",
    label: "Purchase Requests",
    icon: ClipboardList,
    group: "Purchase",
    permission: P.PURCHASE_VIEW,
  },
  {
    href: "/purchase-approval",
    label: "Purchase Approval",
    icon: ClipboardList,
    group: "Purchase",
    permission: P.PURCHASE_VIEW,
  },
  {
    href: "/rfqs",
    label: "RFQS",
    icon: ClipboardList,
    group: "Purchase",
    permission: P.PURCHASE_VIEW,
  },
  {
    href: "/inbound",
    label: "Inbound",
    icon: Package,
    group: "Operations",
    permission: P.INBOUND_VIEW,
  },
  {
    href: "/putaway",
    label: "Putaway",
    icon: Warehouse,
    group: "Operations",
    permission: P.PUTAWAY_VIEW,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Boxes,
    group: "Operations",
    permission: P.INVENTORY_VIEW,
  },
  {
    href: "/outbound",
    label: "Outbound",
    icon: ArrowUpRight,
    group: "Operations",
    permission: P.ORDERS_VIEW,
  },
  {
    href: "/returns",
    label: "Returns / RMA",
    icon: RotateCcw,
    group: "Operations",
    permission: P.INVENTORY_VIEW,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ShoppingCart,
    group: "Fulfillment",
    permission: P.ORDERS_VIEW,
  },
  {
    href: "/picking",
    label: "Picking",
    icon: ScanLine,
    group: "Fulfillment",
    permission: P.PICKING_VIEW,
    liveKey: "pendingPicks",
  },
  {
    href: "/trolleys",
    label: "Trolleys",
    icon: Truck,
    group: "Fulfillment",
    permission: P.TROLLEYS_VIEW,
  },
  {
    href: "/packing",
    label: "Packing",
    icon: PackageCheck,
    group: "Fulfillment",
    permission: P.PACKING_VIEW,
  },
  {
    href: "/shipping",
    label: "Shipping",
    icon: Ship,
    group: "Fulfillment",
    permission: P.SHIPPING_VIEW,
  },
  {
    href: "/master/warehouses",
    label: "Warehouse Master",
    icon: Database,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/zones",
    label: "Zone Master",
    icon: Database,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/aisles",
    label: "Aisle Master",
    icon: Database,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/racks",
    label: "Rack Master",
    icon: Database,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/bins",
    label: "Bin Master",
    icon: Database,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/suppliers",
    label: "Suppliers",
    icon: Users,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/allotments",
    label: "Rack Allotments",
    icon: Warehouse,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/master/items",
    label: "Items",
    icon: Warehouse,
    group: "Admin",
    permission: P.MASTER_VIEW,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    group: "Admin",
    permission: P.REPORTS_VIEW,
  },
  {
    href: "/labels",
    label: "Labels",
    icon: Tag,
    group: "Admin",
    permission: P.LABELS_VIEW,
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    group: "Admin",
    permission: P.USERS_VIEW,
  },
  {
    href: "/roles",
    label: "Roles",
    icon: ShieldCheck,
    group: "Admin",
    permission: P.USERS_MANAGE,
  },
  {
    href: "/roles/access",
    label: "Role Access",
    icon: ShieldCheck,
    group: "Admin",
    permission: P.USERS_MANAGE,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    group: "Admin",
    permission: null,
  },
];

/* ── Enhanced NavItem with favorites and better styling ── */
const NavItem = memo(function NavItem({
  item,
  isCollapsed,
  liveValue,
  isFavorite,
  onToggleFavorite,
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const [showFavStar, setShowFavStar] = useState(false);

  const content = (
    <Link
      href={item.href}
      onMouseEnter={() => !isCollapsed && setShowFavStar(true)}
      onMouseLeave={() => !isCollapsed && setShowFavStar(false)}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.78rem] font-medium transition-all duration-150 ease-out",
        active
          ? "bg-linear-to-r from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-primary shadow-sm before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-linear-to-b before:from-sidebar-primary before:to-sidebar-primary/70"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        isCollapsed && "justify-center px-2",
        "relative overflow-hidden",
      )}
    >
      {/* Background shine effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-linear-to-r from-transparent via-white/5 to-transparent pointer-events-none",
        )}
      />

      <item.icon
        className={cn(
          "size-4 shrink-0 transition-all duration-200",
          active ? "opacity-100" : "opacity-75 group-hover:opacity-100",
        )}
      />

      {!isCollapsed && (
        <>
          <span className="truncate flex-1 relative z-10">{item.label}</span>

          {/* Favorites star */}
          {showFavStar && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(item.href);
              }}
              className="p-0.5 text-sidebar-foreground/40 hover:text-yellow-500 transition-colors"
            >
              <Star
                className={cn(
                  "size-3.5",
                  isFavorite && "fill-yellow-500 text-yellow-500",
                )}
              />
            </button>
          )}

          {/* Count badge */}
          {!showFavStar && liveValue > 0 && (
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-linear-to-br from-sidebar-primary to-sidebar-primary/80 px-2 py-0.5 text-[10px] font-bold text-sidebar-primary-foreground shadow-sm leading-none">
              {liveValue > 99 ? "99+" : liveValue}
            </span>
          )}
        </>
      )}

      {/* Collapsed mode dot */}
      {isCollapsed && liveValue > 0 && (
        <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-linear-to-br from-sidebar-primary to-sidebar-primary/70 animate-pulse shadow-lg" />
      )}
    </Link>
  );

  if (!isCollapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        <div className="flex flex-col gap-1">
          <span>{item.label}</span>
          {liveValue > 0 && (
            <span className="text-[10px] text-sidebar-foreground/60">
              {liveValue} pending
            </span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

/* ── Section Header with stats and collapse toggle ── */
const SectionHeader = memo(function SectionHeader({
  label,
  icon: Icon,
  isExpanded,
  onToggle,
  isCollapsed,
  itemCount,
  stats,
}) {
  if (isCollapsed)
    return <div className="mx-3 my-1.5 h-px bg-sidebar-border/40" />;

  return (
    <div className="px-2.5 mb-1.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-200",
          "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
          isExpanded && "text-sidebar-foreground",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="size-3 shrink-0 opacity-75" />}
          <div className="flex flex-col gap-0 min-w-0 text-left">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em]">
              {label}
            </span>
            {stats && (
              <span className="text-[9px] text-sidebar-foreground/40 mt-0.5">
                {stats}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 transition-transform duration-300",
            isExpanded ? "rotate-180" : "",
          )}
        />
      </button>
    </div>
  );
});

/* ── Main Sidebar Component ── */
const Sidebar = () => {
  const [width, setWidth] = useState(SIDEBAR_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [favorites, setFavorites] = useState([]);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const { can, username, role, loaded } = usePermissions();

  const isCollapsed = width <= SIDEBAR_COLLAPSED + 10;

  // Filter menu items by permission
  const allMenuItems = useMemo(() => {
    if (!loaded) return [];
    return ALL_MENU_ITEMS.filter(
      (item) => item.permission === null || can(item.permission),
    );
  }, [loaded, can]);

  // Group menu items
  const groups = [...new Set(allMenuItems.map((i) => i.group))];
  const groupedItems = useMemo(() => {
    return Object.fromEntries(
      groups.map((group) => [
        group,
        allMenuItems.filter((item) => item.group === group),
      ]),
    );
  }, [allMenuItems, groups]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return groupedItems;

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(groupedItems).forEach(([group, items]) => {
      const matches = items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.href.toLowerCase().includes(query),
      );
      if (matches.length > 0) {
        filtered[group] = matches;
      }
    });

    return filtered;
  }, [groupedItems, searchQuery]);

  /* Live KPIs */
  const { data: kpis } = useQuery({
    queryKey: ["dashboardKpis-sidebar"],
    queryFn: () => api.get("/dashboard/kpis").then((r) => r.data),
    retry: false,
    refetchInterval: 20000,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setWidth(Number(saved));

      const savedExpanded = localStorage.getItem(LS_EXPANDED_KEY);
      if (savedExpanded) setExpandedGroups(JSON.parse(savedExpanded));

      const savedFavorites = localStorage.getItem(LS_FAVORITES_KEY);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch {
      /* noop */
    }
    setMounted(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_KEY, String(width));
      localStorage.setItem(LS_EXPANDED_KEY, JSON.stringify(expandedGroups));
      localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* noop */
    }
  }, [width, mounted, expandedGroups, favorites]);

  /* ── Event Handlers ── */
  const onDragMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
      setIsDragging(true);
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => {
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(
        SIDEBAR_MAX,
        Math.max(SIDEBAR_MIN, dragStartWidth.current + delta),
      );
      setWidth(newWidth);
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  const toggleCollapse = () =>
    setWidth(isCollapsed ? SIDEBAR_DEFAULT : SIDEBAR_COLLAPSED);

  const toggleGroupExpand = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const toggleFavorite = (href) => {
    setFavorites((prev) =>
      prev.includes(href) ? prev.filter((f) => f !== href) : [...prev, href],
    );
  };

  useEffect(() => {
    if (!loaded || !allMenuItems.length) return;
    const prefetchTimer = window.setTimeout(() => {
      allMenuItems.forEach((item) => {
        router.prefetch(item.href);
      });
    }, 150);

    return () => window.clearTimeout(prefetchTimer);
  }, [loaded, allMenuItems, router]);

  const handleLogout = () => {
    localStorage.removeItem("wms_token");
    localStorage.removeItem("wms_username");
    localStorage.removeItem("wms_role");
    localStorage.removeItem("wms_permissions");
    router.push("/login");
  };

  // Get group stats
  const getGroupStats = (group) => {
    if (group === "Fulfillment" && pendingPicks) {
      return `${pendingPicks} pending`;
    }
    return null;
  };

  const pendingPicks = kpis?.pendingPicks ?? 0;
  const displayName = username ?? "User";
  const displayRole = role ? role.replace("_", " ") : "";

  return (
    <aside
      suppressHydrationWarning
      style={{ width }}
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar select-none overflow-hidden",
        !isDragging && "transition-[width] duration-200 ease-out",
      )}
    >
      {/* ── Header: Brand ── */}
      <div className="relative border-b border-sidebar-border bg-linear-to-r from-sidebar to-sidebar/95 px-3 py-2.5 transition-all duration-200">
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-[12px] font-extrabold text-white shadow-md shadow-blue-500/20 transition-transform duration-200 hover:scale-105">
              W
            </div>

            {!isCollapsed && (
              <div className="min-w-0 max-w-[11rem]">
                <p className="truncate text-[0.92rem] font-semibold leading-none text-sidebar-foreground">
                  WMS Pro Control Tower
                </p>
                <p className="mt-0.5 truncate text-[11px] text-sidebar-foreground/55">
                  Fast routing, live queues, shared tables
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Bar — Expanded only ── */}
      {!isCollapsed && (
        <div className="px-2.5 py-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-sidebar-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 pl-7 pr-2.5 py-1.5",
                "text-[0.78rem] text-sidebar-foreground placeholder:text-sidebar-foreground/40",
                "transition-all duration-200 focus:outline-none focus:border-sidebar-primary/60 focus:bg-sidebar-accent/80",
                "hover:border-sidebar-border/80",
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation with Collapsible Groups ── */}
      <nav className="hide-scrollbar flex-1 overflow-y-auto px-1.5 py-1.5">
        {Object.entries(filteredItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-sidebar-foreground/40">
            <AlertCircle className="size-5" />
            <p className="text-xs text-center">No results found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(filteredItems).map(([group, items]) => (
              <div key={group} className="relative">
                <SectionHeader
                  label={group}
                  isExpanded={!searchQuery && expandedGroups[group] !== false}
                  onToggle={() => toggleGroupExpand(group)}
                  isCollapsed={isCollapsed}
                  itemCount={items.length}
                  stats={getGroupStats(group)}
                />

                {(searchQuery || expandedGroups[group] !== false) && (
                  <div
                    className={cn(
                      "space-y-0.5 px-2 overflow-hidden transition-all duration-300 ease-out",
                      "animate-in fade-in slide-in-from-top-1",
                    )}
                  >
                    {items.map((item) => (
                      <div
                        key={item.href}
                        className="transition-all duration-200"
                      >
                        <NavItem
                          item={item}
                          isCollapsed={isCollapsed}
                          liveValue={item.liveKey && kpis ? pendingPicks : 0}
                          isFavorite={favorites.includes(item.href)}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Divider ── */}
      <div className="h-px bg-linear-to-r from-sidebar-border/0 via-sidebar-border/50 to-sidebar-border/0" />

      {/* ── Footer: User + Theme ── */}
      <div className="shrink-0">
        {/* User row */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 transition-all duration-200",
            isCollapsed && "justify-center px-2",
          )}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500/40 to-indigo-500/40 ring-1.5 ring-sidebar-border text-[11px] font-bold text-sidebar-primary/80 hover:ring-sidebar-primary/40 transition-all duration-200">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.72rem] font-semibold text-sidebar-foreground">
                {displayName}
              </p>
              <p className="truncate text-[0.6rem] text-sidebar-foreground/40 mt-0.5">
                {displayRole}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-1 text-sidebar-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                  aria-label="Sign out"
                >
                  <LogOut className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Sign out
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Theme toggle */}
        <div className="px-2 pb-2">
          <button
            suppressHydrationWarning
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] text-sidebar-foreground/60",
              "transition-all duration-200 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
              isCollapsed && "justify-center px-2",
            )}
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="size-4 shrink-0" />
              ) : (
                <Moon className="size-4 shrink-0" />
              )
            ) : (
              <Moon className="size-4 shrink-0" />
            )}
            {!isCollapsed && (
              <span className="text-[0.72rem]">
                {mounted
                  ? theme === "dark"
                    ? "Light Mode"
                    : "Dark Mode"
                  : "Dark Mode"}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Collapse / expand toggle pill ── */}
      <button
        suppressHydrationWarning
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 z-10 flex size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:shadow-xl"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>

      {/* ── Drag-to-resize handle ── */}
      <div
        onMouseDown={onDragMouseDown}
        className={cn(
          "absolute right-0 top-0 h-full w-1 cursor-col-resize z-20 transition-colors duration-200",
          isDragging
            ? "bg-sidebar-primary/70"
            : "hover:bg-sidebar-primary/50 bg-sidebar-primary/10",
        )}
      />
    </aside>
  );
};

export default Sidebar;
