'use client';

import { useState, useMemo, useEffect } from "react";
import {
  Building2,
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

async function exportRacksExcel(items) {
  await exportWmsWorkbook({
    fileName: `racks_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Racks",
    title: "WMS Rack Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Rack ID", key: "rackId", width: 12 },
      { header: "Rack Name", key: "name", width: 24 },
      { header: "Description", key: "description", width: 30 },
      { header: "Dimensions (H×W×D)", key: "dimensions", width: 18 },
      { header: "Height", key: "height", width: 12, align: "right" },
      { header: "Width", key: "width", width: 12, align: "right" },
      { header: "Depth", key: "depth", width: 12, align: "right" },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Status", key: "isActive", width: 12 },
      { header: "Aisle", key: "aisle", width: 20 },
      { header: "Zone", key: "zone", width: 24 },
      { header: "Warehouse", key: "warehouse", width: 28 },
    ],
    rows: items.map((r) => ({
      id: r.id,
      rackId: r.rackId ?? "",
      name: r.name ?? "",
      description: r.description ?? "",
      dimensions: r.height && r.width && r.depth 
        ? `${r.height} × ${r.width} × ${r.depth}`
        : "",
      height: r.height ?? "",
      width: r.width ?? "",
      depth: r.depth ?? "",
      unit: r.unit ?? "Meter",
      isActive: r.isActive ? "Active" : "Inactive",
      aisle: r.aisle?.aisleNumber ?? "",
      zone: r.aisle?.zone?.name ?? "",
      warehouse: r.aisle?.zone?.warehouse?.name ?? "",
    })),
  });
  toast.success("Racks exported to Excel");
}

export default function RacksPage() {
  // State for racks data
  const [racks, setRacks] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");
  const [aisleFilter, setAisleFilter] = useState("ALL");

  // State for form data
  const [formData, setFormData] = useState({
    rackId: "",
    name: "",
    description: "",
    isActive: true,
    height: "",
    width: "",
    depth: "",
    unit: "Meter",
    remarks: "",
    aisleId: "",
    createdBy: "admin",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    fetchRacks();
    fetchAisles();
  }, []);

  const fetchRacks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/racks");
      setRacks(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching racks:", error);
      toast.error("Failed to load racks.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAisles = async () => {
    try {
      const response = await api.get("/aisles");
      setAisles(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching aisles:", error);
      toast.error("Failed to load aisles.");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.rackId || formData.rackId.trim() === "") {
      errors.rackId = "Rack ID is required";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Rack name is required";
    }
    if (!formData.aisleId || formData.aisleId === "") {
      errors.aisleId = "Aisle is required";
    }
    if (formData.height && isNaN(parseFloat(formData.height))) {
      errors.height = "Height must be a number";
    }
    if (formData.width && isNaN(parseFloat(formData.width))) {
      errors.width = "Width must be a number";
    }
    if (formData.depth && isNaN(parseFloat(formData.depth))) {
      errors.depth = "Depth must be a number";
    }
    if (formData.height && parseFloat(formData.height) <= 0) {
      errors.height = "Height must be greater than 0";
    }
    if (formData.width && parseFloat(formData.width) <= 0) {
      errors.width = "Width must be greater than 0";
    }
    if (formData.depth && parseFloat(formData.depth) <= 0) {
      errors.depth = "Depth must be greater than 0";
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
      rackId: formData.rackId.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
      height: formData.height ? parseFloat(formData.height) : null,
      width: formData.width ? parseFloat(formData.width) : null,
      depth: formData.depth ? parseFloat(formData.depth) : null,
      unit: formData.unit || "Meter",
      createdBy: "admin",
      remarks: formData.remarks.trim(),
      aisleId: Number(formData.aisleId),
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        // Update existing rack
        await update(`/racks/${editItem?.id}`, payload);
        toast.success("Rack updated successfully");
      } else {
        // Create new rack
        await CREATE("/racks", payload);
        toast.success("Rack created successfully");
      }

      // Refresh the list
      await fetchRacks();

      // Close modal and reset form
      setOpen(false);
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving rack:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to save rack."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this rack?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await DELETE(`/racks/${id}`);
      await fetchRacks();
      toast.success("Rack deleted successfully");
    } catch (error) {
      console.error("Error deleting rack:", error);
      toast.error(error?.response?.data?.detail || "Unable to delete rack.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rackId: "",
      name: "",
      description: "",
      isActive: true,
      height: "",
      width: "",
      depth: "",
      unit: "Meter",
      remarks: "",
      aisleId: "",
      createdBy: "admin",
    });
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({
      rackId: "",
      name: "",
      description: "",
      isActive: true,
      height: "",
      width: "",
      depth: "",
      unit: "Meter",
      remarks: "",
      aisleId: aisles[0]?.id || "",
      createdBy: "admin",
    });
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      rackId: item.rackId || "",
      name: item.name || "",
      description: item.description || "",
      isActive: item.isActive ?? true,
      height: item.height?.toString() || "",
      width: item.width?.toString() || "",
      depth: item.depth?.toString() || "",
      unit: item.unit || "Meter",
      remarks: item.remarks || "",
      aisleId: item.aisle?.id || "",
      createdBy: item.createdBy || "admin",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = racks;
    if (aisleFilter !== "ALL") {
      list = list.filter(
        (r) => String(r.aisle?.id ?? "") === aisleFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          String(r.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.rackId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.aisle?.aisleNumber ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.aisle?.zone?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.aisle?.zone?.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q)
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [racks, search, aisleFilter]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleRacks,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, aisleFilter, racks?.length ?? 0],
  });

  const showInitialLoading = isLoading && !racks?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rack Master"
        description="Manage racks grouped under aisles for bin allocation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportRacksExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Rack
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
        title={editItem ? "Edit Rack" : "Create Rack"}
        description="Racks are storage structures inside an aisle for bin placement."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          {/* Rack ID */}
          <div className="space-y-1.5">
            <Label htmlFor="rackId">Rack ID *</Label>
            <Input
              id="rackId"
              name="rackId"
              placeholder="e.g. R-01, SHELF-A, BAY-01"
              value={formData.rackId}
              onChange={handleInputChange}
              className={formErrors.rackId ? "border-red-500" : ""}
              disabled={!!editItem}
            />
            {formErrors.rackId && (
              <p className="text-xs text-red-500">{formErrors.rackId}</p>
            )}
          </div>

          {/* Rack Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Rack Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Main Rack 01, Picking Rack A"
              value={formData.name}
              onChange={handleInputChange}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description of the rack's purpose"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Height, Width, Depth with Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                name="height"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 3.0"
                value={formData.height}
                onChange={handleInputChange}
                className={formErrors.height ? "border-red-500" : ""}
              />
              {formErrors.height && (
                <p className="text-xs text-red-500">{formErrors.height}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                name="width"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 2.0"
                value={formData.width}
                onChange={handleInputChange}
                className={formErrors.width ? "border-red-500" : ""}
              />
              {formErrors.width && (
                <p className="text-xs text-red-500">{formErrors.width}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="depth">Depth</Label>
              <Input
                id="depth"
                name="depth"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 1.5"
                value={formData.depth}
                onChange={handleInputChange}
                className={formErrors.depth ? "border-red-500" : ""}
              />
              {formErrors.depth && (
                <p className="text-xs text-red-500">{formErrors.depth}</p>
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
              <option value="Meter">Meter (m)</option>
              <option value="Feet">Feet (ft)</option>
              <option value="Centimeter">Centimeter (cm)</option>
              <option value="Inch">Inch (in)</option>
              <option value="Yard">Yard (yd)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Select the unit for height, width, and depth measurements
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-normal cursor-pointer"
            >
              Active
            </Label>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              name="remarks"
              placeholder="Additional notes or comments"
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>

          {/* Aisle */}
          <div className="space-y-1.5">
            <Label htmlFor="aisleId">Aisle *</Label>
            <select
              id="aisleId"
              name="aisleId"
              className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm ${
                formErrors.aisleId ? "border-red-500" : ""
              }`}
              value={formData.aisleId}
              onChange={handleInputChange}
            >
              <option value="">Select aisle</option>
              {aisles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.aisleId || a.aisleNumber || `Aisle ${a.id}`}
                  {a.name ? ` - ${a.name}` : ""}
                  {a.zone?.name ? ` (${a.zone.name})` : ""}
                  {a.zone?.warehouse?.name ? ` @ ${a.zone.warehouse.name}` : ""}
                </option>
              ))}
            </select>
            {formErrors.aisleId && (
              <p className="text-xs text-red-500">{formErrors.aisleId}</p>
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
                  <Plus className="mr-1.5 size-3.5" /> Create Rack
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
            placeholder="Search rack, aisle, zone, warehouse..."
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
          value={aisleFilter}
          onChange={(e) => setAisleFilter(e.target.value)}
        >
          <option value="ALL">All Aisles</option>
          {aisles.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.aisleId || a.aisleNumber || `Aisle ${a.id}`}
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
            <Building2 className="size-12 opacity-30" />
            <p className="text-sm">
              {racks.length
                ? "No racks match your filters."
                : "No racks yet. Create your first rack."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Rack ID</TableHead>
                  <TableHead>Rack Name</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aisle</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRacks.map((r, idx) => (
                  <TableRow key={r.id} className="table-row-hover">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.rackId || "-"}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.height && r.width && r.depth 
                        ? `${r.height} × ${r.width} × ${r.depth}`
                        : r.height && r.width 
                          ? `${r.height} × ${r.width}`
                          : r.height 
                            ? `${r.height}`
                            : r.width 
                              ? `${r.width}`
                              : r.depth 
                                ? `${r.depth}`
                                : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {r.unit || "Meter"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.isActive
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>{r.aisle?.aisleNumber || r.aisle?.aisleId || "-"}</TableCell>
                    <TableCell>{r.aisle?.zone?.name ?? "-"}</TableCell>
                    <TableCell>{r.aisle?.zone?.warehouse?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="mr-1 size-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-1 size-3.5" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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