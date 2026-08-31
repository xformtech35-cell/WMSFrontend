"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useWebSocketSubscription } from "@/lib/hooks/useWebSocketSubscription";
import {
  BarChart2,
  Boxes,
  Clock3,
  GripVertical,
  Package,
  RefreshCw,
  ScanLine,
  Ship,
  ShoppingCart,
  AlertTriangle,
  Printer,
  TrendingUp,
  Activity,
  Sparkles,
  Warehouse,
  Users,
  DollarSign,
  Percent,
  Calendar,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Zap,
  TrendingDown,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import WarehouseHierarchy from "./components/WarehouseHierarchy";
import { cn } from "@/lib/utils";

// Color palette for charts
const CHART_COLORS = {
  primary: "hsl(var(--wms-primary))",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  orange: "#f97316",
  cyan: "#06b6d4",
  rose: "#f43f5e",
  amber: "#d97706",
  emerald: "#059669",
};

const STATE_COLORS = {
  RECEIVED: "hsl(var(--wms-dock))",
  IN_PUTAWAY: "#f59e0b",
  AVAILABLE: "#10b981",
  RESERVED: "#8b5cf6",
  PICKED: "#ec4899",
  PACKED: "#14b8a6",
  SHIPPED: "hsl(var(--wms-ship))",
};

const DEFAULT_WIDGET_VISIBILITY = {
  inventoryMix: true,
  operationsPulse: true,
  attentionQueue: true,
  liveEvents: true,
  performanceMetrics: true,
};

const DEFAULT_WIDGET_ORDER = [
  "inventoryMix",
  "operationsPulse",
  "attentionQueue",
  "liveEvents",
  "performanceMetrics",
];

const fetchKpis = async () => {
  const { data } = await api.get("/dashboard/warehouse");
  return data;
};

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm px-4 py-3 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-popover-foreground">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          style={{ color: entry.color }}
          className="flex items-center gap-2"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-bold">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { can, role, username } = usePermissions();

  const [shipWindow, setShipWindow] = useState(7);
  const [widgetVisibility, setWidgetVisibility] = useState(
    DEFAULT_WIDGET_VISIBILITY,
  );
  const [widgetOrder, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [draggingWidget, setDraggingWidget] = useState(null);

  useWebSocketSubscription("/topic/dashboard", () => {
    queryClient.invalidateQueries({ queryKey: ["dashboardKpis"] });
  });

  const {
    data: dashboardData,
    isLoading,
    isError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["dashboardKpis"],
    queryFn: fetchKpis,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  const data = dashboardData || {};
  const summary = data.summaryOverview || {};
  const inbound = data.inboundStats || {};
  const outbound = data.outboundStats || {};
  const inventory = data.inventoryOverview || {};
  const capacity = data.warehouseCapacity || {};
  const metrics = data.performanceMetrics || {};
  const alerts = data.alerts || [];
  const activities = data.recentActivities || [];

  // Derived data for charts
  const inventoryByState = [
    {
      name: "Available",
      value: Math.max(
        0,
        inventory.totalQuantity -
          inventory.reservedQuantity -
          inventory.inTransitQuantity,
      ),
    },
    { name: "Reserved", value: inventory.reservedQuantity || 0 },
    { name: "In Transit", value: inventory.inTransitQuantity || 0 },
  ].filter((item) => item.value > 0);

  // Generate sample daily data for charts (since API returns empty arrays)
  const generateDailyData = (days, baseValue, variance) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: format(date, "MMM dd"),
        value: Math.max(
          0,
          baseValue + Math.floor(Math.random() * variance * 2 - variance),
        ),
      };
    });
  };

  const dailyShipments = generateDailyData(7, outbound.totalOrders || 0, 5);
  const dailyOrders = generateDailyData(7, outbound.totalOrders || 0, 8);

  // Performance metrics for gauge chart
  const performanceMetrics = [
    {
      name: "Picking Accuracy",
      value: metrics.pickingAccuracy || 0,
      fill: CHART_COLORS.success,
    },
    {
      name: "On-Time Delivery",
      value: metrics.onTimeDeliveryRate || 0,
      fill: CHART_COLORS.primary,
    },
    {
      name: "Inventory Accuracy",
      value: metrics.inventoryAccuracy || 0,
      fill: CHART_COLORS.purple,
    },
  ];

  // Order status distribution
  const orderStatusData = [
    {
      name: "Pending",
      value: outbound.pendingOrders || 0,
      color: CHART_COLORS.warning,
    },
    {
      name: "Processing",
      value: outbound.processingOrders || 0,
      color: CHART_COLORS.info,
    },
    {
      name: "Completed",
      value: outbound.completedOrders || 0,
      color: CHART_COLORS.success,
    },
    {
      name: "Cancelled",
      value: outbound.cancelledOrders || 0,
      color: CHART_COLORS.danger,
    },
  ].filter((item) => item.value > 0);

  // Pick performance
  const pickPerformance = [
    { name: "Pending", value: outbound.pendingPickTasks || 0 },
    { name: "Completed", value: outbound.completedPickTasks || 0 },
  ];

  // Zone utilization (sample data from API or generate)
  const zoneUtilization =
    data.chartsData?.zoneUtilization?.length > 0
      ? data.chartsData.zoneUtilization
      : [
          { name: "Zone A", utilization: capacity.binUtilization || 0 },
          {
            name: "Zone B",
            utilization: Math.min(100, (capacity.binUtilization || 0) * 0.9),
          },
          {
            name: "Zone C",
            utilization: Math.min(100, (capacity.binUtilization || 0) * 0.7),
          },
          {
            name: "Zone D",
            utilization: Math.min(100, (capacity.binUtilization || 0) * 0.8),
          },
        ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "WARNING":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "INFO":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border/20";
    }
  };
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [isLoadingw, setIsLoading] = useState(false);
  const fetchWarehouses = async () => {
    try {
      setIsLoading(true);

      const response = await api.get("/master/warehouses");

      const data = response.data || [];

      setWarehouses(data);

     
      // Select first warehouse by default
      if (data.length > 0) {
        setSelectedWarehouseId(data[0].warehouseId || data[0].id);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to load warehouses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);
  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: "bg-gray-500/20 text-gray-400",
      PENDING: "bg-amber-500/20 text-amber-400",
      APPROVED: "bg-blue-500/20 text-blue-400",
      PICKING: "bg-purple-500/20 text-purple-400",
      PACKED: "bg-cyan-500/20 text-cyan-400",
      SHIPPED: "bg-emerald-500/20 text-emerald-400",
      DELIVERED: "bg-green-500/20 text-green-400",
      CANCELLED: "bg-red-500/20 text-red-400",
    };
    return styles[status] || "bg-muted/50 text-muted-foreground";
  };

  const StatCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-card rounded-2xl border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(summary.totalOrders || 0)}
              </p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-3">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-emerald-500">↑ 12%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl border-l-4 border-l-emerald-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Inventory
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(inventory.totalQuantity || 0)}
              </p>
            </div>
            <div className="rounded-full bg-emerald-500/10 p-3">
              <Package className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-emerald-500">↑ 5%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl border-l-4 border-l-purple-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total SKUs
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(inventory.totalSKUs || 0)}
              </p>
            </div>
            <div className="rounded-full bg-purple-500/10 p-3">
              <Boxes className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-amber-500">→ Stable</span>
            <span className="text-muted-foreground">No change</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl border-l-4 border-l-orange-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Picks
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(outbound.pendingPickTasks || 0)}
              </p>
            </div>
            <div className="rounded-full bg-orange-500/10 p-3">
              <ScanLine className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-red-500">↑ 8%</span>
            <span className="text-muted-foreground">needs attention</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWidget = (id) => {
    switch (id) {
      case "inventoryMix":
        return (
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Inventory Mix
              </CardTitle>
              <CardDescription>
                Current inventory distribution across states
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryByState.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-12 w-12 opacity-30" />
                  <p className="mt-2 text-sm">No inventory data available</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryByState}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {inventoryByState.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              Object.values(CHART_COLORS)[
                                index % Object.values(CHART_COLORS).length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Total Units</p>
                  <p className="text-lg font-bold">
                    {formatNumber(inventory.totalQuantity || 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Low Stock</p>
                  <p className="text-lg font-bold text-amber-500">
                    {inventory.lowStockItems || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Out of Stock</p>
                  <p className="text-lg font-bold text-red-500">
                    {inventory.outOfStockItems || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "operationsPulse":
        return (
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Operations Pulse
              </CardTitle>
              <CardDescription>Real-time operational metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Warehouse Utilization
                  </span>
                  <span className="font-semibold">
                    {capacity.utilizationPercentage || 0}%
                  </span>
                </div>
                <Progress
                  value={capacity.utilizationPercentage || 0}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Available: {formatNumber(capacity.availableCapacity || 0)}
                  </span>
                  <span>Used: {formatNumber(capacity.usedCapacity || 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Bin Utilization
                  </p>
                  <p className="text-xl font-bold">
                    {capacity.binUtilization || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(capacity.occupiedBins || 0)} /{" "}
                    {formatNumber(capacity.totalBins || 0)} bins
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Pick Pressure</p>
                  <p className="text-xl font-bold">
                    {outbound.totalPickTasks > 0
                      ? Math.round(
                          (outbound.pendingPickTasks /
                            outbound.totalPickTasks) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {outbound.pendingPickTasks || 0} pending tasks
                  </p>
                </div>
              </div>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pickPerformance}
                    layout="vertical"
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill={CHART_COLORS.warning} />
                      <Cell fill={CHART_COLORS.success} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );

      case "attentionQueue":
        return (
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Attention Queue
              </CardTitle>
              <CardDescription>Priority items requiring action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 text-emerald-500 opacity-50" />
                  <p className="mt-2 text-sm font-medium">All systems clear</p>
                  <p className="text-xs">No alerts requiring attention</p>
                </div>
              ) : (
                alerts.slice(0, 4).map((alert, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {alert.type?.replace("_", " ") || "Alert"}
                        </p>
                        <p className="text-xs opacity-90">{alert.message}</p>
                        {alert.action && (
                          <p className="mt-1 text-xs font-medium text-primary cursor-pointer hover:underline">
                            {alert.action} →
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {alert.timestamp
                          ? format(new Date(alert.timestamp), "HH:mm")
                          : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {alerts.length > 4 && (
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all {alerts.length} alerts
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case "liveEvents":
        return (
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Live Activity Feed
              </CardTitle>
              <CardDescription>Recent warehouse activities</CardDescription>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 opacity-30" />
                  <p className="mt-2 text-sm">No recent activity</p>
                </div>
              ) : (
                activities.slice(0, 6).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-border/50 p-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                      {activity.icon || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium truncate">
                          {activity.soNumber ||
                            activity.description ||
                            "Activity"}
                        </p>
                        {activity.status && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusBadge(activity.status)}`}
                          >
                            {activity.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {activity.relativeTime || activity.formattedTime}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case "performanceMetrics":
        return (
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {performanceMetrics.map((metric) => (
                  <div
                    key={metric.name}
                    className="rounded-lg border border-border/50 p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground">
                      {metric.name}
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: metric.fill }}
                    >
                      {metric.value}%
                    </p>
                    <Progress
                      value={metric.value}
                      className="h-1.5 mt-1"
                      style={{
                        "--progress-background": metric.fill,
                      }}
                    />
                  </div>
                ))}
                <div className="rounded-lg border border-border/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Fulfillment Rate
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {metrics.orderFulfillmentRate || 0}%
                  </p>
                  <Progress
                    value={metrics.orderFulfillmentRate || 0}
                    className="h-1.5 mt-1"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Cost per Order
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(metrics.costPerOrder || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Revenue per Order
                  </p>
                  <p className="text-lg font-semibold text-emerald-500">
                    {formatCurrency(metrics.revenuePerOrder || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Performer</p>
                  <p className="text-lg font-semibold">
                    {metrics.topPerformer || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best Zone</p>
                  <p className="text-lg font-semibold">
                    {metrics.bestPerformingZone || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader
        title="Warehouse Dashboard"
        description={`Real-time overview of ${role?.replace("_", " ") || "warehouse"} operations`}
        actions={
          <div className="flex items-center gap-3">
            {dataUpdatedAt && (
              <span className="hidden text-xs text-muted-foreground sm:block">
                Updated {format(new Date(dataUpdatedAt), "HH:mm:ss")}
              </span>
            )}
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setShipWindow(d)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    shipWindow === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["dashboardKpis"] });
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        }
      />

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.slice(0, 2).map((alert, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${getSeverityColor(alert.severity)}`}
            >
              {alert.severity === "WARNING" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : alert.severity === "CRITICAL" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              <span>{alert.message}</span>
            </div>
          ))}
          {alerts.length > 2 && (
            <Button variant="ghost" size="sm" className="text-xs">
              +{alerts.length - 2} more
            </Button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* =========================================================
      LEFT — WAREHOUSE LIST
  ========================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Warehouses</h3>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Select warehouse to view mapping
            </p>
          </div>

          <div className="max-h-[700px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : warehouses.length > 0 ? (
              warehouses.map((warehouse) => {
                const warehouseId = warehouse.warehouseId || warehouse.id;

                const warehouseName =
                  warehouse.name ||
                  warehouse.warehouseName ||
                  "Unnamed Warehouse";

                const isSelected = selectedWarehouseId === warehouseId;

                return (
                  <button
                    key={warehouseId}
                    type="button"
                    onClick={() => {
                      setSelectedWarehouseId(warehouseId);
                    }}
                    className={cn(
                      `
                  mb-1.5
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-lg
                  border
                  px-3
                  py-3
                  text-left
                  transition
                `,

                      isSelected
                        ? `
                    border-[#ef2525]
                    bg-red-50
                  `
                        : `
                    border-transparent
                    bg-white
                    hover:border-slate-200
                    hover:bg-slate-50
                  `,
                    )}
                  >
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "truncate text-[12px] font-semibold",
                          isSelected ? "text-[#ef2525]" : "text-slate-700",
                        )}
                      >
                        {warehouseName}
                      </div>

                      <div className="mt-0.5 truncate text-[9px] text-slate-400">
                        {warehouseId}
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        className="
                    ml-2
                    h-2
                    w-2
                    shrink-0
                    rounded-full
                    bg-[#ef2525]
                  "
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No warehouses found
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
      RIGHT — SELECTED WAREHOUSE HIERARCHY
  ========================================================= */}
        <div className="min-w-0">
          {selectedWarehouseId ? (
            <WarehouseHierarchy
              warehouseId={selectedWarehouseId}
              onNodeSelect={(node) => {
                console.log("Selected node:", node);
              }}
            />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border   border-dashed  border-slate-300   bg-white  ">
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600">
                  Select a warehouse
                </div>

                <div className="mt-1 text-[11px] text-slate-400">
                  Choose a warehouse from the left to view its hierarchy
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Stat Cards */}
      <StatCards />

      {/* Main Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily Shipments Chart */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ship className="h-5 w-5 text-primary" />
              Daily Shipments
            </CardTitle>
            <CardDescription>
              Last {shipWindow} days shipping trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dailyShipments}
                  margin={{ left: -8, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="shipmentArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--wms-ship))"
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--wms-ship))"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Shipped"
                    stroke="hsl(var(--wms-ship))"
                    strokeWidth={2.5}
                    fill="url(#shipmentArea)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Total: {dailyShipments.reduce((sum, d) => sum + d.value, 0)}{" "}
                units
              </span>
              <span>
                Avg:{" "}
                {Math.round(
                  dailyShipments.reduce((sum, d) => sum + d.value, 0) /
                    dailyShipments.length,
                )}{" "}
                / day
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Order Status
            </CardTitle>
            <CardDescription>
              Current order fulfillment pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {orderStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Total Orders:{" "}
              <span className="font-semibold text-foreground">
                {formatNumber(outbound.totalOrders || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Inventory vs Orders Trend */}
        <Card className="glass-card rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Inventory & Orders Trend
            </CardTitle>
            <CardDescription>Last {shipWindow} days comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dailyOrders}
                  margin={{ left: -8, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="orderArea" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.primary}
                        stopOpacity="0.3"
                      />
                      <stop
                        offset="100%"
                        stopColor={CHART_COLORS.primary}
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Orders"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Inventory"
                    stroke={CHART_COLORS.success}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Zone Utilization */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Warehouse className="h-5 w-5 text-primary" />
              Zone Utilization
            </CardTitle>
            <CardDescription>Storage zone capacity usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zoneUtilization}
                  margin={{ left: -8, right: 8, top: 8, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="utilization"
                    name="Utilization %"
                    radius={[0, 4, 4, 0]}
                  >
                    {zoneUtilization.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.utilization > 80
                            ? CHART_COLORS.danger
                            : entry.utilization > 60
                              ? CHART_COLORS.warning
                              : CHART_COLORS.success
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Inbound Today</p>
                <p className="text-xl font-bold">
                  {formatNumber(inbound.todayGRN || 0)}
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-500 mt-0.5">
                  <ArrowUp className="h-3 w-3" /> 0%
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Outbound Today</p>
                <p className="text-xl font-bold">
                  {formatNumber(outbound.todayOrders || 0)}
                </p>
                <div className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                  <ArrowDown className="h-3 w-3" /> 0%
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Pending Orders</p>
                <p className="text-xl font-bold text-amber-500">
                  {formatNumber(outbound.pendingOrders || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatNumber(outbound.processingOrders || 0)} processing
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground">Total Suppliers</p>
                <p className="text-xl font-bold">
                  {formatNumber(summary.totalSuppliers || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {summary.totalCustomers || 0} customers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar Widgets */}
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          "inventoryMix",
          "operationsPulse",
          "attentionQueue",
          "performanceMetrics",
        ].map((id) => (
          <div key={id} className="lg:col-span-1">
            {renderWidget(id)}
          </div>
        ))}
      </div>

      {/* Live Events Feed at Bottom */}
      <div className="lg:col-span-4">{renderWidget("liveEvents")}</div>
    </div>
  );
};

export default DashboardPage;
