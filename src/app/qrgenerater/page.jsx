"use client";
import { CheckCircle, Settings } from "lucide-react";

import { useState, useMemo, useEffect } from "react";
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  Search,
  X,
  Eye,
  Plus,
  Package,
  Warehouse,
  MapPin,
  Layers,
  Box,
  Tag,
  Hash,
  Calendar,
  User,
  FileText,
  Link,
  Grid,
  Ruler,
  Scale,
  Package2,
  FolderTree,
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
import TablePagination from "@/components/TablePagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCodeHistoryTable from "./component/QRCodeHistoryTable";
import GRNSelector from "./component/grnSelector";

// QR Code Types
const QR_TYPES = ["QR_CODE", "BARCODE", "DATA_MATRIX"];
const LABEL_LEVELS = [
  "PALLET",
  "CASE",
  "ITEM",
  "BIN",
  "RACK",
  "ZONE",
  "WAREHOUSE",
];
const LABEL_TYPES = [
  "GRN",
  "PICK",
  "PUTAWAY",
  "INVENTORY",
  "SHIPPING",
  "RECEIVING",
];
const LABEL_FORMATS = ["PNG", "JPEG", "SVG", "PDF"];
const TEMPLATES = ["standard", "compact", "detailed", "warehouse"];

async function generateQRCode(payload) {
  const response = await api.post("/qr-codes/generate", payload);
  return response.data;
}

async function fetchQRCodes(params = {}) {
  const response = await api.get("/qr-codes", { params });
  return response.data;
}

