"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Search,
  Trash2,
  X,
  Barcode,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadImage } from "@/components/downloadImage64";

async function exportWarehousesExcel(items) {
  await exportWmsWorkbook({
    fileName: `warehouses_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    sheetName: "Warehouses",
    title: "WMS Warehouse Master Export",
    columns: [
      { header: "ID", key: "id", width: 10, align: "right" },
      { header: "Warehouse ID", key: "warehouseId", width: 12 },
      { header: "Name", key: "name", width: 28 },
      { header: "Location", key: "location", width: 24 },
      { header: "Address", key: "address", width: 30 },
      { header: "Contact Person", key: "contactPerson", width: 20 },
      { header: "Contact Phone", key: "contactPhone", width: 18 },
      { header: "Contact Email", key: "contactEmail", width: 28 },
      { header: "Capacity", key: "capacity", width: 12, align: "right" },
      { header: "Status", key: "isActive", width: 10 },
      { header: "Remarks", key: "remarks", width: 30 },
    ],
    rows: items.map((w) => ({
      id: w.id,
      warehouseId: w.warehouseId ?? "",
      name: w.name ?? "",
      location: w.location ?? "",
      address: w.address ?? "",
      contactPerson: w.contactPerson ?? "",
      contactPhone: w.contactPhone ?? "",
      contactEmail: w.contactEmail ?? "",
      capacity: w.capacity ?? "",
      isActive: w.isActive ? "Active" : "Inactive",
      remarks: w.remarks ?? "",
    })),
  });
  toast.success("Warehouses exported to Excel");
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
  return apiRequest("/warehouses", "POST", data);
};

const updateAPI = async (id, data) => {
  return apiRequest(`/warehouses/${id}`, "PUT", data);
};

export default function WarehousesPage() {
  // State for warehouses data
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for search
  const [search, setSearch] = useState("");

  // State for form data
  const [formData, setFormData] = useState({
    warehouseId: "",
    name: "",
    location: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    capacity: "",
    remarks: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch warehouses on component mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/master/warehouses");
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to load warehouses.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.warehouseId || formData.warehouseId.trim() === "") {
      errors.warehouseId = "Warehouse ID is required";
    }
    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Warehouse name is required";
    }
    if (!formData.location || formData.location.trim() === "") {
      errors.location = "Location is required";
    }
    if (!formData.address || formData.address.trim() === "") {
      errors.address = "Address is required";
    }
    if (
      formData.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
    ) {
      errors.contactEmail = "Invalid email format";
    }
    if (formData.capacity && formData.capacity < 0) {
      errors.capacity = "Capacity must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const downloadBarcode = (item) => {
    if (item?.barcodeImage) {
      downloadImage(
        item.barcodeImage,
        `barcode_${item.warehouseId || item.id}.png`,
      );
    } else {
      toast.error("No barcode image available to download");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      warehouseId: formData.warehouseId.trim(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      address: formData.address.trim(),
      contactPerson: formData.contactPerson?.trim() || "",
      contactPhone: formData.contactPhone?.trim() || "",
      contactEmail: formData.contactEmail?.trim() || "",
      capacity: formData.capacity ? Number(formData.capacity) : 0,
      remarks: formData.remarks?.trim() || "",
      isActive: true,
      createdBy: "admin",
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        const { createdBy, ...updatePayload } = payload;
        await updateAPI(`${editItem.id}`, updatePayload);
        toast.success("Warehouse updated successfully.");
      } else {
        await createAPI(payload);
        toast.success("Warehouse created successfully.");
      }

      await fetchWarehouses();
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
          "Failed to save warehouse.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/master/warehouses/${id}`);
      toast.success("Warehouse deleted successfully.");
      await fetchWarehouses();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      toast.error(
        error?.response?.data?.detail || "Unable to delete warehouse.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      warehouseId: "",
      name: "",
      location: "",
      address: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      capacity: "",
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
      warehouseId: item.warehouseId || "",
      name: item.name || "",
      location: item.location || "",
      address: item.address || "",
      contactPerson: item.contactPerson || "",
      contactPhone: item.contactPhone || "",
      contactEmail: item.contactEmail || "",
      capacity: item.capacity || "",
      remarks: item.remarks || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const openPreview = (item) => {
    setPreviewItem(item);
    setPreviewDialogOpen(true);
  };

  const filtered = useMemo(() => {
    let list = warehouses;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = warehouses.filter(
        (w) =>
          String(w.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(w.location ?? "")
            .toLowerCase()
            .includes(q) ||
          String(w.address ?? "")
            .toLowerCase()
            .includes(q) ||
          String(w.warehouseId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(w.contactPerson ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [warehouses, search]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleWarehouses,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, warehouses?.length ?? 0],
  });

  const showInitialLoading = isLoading && !warehouses?.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Warehouse Master"
        description="Manage warehouse locations used by zones and aisle hierarchy."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportWarehousesExcel(filtered)}
              disabled={!filtered.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-3.5" /> Create Warehouse
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
        title={editItem ? "Edit Warehouse" : "Create Warehouse"}
        description="Use a clear warehouse name and physical location for operations."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
          <div className="space-y-1.5">
            <Label htmlFor="warehouseId">Warehouse ID</Label>
            <Input
              id="warehouseId"
              name="warehouseId"
              placeholder="e.g. WH-001"
              value={formData.warehouseId}
              onChange={handleInputChange}
              disabled={!!editItem}
              className={formErrors.warehouseId ? "border-red-500" : ""}
            />
            {formErrors.warehouseId && (
              <p className="text-xs text-red-500">{formErrors.warehouseId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Warehouse Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Main DC"
              value={formData.name}
              onChange={handleInputChange}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. Mumbai - Bhiwandi"
              value={formData.location}
              onChange={handleInputChange}
              className={formErrors.location ? "border-red-500" : ""}
            />
            {formErrors.location && (
              <p className="text-xs text-red-500">{formErrors.location}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="e.g. 123, Industrial Area, Andheri East"
              value={formData.address}
              onChange={handleInputChange}
              className={formErrors.address ? "border-red-500" : ""}
            />
            {formErrors.address && (
              <p className="text-xs text-red-500">{formErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                placeholder="e.g. John Doe"
                value={formData.contactPerson}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                placeholder="e.g. +91-9876543210"
                value={formData.contactPhone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              placeholder="e.g. john.doe@company.com"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className={formErrors.contactEmail ? "border-red-500" : ""}
            />
            {formErrors.contactEmail && (
              <p className="text-xs text-red-500">{formErrors.contactEmail}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              placeholder="e.g. 10000"
              value={formData.capacity}
              onChange={handleInputChange}
              className={formErrors.capacity ? "border-red-500" : ""}
            />
            {formErrors.capacity && (
              <p className="text-xs text-red-500">{formErrors.capacity}</p>
            )}
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
                  <Plus className="mr-1.5 size-3.5" /> Create Warehouse
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SlideOverForm>

      {/* Barcode Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="size-4" />
              Warehouse Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {previewItem && (
              <>
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed w-full">
                  {previewItem.barcodeImage ? (
                    <img
                      src={`data:image/png;base64,${previewItem.barcodeImage}`}
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
                    <strong>Warehouse ID:</strong>{" "}
                    {previewItem.warehouseId || "-"}
                  </p>
                  <p>
                    <strong>Name:</strong> {previewItem.name || "-"}
                  </p>
                  <p>
                    <strong>Location:</strong> {previewItem.location || "-"}
                  </p>
                  <p>
                    <strong>Barcode Data:</strong>{" "}
                    {previewItem.barcodeData || previewItem.warehouseId || "-"}
                  </p>
                  <p>
                    <strong>Format:</strong>{" "}
                    {previewItem.barcodeFormat || "CODE128"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={
                        previewItem.isActive ? "text-green-600" : "text-red-600"
                      }
                    >
                      {previewItem.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    className="flex-1"
                    onClick={() => downloadBarcode(previewItem)}
                    disabled={!previewItem.barcodeImage}
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

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search warehouse or location..."
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
            <Building2 className="size-12 opacity-30" />
            <p className="text-sm">
              {warehouses.length
                ? "No warehouses match the search."
                : "No warehouses yet. Create your first warehouse."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Warehouse ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-center">Barcode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleWarehouses.map((w, idx) => (
                  <TableRow key={w.id} className="table-row-hover">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {w.warehouseId || w.id}
                    </TableCell>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>{w.location}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{w.contactPerson || "-"}</div>
                        <div className="text-muted-foreground">
                          {w.contactEmail || "-"}
                        </div>
                        <div className="text-muted-foreground">
                          {w.contactPhone || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{w.capacity || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(w)}
                        title="View Barcode"
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
                          onClick={() => openEdit(w)}
                        >
                          <Pencil className="mr-1 size-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(w.id)}
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
