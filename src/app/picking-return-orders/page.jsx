"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  XCircle,
  Building2,
  Flag,
  CheckCircle,
  Package,
  Calendar,
  CreditCard,
  FileText,
  ArrowLeftRight,
  Truck,
  Printer,
  Download,
  RotateCw,
  User,
  Boxes,
  Clock,
  Percent,
  Check,
  X,
} from "lucide-react";
import api from "@/lib/api";

// API Functions
const apiRequest = async (
  endpoint,
  method = "GET",
  data = null,
  params = null,
) => {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
      params,
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

// API function for picklists
const getPicklistsAPI = async (
  page = 0,
  size = 10,
  searchTerm = "",
  status = "ALL",
) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("size", size);

  if (searchTerm) {
    params.append("searchTerm", searchTerm);
  }

  if (status && status !== "ALL") {
    params.append("status", status);
  }

  return apiRequest(
    `/vendor-returns/picklists/search?${params.toString()}`,
    "POST",
  );
};

// Pick items API
const pickItemsAPI = async (orderId, lines) => {
  return apiRequest(`/vendor-returns/orders/${orderId}/pick`, "PATCH", lines);
};

// Main Component
export default function VendorReturnPicklistsPage() {
  const [picklists, setPicklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPicklist, setViewingPicklist] = useState(null);

  // State for pick modal
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedPicklist, setSelectedPicklist] = useState(null);
  const [selectedLines, setSelectedLines] = useState([]);
  const [pickingItems, setPickingItems] = useState(false);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadPicklists();
  }, [currentPage, pageSize, statusFilter]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPicklists();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadPicklists = async () => {
    try {
      setLoading(true);
      const response = await getPicklistsAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      if (response && response.content) {
        setPicklists(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setPicklists(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        setPicklists([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading picklists:", error);
      setErrorMessage("Failed to load picklists.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (picklist) => {
    setViewingPicklist(picklist);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingPicklist(null);
  };

  const handlePickClick = (picklist) => {
    setSelectedPicklist(picklist);
    setSelectedOrderId(picklist.id);
    // Initialize with all lines selected by default
    setSelectedLines(picklist.items?.map(item => ({ lineId: item.id })) || []);
    setShowPickModal(true);
  };

  const handleLineToggle = (lineId) => {
    setSelectedLines(prev => {
      const exists = prev.some(item => item.lineId === lineId);
      if (exists) {
        return prev.filter(item => item.lineId !== lineId);
      } else {
        return [...prev, { lineId }];
      }
    });
  };

  const handleSelectAllLines = () => {
    if (!selectedPicklist?.items) return;
    const allLineIds = selectedPicklist.items.map(item => ({ lineId: item.id }));
    setSelectedLines(allLineIds);
  };

  const handleDeselectAllLines = () => {
    setSelectedLines([]);
  };

  const handleSubmitPick = async () => {
    if (!selectedOrderId || selectedLines.length === 0) {
      setErrorMessage("Please select at least one item to pick.");
      return;
    }

    try {
      setPickingItems(true);
      await pickItemsAPI(selectedOrderId, selectedLines);
      
      setSuccessMessage(`Successfully picked ${selectedLines.length} item(s)!`);
      setShowSuccess(true);
      setShowPickModal(false);
      setSelectedPicklist(null);
      setSelectedOrderId(null);
      setSelectedLines([]);
      
      // Reload picklists
      await loadPicklists();
    } catch (error) {
      console.error("Error picking items:", error);
      setErrorMessage(`Failed to pick items: ${error.message}`);
    } finally {
      setPickingItems(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      PACKED: "bg-purple-100 text-purple-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusDisplayName = (status) => {
    const names = {
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      PACKED: "Packed",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return names[status] || status || "Pending";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-orange-100 text-orange-700",
      CRITICAL: "bg-red-100 text-red-700",
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getItemStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      PICKED: "bg-blue-100 text-blue-700",
      PACKED: "bg-purple-100 text-purple-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
  };

  const getItemStatusDisplayName = (status) => {
    const names = {
      PENDING: "Pending",
      PICKED: "Picked",
      PACKED: "Packed",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return names[status] || status || "Pending";
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderProgressBar = (progress) => {
    const percentage = Math.round(progress || 0);
    const color =
      percentage === 100
        ? "bg-green-500"
        : percentage > 50
          ? "bg-blue-500"
          : "bg-yellow-500";

    return (
      <div className="w-24">
        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`${color} h-1.5 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Modal */}
        {showSuccess && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSuccess(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform animate-scale-up pointer-events-auto border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Success!
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">{successMessage}</p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Vendor Return Picklists
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Manage picking lists for vendor returns
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadPicklists}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Pick List #, VRO #, or Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PACKED">Packed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Showing {picklists.length} of {totalElements} picklists
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pick List No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VRO No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : picklists.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8 text-gray-500">
                      No picklists found
                    </td>
                  </tr>
                ) : (
                  picklists.map((picklist) => (
                    <tr
                      key={picklist.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">
                          {picklist.pickListNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {picklist.vroNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-800">
                            {picklist.supplierName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {picklist.supplierCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">
                            {picklist.assignedTo || "Unassigned"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {picklist.totalItems || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {picklist.totalQuantity || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(picklist.priority)}`}
                        >
                          <Flag className="w-3 h-3" />
                          {picklist.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(picklist.status)}`}
                        >
                          {getStatusDisplayName(picklist.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateShort(picklist.assignedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(picklist)}
                            className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {picklist.status !== "COMPLETED" && picklist.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => handlePickClick(picklist)}
                              className="text-green-600 cursor-pointer hover:text-green-800 transition-colors"
                              title="Pick Items"
                            >
                              <Check className="w-4 h-4" />
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
          {totalPages > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-500">
                Page {currentPage + 1} of {totalPages} | Total: {totalElements}{" "}
                picklists
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">{currentPage + 1}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pick Modal */}
        {showPickModal && selectedPicklist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
            <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl my-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Pick Items
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedPicklist.pickListNumber}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-sm text-gray-500">
                      {selectedPicklist.vroNumber}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-sm text-gray-500">
                      Supplier: {selectedPicklist.supplierName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPickModal(false);
                    setSelectedPicklist(null);
                    setSelectedOrderId(null);
                    setSelectedLines([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Select items to pick: <span className="font-medium">{selectedLines.length}</span> selected
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllLines}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllLines}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          <input
                            type="checkbox"
                            checked={selectedLines.length === selectedPicklist.items?.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSelectAllLines();
                              } else {
                                handleDeselectAllLines();
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Item Code
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Item Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Location
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Order Qty
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Picked
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Remaining
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPicklist.items?.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedLines.some(line => line.lineId === item.id)}
                              onChange={() => handleLineToggle(item.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              disabled={item.status === "PICKED" || item.status === "PACKED"}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-800">
                            {item.itemCode}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {item.itemName}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {item.pickLocation}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.orderQuantity}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600">
                            {item.pickedQuantity}
                          </td>
                          <td className="px-3 py-2 text-right text-orange-600">
                            {item.remainingQuantity}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}
                            >
                              {getItemStatusDisplayName(item.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowPickModal(false);
                    setSelectedPicklist(null);
                    setSelectedOrderId(null);
                    setSelectedLines([]);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPick}
                  disabled={pickingItems || selectedLines.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {pickingItems ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Picking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Pick Selected ({selectedLines.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingPicklist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
            <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl my-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Picklist Details
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-blue-600 font-medium">
                      {viewingPicklist.pickListNumber}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-sm text-gray-500">
                      {viewingPicklist.vroNumber}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleViewClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Supplier</div>
                    <div className="font-medium text-sm">
                      {viewingPicklist.supplierName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {viewingPicklist.supplierCode}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Assigned To</div>
                    <div className="font-medium text-sm">
                      {viewingPicklist.assignedTo || "Unassigned"}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Status</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block mt-1 ${getStatusColor(viewingPicklist.status)}`}
                    >
                      {getStatusDisplayName(viewingPicklist.status)}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items ({viewingPicklist.items?.length || 0})
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            #
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Item Code
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Item Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Location
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Order Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Picked
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Remaining
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewingPicklist.items?.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800">
                              {item.itemCode}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.itemName}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {item.pickLocation}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {item.orderQuantity}
                            </td>
                            <td className="px-3 py-2 text-right text-green-600">
                              {item.pickedQuantity}
                            </td>
                            <td className="px-3 py-2 text-right text-orange-600">
                              {item.remainingQuantity}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}
                              >
                                {getItemStatusDisplayName(item.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={handleViewClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}