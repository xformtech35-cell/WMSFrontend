'use client';

import { useState, useMemo, useEffect } from "react";
import {
  Package,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import SlideOverForm from "@/components/ui/SlideOverForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SheetFooter } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportWmsWorkbook } from "@/lib/exportExcel";
import { usePaginatedItems } from "@/lib/hooks/usePaginatedItems";
import TablePagination from "@/components/TablePagination";
import { CREATE, DELETE, update } from "@/components/apiRequest";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";

async function exportBinsExcel(items) {
  await exportWmsWorkbook({
    fileName: `bins_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Bins",
    title: "WMS Bin Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Barcode", key: "barcode", width: 18 },
      { header: "Dimensions", key: "dimensions", width: 20 },
      { header: "Length", key: "lengthCm", width: 12, align: "right" },
      { header: "Width", key: "widthCm", width: 12, align: "right" },
      { header: "Height", key: "heightCm", width: 12, align: "right" },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Max Weight (g)", key: "maxWeightG", width: 16, align: "right" },
      { header: "Volume", key: "volume", width: 14, align: "right" },
      { header: "Utilization %", key: "utilization", width: 14, align: "right" },
      { header: "Status", key: "status", width: 14 },
      { header: "Rack", key: "rack", width: 20 },
      { header: "Aisle", key: "aisle", width: 20 },
      { header: "Zone", key: "zone", width: 24 },
      { header: "Warehouse", key: "warehouse", width: 28 },
    ],
    rows: items.map((b) => ({
      id: b.id,
      barcode: b.barcode ?? "",
      dimensions: b.lengthCm && b.widthCm && b.heightCm 
        ? `${b.lengthCm} × ${b.widthCm} × ${b.heightCm}`
        : "",
      lengthCm: b.lengthCm ?? "",
      widthCm: b.widthCm ?? "",
      heightCm: b.heightCm ?? "",
      unit: b.unit ?? "cm",
      maxWeightG: b.maxWeightG ?? "",
      volume: b.lengthCm && b.widthCm && b.heightCm 
        ? (b.lengthCm * b.widthCm * b.heightCm).toLocaleString()
        : "",
      utilization: b.utilization ?? b.utilizationPct ?? 0,
      status: b.status ?? "AVAILABLE",
      rack: b.rack?.rackId || b.rack?.name || "",
      aisle: b.rack?.aisle?.aisleNumber || b.rack?.aisle?.aisleId || "",
      zone: b.rack?.aisle?.zone?.name ?? "",
      warehouse: b.rack?.aisle?.zone?.warehouse?.name ?? "",
    })),
  });
  toast.success("Bins exported to Excel");
}

export default function BinsPage() {
  // State for bins data
  const [bins, setBins] = useState([]);
  const [racks, setRacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");
  const [rackFilter, setRackFilter] = useState("ALL");

  // State for form data
  const [formData, setFormData] = useState({
    barcode: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    unit: "cm",
    maxWeightG: "",
    status: "AVAILABLE",
    rackId: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Calculate volume for display
  const volume = useMemo(() => {
    const length = parseFloat(formData.lengthCm) || 0;
    const width = parseFloat(formData.widthCm) || 0;
    const height = parseFloat(formData.heightCm) || 0;
    return length * width * height;
  }, [formData.lengthCm, formData.widthCm, formData.heightCm]);

  // Fetch data on component mount
  useEffect(() => {
    fetchBins();
    fetchRacks();
  }, []);

  const fetchBins = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/master/bins");
      setBins(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching bins:", error);
      toast.error("Failed to load bins.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRacks = async () => {
    try {
      const response = await api.get("/master/racks");
      setRacks(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching racks:", error);
      toast.error("Failed to load racks.");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.barcode || formData.barcode.trim() === "") {
      errors.barcode = "Barcode is required";
    }
    if (!formData.rackId || formData.rackId === "") {
      errors.rackId = "Rack is required";
    }
    if (!formData.lengthCm || parseFloat(formData.lengthCm) <= 0) {
      errors.lengthCm = "Valid length is required";
    }
    if (!formData.widthCm || parseFloat(formData.widthCm) <= 0) {
      errors.widthCm = "Valid width is required";
    }
    if (!formData.heightCm || parseFloat(formData.heightCm) <= 0) {
      errors.heightCm = "Valid height is required";
    }
    if (!formData.maxWeightG || parseFloat(formData.maxWeightG) <= 0) {
      errors.maxWeightG = "Valid max weight is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare payload with all required fields
    const payload = {
      barcode: formData.barcode.trim().toUpperCase(),
      lengthCm: parseFloat(formData.lengthCm),
      widthCm: parseFloat(formData.widthCm),
      heightCm: parseFloat(formData.heightCm),
      unit: formData.unit || "cm",
      maxWeightG: parseFloat(formData.maxWeightG),
      status: formData.status,
      rackId: Number(formData.rackId),
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        // Update existing bin
        await update(`/master/bins/${editItem?.id}`, payload);
        toast.success("Bin updated successfully");
      } else {
        // Create new bin
        await CREATE("/master/bins", payload);
        toast.success("Bin created successfully");
      }

      // Refresh the list
      await fetchBins();

      // Close modal and reset form
      setOpen(false);
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving bin:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to save bin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this bin?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await DELETE(`/master/bins/${id}`);
      await fetchBins();
      toast.success("Bin deleted successfully");
    } catch (error) {
      console.error("Error deleting bin:", error);
      toast.error(error?.response?.data?.detail || "Unable to delete bin.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      unit: "cm",
      maxWeightG: "",
      status: "AVAILABLE",
      rackId: "",
    });
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({
      barcode: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      unit: "cm",
      maxWeightG: "",
      status: "AVAILABLE",
      rackId: racks[0]?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      barcode: item.barcode || "",
      lengthCm: item.lengthCm?.toString() || item.length_cm?.toString() || "",
      widthCm: item.widthCm?.toString() || item.width_cm?.toString() || "",
      heightCm: item.heightCm?.toString() || item.height_cm?.toString() || "",
      unit: item.unit || "cm",
      maxWeightG: item.maxWeightG?.toString() || item.max_weight_g?.toString() || "",
      status: item.status || "AVAILABLE",
      rackId: item.rackId || item.rack?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = bins;
    if (rackFilter !== "ALL") {
      list = list.filter(
        (b) => String(b.rackId ?? b.rack?.id ?? "") === rackFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          String(b.barcode ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.status ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.rack?.rackId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.rack?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.rack?.aisle?.aisleNumber ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.rack?.aisle?.zone?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.rack?.aisle?.zone?.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q)
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [bins, search, rackFilter]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleBins,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, rackFilter, bins?.length ?? 0],
  });

  const showInitialLoading = isLoading && !bins?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bin Master"
        description="Manage bins inside racks for item storage."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportBinsExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Bin
            </Button>
          </div>
        }
      />

      <SlideOverForm
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditItem(null);
            resetForm();
          }
        }}
        title={editItem ? "Edit Bin" : "Create Bin"}
        description="Bins are storage locations inside a rack for inventory placement."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          {/* Barcode */}
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Barcode *</Label>
            <Input
              id="barcode"
              name="barcode"
              placeholder="e.g. BIN-001, A-01-01-01"
              value={formData.barcode}
              onChange={handleInputChange}
              className={formErrors.barcode ? "border-red-500" : ""}
            />
            {formErrors.barcode && (
              <p className="text-xs text-red-500">{formErrors.barcode}</p>
            )}
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lengthCm">Length *</Label>
              <Input
                id="lengthCm"
                name="lengthCm"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="50.0"
                value={formData.lengthCm}
                onChange={handleInputChange}
                className={formErrors.lengthCm ? "border-red-500" : ""}
              />
              {formErrors.lengthCm && (
                <p className="text-xs text-red-500">{formErrors.lengthCm}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="widthCm">Width *</Label>
              <Input
                id="widthCm"
                name="widthCm"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="40.0"
                value={formData.widthCm}
                onChange={handleInputChange}
                className={formErrors.widthCm ? "border-red-500" : ""}
              />
              {formErrors.widthCm && (
                <p className="text-xs text-red-500">{formErrors.widthCm}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="heightCm">Height *</Label>
              <Input
                id="heightCm"
                name="heightCm"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="30.0"
                value={formData.heightCm}
                onChange={handleInputChange}
                className={formErrors.heightCm ? "border-red-500" : ""}
              />
              {formErrors.heightCm && (
                <p className="text-xs text-red-500">{formErrors.heightCm}</p>
              )}
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit of Measurement</Label>
            <select
              id="unit"
              name="unit"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={formData.unit}
              onChange={handleInputChange}
            >
              <option value="cm">Centimeter (cm)</option>
              <option value="m">Meter (m)</option>
              <option value="mm">Millimeter (mm)</option>
              <option value="inch">Inch (in)</option>
              <option value="ft">Feet (ft)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Select the unit for length, width, and height measurements
            </p>
          </div>

          {/* Volume display */}
          {volume > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">
                Volume: <span className="font-medium text-foreground">{volume.toLocaleString()} {formData.unit}³</span>
                {" • "}
                Max Weight:{" "}
                <span className="font-medium text-foreground">
                  {formData.maxWeightG ? `${(parseFloat(formData.maxWeightG) / 1000).toFixed(2)} kg` : "-"}
                </span>
              </p>
            </div>
          )}

          {/* Max Weight */}
          <div className="space-y-1.5">
            <Label htmlFor="maxWeightG">Max Weight (g) *</Label>
            <Input
              id="maxWeightG"
              name="maxWeightG"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="1000.0"
              value={formData.maxWeightG}
              onChange={handleInputChange}
              className={formErrors.maxWeightG ? "border-red-500" : ""}
            />
            {formErrors.maxWeightG && (
              <p className="text-xs text-red-500">{formErrors.maxWeightG}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter weight in grams (g). Example: 1000g = 1kg
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="AVAILABLE">Available</option>
              <option value="FULL">Full</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Rack */}
          <div className="space-y-1.5">
            <Label htmlFor="rackId">Rack *</Label>
            <select
              id="rackId"
              name="rackId"
              className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm ${
                formErrors.rackId ? "border-red-500" : ""
              }`}
              value={formData.rackId}
              onChange={handleInputChange}
            >
              <option value="">Select rack</option>
              {racks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rackId || r.rackIdentifier || `Rack ${r.id}`}
                  {r.name ? ` - ${r.name}` : ""}
                  {r.aisle?.aisleNumber ? ` (Aisle: ${r.aisle.aisleNumber})` : ""}
                  {r.aisle?.zone?.name ? ` @ ${r.aisle.zone.name}` : ""}
                </option>
              ))}
            </select>
            {formErrors.rackId && (
              <p className="text-xs text-red-500">{formErrors.rackId}</p>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEditItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving..."
              ) : editItem ? (
                <>
                  <CheckCircle2 className="mr-1.5 size-3.5" /> Save Changes
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-3.5" /> Create Bin
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SlideOverForm>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-8"
            placeholder="Search barcode, rack, zone..."
          />
          {search ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          ) : null}
        </div>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={rackFilter}
          onChange={(e) => setRackFilter(e.target.value)}
        >
          <option value="ALL">All Racks</option>
          {racks.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.rackId || r.rackIdentifier || `Rack ${r.id}`}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        {showInitialLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Package className="size-12 opacity-30" />
            <p className="text-sm">
              {bins.length
                ? "No bins match your filters."
                : "No bins yet. Create your first bin."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Max Weight</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead className="min-w-44">Utilization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rack</TableHead>
                  <TableHead>Aisle</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBins.map((b, idx) => {
                  const length = b.lengthCm ?? b.length_cm;
                  const width = b.widthCm ?? b.width_cm;
                  const height = b.heightCm ?? b.height_cm;
                  const maxWeight = b.maxWeightG ?? b.max_weight_g;
                  const utilization = b.utilization ?? b.utilizationPct ?? 0;
                  const volume = length && width && height 
                    ? (length * width * height).toLocaleString()
                    : "-";
                  const unit = b.unit || "cm";

                  return (
                    <TableRow key={b.id} className="table-row-hover">
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {b.barcode || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {length && width && height
                          ? `${length} × ${width} × ${height}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {maxWeight ? `${(maxWeight / 1000).toFixed(1)} kg` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {volume}
                      </TableCell>
                      <TableCell className="min-w-44">
                        <div className="flex items-center gap-2">
                          <Progress value={utilization} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                            {utilization}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status || "AVAILABLE"} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.rack?.rackId || b.rack?.rackIdentifier || b.rackName || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.rack?.aisle?.aisleNumber || b.rack?.aisle?.aisleId || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.rack?.aisle?.zone?.name || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(b)}
                          >
                            <Pencil className="mr-1 size-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(b.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="mr-1 size-3.5" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              startItem={startItem}
              endItem={endItem}
              onPrev={() => setPage((v) => Math.max(1, v - 1))}
              onNext={() => setPage((v) => Math.min(totalPages, v + 1))}
              onFirst={() => setPage(1)}
              onLast={() => setPage(totalPages)}
            />
          </>
        )}
      </div>
    </div>
  );
}