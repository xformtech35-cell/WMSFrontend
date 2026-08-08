"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Package,
  CheckCircle2,
  Search,
  X,
  ArrowRight,
  Warehouse,
  User,
  FileText,
  Boxes,
  RefreshCw,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import StatusBadge from "@/components/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CREATE } from "@/components/apiRequest";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

async function fetchApprovedGRNs(params = {}) {
  const response = await api.get(
    "/inbound/grn-status/APPROVED?barcodeGenerate=true",
    { params },
  );
  return response.data;
}

async function initiatePutaway(payload) {
  const response = await CREATE("/putaway/initiate", payload);
  return response.data;
}

export default function PutawayPage() {
  // State for GRN data
  const [grns, setGrns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedPutaway, setSelectedPutaway] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");

  // State for master data (for dropdowns)
  const [users, setUsers] = useState([]);

  // State for form data
  const [formData, setFormData] = useState({
    grnNumber: "",
    warehouseId: "",
    assignedTo: "",
    receivingArea: "",
    rockId: "",
    createdBy: "admin",
    lines: [],
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // State for putaway history
  const [putawayHistory, setPutawayHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State for selected GRN in form
  const [selectedGrnForPutaway, setSelectedGrnForPutaway] = useState("");
  const [grnItems, setGrnItems] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchApprovedGRNsList();
    fetchPutawayHistory();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [usersRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: [] })),
      ]);

      setUsers(
        usersRes.data?.data?.content ||
          usersRes.data?.content ||
          usersRes.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  const fetchApprovedGRNsList = async (searchQuery = "") => {
    try {
      setIsLoading(true);
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await fetchApprovedGRNs(params);

      const content = response.data?.content || response.content || [];
      setGrns(content);
    } catch (error) {
      console.error("Error fetching approved GRNs:", error);
      toast.error("Failed to load approved GRNs.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPutawayHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.get("/putaway");
      const content =
        response.data?.data?.content ||
        response.data?.content ||
        response.data ||
        [];
      setPutawayHistory(content);
    } catch (error) {
      console.error("Error fetching putaway history:", error);
      toast.error("Failed to load putaway history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const openCreate = () => {
    setSelectedGrn(null);
    setSelectedGrnForPutaway("");
    setGrnItems([]);
    setFormData({
      grnNumber: "",
      warehouseId: "",
      assignedTo: "",
      receivingArea: "",
      rockId: "",
      createdBy: "admin",
      lines: [],
    });
    setFormErrors({});
    setOpen(true);
  };

  const handleGrnSelect = (grnNumber) => {
    setSelectedGrnForPutaway(grnNumber);
    const grn = grns.find((g) => g.grnNumber === grnNumber);
    if (grn) {
      setSelectedGrn(grn);

      // Initialize items from GRN lines
      const items = (grn.lines || []).map((line) => ({
        id: line.id,
        itemCode: line.itemCode || "",
        itemName: line.itemName || "",
        uom: line.uom || "Nos",
        quantity: line.acceptedQuantity || line.quantity || 0,
        inboundLineId: line.id,
        batchNumber: line.batchNumber || "",
        serialNumber: "",
        suggestedBin: "",
        remarks: "",
        isSelected: false,
      }));
      setGrnItems(items);

      // Get rock and warehouse from GRN
      const rock = grn.rock;
      const warehouse = rock?.warehouse;

      // Set form data with rock and warehouse info
      setFormData((prev) => ({
        ...prev,
        grnNumber: grn.grnNumber,
        // Use warehouse from the rock's warehouse
        warehouseId:
          warehouse?.warehouseId || warehouse?.id || grn.warehouseId || "",
        // Use rock name or rockId as receiving area
        receivingArea: rock?.name || rock?.rockId || "",
        rockId: rock?.rockId || grn.rockId || "",
      }));
    }
  };

  const toggleItemSelection = (index) => {
    const updatedItems = [...grnItems];
    updatedItems[index].isSelected = !updatedItems[index].isSelected;
    setGrnItems(updatedItems);
  };

  const addSelectedItemsToLines = () => {
    const selectedItems = grnItems.filter((item) => item.isSelected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to add");
      return;
    }

    const newLines = selectedItems.map((item) => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      uom: item.uom || "Nos",
      quantity: item.quantity || 0,
      inboundLineId: item.inboundLineId,
      batchNumber: item.batchNumber || "",
      serialNumber: "",
      suggestedBin: "",
      remarks: "",
    }));

    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, ...newLines],
    }));

    // Unselect added items
    const updatedItems = grnItems.map((item) => ({
      ...item,
      isSelected: false,
    }));
    setGrnItems(updatedItems);

    toast.success(`${selectedItems.length} item(s) added to putaway`);
  };

  const removeLine = (index) => {
    const updatedLines = [...formData.lines];
    updatedLines.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      lines: updatedLines,
    }));
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

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.lines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      lines: updatedLines,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.grnNumber) {
      errors.grnNumber = "GRN Number is required";
    }
    if (!formData.warehouseId || formData.warehouseId.trim() === "") {
      errors.warehouseId = "Warehouse is required";
    }
    if (!formData.assignedTo || formData.assignedTo.trim() === "") {
      errors.assignedTo = "Assigned person is required";
    }
    if (!formData.receivingArea || formData.receivingArea.trim() === "") {
      errors.receivingArea = "Receiving area is required";
    }
    if (formData.lines.length === 0) {
      errors.lines = "At least one item is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      grnNumber: formData.grnNumber,
      warehouseId: formData.warehouseId.trim(),
      assignedTo: formData.assignedTo.trim(),
      receivingArea: formData.receivingArea.trim(),
      rockId: formData.rockId || null,
      createdBy: formData.createdBy || "admin",
      lines: formData.lines.map((line) => ({
        itemCode: line.itemCode,
        itemName: line.itemName,
        uom: line.uom || "Nos",
        quantity: parseFloat(line.quantity) || 0,
        inboundLineId: line.inboundLineId,
        batchNumber: line.batchNumber || "",
        serialNumber: line.serialNumber || "",
        suggestedBin: line.suggestedBin || "",
        remarks: line.remarks || "",
      })),
    };

    try {
      setIsSubmitting(true);
      await initiatePutaway(payload);

      toast.success("Putaway initiated successfully!");
      setOpen(false);
      setSelectedGrn(null);
      setSelectedGrnForPutaway("");
      setGrnItems([]);

      setFormData({
        grnNumber: "",
        warehouseId: "",
        assignedTo: "",
        receivingArea: "",
        rockId: "",
        createdBy: "admin",
        lines: [],
      });

      await fetchPutawayHistory();
      await fetchApprovedGRNsList(search);
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

  const handleClose = () => {
    setOpen(false);
    setSelectedGrn(null);
    setSelectedGrnForPutaway("");
    setGrnItems([]);
    setFormErrors({});
  };

  const viewPutawayDetails = (item) => {
    setSelectedPutaway(item);
    setViewDetailsOpen(true);
  };

  const closeViewDetails = () => {
    setViewDetailsOpen(false);
    setSelectedPutaway(null);
  };

  const filtered = useMemo(() => {
    let list = grns;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          String(g.grnNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(g.inboundNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(g.supplierName || "")
            .toLowerCase()
            .includes(q),
      );
    }
    return list;
  }, [grns, search]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleGrns,
  } = usePaginatedItems(filtered, {
    resetDeps: [search, grns?.length ?? 0],
  });

  const showInitialLoading = isLoading && !grns?.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Putaway Management{" "}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Initiate Putaway
              </button>
              <button
                type="button"
                onClick={() => fetchApprovedGRNsList(search)}
                disabled={isLoading}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Putaway Form - Custom Modal */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] max-w-[95vw] lg:max-w-7xl xl:max-w-[1200px] max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <Package className="size-5" />
                      Initiate Putaway
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select a GRN and items to create putaway tasks
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Form Body */}
              <form
                onSubmit={handleSubmit}
                className="h-full overflow-y-auto px-6 py-4 space-y-6 max-h-[calc(90vh-180px)]"
              >
                {/* GRN Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="grnSelect"
                      className="flex items-center gap-1.5"
                    >
                      <FileText className="size-3.5" />
                      Select GRN *
                    </Label>
                    <select
                      id="grnSelect"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={selectedGrnForPutaway}
                      onChange={(e) => handleGrnSelect(e.target.value)}
                    >
                      <option value="">Select GRN</option>
                      {grns.map((grn) => (
                        <option key={grn.id} value={grn.grnNumber}>
                          {grn.grnNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="warehouseId"
                      className="flex items-center gap-1.5"
                    >
                      <Warehouse className="size-3.5" />
                      Warehouse *
                    </Label>
                    <Input
                      id="warehouseId"
                      name="warehouseId"
                      value={formData.warehouseId}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                      placeholder="Warehouse from rock"
                    />
                    {formErrors.warehouseId && (
                      <p className="text-xs text-red-500">
                        {formErrors.warehouseId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="assignedTo"
                      className="flex items-center gap-1.5"
                    >
                      <User className="size-3.5" />
                      Assigned To *
                    </Label>
                    <select
                      id="assignedTo"
                      name="assignedTo"
                      className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        formErrors.assignedTo ? "border-red-500" : ""
                      }`}
                      value={formData.assignedTo}
                      onChange={handleInputChange}
                    >
                      <option value="">Select user</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name || u.username || u.id}>
                          {u.name || u.username || `User ${u.id}`}
                        </option>
                      ))}
                    </select>
                    {formErrors.assignedTo && (
                      <p className="text-xs text-red-500">
                        {formErrors.assignedTo}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="receivingArea"
                      className="flex items-center gap-1.5"
                    >
                      <MapPin className="size-3.5" />
                      Receiving Area *
                    </Label>
                    <Input
                      id="receivingArea"
                      name="receivingArea"
                      value={formData.receivingArea}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                      placeholder="Rock name/ID"
                    />
                    {formErrors.receivingArea && (
                      <p className="text-xs text-red-500">
                        {formErrors.receivingArea}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rock Info Display */}
                {selectedGrnForPutaway && formData.rockId && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                    <div className="flex items-center gap-3">
                      <Package className="size-5 text-blue-600" />
                      <div>
                        <Label className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Assigned Rock
                        </Label>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="bg-blue-100 dark:bg-blue-900/30"
                          >
                            {formData.rockId}
                          </Badge>
                          {selectedGrn?.rock && (
                            <>
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                {selectedGrn.rock.name}
                              </span>
                              {selectedGrn.rock.rockType && (
                                <span className="text-xs text-blue-500 dark:text-blue-400">
                                  ({selectedGrn.rock.rockType})
                                </span>
                              )}
                              {selectedGrn.rock.warehouse && (
                                <span className="text-xs text-blue-500 dark:text-blue-400">
                                  • Warehouse: {selectedGrn.rock.warehouse.name}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          This rock is assigned to this GRN. Warehouse and
                          receiving area are auto-filled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGrnForPutaway && !formData.rockId && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="size-5 text-yellow-600" />
                      <div>
                        <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          No Rock Assigned
                        </Label>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          This GRN does not have a rock assigned. Please
                          manually enter warehouse and receiving area.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* GRN Items Selection */}
                {selectedGrnForPutaway && grnItems.length > 0 && (
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">GRN Items</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addSelectedItemsToLines}
                        className="gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        Add Selected Items
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updatedItems = grnItems.map((item) => ({
                                    ...item,
                                    isSelected: checked,
                                  }));
                                  setGrnItems(updatedItems);
                                }}
                                checked={grnItems.every(
                                  (item) => item.isSelected,
                                )}
                              />
                            </TableHead>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Location</TableHead>
                           
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grnItems.map((item, index) =>{
                              const location = [
                              item.warehouseId,
                              item.zone,
                              item.aisle,
                              item.rack,
                              item.binId,
                            ]
                              .filter(Boolean)
                              .join(" → ");

                            return (
                            <TableRow key={index} className="hover:bg-muted/30">
                              <TableCell>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300"
                                  checked={item.isSelected || false}
                                  onChange={() => toggleItemSelection(index)}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {item.itemCode || "-"}
                              </TableCell>
                              <TableCell>{item.itemName || "-"}</TableCell>
                              <TableCell>
                                {location || "-"}
                              </TableCell>
                            </TableRow>
                          )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Selected:{" "}
                      {grnItems.filter((item) => item.isSelected).length} items
                    </div>
                  </div>
                )}

                {/* Putaway Lines */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Putaway Lines</Label>
                    <Badge variant="secondary" className="text-xs">
                      {formData.lines.length} items
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Items to be put away from this GRN
                  </p>

                  {formErrors.lines && (
                    <p className="text-xs text-red-500 mb-2">
                      {formErrors.lines}
                    </p>
                  )}

                  {formData.lines.length === 0 ? (
                    <div className="border rounded-md p-8 text-center text-muted-foreground">
                      <Package className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No items added yet</p>
                      <p className="text-xs">
                        Select items from the GRN above and click "Add Selected
                        Items"
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-12 text-center">
                                #
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Item Code
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Item Name
                              </TableHead>
                              <TableHead className="w-16">UOM</TableHead>
                              <TableHead className="w-24">Quantity</TableHead>
                              <TableHead className="min-w-[100px]">
                                Batch No.
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Serial No.
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Suggested Bin
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Remarks
                              </TableHead>
                              <TableHead className="w-12">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.lines.map((line, index) => (
                              <TableRow
                                key={index}
                                className="hover:bg-muted/30"
                              >
                                <TableCell className="text-xs text-muted-foreground text-center">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.itemCode}
                                    disabled
                                    className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.itemName}
                                    disabled
                                    className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.uom}
                                    disabled
                                    className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0 w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={line.quantity}
                                    onChange={(e) =>
                                      handleLineChange(
                                        index,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.batchNumber || ""}
                                    onChange={(e) =>
                                      handleLineChange(
                                        index,
                                        "batchNumber",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs"
                                    placeholder="Batch"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.serialNumber || ""}
                                    onChange={(e) =>
                                      handleLineChange(
                                        index,
                                        "serialNumber",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs"
                                    placeholder="e.g. SN001-SN010"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.suggestedBin || ""}
                                    onChange={(e) =>
                                      handleLineChange(
                                        index,
                                        "suggestedBin",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs"
                                    placeholder="e.g. B-05"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.remarks || ""}
                                    onChange={(e) =>
                                      handleLineChange(
                                        index,
                                        "remarks",
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 text-xs"
                                    placeholder="Remarks"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeLine(index)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                        Initiating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1.5 size-3.5" />
                        Initiate Putaway
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Putaway Details View - Custom Modal */}
      {viewDetailsOpen && selectedPutaway && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={closeViewDetails}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                      <Package className="size-5" />
                      Putaway Details
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Task: <strong>{selectedPutaway?.taskNumber}</strong>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeViewDetails}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto px-6 py-4 space-y-6 max-h-[calc(90vh-180px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      GRN Number
                    </Label>
                    <p className="font-medium">
                      {selectedPutaway.grnNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Task Number
                    </Label>
                    <p className="font-medium">
                      {selectedPutaway.taskNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <StatusBadge status={selectedPutaway.status || "PENDING"} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Assigned To
                    </Label>
                    <p className="font-medium">
                      {selectedPutaway.assignedTo || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Receiving Area
                    </Label>
                    <p className="font-medium">
                      {selectedPutaway.receivingArea || "-"}
                    </p>
                  </div>
                  {/* <div>
                      <Label className="text-xs text-muted-foreground">Rock ID</Label>
                      <p className="font-medium">{selectedPutaway.rockId || "-"}</p>
                    </div> */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Warehouse
                    </Label>
                    <p className="font-medium">
                      {selectedPutaway.warehouseId || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Total Quantity
                    </Label>
                    <p className="font-medium">
                      {selectedPutaway.totalQuantity || 0}
                    </p>
                  </div>
                  {/* <div>
                    <Label className="text-xs text-muted-foreground">Pending Quantity</Label>
                    <p className="font-medium">{selectedPutaway.pendingQuantity || 0}</p>
                  </div> */}
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      Created At
                    </Label>
                    <p className="font-medium text-sm">
                      {selectedPutaway.createdAt
                        ? format(
                            new Date(selectedPutaway.createdAt),
                            "dd MMM yyyy HH:mm",
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Putaway Lines</Label>
                  <div className="border rounded-md overflow-hidden mt-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead className="text-right">
                              Quantity
                            </TableHead>
                            {/* <TableHead className="text-right">Putaway Qty</TableHead> */}
                            <TableHead className="text-right">
                              Remaining
                            </TableHead>
                            <TableHead>Batch No.</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPutaway.lines?.map((line, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {line.itemCode || "-"}
                              </TableCell>
                              <TableCell>{line.itemName || "-"}</TableCell>
                              <TableCell>{line.uom || "Nos"}</TableCell>
                              <TableCell className="text-right">
                                {line.quantity || 0}
                              </TableCell>
                              {/* <TableCell className="text-right">
                                {line.putawayQuantity || 0}
                              </TableCell> */}
                              <TableCell className="text-right">
                                {line.remainingQuantity || 0}
                              </TableCell>
                              <TableCell className="text-xs">
                                {line.batchNumber || "-"}
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={line.status || "PENDING"}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4">
                <Button onClick={closeViewDetails}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-8"
            placeholder="Search GRN, inbound, supplier..."
          />
          {search && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {grns.length} approved GRNs available
        </p>
      </div>

      {/* Putaway History */}
      {/* Table Section - With the same design as GRN page */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            #
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Task Number
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            GRN Number
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Assigned To
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Receiving Area
          </th>
         
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Items
          </th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Qty
          </th>
          
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
           
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Action
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {isLoadingHistory ? (
          <tr>
            <td colSpan="12" className="text-center py-12">
              <div className="flex justify-center items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
                <span className="text-gray-500 font-medium">
                  Loading putaway history...
                </span>
              </div>
            </td>
          </tr>
        ) : !putawayHistory.length ? (
          <tr>
            <td colSpan="12" className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Boxes className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500 font-medium">
                  No putaway history found
                </p>
                <p className="text-sm text-gray-400">
                  Initiate a putaway to get started
                </p>
              </div>
            </td>
          </tr>
        ) : (
          putawayHistory.slice(0, 10).map((item, idx) => (
            <tr
              key={item.id || idx}
              className="hover:bg-gray-50 transition-colors group"
            >
              <td className="px-4 py-3">
                <span className="text-sm text-gray-500">{idx + 1}</span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => viewPutawayDetails(item)}
                  className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                >
                  {item.taskNumber || "-"}
                </button>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-blue-600">
                  {item.grnNumber || "-"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-800">
                    {item.assignedTo || "-"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {item.receivingArea || "-"}
                  </span>
                </div>
              </td>
               
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {item.lines?.length || 0}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-sm font-medium text-gray-800">
                  {item.totalQuantity || 0}
                </span>
              </td>
              
              <td className="px-4 py-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    item.status === "COMPLETED"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : item.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : item.status === "CANCELLED"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {item.status || "PENDING"}
                </span>
              </td>
             
              <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => viewPutawayDetails(item)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>
    </div>
  );
}
