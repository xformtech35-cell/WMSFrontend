"use client";

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
  Weight,
  Ruler,
  Palette,
  Grip,
  Package,
  DollarSign,
  Ruler as RulerIcon,
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

// Rock Types
const ROCK_TYPES = [
  "GRANITE",
  "MARBLE",
  "LIMESTONE",
  "SANDSTONE",
  "BASALT",
  "QUARTZITE",
  "SLATE",
  "GNEISS",
  "SCHIST",
  "OTHER",
];

// Unit Types
const UNIT_TYPES = ["M", "CM", "MM", "INCH", "FEET", "YARD"];

async function exportRocksExcel(items) {
  await exportWmsWorkbook({
    fileName: `rocks_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Rocks",
    title: "WMS Rock Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Rock ID", key: "rockId", width: 14 },
      { header: "Name", key: "name", width: 28 },
      { header: "Weight (kg)", key: "weightKg", width: 14, align: "right" },
      { header: "Length (cm)", key: "lengthCm", width: 14, align: "right" },
      { header: "Width (cm)", key: "widthCm", width: 14, align: "right" },
      { header: "Height (cm)", key: "heightCm", width: 14, align: "right" },
      { header: "Density (g/cm³)", key: "densityGcm3", width: 16, align: "right" },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Quantity", key: "quantity", width: 12, align: "right" },
      { header: "Min Quantity", key: "minQuantity", width: 14, align: "right" },
      { header: "Max Quantity", key: "maxQuantity", width: 14, align: "right" },
      { header: "Warehouse", key: "warehouse", width: 24 },
      { header: "Status", key: "isActive", width: 10 },
      { header: "Remarks", key: "remarks", width: 30 },
    ],
    rows: items.map((r) => ({
      id: r.id,
      rockId: r.rockId ?? "",
      name: r.name ?? "",
      weightKg: r.weightKg ?? "",
      lengthCm: r.lengthCm ?? "",
      widthCm: r.widthCm ?? "",
      heightCm: r.heightCm ?? "",
      densityGcm3: r.densityGcm3 ?? "",
      unit: r.unit ?? "",
      quantity: r.quantity ?? "",
      minQuantity: r.minQuantity ?? "",
      maxQuantity: r.maxQuantity ?? "",
      warehouse: r.warehouse?.name ?? r.warehouseId ?? "",
      isActive: r.isActive ? "Active" : "Inactive",
      remarks: r.remarks ?? "",
    })),
  });
  toast.success("Rocks exported to Excel");
}

const apiRequest = async (endpoint, method = "GET", data = null) => {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
    });

    const result = response.data;
    if (result && result.success === false) {
      throw new Error(
        result?.message || `API request failed: ${response.status}`,
      );
    }
    return result?.data || result;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "API request failed",
    );
  }
};

const createAPI = async (data) => {
  return apiRequest("/rocks", "POST", data);
};

const updateAPI = async (id, data) => {
  return apiRequest(`/rocks/${id}`, "PUT", data);
};

export default function RocksPage() {
  // State for rocks data
  const [rocks, setRocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for search
  const [search, setSearch] = useState("");

  // State for form data
  const [formData, setFormData] = useState({
    rockId: "",
    name: "",
    description: "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    densityGcm3: "",
    unit: "",
    isActive: true,
    quantity: "",
    minQuantity: "",
    maxQuantity: "",
    warehouseId: "",
    remarks: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch rocks and warehouses on component mount
  useEffect(() => {
    fetchRocks();
    fetchWarehouses();
  }, []);

  const fetchRocks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/rocks");
      setRocks(response.data?.data?.content || []);
      console.log(response.data?.data?.content || []);
    } catch (error) {
      console.error("Error fetching rocks:", error);
      toast.error("Failed to load rocks.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get("/warehouses");
      const data = response.data?.data?.content || response.data?.content || response.data || [];
      setWarehouses(data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.rockId || formData.rockId.trim() === "") {
      errors.rockId = "Rock ID is required";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Rock name is required";
    }
    if (!formData.warehouseId) {
      errors.warehouseId = "Warehouse is required";
    }
    if (!formData.unit) {
      errors.unit = "Unit is required";
    }
    if (formData.weightKg && parseFloat(formData.weightKg) < 0) {
      errors.weightKg = "Weight must be a positive number";
    }
    if (formData.quantity && parseInt(formData.quantity) < 0) {
      errors.quantity = "Quantity must be a positive number";
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
      rockId: formData.rockId.trim(),
      name: formData.name.trim(),
      description: formData.description?.trim() || "",
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
      lengthCm: formData.lengthCm ? parseFloat(formData.lengthCm) : null,
      widthCm: formData.widthCm ? parseFloat(formData.widthCm) : null,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
      densityGcm3: formData.densityGcm3 ? parseFloat(formData.densityGcm3) : null,
      unit: formData.unit,
      isActive: formData.isActive,
      quantity: formData.quantity ? parseInt(formData.quantity) : 0,
      minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : 0,
      maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : 0,
      warehouseId: parseInt(formData.warehouseId),
      remarks: formData.remarks?.trim() || "",
      createdBy: "admin",
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        // Update existing rock
        const { createdBy, ...updatePayload } = payload;
        await updateAPI(`${editItem.id}`, updatePayload);
        toast.success("Rock updated successfully.");
      } else {
        // Create new rock
        await createAPI(payload);
        toast.success("Rock created successfully.");
      }

      // Refresh the list
      await fetchRocks();

      // Close modal and reset form
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
          "Failed to save rock.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this rock?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/master/rocks/${id}`);
      toast.success("Rock deleted successfully.");
      await fetchRocks();
    } catch (error) {
      console.error("Error deleting rock:", error);
      toast.error(
        error?.response?.data?.detail || "Unable to delete rock.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rockId: "",
      name: "",
      description: "",
      weightKg: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      densityGcm3: "",
      unit: "",
      isActive: true,
      quantity: "",
      minQuantity: "",
      maxQuantity: "",
      warehouseId: "",
      remarks: "",
    });
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      rockId: item.rockId || "",
      name: item.name || "",
      description: item.description || "",
      weightKg: item.weightKg || "",
      lengthCm: item.lengthCm || "",
      widthCm: item.widthCm || "",
      heightCm: item.heightCm || "",
      densityGcm3: item.densityGcm3 || "",
      unit: item.unit || "",
      isActive: item.isActive !== undefined ? item.isActive : true,
      quantity: item.quantity || "",
      minQuantity: item.minQuantity || "",
      maxQuantity: item.maxQuantity || "",
      warehouseId: item.warehouse?.id || item.warehouseId || "",
      remarks: item.remarks || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = rocks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = rocks.filter(
        (r) =>
          String(r.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.rockId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.rockType ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.color ?? "")
            .toLowerCase()
            .includes(q) ||
          String(r.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [rocks, search]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleRocks,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, rocks?.length ?? 0],
  });

  const showInitialLoading = isLoading && !rocks?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rock Master"
        description="Manage rock types and their physical properties for warehouse storage."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportRocksExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Rock
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
        title={editItem ? "Edit Rock" : "Create Rock"}
        description="Define rock properties including physical dimensions and storage parameters."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rockId">Rock ID</Label>
              <Input
                id="rockId"
                name="rockId"
                placeholder="e.g. RCK-001"
                value={formData.rockId}
                onChange={handleInputChange}
                disabled={!!editItem}
                className={formErrors.rockId ? "border-red-500" : ""}
              />
              {formErrors.rockId && (
                <p className="text-xs text-red-500">{formErrors.rockId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Rock Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Granite Rock"
                value={formData.name}
                onChange={handleInputChange}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

         

          <div className="space-y-1.5">
            <Label>Physical Dimensions</Label>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="lengthCm" className="text-xs text-muted-foreground">
                  Length  
                </Label>
                <Input
                  id="lengthCm"
                  name="lengthCm"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  value={formData.lengthCm}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="widthCm" className="text-xs text-muted-foreground">
                  Width 
                </Label>
                <Input
                  id="widthCm"
                  name="widthCm"
                  type="number"
                  step="0.01"
                  placeholder="80"
                  value={formData.widthCm}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="heightCm" className="text-xs text-muted-foreground">
                  Height 
                </Label>
                <Input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  step="0.01"
                  placeholder="60"
                  value={formData.heightCm}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-xs text-muted-foreground">
                  Unit
                </Label>
                <select
                  id="unit"
                  name="unit"
                  className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm ${
                    formErrors.unit ? "border-red-500" : ""
                  }`}
                  value={formData.unit}
                  onChange={handleInputChange}
                >
                  <option value="">Select unit</option>
                  {UNIT_TYPES.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                {formErrors.unit && (
                  <p className="text-xs text-red-500">{formErrors.unit}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.01"
              placeholder="e.g. 50"
              value={formData.weightKg}
              onChange={handleInputChange}
              className={formErrors.weightKg ? "border-red-500" : ""}
            />
            {formErrors.weightKg && (
              <p className="text-xs text-red-500">{formErrors.weightKg}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="e.g. 100"
                value={formData.quantity}
                onChange={handleInputChange}
                className={formErrors.quantity ? "border-red-500" : ""}
              />
              {formErrors.quantity && (
                <p className="text-xs text-red-500">{formErrors.quantity}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minQuantity">Min Quantity</Label>
              <Input
                id="minQuantity"
                name="minQuantity"
                type="number"
                placeholder="e.g. 20"
                value={formData.minQuantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxQuantity">Max Quantity</Label>
              <Input
                id="maxQuantity"
                name="maxQuantity"
                type="number"
                placeholder="e.g. 200"
                value={formData.maxQuantity}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
          

            <div className="space-y-1.5">
              <Label htmlFor="warehouseId">Warehouse</Label>
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
                    {w.name} ({w.warehouseId})
                  </option>
                ))}
              </select>
              {formErrors.warehouseId && (
                <p className="text-xs text-red-500">{formErrors.warehouseId}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              name="remarks"
              placeholder="Optional remarks..."
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
              Active
            </Label>
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
                  <Plus className="mr-1.5 size-3.5" /> Create Rock
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SlideOverForm>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rock name, ID, or type..."
          className="h-9 pl-8 pr-8"
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
              {rocks.length
                ? "No rocks match the search."
                : "No rocks yet. Create your first rock."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Rock ID</TableHead>
                  <TableHead>Name</TableHead>
                  {/* <TableHead>Type</TableHead>
                  <TableHead>Color</TableHead> */}
                  <TableHead>Weight</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Qty</TableHead> 
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRocks.map((r, idx) => (
                  <TableRow key={r.id} className="table-row-hover">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.rockId || r.id}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell> 
                    <TableCell>{r.weightKg ? `${r.weightKg} kg` : "-"}</TableCell>
                    <TableCell>{r.unit || "-"}</TableCell>
                    <TableCell>{r.quantity || 0}</TableCell>
                    <TableCell>{r.warehouse?.name || "-"}</TableCell>
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