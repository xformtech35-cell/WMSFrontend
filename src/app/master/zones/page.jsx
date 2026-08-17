"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Blocks,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Barcode,
  Printer,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportWmsWorkbook } from "@/lib/exportExcel";
import { usePaginatedItems } from "@/lib/hooks/usePaginatedItems";
import TablePagination from "@/components/TablePagination";
import { CREATE, DELETE, update } from "@/components/apiRequest";
import { downloadImage } from "@/components/downloadImage64";

async function exportZonesExcel(items) {
  await exportWmsWorkbook({
    fileName: `zones_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Zones",
    title: "WMS Zone Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Zone ID", key: "zoneId", width: 12 },
      { header: "Zone Name", key: "name", width: 24 },
      { header: "Description", key: "description", width: 30 },
      { header: "Zone Type", key: "zoneType", width: 18 },
      { header: "Priority", key: "priority", width: 10, align: "right" },
      { header: "Max Capacity", key: "maxCapacity", width: 12, align: "right" },
      { header: "Min Capacity", key: "minCapacity", width: 12, align: "right" },
      { header: "Capacity Unit", key: "capacityUnit", width: 12 },
      { header: "Status", key: "isActive", width: 12 },
      { header: "Warehouse", key: "warehouse", width: 28 },
      { header: "Barcode Data", key: "barcodeData", width: 20 },
    ],
    rows: items.map((z) => ({
      id: z.id,
      zoneId: z.zoneId ?? "",
      name: z.name ?? "",
      description: z.description ?? "",
      zoneType: z.zoneType ?? "",
      priority: z.priority ?? "",
      maxCapacity: z.maxCapacity ?? "",
      minCapacity: z.minCapacity ?? "",
      capacityUnit: z.capacityUnit ?? "",
      isActive: z.isActive ? "Active" : "Inactive",
      warehouse: z.warehouse?.name ?? "",
      barcodeData: z.barcodeData ?? "",
    })),
  });
  toast.success("Zones exported to Excel");
}

export default function ZonesPage() {
  // State for zones data
  const [zones, setZones] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for barcode preview
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  // State for form data
  const [formData, setFormData] = useState({
    zoneId: "",
    name: "",
    description: "",
    zoneType: "PICKING",
    isActive: true,
    priority: 1,
    maxCapacity: "",
    minCapacity: "",
    capacityUnit: "pallet",
    remarks: "",
    warehouseId: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    fetchZones();
    fetchWarehouses();
  }, []);

  const fetchZones = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/zones");
      setZones(response.data?.data?.content || response.data?.content || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error("Failed to load zones.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get("/master/warehouses");
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to load warehouses.");
    }
  };

  const downloadBarcode = (item) => {
    if (item?.barcodeImage) {
      downloadImage(item.barcodeImage, `barcode_${item.zoneId || item.id}.png`);
      // toast.success("Barcode downloaded successfully");
    } else {
      toast.error("No barcode image available to download");
    }
  };

  const openBarcodePreview = (zone) => {
    setSelectedZone(zone);
    setBarcodeDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.zoneId || formData.zoneId.trim() === "") {
      errors.zoneId = "Zone ID is required";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Zone name is required";
    }
    if (!formData.warehouseId || formData.warehouseId === "") {
      errors.warehouseId = "Warehouse is required";
    }
    if (formData.priority < 1 || formData.priority > 99) {
      errors.priority = "Priority must be between 1 and 99";
    }
    if (formData.maxCapacity && formData.maxCapacity < 0) {
      errors.maxCapacity = "Max capacity must be a positive number";
    }
    if (formData.minCapacity && formData.minCapacity < 0) {
      errors.minCapacity = "Min capacity must be a positive number";
    }
    if (formData.maxCapacity && formData.minCapacity && 
        Number(formData.maxCapacity) < Number(formData.minCapacity)) {
      errors.maxCapacity = "Max capacity cannot be less than min capacity";
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

    const payload = {
      zoneId: formData.zoneId.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      zoneType: formData.zoneType,
      isActive: formData.isActive,
      priority: Number(formData.priority) || 1,
      maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : 0,
      minCapacity: formData.minCapacity ? Number(formData.minCapacity) : 0,
      capacityUnit: formData.capacityUnit || "pallet",
      createdBy: "admin",
      remarks: formData.remarks.trim(),
      warehouseId: Number(formData.warehouseId),
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        await update(`/zones/${editItem?.id}`, payload);
      } else {
        await CREATE("/zones", payload);
      }

      await fetchZones();
      setOpen(false);
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.log("Status:", error.response?.status);
      console.log("Response:", error.response?.data);
      console.log("Headers:", error.response?.headers);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to save zone.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this zone?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await DELETE(`/master/zones/${id}`);
      await fetchZones();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error(error?.response?.data?.detail || "Unable to delete zone.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      zoneId: "",
      name: "",
      description: "",
      zoneType: "PICKING",
      isActive: true,
      priority: 1,
      maxCapacity: "",
      minCapacity: "",
      capacityUnit: "pallet",
      remarks: "",
      warehouseId: "",
    });
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({
      zoneId: "",
      name: "",
      description: "",
      zoneType: "PICKING",
      isActive: true,
      priority: 1,
      maxCapacity: "",
      minCapacity: "",
      capacityUnit: "pallet",
      remarks: "",
      warehouseId: warehouses[0]?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      zoneId: item.zoneId || "",
      name: item.name || "",
      description: item.description || "",
      zoneType: item.zoneType || "PICKING",
      isActive: item.isActive ?? true,
      priority: item.priority || 1,
      maxCapacity: item.maxCapacity || "",
      minCapacity: item.minCapacity || "",
      capacityUnit: item.capacityUnit || "pallet",
      remarks: item.remarks || "",
      warehouseId: item.warehouse?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = zones;
    if (warehouseFilter !== "ALL") {
      list = list.filter(
        (z) => String(z.warehouse?.id ?? "") === warehouseFilter,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (z) =>
          String(z.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(z.zoneId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(z.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(z.barcodeData ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [zones, search, warehouseFilter]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleZones,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, warehouseFilter, zones?.length ?? 0],
  });

  const showInitialLoading = isLoading && !zones?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Zone Master"
        description="Manage zones grouped under warehouses for aisle planning."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportZonesExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Zone
            </Button>
          </div>
        }
      />

      {/* Barcode Preview Dialog */}
      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="size-4" />
              Zone Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedZone && (
              <>
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed w-full">
                  {selectedZone.barcodeImage ? (
                    <img
                      src={`data:image/png;base64,${selectedZone.barcodeImage}`}
                      alt="Barcode"
                      className="max-w-full h-auto"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Barcode className="size-16" />
                      <p className="text-sm">No barcode available</p>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-1 text-sm">
                  <p>
                    <strong>Zone ID:</strong> {selectedZone.zoneId || "-"}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedZone.name || "-"}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedZone.zoneType || "-"}
                  </p>
                  <p>
                    <strong>Warehouse:</strong>{" "}
                    {selectedZone.warehouse?.name || "-"}
                  </p>
                  <p>
                    <strong>Barcode Data:</strong>{" "}
                    {selectedZone.barcodeData || selectedZone.zoneId || "-"}
                  </p>
                  <p>
                    <strong>Format:</strong>{" "}
                    {selectedZone.barcodeFormat || "CODE128"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={
                        selectedZone.isActive
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedZone.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    className="flex-1"
                    onClick={() => downloadBarcode(selectedZone)}
                    disabled={!selectedZone.barcodeImage}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SlideOverForm
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditItem(null);
            resetForm();
          }
        }}
        title={editItem ? "Edit Zone" : "Create Zone"}
        description="Zones are subdivisions inside a warehouse."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          <div className="space-y-1.5">
            <Label htmlFor="zoneId">Zone ID *</Label>
            <Input
              id="zoneId"
              name="zoneId"
              placeholder="e.g. A, B, PICK-01"
              value={formData.zoneId}
              onChange={handleInputChange}
              className={formErrors.zoneId ? "border-red-500" : ""}
              disabled={!!editItem}
            />
            {formErrors.zoneId && (
              <p className="text-xs text-red-500">{formErrors.zoneId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Zone Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Ambient, Picking Area, Bulk Storage"
              value={formData.name}
              onChange={handleInputChange}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description of the zone's purpose"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zoneType">Zone Type</Label>
            <select
              id="zoneType"
              name="zoneType"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={formData.zoneType}
              onChange={handleInputChange}
            >
              <option value="PICKING">Picking</option>
              <option value="STORAGE">Storage</option>
              <option value="RECEIVING">Receiving</option>
              <option value="SHIPPING">Shipping</option>
              <option value="RETURN">Return</option>
              <option value="BULK">Bulk</option>
              <option value="RESERVED">Reserved</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              name="priority"
              type="number"
              min="1"
              max="99"
              placeholder="1-99 (lower number = higher priority)"
              value={formData.priority}
              onChange={handleInputChange}
              className={formErrors.priority ? "border-red-500" : ""}
            />
            {formErrors.priority && (
              <p className="text-xs text-red-500">{formErrors.priority}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Lower numbers indicate higher priority for operations
            </p>
          </div>

          {/* New Capacity Fields */}
          <div className="space-y-1.5">
            <Label htmlFor="maxCapacity">Max Capacity</Label>
            <Input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              placeholder="e.g. 1000"
              value={formData.maxCapacity}
              onChange={handleInputChange}
              className={formErrors.maxCapacity ? "border-red-500" : ""}
            />
            {formErrors.maxCapacity && (
              <p className="text-xs text-red-500">{formErrors.maxCapacity}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="minCapacity">Min Capacity</Label>
            <Input
              id="minCapacity"
              name="minCapacity"
              type="number"
              placeholder="e.g. 500"
              value={formData.minCapacity}
              onChange={handleInputChange}
              className={formErrors.minCapacity ? "border-red-500" : ""}
            />
            {formErrors.minCapacity && (
              <p className="text-xs text-red-500">{formErrors.minCapacity}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacityUnit">Capacity Unit</Label>
            <select
              id="capacityUnit"
              name="capacityUnit"
              value={formData.capacityUnit}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="pallet">Pallet Positions</option>
              <option value="bin">Bin Positions</option>
              <option value="sqft">Square Feet (sq ft)</option>
              <option value="sqm">Square Meters (m²)</option>
              <option value="cft">Cubic Feet (ft³)</option>
              <option value="cbm">Cubic Meters (m³)</option>
              <option value="ton">Tons</option>
              <option value="kg">Kilograms (KG)</option>
              <option value="lbs">Pounds (LBS)</option>
            </select>
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="warehouseId">Warehouse *</Label>
            <select
              id="warehouseId"
              name="warehouseId"
              className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm ${
                formErrors.warehouseId ? "border-red-500" : ""
              }`}
              value={formData.warehouseId}
              onChange={handleInputChange}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.location ? `- ${w.location}` : ""}
                </option>
              ))}
            </select>
            {formErrors.warehouseId && (
              <p className="text-xs text-red-500">{formErrors.warehouseId}</p>
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
                  <Plus className="mr-1.5 size-3.5" /> Create Zone
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
            placeholder="Search zone, warehouse, barcode..."
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
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
        >
          <option value="ALL">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={String(w.id)}>
              {w.name}
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
            <Blocks className="size-12 opacity-30" />
            <p className="text-sm">
              {zones.length
                ? "No zones match your filters."
                : "No zones yet. Create your first zone."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Zone ID</TableHead>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Max/Min</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-center">Barcode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleZones.map((z, idx) => (
                  <TableRow key={z.id} className="table-row-hover">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {z.zoneId || "-"}
                    </TableCell>
                    <TableCell className="font-medium">{z.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {z.zoneType || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {z.priority || "-"}
                    </TableCell>
                    <TableCell>
                      {z.maxCapacity || z.minCapacity ? (
                        <div className="text-xs">
                          <div>Max: {z.maxCapacity || "-"} {z.capacityUnit || ""}</div>
                          <div>Min: {z.minCapacity || "-"} {z.capacityUnit || ""}</div>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          z.isActive
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {z.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>{z.warehouse?.name ?? "-"}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openBarcodePreview(z)}
                        title="View Barcode"
                        disabled={!z.barcodeImage}
                        className="
      inline-flex items-center justify-center
      h-8 w-8
      rounded-md
      bg-blue-50
      text-blue-600
      transition-all duration-200
      hover:bg-blue-600
      hover:text-white
      hover:ring-blue-600
      hover:shadow-sm
      cursor-pointer
    "
                      >
                        <Barcode className="" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(z)}
                        >
                          <Pencil className="mr-1 size-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(z.id)}
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