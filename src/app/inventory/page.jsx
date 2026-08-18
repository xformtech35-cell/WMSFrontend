"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Package,
  Search,
  X,
  RefreshCw,
  MapPin,
  Eye,
  Boxes,
  Warehouse,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Filter,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePaginatedItems } from "@/lib/hooks/usePaginatedItems";
import TablePagination from "@/components/TablePagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ItemTransferPopup from "./components/InventoryDetailModal";
import { useRouter } from "next/navigation";

async function fetchInventoryStock(params = {}) {
  const response = await api.get("/inventory-stock", { params });
  return response.data;
}

export default function InventoryStockPage() {
  // State for inventory data
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    itemCode: "",
    itemName: "",
    status: "",
    warehouseId: "",
    zone: "",
    aisle: "",
    rack: "",
    level: "",
    binId: "",
    batchNumber: "",
    grnNumber: "",
  });

  // Master data for dropdowns
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [racks, setRacks] = useState([]);
  const [levels, setLevels] = useState([]);
  const [bins, setBins] = useState([]);
  const router = useRouter();

  // Debounce timer for filter auto-apply
  const [filterTimeout, setFilterTimeout] = useState(null);

  // Add state for transfer popup
  const [transferPopupOpen, setTransferPopupOpen] = useState(false);
  const [transferItemData, setTransferItemData] = useState(null);

  // Add function to open transfer popup
  const openTransferPopup = (item) => {
    setTransferItemData(item);
    setTransferPopupOpen(true);
  };

  // Add function to handle successful transfer
  const handleTransferSuccess = () => {
    // Refresh the inventory list after successful transfer
    fetchInventoryList(pagination.currentPage, search);
  };

  // Status options
  const statusOptions = [
    "ACTIVE",
    "INACTIVE",
    "FROZEN",
    "ALLOCATED",
    "RESERVED",
  ];

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchInventoryList(0);
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [warehousesRes, zonesRes, aislesRes, racksRes, levelsRes, binsRes] =
        await Promise.all([
          api.get("/warehouses").catch(() => ({ data: [] })),
          api.get("/zones").catch(() => ({ data: [] })),
          api.get("/aisles").catch(() => ({ data: [] })),
          api.get("/racks").catch(() => ({ data: [] })),
          api.get("/levels").catch(() => ({ data: [] })),
          api.get("/bins").catch(() => ({ data: [] })),
        ]);

      setWarehouses(
        warehousesRes.data?.data?.content ||
          warehousesRes.data?.content ||
          warehousesRes.data ||
          [],
      );
      setZones(
        zonesRes.data?.data?.content ||
          zonesRes.data?.content ||
          zonesRes.data ||
          [],
      );
      setAisles(
        aislesRes.data?.data?.content ||
          aislesRes.data?.content ||
          aislesRes.data ||
          [],
      );
      setRacks(
        racksRes.data?.data?.content ||
          racksRes.data?.content ||
          racksRes.data ||
          [],
      );
      setLevels(
        levelsRes.data?.data?.content ||
          levelsRes.data?.content ||
          levelsRes.data ||
          [],
      );
      setBins(
        binsRes.data?.data?.content ||
          binsRes.data?.content ||
          binsRes.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  const fetchInventoryList = async (page = 0, searchQuery = "") => {
    try {
      setIsLoading(true);
      const params = {
        page: page,
        size: pagination.pageSize,
      };

      // Add search if present
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add filters if they have values
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key].trim() !== "") {
          params[key] = filters[key].trim();
        }
      });

      const response = await fetchInventoryStock(params);

      const content = response.content || response.data?.content || [];
      const totalElements =
        response.totalElements || response.data?.totalElements || 0;
      const totalPages = response.totalPages || response.data?.totalPages || 0;
      const currentPage = response.number || response.data?.number || page;
      const pageSize =
        response.size || response.data?.size || pagination.pageSize;
      const first = response.first || response.data?.first || true;
      const last = response.last || response.data?.last || true;

      setInventory(content);
      setPagination({
        currentPage,
        pageSize,
        totalElements,
        totalPages,
        first,
        last,
      });
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory stock.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-apply search when typing
  useEffect(() => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    const timeout = setTimeout(() => {
      fetchInventoryList(0, search);
    }, 500);
    setFilterTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [search]);

  // Auto-apply filters when any filter changes
  useEffect(() => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    const timeout = setTimeout(() => {
      fetchInventoryList(0, search);
    }, 300);
    setFilterTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [filters]);

  const handleRefresh = () => {
    fetchInventoryList(pagination.currentPage, search);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchInventoryList(newPage, search);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      itemCode: "",
      itemName: "",
      status: "",
      warehouseId: "",
      zone: "",
      aisle: "",
      rack: "",
      level: "",
      binId: "",
      batchNumber: "",
      grnNumber: "",
    });
    setSearch("");
    setShowFilters(false);
  };

  const viewDetails = (item) => {
    setSelectedItem(item);
    setViewDetailsOpen(true);
  };

  const closeDetails = () => {
    setViewDetailsOpen(false);
    setSelectedItem(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: "bg-green-100 text-green-700 border-green-200",
      INACTIVE: "bg-red-100 text-red-700 border-red-200",
      FROZEN: "bg-blue-100 text-blue-700 border-blue-200",
      ALLOCATED: "bg-yellow-100 text-yellow-700 border-yellow-200",
      RESERVED: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return statusMap[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v.trim() !== "",
  ).length;
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Inventory Stock Management
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                View and manage inventory stock across all warehouses
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="bg-white text-blue-600 hover:bg-white/90 px-2 py-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </button>
              <button
                type="button"
               onClick={() => router.push("/inventory/transfer-history")}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                History
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details View Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-blue-600" />
              Inventory Details
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Inventory Number
                  </Label>
                  <p className="font-medium">
                    {selectedItem.inventoryNumber || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-block ${getStatusBadge(
                      selectedItem.status,
                    )}`}
                  >
                    {selectedItem.status || "ACTIVE"}
                  </span>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Item Code
                  </Label>
                  <p className="font-medium">{selectedItem.itemCode || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Item Name
                  </Label>
                  <p className="font-medium">{selectedItem.itemName || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Quantity
                  </Label>
                  <p className="font-medium">
                    {selectedItem.quantity || 0} {selectedItem.uom || "Nos"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Available Quantity
                  </Label>
                  <p className="font-medium">
                    {selectedItem.availableQuantity || 0}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Location Details
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Warehouse
                    </Label>
                    <p className="font-medium">
                      {selectedItem.warehouseId || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Zone
                    </Label>
                    <p className="font-medium">{selectedItem.zone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Aisle
                    </Label>
                    <p className="font-medium">{selectedItem.aisle || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Rack
                    </Label>
                    <p className="font-medium">{selectedItem.rack || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Level
                    </Label>
                    <p className="font-medium">{selectedItem.level || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Bin Barcode
                    </Label>
                    <p className="font-medium">
                      {selectedItem.binBarcode || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Reference Details
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      GRN Number
                    </Label>
                    <p className="font-medium text-blue-600">
                      {selectedItem.grnNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Putaway Task
                    </Label>
                    <p className="font-medium">
                      {selectedItem.putawayTaskNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Confirmation Number
                    </Label>
                    <p className="font-medium">
                      {selectedItem.confirmationNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Received Date
                    </Label>
                    <p className="font-medium">
                      {formatDate(selectedItem.receivedDate)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedItem.remarks && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground">
                    Remarks
                  </Label>
                  <p className="text-sm">{selectedItem.remarks}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={closeDetails}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-8"
              placeholder="Search item code, name, GRN..."
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearch("");
                }}
              >
                <X className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${pagination.totalElements} inventory items found`}
          </p>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Filter className="size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount} active
                  </Badge>
                )}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Warehouse
                </Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.warehouseId}
                  onChange={(e) =>
                    handleFilterChange("warehouseId", e.target.value)
                  }
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.warehouseId || w.id}>
                      {w.name} {w.warehouseId ? `(${w.warehouseId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Zone</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.zone}
                  onChange={(e) => handleFilterChange("zone", e.target.value)}
                >
                  <option value="">All Zones</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.zoneId || z.name}>
                      {z.name} {z.zoneId ? `(${z.zoneId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Aisle</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.aisle}
                  onChange={(e) => handleFilterChange("aisle", e.target.value)}
                >
                  <option value="">All Aisles</option>
                  {aisles.map((a) => (
                    <option key={a.id} value={a.aisleId || a.aisleNumber}>
                      {a.aisleNumber || a.aisleId || `Aisle ${a.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Rack</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.rack}
                  onChange={(e) => handleFilterChange("rack", e.target.value)}
                >
                  <option value="">All Racks</option>
                  {racks.map((r) => (
                    <option key={r.id} value={r.rackId || r.rackIdentifier}>
                      {r.rackId || r.rackIdentifier || `Rack ${r.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Level</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.level}
                  onChange={(e) => handleFilterChange("level", e.target.value)}
                >
                  <option value="">All Levels</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.levelId || l.name}>
                      {l.name || l.levelId || `Level ${l.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bin</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.binId}
                  onChange={(e) => handleFilterChange("binId", e.target.value)}
                >
                  <option value="">All Bins</option>
                  {bins.map((b) => (
                    <option key={b.id} value={b.barcode || b.binId || b.id}>
                      {b.barcode || b.binId || `Bin ${b.id}`}
                      {b.rack?.rackId ? ` (${b.rack.rackId})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventory Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="flex justify-center items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
                      <span className="text-gray-500 font-medium">
                        Loading inventory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : !inventory.length ? (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Boxes className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No inventory found
                      </p>
                      <p className="text-sm text-gray-400">
                        Inventory will appear here after putaway confirmation
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                inventory.map((item, idx) => {
                  const location = [
                    item.warehouseId,
                    item.zone,
                    item.aisle,
                    item.rack,
                    item.level,
                    item.binId,
                  ]
                    .filter(Boolean)
                    .join(" → ");

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {pagination.currentPage * pagination.pageSize +
                            idx +
                            1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewDetails(item)}
                          className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                        >
                          {item.inventoryNumber || "-"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-gray-800">
                          {item.itemCode || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {item.itemName || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {item.quantity || 0} {item.uom || "Nos"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {item.availableQuantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {item.warehouseId || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span
                            className="text-sm text-gray-600 truncate max-w-[120px]"
                            title={location}
                          >
                            {location || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status || "ACTIVE"}
                        </span>
                        {/* {item.isAvailable && (
                          <span className="ml-1 inline-flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          </span>
                        )} */}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => viewDetails(item)}
                            className="p-1.5 cursor-pointer text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openTransferPopup(item)}
                            className="p-1.5 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Transfer Item"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <ItemTransferPopup
          isOpen={transferPopupOpen}
          onClose={() => {
            setTransferPopupOpen(false);
            setTransferItemData(null);
          }}
          itemData={transferItemData}
          onSuccess={handleTransferSuccess}
        />
        {/* Pagination */}
        {!isLoading && inventory.length > 0 && (
          <TablePagination
            page={pagination.currentPage + 1}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalElements}
            startItem={pagination.currentPage * pagination.pageSize + 1}
            endItem={Math.min(
              (pagination.currentPage + 1) * pagination.pageSize,
              pagination.totalElements,
            )}
            onPrev={() => handlePageChange(pagination.currentPage - 1)}
            onNext={() => handlePageChange(pagination.currentPage + 1)}
            onFirst={() => handlePageChange(0)}
            onLast={() => handlePageChange(pagination.totalPages - 1)}
          />
        )}
      </div>
    </div>
  );
}
