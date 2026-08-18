// app/transfer-history/page.jsx or components/TransferHistoryPage.jsx
"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Search,
  X,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  ChevronDown,
  Warehouse,
  MapPin,
  Package,
  Calendar,
  User,
  Hash,
  Layers,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import TransferDetailsPopup from "../components/TransferDetailsPopup";
// import TransferDetailsPopup from "@/components/TransferDetailsPopup";

async function fetchTransferHistory(params = {}) {
  const response = await api.get("/stock-transfers/filter", { params });
  return response.data;
}

export default function TransferHistoryPage() {
  // State for transfer data
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    transferNumber: "",
    itemCode: "",
    itemName: "",
    status: "",
    sourceLocation: "",
    targetLocation: "",
    batchNumber: "",
    grnNumber: "",
    createdBy: "",
    fromDate: "",
    toDate: "",
  });

  // Status options
  const statusOptions = [
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
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

  // Debounce timer
  const [filterTimeout, setFilterTimeout] = useState(null);

  useEffect(() => {
    fetchTransferList(0);
  }, []);

  // Auto-apply search
  useEffect(() => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    const timeout = setTimeout(() => {
      fetchTransferList(0, search);
    }, 500);
    setFilterTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [search]);

  // Auto-apply filters
  useEffect(() => {
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    const timeout = setTimeout(() => {
      fetchTransferList(0, search);
    }, 300);
    setFilterTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [filters]);

  const fetchTransferList = async (page = 0, searchQuery = "") => {
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

      const response = await fetchTransferHistory(params);

      const content = response.content || response.data?.content || [];
      const totalElements =
        response.totalElements || response.data?.totalElements || 0;
      const totalPages = response.totalPages || response.data?.totalPages || 0;
      const currentPage = response.number || response.data?.number || page;
      const pageSize = response.size || response.data?.size || pagination.pageSize;
      const first = response.first || response.data?.first || true;
      const last = response.last || response.data?.last || true;

      setTransfers(content);
      setPagination({
        currentPage,
        pageSize,
        totalElements,
        totalPages,
        first,
        last,
      });
    } catch (error) {
      console.error("Error fetching transfer history:", error);
      toast.error("Failed to load transfer history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTransferList(pagination.currentPage, search);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchTransferList(newPage, search);
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
      transferNumber: "",
      itemCode: "",
      itemName: "",
      status: "",
      sourceLocation: "",
      targetLocation: "",
      batchNumber: "",
      grnNumber: "",
      createdBy: "",
      fromDate: "",
      toDate: "",
    });
    setSearch("");
    setShowFilters(false);
  };

  const viewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: {
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: Clock,
      },
      IN_PROGRESS: {
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: RefreshCw,
      },
      COMPLETED: {
        className: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle,
      },
      FAILED: {
        className: "bg-red-100 text-red-700 border-red-200",
        icon: AlertCircle,
      },
      CANCELLED: {
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: X,
      },
    };
    const defaultStatus = {
      className: "bg-gray-100 text-gray-700 border-gray-200",
      icon: FileText,
    };
    return statusMap[status] || defaultStatus;
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
    (v) => v && v.trim() !== ""
  ).length;

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Transfer Details Popup */}
      <TransferDetailsPopup
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedTransfer(null);
        }}
        transferData={selectedTransfer}
      />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Transfer History
              </h1>
              <p className="text-purple-100 text-sm mt-1">
                View and manage all inventory transfer records
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
                  <Badge className="bg-white text-purple-600 hover:bg-white/90 px-2 py-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
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

      {/* Search and Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-8"
              placeholder="Search by transfer #, item, location..."
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearch("")}
              >
                <X className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${pagination.totalElements} transfers found`}
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
                <Label className="text-xs text-muted-foreground">
                  Transfer Number
                </Label>
                <Input
                  className="h-9"
                  value={filters.transferNumber}
                  onChange={(e) =>
                    handleFilterChange("transferNumber", e.target.value)
                  }
                  placeholder="TRF-2026..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Item Code
                </Label>
                <Input
                  className="h-9"
                  value={filters.itemCode}
                  onChange={(e) =>
                    handleFilterChange("itemCode", e.target.value)
                  }
                  placeholder="Search by item code"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Item Name
                </Label>
                <Input
                  className="h-9"
                  value={filters.itemName}
                  onChange={(e) =>
                    handleFilterChange("itemName", e.target.value)
                  }
                  placeholder="Search by item name"
                />
              </div>

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
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Source Location
                </Label>
                <Input
                  className="h-9"
                  value={filters.sourceLocation}
                  onChange={(e) =>
                    handleFilterChange("sourceLocation", e.target.value)
                  }
                  placeholder="Enter source location"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Target Location
                </Label>
                <Input
                  className="h-9"
                  value={filters.targetLocation}
                  onChange={(e) =>
                    handleFilterChange("targetLocation", e.target.value)
                  }
                  placeholder="Enter target location"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  GRN Number
                </Label>
                <Input
                  className="h-9"
                  value={filters.grnNumber}
                  onChange={(e) =>
                    handleFilterChange("grnNumber", e.target.value)
                  }
                  placeholder="Search by GRN"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Created By
                </Label>
                <Input
                  className="h-9"
                  value={filters.createdBy}
                  onChange={(e) =>
                    handleFilterChange("createdBy", e.target.value)
                  }
                  placeholder="User name"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  From Date
                </Label>
                <Input
                  className="h-9"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    handleFilterChange("fromDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To Date</Label>
                <Input
                  className="h-9"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From → To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
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
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent"></div>
                      <span className="text-gray-500 font-medium">
                        Loading transfer history...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : !transfers.length ? (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <ArrowRight className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No transfers found
                      </p>
                      <p className="text-sm text-gray-400">
                        Transfer records will appear here once items are moved
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((transfer, idx) => {
                  const StatusIcon = getStatusBadge(transfer.status).icon;
                  const statusClass = getStatusBadge(transfer.status).className;

                  return (
                    <tr
                      key={transfer.transferNumber || idx}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewDetails(transfer)}
                            className="font-mono text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline cursor-pointer transition-colors"
                          >
                            {transfer.transferNumber || "-"}
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(transfer.transferNumber)
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
                            title="Copy transfer number"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {transfer.itemCode || "-"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {transfer.itemName || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {transfer.quantityTransferred || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-600 truncate max-w-[80px]">
                            {transfer.sourceLocation?.split("-").pop() || "-"}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 truncate max-w-[80px]">
                            {transfer.targetLocation?.split("-").pop() || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${statusClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {transfer.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {formatDate(transfer.transferDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {transfer.createdBy || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => viewDetails(transfer)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {transfer.grnNumber && (
                            <button
                              onClick={() => {
                                toast.info(`GRN: ${transfer.grnNumber}`);
                              }}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View GRN"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
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
        {!isLoading && transfers.length > 0 && (
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