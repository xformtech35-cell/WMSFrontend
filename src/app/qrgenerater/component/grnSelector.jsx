"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Package,
  Building2,
  Calendar,
  CheckCircle2,
  Search,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import StatusBadge from "@/components/StatusBadge";

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
    selectedItem?.id || null,
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

  // const fetchGRNs = async (page = 0, searchQuery = "") => {
  //   try {
  //     setIsLoading(true);
  //     const params = {
  //       page: page,
  //       size: pagination.pageSize,
  //     };

  //     if (searchQuery) {
  //       params.search = searchQuery;
  //     }

  //     const response = await fetchApprovedGRNs(params);

  //     // Extract data from response
  //     const data = response.data?.data || response.data || response;
  //     const content = data.content || [];
  //     const totalElements = data.totalElements || 0;
  //     const totalPages = data.totalPages || 0;
  //     const currentPage = data.number || page;
  //     const pageSize = data.size || pagination.pageSize;
  //     const first = data.first !== undefined ? data.first : true;
  //     const last = data.last !== undefined ? data.last : true;

  //     // Filter GRNs that have at least one line with barcodeGenerate === null
  //     const filteredContent = content.filter((grn) =>
  //       grn.lines?.some((line) => line.barcodeGenerate === null)
  //     );

  //     setGrns(filteredContent);
  //     setPagination({
  //       currentPage,
  //       pageSize,
  //       totalElements: filteredContent.length,
  //       totalPages: Math.ceil(filteredContent.length / pageSize),
  //       first,
  //       last,
  //     });

  //     // Auto-expand first GRN if available
  //     if (filteredContent.length > 0 && !expandedGRN) {
  //       setExpandedGRN(filteredContent[0].id);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching approved GRNs:", error);
  //     toast.error("Failed to load GRNs. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchGRNs = async (page = 0, searchQuery = "") => {
    try {
      setIsLoading(true);

      const params = {
        page,
        size: pagination.pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await fetchApprovedGRNs(params);

      const data = response.data?.data || response.data || response;
      const content = data.content || [];
      console.log("Fetched GRNs:", content); // Debugging log
      const totalElements = data.totalElements || 0;
      const totalPages = data.totalPages || 0;
      const currentPage = data.number || page;
      const pageSize = data.size || pagination.pageSize;
      const first = data.first !== undefined ? data.first : true;
      const last = data.last !== undefined ? data.last : true;

      // Only GRNs having at least one pending barcode line
      const filteredContent = content.filter((grn) =>
        grn.lines?.some((line) => line.barcodeGenerate === null),
      );

      setGrns(filteredContent);

      setPagination({
        currentPage,
        pageSize,
        totalElements: totalElements,
        totalPages,
        first,
        last,
      });

      // Select first GRN + first pending line by default
      if (filteredContent.length > 0) {
        const firstGRN = filteredContent[0];

        const firstPendingLine = firstGRN.lines?.find(
          (line) => line.barcodeGenerate === null,
        );

        setExpandedGRN(firstGRN.id);
        setSelectedGrnId(firstGRN.id);

        if (firstPendingLine) {
          setSelectedLineId(firstPendingLine.id);
        } else {
          setSelectedLineId(null);
        }
      } else {
        setExpandedGRN(null);
        setSelectedGrnId(null);
        setSelectedLineId(null);
      }

      return filteredContent;
    } catch (error) {
      console.error("Error fetching approved GRNs:", error);
      toast.error("Failed to load GRNs. Please try again.");

      setGrns([]);
      setExpandedGRN(null);
      setSelectedGrnId(null);
      setSelectedLineId(null);

      return [];
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
      quantity: line.remainingQuantity || line.acceptedQuantity,
    });
  };

  const handleConfirm = () => {
    if (!selectedGrnId || !selectedLineId) {
      toast.error("Please select a GRN and an item");
      return;
    }

    const selectedGrn = grns.find((g) => g.id === selectedGrnId);
    const selectedLine = selectedGrn?.lines?.find(
      (l) => l.id === selectedLineId,
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
        quantity: selectedLine.remainingQuantity || selectedLine.acceptedQuantity,
      });
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const selectedGrn = grns.find((g) => g.id === selectedGrnId);
  const selectedLine = selectedGrn?.lines?.find((l) => l.id === selectedLineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="size-5 text-primary" />
            Select GRN and Item
          </DialogTitle>
          <DialogDescription>
            Choose an approved GRN with items pending barcode generation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearch}
              className="relative w-full sm:max-w-xs"
            >
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 pr-16"
                placeholder="Search GRN, supplier..."
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-3 text-sm font-medium text-primary hover:text-primary/80"
              >
                Search
              </button>
            </form>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw
                className={cn("size-3.5", isLoading && "animate-spin")}
              />
              <span className="ml-1.5">Refresh</span>
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : grns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Package className="mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">
                  No GRNs with pending items
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All items have already been generated
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {grns.map((grn) => {
                  const isExpanded = expandedGRN === grn.id;
                  const isSelected = selectedGrnId === grn.id;
                  const pendingLines =
                    grn.lines?.filter(
                      (line) => line.barcodeGenerate === null,
                    ) || [];

                  return (
                    <div key={grn.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40",
                          isSelected && "bg-primary/5",
                        )}
                        onClick={() => {
                          toggleExpand(grn.id);
                          handleSelectGRN(grn);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            toggleExpand(grn.id);
                            handleSelectGRN(grn);
                          }
                        }}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="rounded-md p-1 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                {grn.grnNumber}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {grn.inboundNumber}
                              </Badge>
                              <StatusBadge
                                status={grn.qualityStatus || "PENDING"}
                                showDot={false}
                              />
                              <Badge variant="secondary" className="text-xs">
                                {pendingLines.length} pending
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="size-3" />
                                {grn.supplierName || "N/A"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3" />
                                {grn.grnDate
                                  ? new Date(grn.grnDate).toLocaleDateString()
                                  : "N/A"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Package className="size-3" />
                                {grn.lines?.length || 0} items
                              </span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          <div className="overflow-x-auto rounded-md border border-border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-8">#</TableHead>
                                  <TableHead>Item Code</TableHead>
                                  <TableHead>Item Name</TableHead>
                                  <TableHead>UOM</TableHead>
                                  <TableHead>Received</TableHead>
                                  <TableHead>Remaining</TableHead>
                                  <TableHead>Quality</TableHead>
                                  <TableHead>Barcode</TableHead>
                                  <TableHead className="text-right">
                                    Action
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {grn.lines?.map((line, index) => {
                                  const isPending =
                                    line.remainingQuantity === null ||
                                    line.remainingQuantity > 0;
                                  const barcodeStatus =
                                    line.remainingQuantity === 0;
                                  const isLineSelected =
                                    selectedLineId === line.id;

                                  return (
                                    <TableRow
                                      key={line.id}
                                      className={cn(
                                        !isPending && "opacity-50",
                                        isPending &&
                                          "cursor-pointer hover:bg-accent/40",
                                        isLineSelected && "bg-primary/5",
                                      )}
                                      onClick={() => {
                                        if (isPending) {
                                          handleSelectLine(grn, line);
                                        }
                                      }}
                                    >
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {line.itemCode}
                                      </TableCell>
                                      <TableCell>{line.itemName}</TableCell>
                                      <TableCell>{line.uom}</TableCell>
                                      <TableCell>
                                        {line.acceptedQuantity ||
                                          line.orderedQuantity}
                                      </TableCell>
                                      <TableCell>
                                        {line.remainingQuantity || 0}
                                      </TableCell>
                                      <TableCell>
                                        <StatusBadge
                                          status={
                                            line.qualityStatus || "PENDING"
                                          }
                                          showDot={false}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {!barcodeStatus ? (
                                          <Badge
                                            variant="outline"
                                            className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                          >
                                            Remain Items
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                          >
                                            All Generated
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
                                          <span className="text-xs text-muted-foreground">
                                            Already generated
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {grns.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {grns.length} GRN{grns.length !== 1 ? "s" : ""} with pending
                items
              </p>
              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                startItem={pagination.currentPage * pagination.pageSize + 1}
                endItem={Math.min(
                  (pagination.currentPage + 1) * pagination.pageSize,
                  grns.length,
                )}
                totalItems={grns.length}
              />
            </div>
          )}

          {selectedGrnId && selectedLineId && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-primary" />
                <span className="font-medium">Selected:</span>
                <span className="text-muted-foreground">
                  {selectedGrn?.grnNumber} → {selectedLine?.itemCode}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="-mx-0 -mb-0 border-t border-border bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLineId}>
            <CheckCircle2 className="mr-1.5 size-3.5" />
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
