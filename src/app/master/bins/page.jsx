"use client";

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
  Barcode,
  Printer,
  Warehouse,
  Layers,
  MapPin,
  Boxes,
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
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { downloadImage } from "@/components/downloadImage64";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      {
        header: "Max Weight (g)",
        key: "maxWeightG",
        width: 16,
        align: "right",
      },
      { header: "Min Capacity", key: "minCapacity", width: 16, align: "right" },
      { header: "Max Capacity", key: "maxCapacity", width: 16, align: "right" },
      { header: "Capacity Unit", key: "capacityUnit", width: 14 },
      { header: "Volume (cm³)", key: "volumeCm3", width: 16, align: "right" },
      {
        header: "Utilization %",
        key: "utilizationPercentage",
        width: 14,
        align: "right",
      },
      { header: "Status", key: "status", width: 14 },
      { header: "Level", key: "level", width: 20 },
      { header: "Rack", key: "rack", width: 20 },
      { header: "Aisle", key: "aisle", width: 20 },
      { header: "Zone", key: "zone", width: 24 },
      { header: "Warehouse", key: "warehouse", width: 28 },
      { header: "Full Location", key: "fullLocation", width: 40 },
      { header: "Stock Quantity", key: "stockQuantity", width: 16, align: "right" },
      { header: "Item Types", key: "itemTypes", width: 16, align: "right" },
    ],
    rows: items.map((b) => ({
      id: b.id,
      barcode: b.barcode ?? "",
      dimensions:
        b.lengthCm && b.widthCm && b.heightCm
          ? `${b.lengthCm} × ${b.widthCm} × ${b.heightCm}`
          : "",
      lengthCm: b.lengthCm ?? "",
      widthCm: b.widthCm ?? "",
      heightCm: b.heightCm ?? "",
      unit: b.unit ?? "cm",
      maxWeightG: b.maxWeightG ?? "",
      minCapacity: b.minCapacity ?? "",
      maxCapacity: b.maxCapacity ?? "",
      capacityUnit: b.capacityUnit ?? "pic",
      volumeCm3: b.volumeCm3 ?? "",
      utilizationPercentage: b.utilizationPercentage ?? b.utilizationPct ?? 0,
      status: b.status ?? "AVAILABLE",
      level: b.levelName || b.level?.levelId || b.level?.name || "",
      rack: b.rackName || b.level?.rack?.rackId || b.level?.rack?.name || "",
      aisle: b.level?.rack?.aisle?.aisleNumber || b.level?.rack?.aisle?.aisleId || "",
      zone: b.level?.rack?.aisle?.zone?.name ?? "",
      warehouse: b.level?.rack?.aisle?.zone?.warehouse?.name ?? "",
      fullLocation: b.fullLocation || "",
      stockQuantity: b.stockSummary?.totalQuantity ?? 0,
      itemTypes: b.stockSummary?.uniqueItemsCount ?? 0,
    })),
  });
  toast.success("Bins exported to Excel");
}

