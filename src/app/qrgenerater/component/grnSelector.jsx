"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Package,
  Building2,
  Calendar,
  Hash,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/TablePagination";

// API function to fetch approved GRNs
async function fetchApprovedGRNs(params = {}) {
  const response = await api.get("/inbound/grn-status/APPROVED", { params });
  return response.data;
}

export default function GRNSelector({
  open,
  onOpenChange,
  onSelect,
  selectedGRN = null,
  selectedItem = null,
}) {
  const [grns, setGrns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGRN, setExpandedGRN] = useState(null);
  const [selectedGrnId, setSelectedGrnId] = useState(selectedGRN?.id || null);
  const [selectedLineId, setSelectedLineId] = useState(
    selectedItem?.id || null
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });

  // Fetch GRNs on mount and page change
  useEffect(() => {
    if (open) {
      fetchGRNs(0);
    }
  }, [open]);

  const fetchGRNs = async (page = 0, searchQuery = "") => {
    try {
      setIsLoading(true);
      const params = {
        page: page,
        size: pagination.pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await fetchApprovedGRNs(params);

      // Extract data from response
      const data = response.data?.data || response.data || response;
      const content = data.content || [];
      const totalElements = data.totalElements || 0;
      const totalPages = data.totalPages || 0;
      const currentPage = data.number || page;
      const pageSize = data.size || pagination.pageSize;
      const first = data.first !== undefined ? data.first : true;
      const last = data.last !== undefined ? data.last : true;

      // Filter GRNs that have at least one line with barcodeGenerate === null
      const filteredContent = content.filter((grn) =>
        grn.lines?.some((line) => line.barcodeGenerate === null)
      );

      setGrns(filteredContent);
      setPagination({
        currentPage,
        pageSize,
        totalElements: filteredContent.length,
        totalPages: Math.ceil(filteredContent.length / pageSize),
        first,
        last,
      });

      // Auto-expand first GRN if available
      if (filteredContent.length > 0 && !expandedGRN) {
        setExpandedGRN(filteredContent[0].id);
      }
    } catch (error) {
      console.error("Error fetching approved GRNs:", error);
      toast.error("Failed to load GRNs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchGRNs(newPage, search);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGRNs(0, search);
  };

  const handleRefresh = () => {
    fetchGRNs(pagination.currentPage, search);
  };

  const toggleExpand = (grnId) => {
    setExpandedGRN(expandedGRN === grnId ? null : grnId);
  };

  const handleSelectGRN = (grn) => {
    setSelectedGrnId(grn.id);
    setSelectedLineId(null);
    // Don't auto-select, wait for item selection
  };

  const handleSelectLine = (grn, line) => {
    setSelectedLineId(line.id);
    onSelect({
      grn: grn,
      line: line,
      inboundId: grn.id,
      inboundLineId: line.id,
      grnNumber: grn.grnNumber,
      inboundNumber: grn.inboundNumber,
      itemCode: line.itemCode,
      itemName: line.itemName,
      uom: line.uom,
      quantity: line.acceptedQuantity || line.orderedQuantity,
    });
  };

  const handleConfirm = () => {
    if (!selectedGrnId || !selectedLineId) {
      toast.error("Please select a GRN and an item");
      return;
    }

    const selectedGrn = grns.find((g) => g.id === selectedGrnId);
    const selectedLine = selectedGrn?.lines?.find(
      (l) => l.id === selectedLineId
    );

    if (selectedGrn && selectedLine) {
      onSelect({
        grn: selectedGrn,
        line: selectedLine,
        inboundId: selectedGrn.id,
        inboundLineId: selectedLine.id,
        grnNumber: selectedGrn.grnNumber,
        inboundNumber: selectedGrn.inboundNumber,
        itemCode: selectedLine.itemCode,
        itemName: selectedLine.itemName,
        uom: selectedLine.uom,
        quantity: selectedLine.acceptedQuantity || selectedLine.orderedQuantity,
      });
      onOpenChange(false);
    }
  };

  const getQualityStatusColor = (status) => {
    const colors = {
      ACCEPTED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      PARTIAL: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const canSelectLine = (line) => {
    return line.barcodeGenerate === null;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="size-5" />
            Select GRN and Item
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 pr-16"
                placeholder="Search GRN, supplier..."
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-3 text-sm text-primary hover:text-primary/80"
              >
                Search
              </button>
            </form>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!selectedLineId}>
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Select
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="mr-1.5 size-3.5" />
                Cancel
              </Button>
            </div>
          </div>

          {/* GRN List */}
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : grns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="size-12 mx-auto mb-3 opacity-20" />
                <p>No GRNs with items pending barcode generation</p>
                <p className="text-sm mt-1">All items have already been generated</p>
              </div>
            ) : (
              <div className="divide-y">
                {grns.map((grn) => {
                  const isExpanded = expandedGRN === grn.id;
                  const isSelected = selectedGrnId === grn.id;
                  const pendingLines = grn.lines?.filter(
                    (line) => line.barcodeGenerate === null
                  ) || [];

                  return (
                    <div key={grn.id} className="transition-colors">
                      {/* GRN Header */}
                      <div
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          isSelected ? "bg-blue-50 dark:bg-blue-950/20" : ""
                        }`}
                        onClick={() => {
                          toggleExpand(grn.id);
                          handleSelectGRN(grn);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-medium text-sm">
                                {grn.grnNumber}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {grn.inboundNumber}
                              </Badge>
                              <Badge
                                className={`text-xs ${getQualityStatusColor(
                                  grn.qualityStatus
                                )}`}
                              >
                                {grn.qualityStatus || "PENDING"}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800"
                              >
                                {pendingLines.length} pending
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="size-3" />
                                {grn.supplierName || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {grn.grnDate
                                  ? new Date(grn.grnDate).toLocaleDateString()
                                  : "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="size-3" />
                                {grn.lines?.length || 0} items
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <CheckCircle2 className="size-4 text-blue-600" />
                          )}
                        </div>
                      </div>

                      {/* GRN Lines */}
                      {isExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-900/30 p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8">#</TableHead>
                                <TableHead>Item Code</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>UOM</TableHead>
                                <TableHead>Received</TableHead>
                                <TableHead>Quality</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead className="text-right">
                                  Action
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grn.lines?.map((line, index) => {
                                const isPending = line.barcodeGenerate === null;
                                const isLineSelected =
                                  selectedLineId === line.id;

                                return (
                                  <TableRow
                                    key={line.id}
                                    className={
                                      isPending
                                        ? "hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer"
                                        : "opacity-50"
                                    }
                                    onClick={() => {
                                      if (isPending) {
                                        handleSelectLine(grn, line);
                                      }
                                    }}
                                  >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-mono">
                                      {line.itemCode}
                                    </TableCell>
                                    <TableCell>{line.itemName}</TableCell>
                                    <TableCell>{line.uom}</TableCell>
                                    <TableCell>
                                      {line.acceptedQuantity ||
                                        line.orderedQuantity}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={`text-xs ${getQualityStatusColor(
                                          line.qualityStatus
                                        )}`}
                                      >
                                        {line.qualityStatus || "PENDING"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {isPending ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-yellow-500 text-yellow-600 bg-yellow-50"
                                        >
                                          Not Generated
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-green-500 text-green-600 bg-green-50"
                                        >
                                          Generated
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {isPending ? (
                                        <Button
                                          size="sm"
                                          variant={
                                            isLineSelected
                                              ? "default"
                                              : "outline"
                                          }
                                          className={
                                            isLineSelected
                                              ? "bg-blue-600 hover:bg-blue-700"
                                              : ""
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectLine(grn, line);
                                          }}
                                        >
                                          {isLineSelected ? (
                                            <>
                                              <CheckCircle2 className="mr-1.5 size-3.5" />
                                              Selected
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="mr-1.5 size-3.5" />
                                              Select
                                            </>
                                          )}
                                        </Button>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Already Generated
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {grns.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {grns.length} GRNs with pending items
              </p>
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                startItem={pagination.currentPage * pagination.pageSize + 1}
                endItem={Math.min(
                  (pagination.currentPage + 1) * pagination.pageSize,
                  grns.length
                )}
                totalItems={grns.length}
              />
            </div>
          )}

          {/* Selected Summary */}
          {selectedGrnId && selectedLineId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-blue-600" />
                <span className="font-medium">Selected:</span>
                <span className="text-muted-foreground">
                  {grns.find((g) => g.id === selectedGrnId)?.grnNumber} →{" "}
                  {
                    grns
                      .find((g) => g.id === selectedGrnId)
                      ?.lines?.find((l) => l.id === selectedLineId)?.itemCode
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}