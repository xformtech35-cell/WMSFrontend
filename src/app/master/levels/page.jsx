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
  Layers,
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
import { Switch } from "@/components/ui/switch";

async function exportLevelsExcel(items) {
  await exportWmsWorkbook({
    fileName: `levels_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Levels",
    title: "WMS Level Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Level ID", key: "levelId", width: 16 },
      { header: "Name", key: "name", width: 28 },
      { header: "Description", key: "description", width: 40 },
      { header: "Level Number", key: "levelNumber", width: 14, align: "right" },
      { header: "Height", key: "height", width: 18, align: "right" },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Max Weight (kg)", key: "maxWeightKg", width: 18, align: "right" },
      { header: "Max Items", key: "maxItems", width: 14, align: "right" },
      { header: "Status", key: "status", width: 14 },
      { header: "Rack", key: "rack", width: 20 },
      { header: "Aisle", key: "aisle", width: 20 },
      { header: "Zone", key: "zone", width: 24 },
      { header: "Warehouse", key: "warehouse", width: 28 },
      { header: "Created By", key: "createdBy", width: 20 },
      { header: "Remarks", key: "remarks", width: 30 },
    ],
    rows: items.map((l) => ({
      id: l.id,
      levelId: l.levelId ?? "",
      name: l.name ?? "",
      description: l.description ?? "",
      levelNumber: l.levelNumber ?? "",
      height: l.heightCm ? `${l.heightCm} ${l.unit || 'cm'}` : "",
      unit: l.unit ?? "cm",
      maxWeightKg: l.maxWeightKg ?? "",
      maxItems: l.maxItems ?? "",
      status: l.isActive ? "Active" : "Inactive",
      rack: l.rack?.rackId || l.rack?.name || "",
      aisle: l.rack?.aisle?.aisleNumber || l.rack?.aisle?.aisleId || "",
      zone: l.rack?.aisle?.zone?.name ?? "",
      warehouse: l.rack?.aisle?.zone?.warehouse?.name ?? "",
      createdBy: l.createdBy ?? "",
      remarks: l.remarks ?? "",
    })),
  });
  toast.success("Levels exported to Excel");
}

export default function LevelsPage() {
  // State for levels data
  const [levels, setLevels] = useState([]);
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
    levelId: "",
    name: "",
    description: "",
    levelNumber: "",
    heightCm: "",
    unit: "cm",
    maxWeightKg: "",
    maxItems: "",
    isActive: true,
    remarks: "",
    createdBy: "admin",
    rackId: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    fetchLevels();
    fetchRacks();
  }, []);

  const fetchLevels = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/levels");
      setLevels(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching levels:", error);
      toast.error("Failed to load levels.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRacks = async () => {
    try {
      const response = await api.get("/racks");
      setRacks(response.data?.data?.content || response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching racks:", error);
      toast.error("Failed to load racks.");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.levelId || formData.levelId.trim() === "") {
      errors.levelId = "Level ID is required";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Name is required";
    }
    if (!formData.levelNumber || parseInt(formData.levelNumber) <= 0) {
      errors.levelNumber = "Valid level number is required";
    }
    if (!formData.heightCm || parseFloat(formData.heightCm) <= 0) {
      errors.heightCm = "Valid height is required";
    }
    if (!formData.maxWeightKg || parseFloat(formData.maxWeightKg) <= 0) {
      errors.maxWeightKg = "Valid max weight is required";
    }
    if (!formData.maxItems || parseInt(formData.maxItems) <= 0) {
      errors.maxItems = "Valid max items is required";
    }
    if (!formData.rackId || formData.rackId === "") {
      errors.rackId = "Rack is required";
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

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare payload with all required fields
    const payload = {
      levelId: formData.levelId.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      levelNumber: parseInt(formData.levelNumber),
      heightCm: parseFloat(formData.heightCm),
      unit: formData.unit || "cm",
      maxWeightKg: parseFloat(formData.maxWeightKg),
      maxItems: parseInt(formData.maxItems),
      isActive: formData.isActive,
      createdBy: formData.createdBy || "admin",
      remarks: formData.remarks.trim(),
      rackId: Number(formData.rackId),
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        // Update existing level
        await update(`/levels/${editItem?.id}`, payload);
        toast.success("Level updated successfully");
      } else {
        // Create new level
        await CREATE("/levels", payload);
        toast.success("Level created successfully");
      }

      // Refresh the list
      await fetchLevels();

      // Close modal and reset form
      setOpen(false);
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving level:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to save level."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this level?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await DELETE(`/levels/${id}`);
      await fetchLevels();
      toast.success("Level deleted successfully");
    } catch (error) {
      console.error("Error deleting level:", error);
      toast.error(error?.response?.data?.detail || "Unable to delete level.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      levelId: "",
      name: "",
      description: "",
      levelNumber: "",
      heightCm: "",
      unit: "cm",
      maxWeightKg: "",
      maxItems: "",
      isActive: true,
      remarks: "",
      createdBy: "admin",
      rackId: "",
    });
    setFormErrors({});
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData({
      levelId: "",
      name: "",
      description: "",
      levelNumber: "",
      heightCm: "",
      unit: "cm",
      maxWeightKg: "",
      maxItems: "",
      isActive: true,
      remarks: "",
      createdBy: "admin",
      rackId: racks[0]?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      levelId: item.levelId || "",
      name: item.name || "",
      description: item.description || "",
      levelNumber: item.levelNumber?.toString() || "",
      heightCm: item.heightCm?.toString() || "",
      unit: item.unit || "cm",
      maxWeightKg: item.maxWeightKg?.toString() || "",
      maxItems: item.maxItems?.toString() || "",
      isActive: item.isActive !== undefined ? item.isActive : true,
      remarks: item.remarks || "",
      createdBy: item.createdBy || "admin",
      rackId: item.rackId || item.rack?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = levels;
    if (rackFilter !== "ALL") {
      list = list.filter(
        (l) => String(l.rackId ?? l.rack?.id ?? "") === rackFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          String(l.levelId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.description ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.rack?.rackId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.rack?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.rack?.aisle?.aisleNumber ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.rack?.aisle?.zone?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(l.rack?.aisle?.zone?.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q)
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [levels, search, rackFilter]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleLevels,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, rackFilter, levels?.length ?? 0],
  });

  const showInitialLoading = isLoading && !levels?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Level Master"
        description="Manage levels inside racks for item storage organization."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportLevelsExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Level
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
        title={editItem ? "Edit Level" : "Create Level"}
        description="Levels represent vertical storage tiers inside a rack."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          {/* Level ID */}
          <div className="space-y-1.5">
            <Label htmlFor="levelId">Level ID *</Label>
            <Input
              id="levelId"
              name="levelId"
              placeholder="e.g. L-01, L-02"
              value={formData.levelId}
              onChange={handleInputChange}
              className={formErrors.levelId ? "border-red-500" : ""}
            />
            {formErrors.levelId && (
              <p className="text-xs text-red-500">{formErrors.levelId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Unique identifier for this level (e.g., L-01, L-02, L-03)
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Level 1 - Bottom"
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
              placeholder="e.g. Bottom level for heavy items storage"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Level Number */}
          <div className="space-y-1.5">
            <Label htmlFor="levelNumber">Level Number *</Label>
            <Input
              id="levelNumber"
              name="levelNumber"
              type="number"
              min="1"
              placeholder="1"
              value={formData.levelNumber}
              onChange={handleInputChange}
              className={formErrors.levelNumber ? "border-red-500" : ""}
            />
            {formErrors.levelNumber && (
              <p className="text-xs text-red-500">{formErrors.levelNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Sequential number representing the level position (1 = bottom, 2 = next, etc.)
            </p>
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <Label htmlFor="heightCm">Height *</Label>
            <div className="flex gap-2">
              <Input
                id="heightCm"
                name="heightCm"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="100.0"
                value={formData.heightCm}
                onChange={handleInputChange}
                className={`flex-1 ${formErrors.heightCm ? "border-red-500" : ""}`}
              />
              <select
                id="unit"
                name="unit"
                className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm"
                value={formData.unit}
                onChange={handleInputChange}
              >
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="mm">mm</option>
                <option value="inch">in</option>
                <option value="ft">ft</option>
              </select>
            </div>
            {formErrors.heightCm && (
              <p className="text-xs text-red-500">{formErrors.heightCm}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Height of this level with unit of measurement
            </p>
          </div>

          {/* Max Weight */}
          <div className="space-y-1.5">
            <Label htmlFor="maxWeightKg">Max Weight (kg) *</Label>
            <Input
              id="maxWeightKg"
              name="maxWeightKg"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="500.0"
              value={formData.maxWeightKg}
              onChange={handleInputChange}
              className={formErrors.maxWeightKg ? "border-red-500" : ""}
            />
            {formErrors.maxWeightKg && (
              <p className="text-xs text-red-500">{formErrors.maxWeightKg}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum weight capacity for this level in kilograms
            </p>
          </div>

          {/* Max Items */}
          <div className="space-y-1.5">
            <Label htmlFor="maxItems">Max Items *</Label>
            <Input
              id="maxItems"
              name="maxItems"
              type="number"
              min="1"
              placeholder="50"
              value={formData.maxItems}
              onChange={handleInputChange}
              className={formErrors.maxItems ? "border-red-500" : ""}
            />
            {formErrors.maxItems && (
              <p className="text-xs text-red-500">{formErrors.maxItems}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum number of items this level can hold
            </p>
          </div>

          {/* Status / Active */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this level
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
            />
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

          {/* Created By */}
          <div className="space-y-1.5">
            <Label htmlFor="createdBy">Created By</Label>
            <Input
              id="createdBy"
              name="createdBy"
              placeholder="admin"
              value={formData.createdBy}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              Name of the person creating this level
            </p>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              name="remarks"
              placeholder="Additional notes"
              value={formData.remarks}
              onChange={handleInputChange}
            />
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
                  <Plus className="mr-1.5 size-3.5" /> Create Level
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
            placeholder="Search level ID, name, rack..."
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
            <Layers className="size-12 opacity-30" />
            <p className="text-sm">
              {levels.length
                ? "No levels match your filters."
                : "No levels yet. Create your first level."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Level ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Level #</TableHead>
                  <TableHead>Height</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Max Weight</TableHead>
                  <TableHead>Max Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rack</TableHead>
                  <TableHead>Aisle</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLevels.map((l, idx) => (
                  <TableRow key={l.id} className="table-row-hover">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {l.levelId || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.name || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {l.levelNumber || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {l.heightCm ? `${l.heightCm}` : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {l.unit || "cm"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {l.maxWeightKg ? `${l.maxWeightKg} kg` : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {l.maxItems || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={l.isActive ? "Active" : "Inactive"} 
                        variant={l.isActive ? "success" : "secondary"}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      {l.rack?.rackId || l.rack?.rackIdentifier || l.rackName || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {l.rack?.aisle?.aisleNumber || l.rack?.aisle?.aisleId || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {l.rack?.aisle?.zone?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(l)}
                        >
                          <Pencil className="mr-1 size-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(l.id)}
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