'use client';

import { useState, useMemo, useEffect } from "react";
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  Search,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaginatedItems } from "@/lib/hooks/usePaginatedItems";
import TablePagination from "@/components/TablePagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// QR Code Types
const QR_TYPES = ["QR_CODE", "BARCODE", "DATA_MATRIX"];
const LABEL_LEVELS = ["PALLET", "CASE", "ITEM", "BIN", "RACK", "ZONE", "WAREHOUSE"];
const LABEL_TYPES = ["GRN", "PICK", "PUTAWAY", "INVENTORY", "SHIPPING", "RECEIVING"];
const LABEL_FORMATS = ["PNG", "JPEG", "SVG", "PDF"];
const TEMPLATES = ["standard", "compact", "detailed", "warehouse"];

async function generateQRCode(payload) {
  const response = await api.post("/qr-codes/generate", payload);
  return response.data;
}

export default function QRCodeGeneratorPage() {
  // State for master data
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // State for form data
  const [formData, setFormData] = useState({
    qrType: "QR_CODE",
    labelLevel: "PALLET",
    labelType: "GRN",
    grnNumber: "",
    inboundId: "",
    inboundLineId: "",
    itemCode: "",
    itemName: "",
    batchNumber: "",
    serialNumbers: "",
    quantity: "",
    uom: "Nos",
    warehouseId: "",
    zoneId: "",
    aisleId: "",
    rackId: "",
    shelfId: "",
    binId: "",
    palletNumber: "",
    generatedBy: "admin",
    templateName: "standard",
    labelFormat: "PNG",
    remarks: "",
  });

  // State for QR history
  const [qrHistory, setQrHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [previewQr, setPreviewQr] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch master data
  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setIsLoadingMaster(true);
      
      const [warehousesRes, zonesRes, aislesRes, racksRes, binsRes] = await Promise.all([
        api.get("/warehouses").catch(() => ({ data: [] })),
        api.get("/zones").catch(() => ({ data: [] })),
        api.get("/aisles").catch(() => ({ data: [] })),
        api.get("/racks").catch(() => ({ data: [] })),
        api.get("/bins").catch(() => ({ data: [] })),
      ]);

      setWarehouses(warehousesRes.data?.data?.content || warehousesRes.data?.content || warehousesRes.data || []);
      setZones(zonesRes.data?.data?.content || zonesRes.data?.content || zonesRes.data || []);
      setAisles(aislesRes.data?.data?.content || aislesRes.data?.content || aislesRes.data || []);
      setRacks(racksRes.data?.data?.content || racksRes.data?.content || racksRes.data || []);
      setBins(binsRes.data?.data?.content || binsRes.data?.content || binsRes.data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data for dropdowns.");
    } finally {
      setIsLoadingMaster(false);
    }
  };

  // Get filtered zones based on selected warehouse
  const filteredZones = useMemo(() => {
    if (!formData.warehouseId) return zones;
    return zones.filter(z => z.warehouse?.id === parseInt(formData.warehouseId) || z.warehouseId === parseInt(formData.warehouseId));
  }, [zones, formData.warehouseId]);

  const filteredAisles = useMemo(() => {
    if (!formData.zoneId) return aisles;
    return aisles.filter(a => a.zone?.id === parseInt(formData.zoneId) || a.zoneId === parseInt(formData.zoneId));
  }, [aisles, formData.zoneId]);

  const filteredRacks = useMemo(() => {
    if (!formData.aisleId) return racks;
    return racks.filter(r => r.aisle?.id === parseInt(formData.aisleId) || r.aisleId === parseInt(formData.aisleId));
  }, [racks, formData.aisleId]);

  const filteredBins = useMemo(() => {
    if (!formData.rackId) return bins;
    return bins.filter(b => b.rack?.id === parseInt(formData.rackId) || b.rackId === parseInt(formData.rackId));
  }, [bins, formData.rackId]);

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

    if (name === "warehouseId") {
      setFormData((prev) => ({ ...prev, zoneId: "", aisleId: "", rackId: "", binId: "" }));
    } else if (name === "zoneId") {
      setFormData((prev) => ({ ...prev, aisleId: "", rackId: "", binId: "" }));
    } else if (name === "aisleId") {
      setFormData((prev) => ({ ...prev, rackId: "", binId: "" }));
    } else if (name === "rackId") {
      setFormData((prev) => ({ ...prev, binId: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.grnNumber || formData.grnNumber.trim() === "") {
      errors.grnNumber = "GRN Number is required";
    }
    if (!formData.itemCode || formData.itemCode.trim() === "") {
      errors.itemCode = "Item Code is required";
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
    }
    if (!formData.warehouseId) {
      errors.warehouseId = "Warehouse is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const selectedWarehouse = warehouses.find(w => w.id === parseInt(formData.warehouseId));
    const selectedZone = zones.find(z => z.id === parseInt(formData.zoneId));
    const selectedAisle = aisles.find(a => a.id === parseInt(formData.aisleId));
    const selectedRack = racks.find(r => r.id === parseInt(formData.rackId));
    const selectedBin = bins.find(b => b.id === parseInt(formData.binId));

    const payload = {
      qrType: formData.qrType,
      labelLevel: formData.labelLevel,
      labelType: formData.labelType,
      grnNumber: formData.grnNumber.trim(),
      inboundId: formData.inboundId ? parseInt(formData.inboundId) : null,
      inboundLineId: formData.inboundLineId ? parseInt(formData.inboundLineId) : null,
      itemCode: formData.itemCode.trim(),
      itemName: formData.itemName.trim(),
      batchNumber: formData.batchNumber.trim(),
      serialNumbers: formData.serialNumbers.trim(),
      quantity: parseInt(formData.quantity),
      uom: formData.uom,
      warehouseId: selectedWarehouse?.warehouseId || selectedWarehouse?.id || formData.warehouseId,
      zone: selectedZone?.zoneId || selectedZone?.name || "",
      aisle: selectedAisle?.aisleId || selectedAisle?.aisleNumber || "",
      rack: selectedRack?.rackId || selectedRack?.name || "",
      shelf: formData.shelfId || "",
      binId: selectedBin?.barcode || selectedBin?.binId || "",
      palletNumber: formData.palletNumber.trim(),
      generatedBy: "admin",
      templateName: formData.templateName,
      labelFormat: formData.labelFormat,
      remarks: formData.remarks.trim(),
    };

    try {
      setIsGenerating(true);
      const response = await generateQRCode(payload);
      
      // Extract QR data from response
      const qrData = response.data || response;
      
      // Add to history with QR image
      const newQr = {
        id: qrData.id || Date.now(),
        qrId: qrData.qrId,
        qrCode: qrData.qrCode,
        qrImage: qrData.qrImage, // Base64 image
        barcode: qrData.barcode,
        barcodeImage: qrData.barcodeImage,
        grnNumber: qrData.grnNumber || payload.grnNumber,
        itemCode: qrData.itemCode || payload.itemCode,
        itemName: qrData.itemName || payload.itemName,
        batchNumber: qrData.batchNumber || payload.batchNumber,
        quantity: qrData.quantity || payload.quantity,
        uom: qrData.uom || payload.uom,
        warehouseId: qrData.warehouseId || payload.warehouseId,
        zone: qrData.zone || payload.zone,
        aisle: qrData.aisle || payload.aisle,
        rack: qrData.rack || payload.rack,
        shelf: qrData.shelf || payload.shelf,
        binId: qrData.binId || payload.binId,
        palletNumber: qrData.palletNumber || payload.palletNumber,
        labelType: qrData.labelType || payload.labelType,
        labelLevel: qrData.labelLevel || payload.labelLevel,
        qrType: qrData.qrType || payload.qrType,
        status: qrData.status || "GENERATED",
        generatedAt: qrData.createdAt || new Date().toISOString(),
        generatedBy: qrData.generatedBy || payload.generatedBy,
        displayWarehouse: selectedWarehouse?.name || qrData.warehouseId,
        displayZone: selectedZone?.name || qrData.zone,
        displayAisle: selectedAisle?.aisleNumber || qrData.aisle,
        displayRack: selectedRack?.name || qrData.rack,
        displayBin: selectedBin?.barcode || qrData.binId,
      };
      
      setQrHistory((prev) => [newQr, ...prev]);
      
      toast.success("QR Code generated successfully!");
      
      // Open preview
      setPreviewQr(newQr);
      setPreviewDialogOpen(true);
      
      // Reset form partially
      setFormData((prev) => ({
        ...prev,
        grnNumber: "",
        batchNumber: "",
        serialNumbers: "",
        remarks: "",
      }));
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to generate QR code."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (qrData) => {
    if (qrData.qrImage) {
      // Convert base64 to blob and download
      const byteCharacters = atob(qrData.qrImage);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr_${qrData.qrId || qrData.grnNumber || "code"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("QR Code downloaded");
    } else {
      toast.error("No QR image available to download");
    }
  };

  const handlePrint = (qrData) => {
    if (qrData.qrImage) {
      const printWindow = window.open('', '_blank', 'width=600,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print QR Code</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:Arial;">
              <img src="data:image/png;base64,${qrData.qrImage}" style="max-width:300px;height:auto;" />
              <p style="margin-top:20px;font-size:14px;color:#666;">
                <strong>${qrData.grnNumber}</strong> - ${qrData.itemCode}
              </p>
              <p style="font-size:12px;color:#999;">
                ${qrData.quantity} ${qrData.uom} • ${qrData.warehouseId}
              </p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
      toast.success("Print dialog opened");
    } else {
      toast.error("No QR image available to print");
    }
  };

  const filteredHistory = useMemo(() => {
    let list = qrHistory;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          String(h.grnNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(h.itemCode || "")
            .toLowerCase()
            .includes(q) ||
          String(h.itemName || "")
            .toLowerCase()
            .includes(q) ||
          String(h.batchNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(h.warehouseId || "")
            .toLowerCase()
            .includes(q) ||
          String(h.qrId || "")
            .toLowerCase()
            .includes(q)
      );
    }
    return list;
  }, [qrHistory, search]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleHistory,
  } = usePaginatedItems(filteredHistory, {
    resetDeps: [search, qrHistory.length],
  });

  if (isLoadingMaster) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="glass-card rounded-2xl p-6 space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="QR Code Generator"
        description="Generate QR codes for warehouse labels and tracking."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast.info("Export functionality coming soon");
              }}
              disabled={!qrHistory.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export History
            </Button>
          </div>
        }
      />

      {/* QR Code Generator Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="size-5" />
            Generate QR Code
          </CardTitle>
          <CardDescription>
            Fill in the details below to generate a QR code for warehouse labeling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="qrType">QR Type</Label>
                <select
                  id="qrType"
                  name="qrType"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.qrType}
                  onChange={handleInputChange}
                >
                  {QR_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="labelLevel">Label Level</Label>
                <select
                  id="labelLevel"
                  name="labelLevel"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.labelLevel}
                  onChange={handleInputChange}
                >
                  {LABEL_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="labelType">Label Type</Label>
                <select
                  id="labelType"
                  name="labelType"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.labelType}
                  onChange={handleInputChange}
                >
                  {LABEL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="labelFormat">Label Format</Label>
                <select
                  id="labelFormat"
                  name="labelFormat"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.labelFormat}
                  onChange={handleInputChange}
                >
                  {LABEL_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="grnNumber">GRN Number *</Label>
                <Input
                  id="grnNumber"
                  name="grnNumber"
                  placeholder="e.g. GRN-INB-20260717-0003"
                  value={formData.grnNumber}
                  onChange={handleInputChange}
                  className={formErrors.grnNumber ? "border-red-500" : ""}
                />
                {formErrors.grnNumber && (
                  <p className="text-xs text-red-500">{formErrors.grnNumber}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="palletNumber">Pallet Number</Label>
                <Input
                  id="palletNumber"
                  name="palletNumber"
                  placeholder="e.g. PAL-001"
                  value={formData.palletNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="itemCode">Item Code *</Label>
                <Input
                  id="itemCode"
                  name="itemCode"
                  placeholder="e.g. mobile_23"
                  value={formData.itemCode}
                  onChange={handleInputChange}
                  className={formErrors.itemCode ? "border-red-500" : ""}
                />
                {formErrors.itemCode && (
                  <p className="text-xs text-red-500">{formErrors.itemCode}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  name="itemName"
                  placeholder="e.g. Barcode Scanner"
                  value={formData.itemName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  placeholder="e.g. BATCH-2026-001"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="serialNumbers">Serial Numbers</Label>
                <Input
                  id="serialNumbers"
                  name="serialNumbers"
                  placeholder="e.g. SN001,SN002,SN003"
                  value={formData.serialNumbers}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated serial numbers
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="15"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className={formErrors.quantity ? "border-red-500" : ""}
                />
                {formErrors.quantity && (
                  <p className="text-xs text-red-500">{formErrors.quantity}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Input
                  id="uom"
                  name="uom"
                  placeholder="e.g. Nos, KG, PCS"
                  value={formData.uom}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      {w.name} {w.warehouseId ? `(${w.warehouseId})` : ""}
                    </option>
                  ))}
                </select>
                {formErrors.warehouseId && (
                  <p className="text-xs text-red-500">{formErrors.warehouseId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zoneId">Zone</Label>
                <select
                  id="zoneId"
                  name="zoneId"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.zoneId}
                  onChange={handleInputChange}
                  disabled={!formData.warehouseId}
                >
                  <option value="">Select zone</option>
                  {filteredZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} {z.zoneId ? `(${z.zoneId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aisleId">Aisle</Label>
                <select
                  id="aisleId"
                  name="aisleId"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.aisleId}
                  onChange={handleInputChange}
                  disabled={!formData.zoneId}
                >
                  <option value="">Select aisle</option>
                  {filteredAisles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.aisleNumber || a.aisleId || `Aisle ${a.id}`}
                      {a.name ? ` - ${a.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rackId">Rack</Label>
                <select
                  id="rackId"
                  name="rackId"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.rackId}
                  onChange={handleInputChange}
                  disabled={!formData.aisleId}
                >
                  <option value="">Select rack</option>
                  {filteredRacks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rackId || r.rackIdentifier || `Rack ${r.id}`}
                      {r.name ? ` - ${r.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shelfId">Shelf</Label>
                <Input
                  id="shelfId"
                  name="shelfId"
                  placeholder="e.g. S-02"
                  value={formData.shelfId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="binId">Bin</Label>
                <select
                  id="binId"
                  name="binId"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.binId}
                  onChange={handleInputChange}
                  disabled={!formData.rackId}
                >
                  <option value="">Select bin</option>
                  {filteredBins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.barcode || b.binId || `Bin ${b.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="templateName">Template</Label>
                <select
                  id="templateName"
                  name="templateName"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.templateName}
                  onChange={handleInputChange}
                >
                  {TEMPLATES.map((template) => (
                    <option key={template} value={template}>
                      {template.charAt(0).toUpperCase() + template.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inboundId">Inbound ID</Label>
                <Input
                  id="inboundId"
                  name="inboundId"
                  type="number"
                  placeholder="1"
                  value={formData.inboundId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inboundLineId">Inbound Line ID</Label>
                <Input
                  id="inboundLineId"
                  name="inboundLineId"
                  type="number"
                  placeholder="1"
                  value={formData.inboundLineId}
                  onChange={handleInputChange}
                />
              </div>

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
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isGenerating} className="flex-1">
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-1.5 size-3.5" />
                    Generate QR Code
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    qrType: "QR_CODE",
                    labelLevel: "PALLET",
                    labelType: "GRN",
                    grnNumber: "",
                    inboundId: "",
                    inboundLineId: "",
                    itemCode: "",
                    itemName: "",
                    batchNumber: "",
                    serialNumbers: "",
                    quantity: "",
                    uom: "Nos",
                    warehouseId: "",
                    zoneId: "",
                    aisleId: "",
                    rackId: "",
                    shelfId: "",
                    binId: "",
                    palletNumber: "",
                    generatedBy: "admin",
                    templateName: "standard",
                    labelFormat: "PNG",
                    remarks: "",
                  });
                  setFormErrors({});
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-4" />
              QR Code Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {previewQr && (
              <>
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed">
                  {previewQr.qrImage ? (
                    <img
                      src={`data:image/png;base64,${previewQr.qrImage}`}
                      alt="QR Code"
                      className="max-w-[200px] h-auto"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <QrCode className="size-16" />
                      <p className="text-sm">QR Code Preview</p>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-1 text-sm">
                  <p><strong>QR ID:</strong> {previewQr.qrId || "-"}</p>
                  <p><strong>GRN:</strong> {previewQr.grnNumber}</p>
                  <p><strong>Item:</strong> {previewQr.itemCode} - {previewQr.itemName}</p>
                  <p><strong>Quantity:</strong> {previewQr.quantity} {previewQr.uom}</p>
                  <p><strong>Status:</strong> {previewQr.status || "GENERATED"}</p>
                  <p><strong>Location:</strong> {[previewQr.displayWarehouse, previewQr.displayZone, previewQr.displayAisle, previewQr.displayRack, previewQr.displayBin].filter(Boolean).join(" → ")}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    className="flex-1"
                    onClick={() => handleDownload(previewQr)}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePrint(previewQr)}
                  >
                    <Printer className="mr-1.5 size-3.5" />
                    Print
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and History */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-8"
            placeholder="Search GRN, item, QR ID..."
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
        <p className="text-xs text-muted-foreground">
          {qrHistory.length} QR codes generated
        </p>
      </div>

      {/* QR Code History */}
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Generation History</CardTitle>
          <CardDescription>
            Recently generated QR codes and their details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!filteredHistory.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <QrCode className="size-12 opacity-30" />
              <p className="text-sm">
                {qrHistory.length
                  ? "No QR codes match your search."
                  : "No QR codes generated yet. Create your first QR code."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>#</TableHead>
                    <TableHead>QR ID</TableHead>
                    <TableHead>GRN Number</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleHistory.map((h, idx) => (
                    <TableRow key={h.id} className="table-row-hover">
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {h.qrId || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {h.grnNumber || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {h.itemCode || "-"}
                      </TableCell>
                      <TableCell>{h.itemName || "-"}</TableCell>
                      <TableCell className="text-center">
                        {h.quantity} {h.uom}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          h.status === "GENERATED" 
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                        }`}>
                          {h.status || "GENERATED"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {[h.displayWarehouse || h.warehouseId, h.displayZone || h.zone, h.displayAisle || h.aisle, h.displayRack || h.rack, h.displayBin || h.binId]
                          .filter(Boolean)
                          .join(" → ") || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewQr(h);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(h)}
                          >
                            <Download className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(h)}
                          >
                            <Printer className="size-3.5" />
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
        </CardContent>
      </Card>
    </div>
  );
}