export default function BinsPage() {
  // State for bins data
  const [bins, setBins] = useState([]);
  const [racks, setRacks] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // State for barcode preview
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");
  const [rackFilter, setRackFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // State for form data
  const [formData, setFormData] = useState({
    barcode: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    unit: "cm",
    maxWeightG: "",
    minCapacity: "",
    maxCapacity: "",
    capacityUnit: "pic",
    status: "AVAILABLE",
    rackId: "",
    levelId: "",
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
    fetchLevels();
  }, []);

  const fetchBins = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/bins");
      setBins(
        response.data?.data?.content ||
          response.data?.content ||
          response.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching bins:", error);
      toast.error("Failed to load bins.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRacks = async () => {
    try {
      const response = await api.get("/racks");
      setRacks(
        response.data?.data?.content ||
          response.data?.content ||
          response.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching racks:", error);
      toast.error("Failed to load racks.");
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await api.get("/levels");
      setLevels(
        response.data?.data?.content ||
          response.data?.content ||
          response.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching levels:", error);
      toast.error("Failed to load levels.");
    }
  };

  const downloadBarcode = (item) => {
    if (item?.barcodeImage) {
      downloadImage(
        item.barcodeImage,
        `barcode_${item.barcode || item.id}.png`,
      );
    } else {
      toast.error("No barcode image available to download");
    }
  };

  const openBarcodePreview = (bin) => {
    setSelectedBin(bin);
    setBarcodeDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.barcode || formData.barcode.trim() === "") {
      errors.barcode = "Barcode is required";
    }
    if (!formData.rackId || formData.rackId === "") {
      errors.rackId = "Rack is required";
    }
    if (!formData.levelId || formData.levelId === "") {
      errors.levelId = "Level is required";
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
    if (!formData.maxCapacity || parseFloat(formData.maxCapacity) <= 0) {
      errors.maxCapacity = "Valid max capacity is required";
    }
    if (formData.minCapacity && parseFloat(formData.minCapacity) < 0) {
      errors.minCapacity = "Min capacity cannot be negative";
    }
    if (formData.minCapacity && formData.maxCapacity && 
        parseFloat(formData.minCapacity) > parseFloat(formData.maxCapacity)) {
      errors.minCapacity = "Min capacity cannot exceed max capacity";
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
      barcode: formData.barcode.trim().toUpperCase(),
      lengthCm: parseFloat(formData.lengthCm),
      widthCm: parseFloat(formData.widthCm),
      heightCm: parseFloat(formData.heightCm),
      unit: formData.unit || "cm",
      maxWeightG: parseFloat(formData.maxWeightG),
      minCapacity: formData.minCapacity ? parseFloat(formData.minCapacity) : null,
      maxCapacity: parseFloat(formData.maxCapacity),
      capacityUnit: formData.capacityUnit || "pic",
      status: formData.status,
      rackId: Number(formData.rackId),
      levelId: Number(formData.levelId),
    };

    try {
      setIsSubmitting(true);

      if (editItem) {
        await update(`/bins/${editItem?.id}`, payload);
        toast.success("Bin updated successfully");
      } else {
        await CREATE("/bins", payload);
        toast.success("Bin created successfully");
      }

      await fetchBins();
      setOpen(false);
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.error("Error saving bin:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to save bin.",
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
      await DELETE(`/bins/${id}`);
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
      minCapacity: "",
      maxCapacity: "",
      capacityUnit: "pic",
      status: "AVAILABLE",
      rackId: "",
      levelId: "",
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
      minCapacity: "",
      maxCapacity: "",
      capacityUnit: "pic",
      status: "AVAILABLE",
      rackId: racks[0]?.id || "",
      levelId: levels[0]?.id || "",
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
      maxWeightG:
        item.maxWeightG?.toString() || item.max_weight_g?.toString() || "",
      minCapacity: item.minCapacity?.toString() || "",
      maxCapacity: item.maxCapacity?.toString() || "",
      capacityUnit: item.capacityUnit || "pic",
      status: item.status || "AVAILABLE",
      rackId: item.rackId || item.rack?.id || "",
      levelId: item.levelId || item.level?.id || "",
    });
    setFormErrors({});
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = bins;
    if (rackFilter !== "ALL") {
      list = list.filter(
        (b) => String(b.rackId ?? b.rack?.id ?? "") === rackFilter,
      );
    }
    if (levelFilter !== "ALL") {
      list = list.filter(
        (b) => String(b.levelId ?? b.level?.id ?? "") === levelFilter,
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
          String(b.rackName ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.levelName ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.levelId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.rack?.rackId ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.rack?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.rack?.aisle?.aisleNumber ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.rack?.aisle?.zone?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.level?.rack?.aisle?.zone?.warehouse?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          String(b.fullLocation ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [bins, search, rackFilter, levelFilter]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleBins,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, rackFilter, levelFilter, bins?.length ?? 0],
  });

  const showInitialLoading = isLoading && !bins?.length;

  // Helper function to get utilization color
  const getUtilizationColor = (value) => {
    if (value >= 90) return "bg-red-500";
    if (value >= 70) return "bg-yellow-500";
    if (value >= 30) return "bg-blue-500";
    return "bg-green-500";
  };

  // Helper function to get status color for text
  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE": return "text-green-600";
      case "FULL": return "text-yellow-600";
      case "BLOCKED": return "text-red-600";
      default: return "text-gray-600";
    }
  };

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

      {/* Barcode Preview Dialog */}
      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogContent className="sm:max-w-md h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="size-4" />
              Bin Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedBin && (
              <>
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed w-full">
                  {selectedBin.barcodeImage ? (
                    <img
                      src={`data:image/png;base64,${selectedBin.barcodeImage}`}
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
                    <strong>Barcode:</strong> {selectedBin.barcode || "-"}
                  </p>
                  <p>
                    <strong>Full Location:</strong>{" "}
                    {selectedBin.fullLocation || "-"}
                  </p>
                  <p>
                    <strong>Warehouse:</strong>{" "}
                    {selectedBin.level?.rack?.aisle?.zone?.warehouse?.name ||
                      selectedBin.level?.rack?.aisle?.zone?.warehouse?.warehouseId ||
                      "-"}
                  </p>
                  <p>
                    <strong>Zone:</strong>{" "}
                    {selectedBin.level?.rack?.aisle?.zone?.name ||
                      selectedBin.level?.rack?.aisle?.zone?.zoneId ||
                      "-"}
                  </p>
                  <p>
                    <strong>Aisle:</strong>{" "}
                    {selectedBin.level?.rack?.aisle?.aisleNumber ||
                      selectedBin.level?.rack?.aisle?.aisleId ||
                      "-"}
                  </p>
                  <p>
                    <strong>Rack:</strong>{" "}
                    {selectedBin.rackName ||
                      selectedBin.level?.rack?.rackId ||
                      selectedBin.level?.rack?.name ||
                      "-"}
                  </p>
                  <p>
                    <strong>Level:</strong>{" "}
                    {selectedBin.levelName ||
                      selectedBin.level?.levelId ||
                      selectedBin.level?.name ||
                      "-"}
                    {selectedBin.level?.levelNumber && ` (#${selectedBin.level.levelNumber})`}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={getStatusColor(selectedBin.status)}>
                      {selectedBin.status || "AVAILABLE"}
                    </span>
                  </p>
                  <p>
                    <strong>Dimensions:</strong>{" "}
                    {selectedBin.lengthCm &&
                    selectedBin.widthCm &&
                    selectedBin.heightCm
                      ? `${selectedBin.lengthCm} × ${selectedBin.widthCm} × ${selectedBin.heightCm} ${selectedBin.unit || "cm"}`
                      : "-"}
                  </p>
                  <p>
                    <strong>Volume:</strong>{" "}
                    {selectedBin.volumeCm3
                      ? `${selectedBin.volumeCm3.toLocaleString()} ${selectedBin.unit || "cm"}³`
                      : "-"}
                  </p>
                  <p>
                    <strong>Max Weight:</strong>{" "}
                    {selectedBin.maxWeightG
                      ? `${selectedBin.maxWeightG.toLocaleString()} g (${(selectedBin.maxWeightG / 1000).toFixed(2)} kg)`
                      : "-"}
                  </p>
                  <p>
                    <strong>Min Capacity:</strong>{" "}
                    {selectedBin.minCapacity
                      ? `${selectedBin.minCapacity} ${selectedBin.capacityUnit || "pic"}`
                      : "-"}
                  </p>
                  <p>
                    <strong>Max Capacity:</strong>{" "}
                    {selectedBin.maxCapacity
                      ? `${selectedBin.maxCapacity} ${selectedBin.capacityUnit || "pic"}`
                      : "-"}
                  </p>
                  <p>
                    <strong>Utilization:</strong>{" "}
                    {selectedBin.utilizationPercentage || 0}%
                  </p>
                  {selectedBin.stockSummary && (
                    <>
                      <hr className="my-2" />
                      <p className="font-medium">Stock Summary</p>
                      <p>
                        <strong>Total Quantity:</strong>{" "}
                        {selectedBin.stockSummary.totalQuantity || 0}
                      </p>
                      <p>
                        <strong>Stock In:</strong>{" "}
                        {selectedBin.stockSummary.stockin || 0}
                      </p>
                      <p>
                        <strong>Available:</strong>{" "}
                        {selectedBin.stockSummary.availableSlots || 0}
                      </p>
                      <p>
                        <strong>Reserved:</strong>{" "}
                        {selectedBin.stockSummary.reservedQuantity || 0}
                      </p>
                      <p>
                        <strong>In Transit:</strong>{" "}
                        {selectedBin.stockSummary.inTransitQuantity || 0}
                      </p>
                      <p>
                        <strong>Unique Items:</strong>{" "}
                        {selectedBin.stockSummary.uniqueItemsCount || 0}
                      </p>
                      <p>
                        <strong>Has Stock:</strong>{" "}
                        {selectedBin.stockSummary.hasStock ? "Yes" : "No"}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    className="flex-1"
                    onClick={() => downloadBarcode(selectedBin)}
                    disabled={!selectedBin.barcodeImage}
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
        title={editItem ? "Edit Bin" : "Create Bin"}
        description="Bins are storage locations inside a rack for inventory placement."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
        >
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

          {volume > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">
                Volume:{" "}
                <span className="font-medium text-foreground">
                  {volume.toLocaleString()} {formData.unit}³
                </span>
                {" • "}
                Max Weight:{" "}
                <span className="font-medium text-foreground">
                  {formData.maxWeightG
                    ? `${(parseFloat(formData.maxWeightG) / 1000).toFixed(2)} kg`
                    : "-"}
                </span>
              </p>
            </div>
          )}

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

          {/* Capacity Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="minCapacity">Min Capacity</Label>
              <Input
                id="minCapacity"
                name="minCapacity"
                type="number"
                step="1"
                min="0"
                placeholder="500"
                value={formData.minCapacity}
                onChange={handleInputChange}
                className={formErrors.minCapacity ? "border-red-500" : ""}
              />
              {formErrors.minCapacity && (
                <p className="text-xs text-red-500">{formErrors.minCapacity}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxCapacity">Max Capacity *</Label>
              <Input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                step="1"
                min="1"
                placeholder="1000"
                value={formData.maxCapacity}
                onChange={handleInputChange}
                className={formErrors.maxCapacity ? "border-red-500" : ""}
              />
              {formErrors.maxCapacity && (
                <p className="text-xs text-red-500">{formErrors.maxCapacity}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacityUnit">Capacity Unit</Label>
            <select
              id="capacityUnit"
              name="capacityUnit"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={formData.capacityUnit}
              onChange={handleInputChange}
            >
              <option value="pic">Pieces (pic)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="lb">Pounds (lb)</option>
              <option value="oz">Ounces (oz)</option>
              <option value="l">Liters (l)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="gal">Gallons (gal)</option>
              <option value="ctn">Cartons (ctn)</option>
              <option value="pal">Pallets (pal)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Unit for capacity measurements (min/max capacity)
            </p>
          </div>

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
                  {r.aisle?.aisleNumber
                    ? ` (Aisle: ${r.aisle.aisleNumber})`
                    : ""}
                  {r.aisle?.zone?.name ? ` @ ${r.aisle.zone.name}` : ""}
                </option>
              ))}
            </select>
            {formErrors.rackId && (
              <p className="text-xs text-red-500">{formErrors.rackId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="levelId">Level *</Label>
            <select
              id="levelId"
              name="levelId"
              className={`h-9 w-full rounded-md border border-input bg-background px-3 text-sm ${
                formErrors.levelId ? "border-red-500" : ""
              }`}
              value={formData.levelId}
              onChange={handleInputChange}
            >
              <option value="">Select level</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.levelId || `Level ${l.id}`}
                  {l.name ? ` - ${l.name}` : ""}
                  {l.levelNumber ? ` (#${l.levelNumber})` : ""}
                </option>
              ))}
            </select>
            {formErrors.levelId && (
              <p className="text-xs text-red-500">{formErrors.levelId}</p>
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
            placeholder="Search barcode, rack, level, zone, location..."
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

        <div className="flex gap-2">
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

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            {levels.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.levelId || `Level ${l.id}`}
                {l.name ? ` - ${l.name}` : ""}
              </option>
            ))}
          </select>
        </div>
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
                  <TableHead className="min-w-32">Location</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Max Weight</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead className="min-w-44">Utilization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-24">Stock</TableHead>
                  <TableHead className="text-center">Barcode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBins.map((b, idx) => {
                  const length = b.lengthCm ?? b.length_cm;
                  const width = b.widthCm ?? b.width_cm;
                  const height = b.heightCm ?? b.height_cm;
                  const maxWeight = b.maxWeightG ?? b.max_weight_g;
                  const utilization = b.utilizationPercentage ?? b.utilization ?? b.utilizationPct ?? 0;
                  const volume = b.volumeCm3 || (length && width && height
                    ? (length * width * height).toLocaleString()
                    : "-");
                  const unit = b.unit || "cm";
                  const hasStock = b.stockSummary?.hasStock || false;
                  const totalQuantity = b.stockSummary?.totalQuantity || 0;
                  const uniqueItems = b.stockSummary?.uniqueItemsCount || 0;
                  const minCapacity = b.minCapacity;
                  const maxCapacity = b.maxCapacity;
                  const capacityUnit = b.capacityUnit || "pic";

                  // Build location hierarchy
                  const locationParts = [
                    b.level?.rack?.aisle?.zone?.warehouse?.warehouseId || b.level?.rack?.aisle?.zone?.warehouse?.name,
                    b.level?.rack?.aisle?.zone?.zoneId || b.level?.rack?.aisle?.zone?.name,
                    b.level?.rack?.aisle?.aisleId || b.level?.rack?.aisle?.aisleNumber,
                    b.rackName || b.level?.rack?.rackId || b.level?.rack?.name,
                    b.levelName || b.level?.levelId || b.level?.name,
                  ].filter(Boolean);
                  
                  const locationDisplay = locationParts.length > 0 
                    ? locationParts.join(" › ")
                    : b.fullLocation?.split("-").pop() || "-";

                  return (
                    <TableRow key={b.id} className="table-row-hover">
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {b.barcode || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help flex items-center gap-1">
                                <MapPin className="size-3 text-muted-foreground" />
                                {locationDisplay.length > 30 
                                  ? locationDisplay.slice(0, 30) + "..."
                                  : locationDisplay}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-0.5 text-xs">
                                <p><strong>Full Location:</strong> {b.fullLocation || "N/A"}</p>
                                <p><strong>Warehouse:</strong> {b.level?.rack?.aisle?.zone?.warehouse?.name || "-"}</p>
                                <p><strong>Zone:</strong> {b.level?.rack?.aisle?.zone?.name || "-"}</p>
                                <p><strong>Aisle:</strong> {b.level?.rack?.aisle?.aisleNumber || b.level?.rack?.aisle?.aisleId || "-"}</p>
                                <p><strong>Rack:</strong> {b.rackName || b.level?.rack?.rackId || "-"}</p>
                                <p><strong>Level:</strong> {b.levelName || b.level?.levelId || "-"}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {length && width && height
                          ? `${length} × ${width} × ${height} ${unit}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {maxWeight
                          ? `${(maxWeight / 1000).toFixed(1)} kg`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {minCapacity && maxCapacity
                                  ? `${minCapacity} - ${maxCapacity} ${capacityUnit}`
                                  : maxCapacity
                                    ? `≤ ${maxCapacity} ${capacityUnit}`
                                    : "-"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-0.5 text-xs">
                                <p><strong>Min Capacity:</strong> {minCapacity || "N/A"} {capacityUnit}</p>
                                <p><strong>Max Capacity:</strong> {maxCapacity || "N/A"} {capacityUnit}</p>
                                <p><strong>Unit:</strong> {capacityUnit}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {typeof volume === 'number' || !isNaN(volume) 
                          ? `${volume} ${unit}³` 
                          : "-"}
                      </TableCell>
                      <TableCell className="min-w-44">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={utilization}
                            className={`h-1.5 flex-1 ${getUtilizationColor(utilization)}`}
                          />
                          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                            {utilization}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status || "AVAILABLE"} />
                      </TableCell>
                      <TableCell>
                        {hasStock ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                  <Package className="size-3.5 text-blue-500" />
                                  <span className="text-xs font-medium">
                                    {b.stockSummary?.stockin || 0}
                                  </span>
                                  {uniqueItems > 1 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      ({uniqueItems} types)
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-0.5 text-xs">
                                  <p><strong>Stock In:</strong> {b.stockSummary?.stockin || 0} units</p>
                                  <p><strong>Available:</strong> {b.stockSummary?.availableSlots || 0}</p>
                                  <p><strong>Reserved:</strong> {b.stockSummary?.reservedQuantity || 0}</p>
                                  <p><strong>In Transit:</strong> {b.stockSummary?.inTransitQuantity || 0}</p>
                                  <p><strong>Item Types:</strong> {uniqueItems}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-xs text-muted-foreground">Empty</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openBarcodePreview(b)}
                          title="View Barcode"
                          disabled={!b.barcodeImage}
                          className={`
                            inline-flex items-center justify-center
                            h-8 w-8
                            rounded-md
                            transition-all duration-200
                            cursor-pointer
                            ${b.barcodeImage 
                              ? "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:ring-blue-600 hover:shadow-sm"
                              : "opacity-50 cursor-not-allowed"
                            }
                          `}
                        >
                          <Barcode className="size-4" />
                        </Button>
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