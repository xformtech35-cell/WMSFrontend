'use client';

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Waypoints,
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

async function exportAislesExcel(items) {
  await exportWmsWorkbook({
    fileName: `aisles_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Aisles",
    title: "WMS Aisle Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Aisle ID", key: "aisleId", width: 12 },
      { header: "Aisle Name", key: "name", width: 24 },
      { header: "Description", key: "description", width: 30 },
      { header: "Width", key: "width", width: 12, align: "right" },
      { header: "Length", key: "length", width: 12, align: "right" },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Status", key: "isActive", width: 12 },
      { header: "Zone", key: "zone", width: 28 },
      { header: "Warehouse", key: "warehouse", width: 28 },
    ],
    rows: items.map((a) => ({
      id: a.id,
      aisleId: a.aisleId ?? "",
      name: a.name ?? "",
      description: a.description ?? "",
      width: a.width ?? "",
      length: a.length ?? "",
      unit: a.unit ?? "Meter",
      isActive: a.isActive ? "Active" : "Inactive",
      zone: a.zone?.name ?? "",
      warehouse: a.zone?.warehouse?.name ?? "",
    })),
  });
  toast.success("Aisles exported to Excel");
}

export default function AislesPage() {
  // State for aisles data
  const [aisles, setAisles] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");

  // State for form data
  const [formData, setFormData] = useState({
    aisleId: "",
    name: "",
    description: "",
    isActive: true,
    width: "",
    length: "",
    unit: "Meter",
    remarks: "",
    zoneId: "",
    createdBy: "admin",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    fetchAisles();
    fetchZones();
  }, []);

  const fetchAisles = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/aisles");
      setAisles(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching aisles:", error);
      toast.error("Failed to load aisles.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await api.get("/zones");
      setZones(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error("Failed to load zones.");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.aisleId || formData.aisleId.trim() === "") {
      errors.aisleId = "Aisle ID is required";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Aisle name is required";
    }
    if (!formData.zoneId || formData.zoneId === "") {
      errors.zoneId = "Zone is required";
    }
    if (formData.width && isNaN(parseFloat(formData.width))) {
      errors.width = "Width must be a number";
    }
    if (formData.length && isNaN(parseFloat(formData.length))) {
      errors.length = "Length must be a number";
    }
    if (formData.width && parseFloat(formData.width) <= 0) {
      errors.width = "Width must be greater than 0";
    }
    if (formData.length && parseFloat(formData.length) <= 0) {
      errors.length = "Length must be greater than 0";
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
      aisleId: formData.aisleId.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
      width: formData.width ? parseFloat(formData.width) : null,
      length: formData.length ? parseFloat(formData.length) : null,
      unit: formData.unit || "Meter",
      createdBy: "admin",
      remarks: formData.remarks.trim(),
      zoneId: Number(formData.zoneId),
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        // Update existing aisle
        await update(`/aisles/${editItem?.id}`, payload);
        toast.success("Aisle updated successfully");
      } else {
        // Create new aisle
        await CREATE("/aisles", payload);
        toast.success("Aisle created successfully");
      }

      // Refresh the list
      await fetchAisles();

      // Close modal and reset form
      setOpen(false);
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving aisle:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to save aisle."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this aisle?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await DELETE(`/aisles/${id}`);
      await fetchAisles();
      toast.success("Aisle deleted successfully");
    } catch (error) {
      console.error("Error deleting aisle:", error);
      toast.error(error?.response?.data?.detail || "Unable to delete aisle.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      aisleId: "",
      name: "",
      description: "",
      isActive: true,
      width: "",
      length: "",
      unit: "Meter",
      remarks: "",
      zoneId: "",
      createdBy: "admin",
    });
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({
      aisleId: "",
      name: "",
      description: "",
      isActive: true,
      width: "",
      length: "",
      unit: "Meter",
      remarks: "",
      zoneId: zones[0]?.id || "",
      createdBy: "admin",
    });
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      aisleId: item.aisleId || "",
      name: item.name || "",
      description: item.description || "",
      isActive: item.isActive ?? true,
      width: item.width?.toString() || "",
      length: item.length?.toString() || "",
      unit: item.unit || "Meter",
      remarks: item.remarks || "",
      zoneId: item.zone?.id || "",
      createdBy: item.createdBy || "admin",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = aisles;
    if (zoneFilter !== "ALL") {
      list = list.filter(
        (a) => String(a.zone?.id ?? "") === zoneFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          String(a.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(a.aisleId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(a.zone?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(a.zone?.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q)
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [aisles, search, zoneFilter]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleAisles,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, zoneFilter, aisles?.length ?? 0],
  });

  const showInitialLoading = isLoading && !aisles?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aisle Master"
        description="Manage aisles grouped under zones for rack and bin planning."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportAislesExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Aisle
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
        title={editItem ? "Edit Aisle" : "Create Aisle"}
        description="Aisles are subdivisions inside a zone for rack and bin planning."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          {/* Aisle ID */}
          <div className="space-y-1.5">
            <Label htmlFor="aisleId">Aisle ID *</Label>
            <Input
              id="aisleId"
              name="aisleId"
              placeholder="e.g. A-01, B-02, MAIN-01"
              value={formData.aisleId}
              onChange={handleInputChange}
              className={formErrors.aisleId ? "border-red-500" : ""}
              disabled={!!editItem}
            />
            {formErrors.aisleId && (
              <p className="text-xs text-red-500">{formErrors.aisleId}</p>
            )}
          </div>

          {/* Aisle Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Aisle Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Main Aisle 01, Picking Aisle A"
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
              placeholder="Brief description of the aisle's purpose"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Width and Length with Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                name="width"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 5.0"
                value={formData.width}
                onChange={handleInputChange}
                className={formErrors.width ? "border-red-500" : ""}
              />
              {formErrors.width && (
                <p className="text-xs text-red-500">{formErrors.width}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="length">Length</Label>
              <Input
                id="length"
                name="length"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 50.0"
                value={formData.length}
                onChange={handleInputChange}
                className={formErrors.length ? "border-red-500" : ""}
              />
              {formErrors.length && (
                <p className="text-xs text-red-500">{formErrors.length}</p>
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
              Select the unit for width and length measurements
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

          {/* Zone */}
          <div className="space-y-1.5">
            <Label htmlFor="zoneId">Zone *</Label>
            <select
              id="zoneId"
              name="zoneId"
              className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm ${
                formErrors.zoneId ? "border-red-500" : ""
              }`}
              value={formData.zoneId}
              onChange={handleInputChange}
            >
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} {z.zoneId ? `(${z.zoneId})` : ""} 
                  {z.warehouse?.name ? ` - ${z.warehouse.name}` : ""}
                </option>
              ))}
            </select>
            {formErrors.zoneId && (
              <p className="text-xs text-red-500">{formErrors.zoneId}</p>
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
                  <Plus className="mr-1.5 size-3.5" /> Create Aisle
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
            placeholder="Search aisle, zone, warehouse..."
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
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
        >
          <option value="ALL">All Zones</option>
          {zones.map((z) => (
            <option key={z.id} value={String(z.id)}>
              {z.name}
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
            <Waypoints className="size-12 opacity-30" />
            <p className="text-sm">
              {aisles.length
                ? "No aisles match your filters."
                : "No aisles yet. Create your first aisle."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Aisle ID</TableHead>
                  <TableHead>Aisle Name</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAisles.map((a, idx) => (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.aisleId || "-"}
                    </TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.width && a.length 
                        ? `${a.width} × ${a.length}`
                        : a.width 
                          ? `${a.width}`
                          : a.length 
                            ? `${a.length}`
                            : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {a.unit || "Meter"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.isActive
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>{a.zone?.name ?? "-"}</TableCell>
                    <TableCell>{a.zone?.warehouse?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="mr-1 size-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(a.id)}
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