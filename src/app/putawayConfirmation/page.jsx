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
  Play,
  Check,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { usePaginatedItems } from "@/lib/hooks/usePaginatedItems";
import { CREATE } from "@/components/apiRequest";
import PutawayDetailsModal from "./components/PutawayDetailsModal";
import PutawayConfirmModal from "./components/PutawayConfirmModal";

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

async function executePutaway(payload) {
  const response = await api.post("/putaway/execute", payload);
  return response.data;
}

async function confirmPutaway(payload) {
  const response = await CREATE("/putaway/confirm", payload);
  return response.data;
}

export default function PutawayConfirmationPage() {
  // State for GRN data
  const [grns, setGrns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for modal
  const [open, setOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedPutaway, setSelectedPutaway] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // State for search and filter
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [grnNumberFilter, setGrnNumberFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyPageSize] = useState(10);

  // State for selected GRN in form
  const [selectedGrnForPutaway, setSelectedGrnForPutaway] = useState("");
  const [grnItems, setGrnItems] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchApprovedGRNsList();
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

  const fetchPutawayHistory = async (
    page = 0,
    filters = {
      search: debouncedHistorySearch,
      status: statusFilter,
      stage: stageFilter,
      grnNumber: grnNumberFilter,
    },
  ) => {
    try {
      setIsLoadingHistory(true);
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("size", historyPageSize);
      if (filters.search?.trim()) {
        params.append("search", filters.search.trim());
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      if (filters.stage) {
        params.append("stage", filters.stage);
      }
      if (filters.grnNumber?.trim()) {
        params.append("grnNumber", filters.grnNumber.trim());
      }
      const response = await api.get(`/putaway?${params.toString()}`);
      const data = response.data?.data || response.data;
      const content = data?.content || response.data?.content || data || [];
      const totalPages = data?.totalPages || response.data?.totalPages || 0;
      const totalElements =
        data?.totalElements || response.data?.totalElements || 0;
      setPutawayHistory(content);
      setHistoryTotalPages(totalPages);
      setHistoryTotalElements(totalElements);
      setHistoryPage(page);
    } catch (error) {
      console.error("Error fetching putaway history:", error);
      toast.error("Failed to load putaway history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPutawayHistory(0, {
      search: debouncedHistorySearch,
      status: statusFilter,
      stage: stageFilter,
      grnNumber: grnNumberFilter,
    });
  }, [debouncedHistorySearch, statusFilter, stageFilter, grnNumberFilter]);

  const handleHistoryPageChange = (newPage) => {
    if (newPage >= 0 && newPage < historyTotalPages) {
      fetchPutawayHistory(newPage);
    }
  };

  const clearHistoryFilters = () => {
    setHistorySearch("");
    setDebouncedHistorySearch("");
    setStatusFilter("");
    setStageFilter("");
    setGrnNumberFilter("");
    setHistoryPage(0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistorySearch(historySearch.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [historySearch]);

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
      const items = (grn.lines || []).map((line) => {
        const location = [
          line.warehouseId,
          line.zone,
          line.aisle,
          line.rack,
          line.binId,
        ]
          .filter(Boolean)
          .join(" → ");

        return {
          id: line.id,
          itemCode: line.itemCode || "",
          itemName: line.itemName || "",
          uom: line.uom || "Nos",
          quantity: line.acceptedQuantity || line.quantity || 0,
          inboundLineId: line.id,
          batchNumber: line.batchNumber || "",
          location: location || "",
          serialNumber: "",
          suggestedBin: "",
          remarks: "",
          isSelected: false,
        };
      });
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

      await fetchPutawayHistory(0);
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

  const openConfirmModal = (item) => {
    setSelectedTask(item);
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setSelectedTask(null);
  };

  const handleConfirmPutaway = async (confirmData) => {
    try {
      const payload = {
        taskNumber: selectedTask.taskNumber,
        confirmedBy: confirmData.confirmedBy,
        confirmedQuantity: Number(confirmData.confirmedQuantity),
        binId: confirmData.binId,
        binBarcode: confirmData.binBarcode,
        isVerified: confirmData.isVerified,
        verifiedBy: confirmData.verifiedBy || confirmData.confirmedBy,
        remarks: confirmData.remarks || "",
        lines: confirmData.lines.map((line) => ({
          lineId: Number(line.lineId),
          confirmedQuantity: Number(line.confirmedQuantity),
          actualBin: line.actualBin || confirmData.binId,
          actualBinBarcode: line.actualBinBarcode || confirmData.binBarcode,
          remarks: line.remarks || "",
        })),
      };

      await confirmPutaway(payload);
      toast.success("Putaway confirmed successfully!");
      setConfirmModalOpen(false);
      setSelectedTask(null);
      await fetchPutawayHistory(historyPage);
    } catch (error) {
      console.error("Error confirming putaway:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to confirm putaway.",
      );
      throw error;
    }
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

  // Check if task can be confirmed (not completed/cancelled and has been executed)
  const canConfirm = (status, stage) => {
    return (
      status === "IN_PROGRESS" &&
      status !== "CANCELLED" &&
      (stage === "PLACED" || stage === "PICKED" || stage === "IN_PROGRESS")
    );
  };

  // Status options for filter
  const statusOptions = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const stageOptions = [
    "PENDING",
    "PICKED",
    "TRANSPORTED",
    "SCANNED",
    "PLACED",
    "CONFIRMED",
    "COMPLETED",
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Putaway Confirmation Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchPutawayHistory(historyPage)}
                disabled={isLoading}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Putaway Confirm Modal */}
      <PutawayConfirmModal
        open={confirmModalOpen}
        onClose={closeConfirmModal}
        selectedTask={selectedTask}
        onConfirm={handleConfirmPutaway}
        users={users}
      />

      {/* Putaway Details View - Custom Modal */}
      <PutawayDetailsModal
        open={viewDetailsOpen}
        onClose={closeViewDetails}
        selectedPutaway={selectedPutaway}
      />

      {/* Putaway History Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-9 pl-8 pr-8"
                placeholder="Search by task, GRN, assigned to..."
              />
              {historySearch && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    setHistorySearch("");
                    setDebouncedHistorySearch("");
                  }}
                >
                  <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(statusFilter || stageFilter || grnNumberFilter) && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                  {
                    [statusFilter, stageFilter, grnNumberFilter].filter(Boolean)
                      .length
                  }
                </span>
              )}
            </button>

            {(historySearch ||
              statusFilter ||
              stageFilter ||
              grnNumberFilter) && (
              <button
                type="button"
                onClick={clearHistoryFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Stage
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stages</option>
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

            
            </div>
          )}
        </div>
      </div>

      {/* Putaway History Table */}
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
                  Stage
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
                        {historySearch ||
                        statusFilter ||
                        stageFilter ||
                        grnNumberFilter
                          ? "Try adjusting your search filters"
                          : "Initiate a putaway to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                putawayHistory.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {historyPage * historyPageSize + idx + 1}
                      </span>
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
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          item.stage === "COMPLETED" || item.stage === "PLACED"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : item.stage === "IN_PROGRESS" ||
                                item.stage === "PICKED"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {item.stage || "PENDING"}
                      </span>
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewPutawayDetails(item)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === "CONFIRMED" && (
                          <button
                            onClick={() => openConfirmModal(item)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Confirm Putaway"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoadingHistory && putawayHistory.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-2">
            <div className="text-sm text-gray-500">
              Showing {historyPage * historyPageSize + 1} to{" "}
              {Math.min(
                (historyPage + 1) * historyPageSize,
                historyTotalElements,
              )}{" "}
              of {historyTotalElements} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleHistoryPageChange(historyPage - 1)}
                disabled={historyPage === 0}
                className={`p-2 rounded-lg border border-gray-200 transition-colors ${
                  historyPage === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {historyPage + 1} of {historyTotalPages || 1}
              </span>
              <button
                onClick={() => handleHistoryPageChange(historyPage + 1)}
                disabled={
                  historyPage === historyTotalPages - 1 ||
                  historyTotalPages === 0
                }
                className={`p-2 rounded-lg border border-gray-200 transition-colors ${
                  historyPage === historyTotalPages - 1 ||
                  historyTotalPages === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
