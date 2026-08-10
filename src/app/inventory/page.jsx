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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePaginatedItems } from "@/lib/hooks/usePaginatedItems";
import TablePagination from "@/components/TablePagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });

  // Fetch inventory data
  useEffect(() => {
    fetchInventoryList(0);
  }, []);

  const fetchInventoryList = async (page = 0, searchQuery = "") => {
    try {
      setIsLoading(true);
      const params = {
        page: page,
        size: pagination.pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await fetchInventoryStock(params);

      const content = response.content || response.data?.content || [];
      const totalElements = response.totalElements || response.data?.totalElements || 0;
      const totalPages = response.totalPages || response.data?.totalPages || 0;
      const currentPage = response.number || response.data?.number || page;
      const pageSize = response.size || response.data?.size || pagination.pageSize;
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInventoryList(0, search);
  };

  const handleRefresh = () => {
    fetchInventoryList(pagination.currentPage, search);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchInventoryList(newPage, search);
    }
  };

  const viewDetails = (item) => {
    setSelectedItem(item);
    setViewDetailsOpen(true);
  };

  const closeDetails = () => {
    setViewDetailsOpen(false);
    setSelectedItem(null);
  };

  // Status badge helper
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

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

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
                  <Label className="text-xs text-muted-foreground">Inventory Number</Label>
                  <p className="font-medium">{selectedItem.inventoryNumber || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-block ${getStatusBadge(selectedItem.status)}`}>
                    {selectedItem.status || "ACTIVE"}
                  </span>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Item Code</Label>
                  <p className="font-medium">{selectedItem.itemCode || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Item Name</Label>
                  <p className="font-medium">{selectedItem.itemName || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedItem.quantity || 0} {selectedItem.uom || "Nos"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Available Quantity</Label>
                  <p className="font-medium">{selectedItem.availableQuantity || 0}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">Location Details</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Warehouse</Label>
                    <p className="font-medium">{selectedItem.warehouseId || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Zone</Label>
                    <p className="font-medium">{selectedItem.zone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Aisle</Label>
                    <p className="font-medium">{selectedItem.aisle || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Rack</Label>
                    <p className="font-medium">{selectedItem.rack || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bin ID</Label>
                    <p className="font-medium">{selectedItem.binId || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bin Barcode</Label>
                    <p className="font-medium">{selectedItem.binBarcode || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">Reference Details</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">GRN Number</Label>
                    <p className="font-medium text-blue-600">{selectedItem.grnNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Putaway Task</Label>
                    <p className="font-medium">{selectedItem.putawayTaskNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Confirmation Number</Label>
                    <p className="font-medium">{selectedItem.confirmationNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Received Date</Label>
                    <p className="font-medium">{formatDate(selectedItem.receivedDate)}</p>
                  </div>
                </div>
              </div>

              {selectedItem.remarks && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground">Remarks</Label>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-16"
            placeholder="Search item code, name, GRN..."
          />
          <button
            type="submit"
            className="absolute right-0 top-0 h-full px-3 text-sm text-primary hover:text-primary/80"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              className="absolute right-14 top-1/2 -translate-y-1/2"
              onClick={() => {
                setSearch("");
                fetchInventoryList(0, "");
              }}
            >
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </form>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading..." : `${pagination.totalElements} inventory items found`}
        </p>
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
                          {pagination.currentPage * pagination.pageSize + idx + 1}
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
                          <span className="text-sm text-gray-600 truncate max-w-[120px]" title={location}>
                            {location || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}
                        >
                          {item.status || "ACTIVE"}
                        </span>
                        {item.isAvailable && (
                          <span className="ml-1 inline-flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => viewDetails(item)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
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

        {/* Pagination */}
        {!isLoading && inventory.length > 0 && (
          <TablePagination
            page={pagination.currentPage + 1}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalElements}
            startItem={pagination.currentPage * pagination.pageSize + 1}
            endItem={Math.min(
              (pagination.currentPage + 1) * pagination.pageSize,
              pagination.totalElements
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