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
  PackagePlus,
  UserCheck,
  ClipboardList,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
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

export default function PutawayInitiate() {
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
  // State for putaway dialog
  const [users, setUsers] = useState([]);
  const [putawayDialogOpen, setPutawayDialogOpen] = useState(false);
  const [selectedQrForPutaway, setSelectedQrForPutaway] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [putawayForm, setPutawayForm] = useState({
    assignedTo: "",
    receivingArea: "",
    warehouseArea: "",
    remarks: "",
  });
  const [putawayErrors, setPutawayErrors] = useState({});
  async function initiatePutaway(payload) {
    const response = await api.post("/putaway/initiate", payload);
    return response.data;
  }
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === parseInt(userId));
    return user?.name || user?.username || `User ${userId}`;
  };
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
      setFormData((prev) => ({
        ...prev,
        grnNumber: selection.grnNumber,
        inboundId: selection.inboundId,
        inboundLineId: selection.inboundLineId,
        itemCode: selection.itemCode,
        itemName: selection.itemName,
        uom: selection.uom,
        quantity: selection.quantity || 1,
      }));
      toast.success(
        `Selected: ${selection.itemCode} from ${selection.grnNumber}`,
      );
    }
  };

  const fetchMasterData = async () => {
    try {
      setIsLoadingMaster(true);

      const [
        warehousesRes,
        zonesRes,
        aislesRes,
        racksRes,
        levelsRes,
        binsRes,
        usersRes,
      ] = await Promise.all([
        api.get("/warehouses").catch(() => ({ data: [] })),
        api.get("/zones").catch(() => ({ data: [] })),
        api.get("/aisles").catch(() => ({ data: [] })),
        api.get("/racks").catch(() => ({ data: [] })),
        api.get("/levels").catch(() => ({ data: [] })),
        api.get("/bins").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] })),
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
      setUsers(
        usersRes.data?.data?.content ||
          usersRes.data?.content ||
          usersRes.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data.");
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
        rock: item.rock,
        isTaskAssinged: item.isTaskAssinged,
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
    } else if (name === "quantity") {
      // Validate quantity against available slots when quantity changes
      if (formData.binId && value) {
        const selectedBin = bins.find((b) => b.id === parseInt(formData.binId));
        if (selectedBin) {
          const availableSlots = selectedBin.stockSummary?.availableSlots || 0;
          if (parseInt(value) > availableSlots) {
            setFormErrors((prev) => ({
              ...prev,
              quantity: `Quantity (${value}) exceeds available slots (${availableSlots}) in this bin`,
            }));
          } else {
            setFormErrors((prev) => ({
              ...prev,
              quantity: undefined,
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
  const validatePutawayForm = () => {
    const errors = {};
    if (!putawayForm.assignedTo) {
      errors.assignedTo = "Please select a user";
    }
    setPutawayErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePutawaySubmit = async (e) => {
    e.preventDefault();

    if (!validatePutawayForm()) {
      return;
    }

    if (!selectedQrForPutaway) {
      toast.error("QR data not selected.");
      return;
    }

    const qr = selectedQrForPutaway;

    const payload = {
      grnNumber: qr.grnNumber || "",
      warehouseId: qr.warehouseId || "",
      assignedTo: putawayForm.assignedTo,
      receivingArea: putawayForm.receivingArea || qr.binId || "",
      // rockId: null,
      createdBy: "admin",
      lines: [
        {
          itemCode: qr.itemCode || "",
          itemName: qr.itemName || "",
          uom: qr.uom || "Nos",
          quantity: parseFloat(qr.quantity) || 0,
          inboundLineId: qr.id,
          batchNumber: qr.batchNumber || "",
          serialNumber: "",
          suggestedBin: qr.binId || "",
          remarks: putawayForm.remarks || "",
        },
      ],
    };

    try {
      setIsSubmitting(true);
      await initiatePutaway(payload);
      toast.success(
        `Putaway assigned successfully to ${getUserName(putawayForm.assignedTo)}`,
      );
      setPutawayDialogOpen(false);
      setSelectedQrForPutaway(null);
      setPutawayForm({
        assignedTo: "",
        receivingArea: "",
        remarks: "",
      });
      setPutawayErrors({});
      await fetchQRCodesList(pagination.currentPage, search);
    } catch (error) {
      console.error("Error initiating putaway:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to initiate putaway.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPutawayDialog = (qr) => {
    setSelectedQrForPutaway(qr);
    const rockId = qr?.rock?.rockId || qr?.rockId || "";
    const warehouseId = qr?.rock?.warehouse?.warehouseId;
    ("");
    setPutawayForm({
      assignedTo: "",
      receivingArea: rockId || "",
      warehouseArea: warehouseId || "",
      remarks: "",
    });
    console.log("Selected QR for putaway:", rockId);
    setPutawayErrors({});
    setPutawayDialogOpen(true);
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
                Putaway Assignment Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
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

      {/* Putaway Assignment Dialog */}
      <Dialog open={putawayDialogOpen} onOpenChange={setPutawayDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PackagePlus className="w-6 h-6 text-orange-600" />
              Initiate Putaway Assignment
            </DialogTitle>
            <DialogDescription>
              Assign the selected QR/GRN item to a user for putaway processing.
            </DialogDescription>
          </DialogHeader>

          {selectedQrForPutaway && (
            <form onSubmit={handlePutawaySubmit} className="space-y-6 py-4">
              {/* QR / GRN Information */}
              <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-blue-100/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">
                    QR / GRN Information
                  </h3>
                  <Badge className="ml-auto bg-blue-600 text-white">
                    {selectedQrForPutaway.labelType || "GRN"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 min-w-[80px]">
                      QR ID:
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {selectedQrForPutaway.qrId || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 min-w-[80px]">
                      GRN Number:
                    </span>
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {selectedQrForPutaway.grnNumber || "-"}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 min-w-[80px]">
                      Barcode:
                    </span>
                    <span className="font-mono text-sm">
                      {selectedQrForPutaway.barcode || "-"}
                    </span>
                  </div> */}
                  {/* <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 min-w-[80px]">
                      Status:
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {selectedQrForPutaway.status || "GENERATED"}
                    </Badge>
                  </div> */}
                </div>
              </div>

              {/* Item Details */}
              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">Item Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Item Code</Label>
                    <Input
                      value={selectedQrForPutaway.itemCode || "-"}
                      readOnly
                      className="bg-gray-50 border-0 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Item Name</Label>
                    <Input
                      value={selectedQrForPutaway.itemName || "-"}
                      readOnly
                      className="bg-gray-50 border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Quantity</Label>
                    <Input
                      value={`${selectedQrForPutaway.quantity || 0} ${
                        selectedQrForPutaway.uom || "Nos"
                      }`}
                      readOnly
                      className="bg-gray-50 border-0 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Batch Number
                    </Label>
                    <Input
                      value={selectedQrForPutaway.batchNumber || "-"}
                      readOnly
                      className="bg-gray-50 border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Pallet Number
                    </Label>
                    <Input
                      value={selectedQrForPutaway.palletNumber || "-"}
                      readOnly
                      className="bg-gray-50 border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Inbound Line ID
                    </Label>
                    <Input
                      value={selectedQrForPutaway.id || "-"}
                      readOnly
                      className="bg-gray-50 border-0 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Current Location */}
              <div className="rounded-xl border bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">
                    Current Location
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Warehouse</Label>
                    <Input
                      value={selectedQrForPutaway.warehouseId || "-"}
                      readOnly
                      className="bg-white border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Zone</Label>
                    <Input
                      value={selectedQrForPutaway.zone || "-"}
                      readOnly
                      className="bg-white border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Aisle</Label>
                    <Input
                      value={selectedQrForPutaway.aisle || "-"}
                      readOnly
                      className="bg-white border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Rack</Label>
                    <Input
                      value={selectedQrForPutaway.rack || "-"}
                      readOnly
                      className="bg-white border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Level</Label>
                    <Input
                      value={selectedQrForPutaway.level || "-"}
                      readOnly
                      className="bg-white border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Bin</Label>
                    <Input
                      value={selectedQrForPutaway.binId || "-"}
                      readOnly
                      className="bg-white border-0 text-sm font-medium text-blue-600"
                    />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <Label className="text-xs text-gray-500">Location Path</Label>
                  <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-700 bg-white rounded-lg px-3 py-2 border">
                    {[
                      selectedQrForPutaway.warehouseId,
                      selectedQrForPutaway.zone,
                      selectedQrForPutaway.aisle,
                      selectedQrForPutaway.rack,
                      selectedQrForPutaway.level,
                      selectedQrForPutaway.binId,
                    ]
                      .filter(Boolean)
                      .map((item, index, array) => (
                        <span key={index} className="flex items-center gap-2">
                          <span className="text-blue-600 font-mono">
                            {item}
                          </span>
                          {index < array.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                          )}
                        </span>
                      ))}
                    {[
                      selectedQrForPutaway.warehouseId,
                      selectedQrForPutaway.zone,
                      selectedQrForPutaway.aisle,
                      selectedQrForPutaway.rack,
                      selectedQrForPutaway.binId,
                    ].filter(Boolean).length === 0 && "-"}
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="rounded-xl border bg-orange-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-800">
                    Putaway Assignment
                  </h3>
                  <span className="text-xs text-red-500 ml-2">* Required</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignedTo" className="text-sm font-medium">
                      Assign To <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="assignedTo"
                      value={putawayForm.assignedTo}
                      onChange={(e) =>
                        setPutawayForm((prev) => ({
                          ...prev,
                          assignedTo: e.target.value,
                        }))
                      }
                      className={`mt-1 w-full h-10 rounded-md border ${
                        putawayErrors.assignedTo
                          ? "border-red-500"
                          : "border-gray-300"
                      } bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    >
                      <option value="">-- Select User --</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.username}>
                          {user.name || user.username || `User ${user.id}`}
                        </option>
                      ))}
                    </select>
                    {putawayErrors.assignedTo && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {putawayErrors.assignedTo}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="receivingArea"
                      className="text-sm font-medium"
                    >
                      Receiving Area
                    </Label>
                    <Input
                      id="receivingArea"
                      value={putawayForm.receivingArea}
                      onChange={(e) =>
                        setPutawayForm((prev) => ({
                          ...prev,
                          receivingArea: e.target.value,
                        }))
                      }
                      placeholder="Enter receiving area"
                      className="mt-1"
                      disabled
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="warehouseArea"
                      className="text-sm font-medium"
                    >
                      Warehouse Location
                    </Label>
                    <Input
                      id="warehouseArea"
                      value={putawayForm.warehouseArea}
                      onChange={(e) =>
                        setPutawayForm((prev) => ({
                          ...prev,
                          warehouseArea: e.target.value,
                        }))
                      }
                      placeholder="Enter warehouse location"
                      className="mt-1"
                      disabled
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Remarks
                  </Label>
                  <textarea
                    id="remarks"
                    value={putawayForm.remarks}
                    onChange={(e) =>
                      setPutawayForm((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter any additional remarks..."
                  />
                </div>
              </div>

              {/* Payload Preview */}
              {/* <div className="rounded-lg bg-gray-900 p-4 text-xs text-green-400 overflow-x-auto">
          <div className="text-gray-400 mb-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Payload Preview (inboundLineId: {selectedQrForPutaway.id})
          </div>
          <pre className="font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(
              {
                grnNumber: selectedQrForPutaway.grnNumber || "",
                warehouseId: selectedQrForPutaway.warehouseId || "",
                assignedTo: putawayForm.assignedTo || "",
                receivingArea: putawayForm.receivingArea || selectedQrForPutaway.binId || "",
                lines: [
                  {
                    itemCode: selectedQrForPutaway.itemCode || "",
                    itemName: selectedQrForPutaway.itemName || "",
                    uom: selectedQrForPutaway.uom || "Nos",
                    quantity: parseInt(selectedQrForPutaway.quantity) || 0,
                    inboundLineId: selectedQrForPutaway.id,
                    batchNumber: selectedQrForPutaway.batchNumber || "",
                    suggestedBin: selectedQrForPutaway.binId || "",
                    remarks: putawayForm.remarks || "",
                  },
                ],
              },
              null,
              2
            )}
          </pre>
        </div> */}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPutawayDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !putawayForm.assignedTo}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-4 h-4 mr-2" />
                      Initiate Putaway
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
        onInitiatePutaway={openPutawayDialog} // Add this line
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