export default function QRCodeGeneratorPage() {
  // State for master data
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [racks, setRacks] = useState([]);
  const [levels, setLevels] = useState([]);
  const [bins, setBins] = useState([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [grnSelectorOpen, setGrnSelectorOpen] = useState(false);

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
    levelId: "",
    shelfId: "",
    binId: "",
    palletNumber: "",
    generatedBy: "admin",
    templateName: "standard",
    labelFormat: "PNG",
    remarks: "",
    remainingQuantity: 0,
  });

  // State for QR history from API
  const [qrHistory, setQrHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [previewQr, setPreviewQr] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [generate, setGenerate] = useState(false);

  // Pagination state from API
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // State for selected bin details
  const [selectedBinDetails, setSelectedBinDetails] = useState(null);

  // Fetch master data and QR codes on mount
  useEffect(() => {
    fetchMasterData();
    fetchQRCodesList(0);
  }, []);

  // Update bin details when binId changes
  useEffect(() => {
    if (formData.binId) {
      const selectedBin = bins.find((b) => b.id === parseInt(formData.binId));
      if (selectedBin) {
        setSelectedBinDetails(selectedBin);
        // Validate quantity against available slots
        if (formData.quantity) {
          const availableSlots = selectedBin.stockSummary?.availableSlots || 0;
          if (parseInt(formData.quantity) > availableSlots) {
            setFormErrors((prev) => ({
              ...prev,
              quantity: `Quantity (${formData.quantity}) exceeds available slots (${availableSlots}) in this bin`,
            }));
          } else {
            setFormErrors((prev) => ({
              ...prev,
              quantity: undefined,
            }));
          }
        }
      }
    } else {
      setSelectedBinDetails(null);
    }
  }, [formData.binId, bins, formData.quantity]);

  const handleGRNSelect = (selection) => {
    if (selection) {
      const remainingQuantity = Number(selection.remainingQuantity ?? 0);
      setFormData((prev) => ({
        ...prev,
        grnNumber: selection.grnNumber,
        inboundId: selection.inboundId,
        inboundLineId: selection.inboundLineId,
        itemCode: selection.itemCode,
        itemName: selection.itemName,
        uom: selection.uom,
        remainingQuantity: remainingQuantity,
        quantity: remainingQuantity > 0 ? String(remainingQuantity) : "", // Set initial quantity to remaining
      }));
      toast.success(
        `Selected: ${selection.itemCode} from ${selection.grnNumber}`,
      );
    }
  };

  const fetchMasterData = async () => {
    try {
      setIsLoadingMaster(true);

      const [warehousesRes, zonesRes, aislesRes, racksRes, levelsRes, binsRes] =
        await Promise.all([
          api.get("/warehouses").catch(() => ({ data: [] })),
          api.get("/zones").catch(() => ({ data: [] })),
          api.get("/aisles").catch(() => ({ data: [] })),
          api.get("/racks").catch(() => ({ data: [] })),
          api.get("/levels").catch(() => ({ data: [] })),
          api.get("/bins").catch(() => ({ data: [] })),
        ]);

      setWarehouses(
        warehousesRes.data?.data?.content ||
          warehousesRes.data?.content ||
          warehousesRes.data ||
          [],
      );
      setZones(
        zonesRes.data?.data?.content ||
          zonesRes.data?.content ||
          zonesRes.data ||
          [],
      );
      setAisles(
        aislesRes.data?.data?.content ||
          aislesRes.data?.content ||
          aislesRes.data ||
          [],
      );
      setRacks(
        racksRes.data?.data?.content ||
          racksRes.data?.content ||
          racksRes.data ||
          [],
      );
      setLevels(
        levelsRes.data?.data?.content ||
          levelsRes.data?.content ||
          levelsRes.data ||
          [],
      );
      setBins(
        binsRes.data?.data?.content ||
          binsRes.data?.content ||
          binsRes.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data for dropdowns.");
    } finally {
      setIsLoadingMaster(false);
    }
  };

  // Fetch QR codes from API with pagination
  const fetchQRCodesList = async (page = 0, searchQuery = "") => {
    try {
      setIsLoadingHistory(true);
      const params = {
        page: page,
        size: pagination.pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await fetchQRCodes(params);

      // Handle the paginated response structure
      const content = response.data?.content || response.content || [];
      const totalElements =
        response.data?.totalElements || response.totalElements || 0;
      const totalPages = response.data?.totalPages || response.totalPages || 0;
      const currentPage = response.data?.number || response.number || page;
      const pageSize =
        response.data?.size || response.size || pagination.pageSize;
      const first = response.data?.first || response.first || true;
      const last = response.data?.last || response.last || true;

      // Transform API data to match component format
      const transformedData = content.map((item) => ({
        id: item.id,
        qrId: item.qrId,
        createdAt: item.createdAt,
        qrCode: item.qrCode,
        qrImage: item.qrImage,
        barcode: item.barcode,
        barcodeImage: item.barcodeImage,
        grnNumber: item.grnNumber,
        itemCode: item.itemCode,
        itemName: item.itemName,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        uom: item.uom,
        warehouseId: item.warehouseId,
        zone: item.zone,
        aisle: item.aisle,
        rack: item.rack,
        level: item.level,
        shelf: item.shelf,
        binId: item.binId,
        palletNumber: item.palletNumber,
        labelType: item.labelType,
        labelLevel: item.labelLevel,
        qrType: item.qrType,
        status: item.status || "GENERATED",
        generatedAt: item.createdAt || item.generatedAt,
        generatedBy: item.generatedBy || "admin",
        displayWarehouse: item.warehouseId,
        displayZone: item.zone,
        displayAisle: item.aisle,
        displayRack: item.rack,
        displayLevel: item.level,
        displayBin: item.binId,
      }));

      setQrHistory(transformedData);
      setPagination({
        currentPage,
        pageSize,
        totalElements,
        totalPages,
        first,
        last,
      });
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      toast.error("Failed to load QR code history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchQRCodesList(newPage, search);
    }
  };

  // Get filtered zones based on selected warehouse
  const filteredZones = useMemo(() => {
    if (!formData.warehouseId) return zones;
    return zones.filter(
      (z) =>
        z.warehouse?.id === parseInt(formData.warehouseId) ||
        z.warehouseId === parseInt(formData.warehouseId),
    );
  }, [zones, formData.warehouseId]);

  const filteredAisles = useMemo(() => {
    if (!formData.zoneId) return aisles;
    return aisles.filter(
      (a) =>
        a.zone?.id === parseInt(formData.zoneId) ||
        a.zoneId === parseInt(formData.zoneId),
    );
  }, [aisles, formData.zoneId]);

  const filteredRacks = useMemo(() => {
    if (!formData.aisleId) return racks;
    return racks.filter(
      (r) =>
        r.aisle?.id === parseInt(formData.aisleId) ||
        r.aisleId === parseInt(formData.aisleId),
    );
  }, [racks, formData.aisleId]);

  const filteredLevels = useMemo(() => {
    if (!formData.rackId) return levels;
    return levels.filter(
      (l) =>
        l.rack?.id === parseInt(formData.rackId) ||
        l.rackId === parseInt(formData.rackId),
    );
  }, [levels, formData.rackId]);

  const filteredBins = useMemo(() => {
    if (!formData.rackId) return bins;
    return bins.filter(
      (b) =>
        b.rack?.id === parseInt(formData.rackId) ||
        b.rackId === parseInt(formData.rackId),
    );
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
      setFormData((prev) => ({
        ...prev,
        zoneId: "",
        aisleId: "",
        rackId: "",
        levelId: "",
        binId: "",
      }));
      setSelectedBinDetails(null);
    } else if (name === "zoneId") {
      setFormData((prev) => ({
        ...prev,
        aisleId: "",
        rackId: "",
        levelId: "",
        binId: "",
      }));
      setSelectedBinDetails(null);
    } else if (name === "aisleId") {
      setFormData((prev) => ({
        ...prev,
        rackId: "",
        levelId: "",
        binId: "",
      }));
      setSelectedBinDetails(null);
    } else if (name === "rackId") {
      setFormData((prev) => ({
        ...prev,
        levelId: "",
        binId: "",
      }));
      setSelectedBinDetails(null);
    } else if (name === "levelId") {
      setFormData((prev) => ({
        ...prev,
        binId: "",
      }));
      setSelectedBinDetails(null);
    } else if (name === "binId") {
      // Validate quantity against available slots when bin changes
      const selectedBin = bins.find((b) => b.id === parseInt(value));
      if (selectedBin && formData.quantity) {
        const availableSlots = selectedBin.stockSummary?.availableSlots || 0;
        if (parseInt(formData.quantity) > availableSlots) {
          setFormErrors((prev) => ({
            ...prev,
            quantity: `Quantity (${formData.quantity}) exceeds available slots (${availableSlots}) in this bin`,
          }));
        } else {
          setFormErrors((prev) => ({
            ...prev,
            quantity: undefined,
          }));
        }
      }
    }
    //  else if (name === "quantity") {
    //   // Validate quantity against available slots when quantity changes
    //   if (formData.binId && value) {
    //     const selectedBin = bins.find((b) => b.id === parseInt(formData.binId));
    //     if (selectedBin) {
    //       const availableSlots = selectedBin.stockSummary?.availableSlots || 0;
    //       if (parseInt(value) > availableSlots) {
    //         setFormErrors((prev) => ({
    //           ...prev,
    //           quantity: `Quantity (${value}) exceeds available slots (${availableSlots}) in this bin`,
    //         }));
    //       } else {
    //         setFormErrors((prev) => ({
    //           ...prev,
    //           quantity: undefined,
    //         }));
    //       }
    //     }
    //   }
    // }
    else if (name === "quantity") {
      let quantity = value;
      const remainingQuantity = Number(formData.remainingQuantity || 0);

      // Prevent entering more than remaining quantity
      if (remainingQuantity > 0 && Number(quantity) > remainingQuantity) {
        setFormErrors((prev) => ({
          ...prev,
          quantity: `Quantity cannot exceed remaining quantity (${remainingQuantity})`,
        }));
      } else if (remainingQuantity > 0 && Number(quantity) <= 0) {
        setFormErrors((prev) => ({
          ...prev,
          quantity: "Quantity must be at least 1",
        }));
      } else {
        setFormErrors((prev) => ({
          ...prev,
          quantity: undefined,
        }));
      }

      setFormData((prev) => ({
        ...prev,
        quantity,
      }));

      // Bin capacity validation (keep this as well)
      if (formData.binId && quantity) {
        const selectedBin = bins.find((b) => b.id === parseInt(formData.binId));
        if (selectedBin) {
          const availableSlots = selectedBin.stockSummary?.availableSlots || 0;
          if (parseInt(quantity) > availableSlots) {
            setFormErrors((prev) => ({
              ...prev,
              quantity: `Quantity (${quantity}) exceeds available slots (${availableSlots}) in this bin`,
            }));
          }
        }
      }
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
    } else {
      // Validate against remaining quantity
      const remainingQuantity = Number(formData.remainingQuantity || 0);
      if (
        remainingQuantity > 0 &&
        parseInt(formData.quantity) > remainingQuantity
      ) {
        errors.quantity = `Quantity (${formData.quantity}) exceeds remaining quantity (${remainingQuantity})`;
      }
    }
    if (!formData.warehouseId) {
      errors.warehouseId = "Warehouse is required";
    }

    // Validate bin capacity if bin is selected
    if (formData.binId && formData.quantity) {
      const selectedBin = bins.find((b) => b.id === parseInt(formData.binId));
      if (selectedBin) {
        const availableSlots = selectedBin.stockSummary?.availableSlots || 0;
        if (parseInt(formData.quantity) > availableSlots) {
          errors.quantity = `Quantity (${formData.quantity}) exceeds available slots (${availableSlots}) in this bin`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const selectedWarehouse = warehouses.find(
      (w) => w.id === parseInt(formData.warehouseId),
    );
    const selectedZone = zones.find((z) => z.id === parseInt(formData.zoneId));
    const selectedAisle = aisles.find(
      (a) => a.id === parseInt(formData.aisleId),
    );
    const selectedRack = racks.find((r) => r.id === parseInt(formData.rackId));
    const selectedLevel = levels.find(
      (l) => l.id === parseInt(formData.levelId),
    );
    const selectedBin = bins.find((b) => b.id === parseInt(formData.binId));

    const payload = {
      qrType: formData.qrType,
      labelLevel: formData.labelLevel,
      labelType: formData.labelType,
      grnNumber: formData.grnNumber.trim(),
      inboundId: formData.inboundId ? parseInt(formData.inboundId) : null,
      inboundLineId: formData.inboundLineId
        ? parseInt(formData.inboundLineId)
        : null,
      itemCode: formData.itemCode.trim(),
      itemName: formData.itemName.trim(),
      batchNumber: formData.batchNumber.trim(),
      serialNumbers: formData.serialNumbers.trim(),
      quantity: parseInt(formData.quantity),
      uom: formData.uom,
      warehouseId:
        selectedWarehouse?.warehouseId ||
        selectedWarehouse?.id ||
        formData.warehouseId,
      zone: selectedZone?.zoneId || selectedZone?.name || "",
      aisle: selectedAisle?.aisleId || selectedAisle?.aisleNumber || "",
      rack: selectedRack?.rackId || selectedRack?.name || "",
      level: selectedLevel?.levelId || selectedLevel?.name || "",
      levelId: formData.levelId ? parseInt(formData.levelId) : null,
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

      toast.success("QR Code generated successfully!");
      setGenerate(false);
      // Refresh the QR codes list - go to first page
      await fetchQRCodesList(0, search);
      fetchMasterData();
      // Open preview with the newly generated QR
      const newQr = {
        id: qrData.id || Date.now(),
        qrId: qrData.qrId,
        qrCode: qrData.qrCode,
        qrImage: qrData.qrImage,
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
        level: qrData.level || payload.level,
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
        displayLevel: selectedLevel?.name || qrData.level,
        displayBin: selectedBin?.barcode || qrData.binId,
      };

      setPreviewQr(newQr);
      setPreviewDialogOpen(true);

      // Reset form partially
      setFormData((prev) => ({
        ...prev,
        grnNumber: "",
        batchNumber: "",
        serialNumbers: "",
        remarks: "",
        inboundId: "",
        inboundLineId: "",
        remainingQuantity: 0, // Add this
      }));
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to generate QR code.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQRCodesList(0, search);
  };

  const handleRefresh = () => {
    fetchQRCodesList(pagination.currentPage, search);
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
  useEffect(() => {
    console.log("Generate state changed to:", generate);
  }, [generate]);
  const handleDownloadbarcode = (qrData) => {
    if (qrData.barcodeImage) {
      // Convert base64 to blob and download
      const byteCharacters = atob(qrData.barcodeImage);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${qrData.barcode || qrData.grnNumber || "code"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Barcode downloaded");
    } else {
      toast.error("No Barcode image available to download");
    }
  };

  const handlePrint = (qrData) => {
    if (qrData.qrImage) {
      const printWindow = window.open("", "_blank", "width=600,height=600");
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

  if (isLoadingMaster) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="glass-card rounded-2xl p-6 space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                QR Code Generator
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(
                    "Generate button clicked, current state:",
                    generate,
                  );
                  setGenerate(!generate);
                }}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Generate
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoadingHistory}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {generate === true && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => {
                setGenerate(false);
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
                  levelId: "",
                  shelfId: "",
                  binId: "",
                  palletNumber: "",
                  generatedBy: "admin",
                  templateName: "standard",
                  labelFormat: "PNG",
                  remarks: "",
                  remainingQuantity: 0, // Add this
                });
                setFormErrors({});
                setSelectedBinDetails(null);
                fetchMasterData();
              }}
            />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <Card className="border-0 shadow-none">
                <CardHeader className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <QrCode className="size-5 text-blue-600" />
                      Generate QR Code
                    </CardTitle>
                    <CardDescription>
                      Fill in the details below to generate a QR code for
                      warehouse labeling.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-gray-100 hover:text-gray-600"
                    onClick={() => {
                      setGenerate(false);
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
                        levelId: "",
                        shelfId: "",
                        binId: "",
                        palletNumber: "",
                        generatedBy: "admin",
                        templateName: "standard",
                        labelFormat: "PNG",
                        remarks: "",
                        remainingQuantity: 0, // Add this
                      });
                      setFormErrors({});
                      setSelectedBinDetails(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <CardContent className="px-6 py-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section: Label Configuration */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Tag className="size-4" />
                        Label Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    </div>

                    {/* Section: Item & GRN Details */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="size-4" />
                        Item & GRN Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="grnNumber">GRN Number *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="grnNumber"
                              name="grnNumber"
                              placeholder="e.g. GRN-INB-20260717-0003"
                              value={formData.grnNumber}
                              onChange={handleInputChange}
                              className={
                                formErrors.grnNumber ? "border-red-500" : ""
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setGrnSelectorOpen(true)}
                              className="shrink-0"
                            >
                              <Package className="size-4" />
                            </Button>
                          </div>
                          {formErrors.grnNumber && (
                            <p className="text-xs text-red-500">
                              {formErrors.grnNumber}
                            </p>
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
                            className={
                              formErrors.itemCode ? "border-red-500" : ""
                            }
                          />
                          {formErrors.itemCode && (
                            <p className="text-xs text-red-500">
                              {formErrors.itemCode}
                            </p>
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
                            max={formData.remainingQuantity || undefined}
                            placeholder="15"
                            value={formData.quantity}
                            // onChange={handleInputChange}
                            onChange={(e) => {
                              const value = e.target.value;
                              const maxQuantity = Number(
                                formData.remainingQuantity || 0,
                              );

                              // Allow clearing the input
                              if (value === "") {
                                handleInputChange(e);
                                return;
                              }

                              const quantity = Number(value);

                              // Don't allow typing more than remaining quantity
                              if (maxQuantity > 0 && quantity > maxQuantity) {
                                return;
                              }

                              handleInputChange(e);
                            }}
                            className={
                              formErrors.quantity ? "border-red-500" : ""
                            }
                          />
                          {formErrors.quantity && (
                            <p className="text-xs text-red-500">
                              {formErrors.quantity}
                            </p>
                          )}
                          {formData.remainingQuantity > 0 && (
                            <p className="text-xs text-blue-600">
                              Remaining quantity: {formData.remainingQuantity}{" "}
                              {formData.uom}
                            </p>
                          )}
                          {/* ... rest of your code */}
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
                    </div>

                    {/* Section: Warehouse Location */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FolderTree className="size-4" />
                        Warehouse Location
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                {w.name}{" "}
                                {w.warehouseId ? `(${w.warehouseId})` : ""}
                              </option>
                            ))}
                          </select>
                          {formErrors.warehouseId && (
                            <p className="text-xs text-red-500">
                              {formErrors.warehouseId}
                            </p>
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
                          <Label htmlFor="levelId">Level</Label>
                          <select
                            id="levelId"
                            name="levelId"
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={formData.levelId}
                            onChange={handleInputChange}
                            disabled={!formData.rackId}
                          >
                            <option value="">Select level</option>
                            {filteredLevels.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.levelId || `Level ${l.id}`}
                                {l.name ? ` - ${l.name}` : ""}
                                {l.levelNumber
                                  ? ` (Level ${l.levelNumber})`
                                  : ""}
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
                                {b.barcode || b.binId || `Bin ${b.id}`} -{" "}
                                {b.stockSummary?.availableSlots || 0} available
                              </option>
                            ))}
                          </select>
                          {selectedBinDetails && formData.binId && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="size-3" />
                              Selected bin has{" "}
                              {selectedBinDetails.stockSummary
                                ?.availableSlots || 0}{" "}
                              available slots
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section: Additional Settings */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Settings className="size-4" />
                        Additional Settings
                      </h3>
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
                                {template.charAt(0).toUpperCase() +
                                  template.slice(1)}
                              </option>
                            ))}
                          </select>
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
                    </div>

                    {/* Hidden fields for inbound tracking */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                      <div className="space-y-1.5">
                        <Label htmlFor="inboundId">Inbound ID</Label>
                        <Input
                          id="inboundId"
                          name="inboundId"
                          type="number"
                          placeholder="1"
                          disabled
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
                          disabled
                          value={formData.inboundLineId}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="submit"
                        disabled={isGenerating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="mr-2 size-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 size-4" />
                            Generate QR Code
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setGenerate(false);
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
                            levelId: "",
                            shelfId: "",
                            binId: "",
                            palletNumber: "",
                            generatedBy: "admin",
                            templateName: "standard",
                            labelFormat: "PNG",
                            remarks: "",
                          });
                          setFormErrors({});
                          setSelectedBinDetails(null);
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
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
                            levelId: "",
                            shelfId: "",
                            binId: "",
                            palletNumber: "",
                            generatedBy: "admin",
                            templateName: "standard",
                            labelFormat: "PNG",
                            remarks: "",
                            remainingQuantity: 0, // Add this
                          });
                          setFormErrors({});
                          setSelectedBinDetails(null);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

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
                  <p>
                    <strong>QR ID:</strong> {previewQr.qrId || "-"}
                  </p>
                  <p>
                    <strong>GRN:</strong> {previewQr.grnNumber}
                  </p>
                  <p>
                    <strong>Item:</strong> {previewQr.itemCode} -{" "}
                    {previewQr.itemName}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {previewQr.quantity}{" "}
                    {previewQr.uom}
                  </p>
                  <p>
                    <strong>Status:</strong> {previewQr.status || "GENERATED"}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {[
                      previewQr.displayWarehouse,
                      previewQr.displayZone,
                      previewQr.displayAisle,
                      previewQr.displayRack,
                      previewQr.displayLevel,
                      previewQr.displayBin,
                    ]
                      .filter(Boolean)
                      .join(" → ")}
                  </p>
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
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-16"
            placeholder="Search GRN, item, QR ID..."
          />
          <button
            type="submit"
            className="absolute right-0 top-0 h-full px-3 text-sm text-primary hover:text-primary/80"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              className="absolute right-14 top-1/2 -translate-y-1/2"
              onClick={() => {
                setSearch("");
                fetchQRCodesList(0, "");
              }}
            >
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </form>
        <p className="text-xs text-muted-foreground">
          {isLoadingHistory
            ? "Loading..."
            : `${pagination.totalElements} QR codes found`}
        </p>
      </div>

      <GRNSelector
        open={grnSelectorOpen}
        onOpenChange={setGrnSelectorOpen}
        onSelect={handleGRNSelect}
      />

      {/* QR Code History Table */}
      <QRCodeHistoryTable
        qrHistory={qrHistory}
        isLoading={isLoadingHistory}
        onView={(qr) => {
          setPreviewQr(qr);
          setPreviewDialogOpen(true);
        }}
        onDownload={handleDownload}
        handleDownloadbarcode={handleDownloadbarcode}
        onPrint={handlePrint}
        page={pagination.currentPage + 1}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalElements}
        startItem={pagination.currentPage * pagination.pageSize + 1}
        endItem={Math.min(
          (pagination.currentPage + 1) * pagination.pageSize,
          pagination.totalElements,
        )}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

// Add missing imports at the top
