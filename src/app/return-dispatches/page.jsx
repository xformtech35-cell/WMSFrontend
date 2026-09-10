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
  CheckCircle,
  Package,
  FileText,
  Truck,
  Boxes,
  ExternalLink,
  AlertTriangle,
  Check,
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

// Get all dispatches
const getDispatchesAPI = async (page = 0, size = 20, searchTerm = "") => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("size", size);
  if (searchTerm) params.append("search", searchTerm);

  return apiRequest(`/vendor-returns/dispatches?${params.toString()}`, "GET");
};

// Confirm Dispatch API
const confirmDispatchAPI = async (dispatchId, payload = {}) => {
  return apiRequest(
    `/vendor-returns/dispatches/${dispatchId}/confirm`,
    "PATCH",
    payload,
  );
};

// Main Component
export default function ReturnDispatches() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDispatch, setViewingDispatch] = useState(null);

  // Confirm dispatch state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingDispatch, setConfirmingDispatch] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmRemarks, setConfirmRemarks] = useState("");

  // Load data on mount + page change
  useEffect(() => {
    loadDispatches();
  }, [currentPage, pageSize]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      loadDispatches();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-clear messages
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const response = await getDispatchesAPI(
        currentPage,
        pageSize,
        searchTerm,
      );

      if (response && response.content) {
        setDispatches(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setDispatches(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        setDispatches([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading dispatches:", error);
      setErrorMessage(`Failed to load dispatches: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (dispatch) => {
    setViewingDispatch(dispatch);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingDispatch(null);
  };

  // ==================== Confirm Dispatch Handlers ====================

  const handleConfirmClick = (dispatch) => {
    setConfirmingDispatch(dispatch);
    setConfirmRemarks("");
    setShowConfirmModal(true);
  };

  const handleConfirmClose = () => {
    if (confirming) return;
    setShowConfirmModal(false);
    setConfirmingDispatch(null);
    setConfirmRemarks("");
  };

  const handleSubmitConfirm = async () => {
    if (!confirmingDispatch) return;

    try {
      setConfirming(true);
      const payload = confirmRemarks.trim()
        ? { remarks: confirmRemarks.trim() }
        : {};

      await confirmDispatchAPI(confirmingDispatch.id, payload);

      setSuccessMessage(
        `Dispatch ${confirmingDispatch.dispatchNumber || confirmingDispatch.id} confirmed successfully!`,
      );
      setShowSuccess(true);
      setShowConfirmModal(false);
      setConfirmingDispatch(null);
      setConfirmRemarks("");

      await loadDispatches();
    } catch (error) {
      console.error("Error confirming dispatch:", error);
      setErrorMessage(`Failed to confirm dispatch: ${error.message}`);
    } finally {
      setConfirming(false);
    }
  };

  // ==================== Display Helpers ====================

  const getStatusColor = (status) => {
    const colors = {
      CREATED: "bg-blue-100 text-blue-700",
      DISPATCHED: "bg-teal-100 text-teal-700",
      IN_TRANSIT: "bg-indigo-100 text-indigo-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      POD_RECEIVED: "bg-emerald-100 text-emerald-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusDisplayName = (dispatch) => {
    if (dispatch.statusDisplayName) return dispatch.statusDisplayName;
    if (!dispatch.status) return "N/A";
    return dispatch.status
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Can this dispatch be confirmed?
  const canConfirm = (d) => d.status === "CREATED";

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-2xl border border-green-200 p-4 flex items-center gap-3 animate-scale-up">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-700">{successMessage}</span>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error */}
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
                  All Dispatches
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Vendor return dispatches
                </p>
              </div>
              <button
                type="button"
                onClick={loadDispatches}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
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
                  placeholder="Search by Dispatch #, VRO #, or Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Showing {dispatches.length} of {totalElements} dispatches
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
                    Dispatch #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VRO #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatch Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LR / Challan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POD
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : dispatches.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-8 text-gray-500">
                      No dispatches found
                    </td>
                  </tr>
                ) : (
                  dispatches.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">
                          {d.dispatchNumber || d.id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {d.returnOrderNumber || d.returnOrderId || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-800">
                          {d.supplierName || "—"}
                        </div>
                        {d.supplierCode ? (
                          <div className="text-xs text-gray-400">
                            {d.supplierCode}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{formatDate(d.dispatchDate)}</div>
                        {d.dispatchTime ? (
                          <div className="text-xs text-gray-400">
                            {d.dispatchTime}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Truck className="w-3 h-3 text-gray-400" />
                          {d.transportModeDisplayName || d.transportMode || "—"}
                        </div>
                        {d.vehicleNumber ? (
                          <div className="text-xs text-gray-400">
                            {d.vehicleNumber}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-700">
                          {d.lrNumber || "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {d.returnChallanNumber || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {d.totalItems || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {d.totalQuantity || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {d.totalWeight != null ? `${d.totalWeight} kg` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}
                        >
                          {getStatusDisplayName(d)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.podReceived ? (
                          <CheckCircle
                            className="w-4 h-4 text-green-600 inline"
                            title="POD received"
                          />
                        ) : (
                          <XCircle
                            className="w-4 h-4 text-gray-300 inline"
                            title="POD not received"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleViewClick(d)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canConfirm(d) && (
                            <button
                              type="button"
                              onClick={() => handleConfirmClick(d)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Confirm Dispatch"
                            >
                              <Truck className="w-4 h-4" />
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
                dispatches
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

        {/* View Modal */}
        {showViewModal && viewingDispatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
            <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl my-4">
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Dispatch Details
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-blue-600 font-medium">
                      {viewingDispatch.dispatchNumber}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-sm text-gray-500">
                      {viewingDispatch.returnOrderNumber}
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

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Supplier</div>
                    <div className="font-medium text-sm text-gray-800">
                      {viewingDispatch.supplierName || "—"}
                    </div>
                    {viewingDispatch.supplierCode ? (
                      <div className="text-xs text-gray-400">
                        {viewingDispatch.supplierCode}
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Dispatch At
                    </div>
                    <div className="font-medium text-sm text-gray-800">
                      {formatDate(viewingDispatch.dispatchDate)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {viewingDispatch.dispatchTime || ""}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Status</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block mt-1 ${getStatusColor(viewingDispatch.status)}`}
                    >
                      {getStatusDisplayName(viewingDispatch)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">POD</div>
                    <div className="font-medium text-sm text-gray-800">
                      {viewingDispatch.podReceived ? "Received" : "Pending"}
                    </div>
                    {viewingDispatch.podNumber ? (
                      <div className="text-xs text-gray-400">
                        {viewingDispatch.podNumber}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Transport
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <Row
                        label="Mode"
                        value={
                          viewingDispatch.transportModeDisplayName ||
                          viewingDispatch.transportMode
                        }
                      />
                      <Row
                        label="Company"
                        value={viewingDispatch.transportCompany}
                      />
                      <Row
                        label="Transporter"
                        value={viewingDispatch.transporterName}
                      />
                      <Row
                        label="Vehicle"
                        value={viewingDispatch.vehicleNumber}
                      />
                      <Row
                        label="Driver"
                        value={viewingDispatch.driverName}
                      />
                      <Row
                        label="Driver Phone"
                        value={viewingDispatch.driverPhone}
                      />
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Challan & Tracking
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <Row label="LR #" value={viewingDispatch.lrNumber} />
                      <Row label="AWB #" value={viewingDispatch.awbNumber} />
                      <Row
                        label="Challan #"
                        value={viewingDispatch.returnChallanNumber}
                      />
                      <Row
                        label="Challan Date"
                        value={formatDate(viewingDispatch.returnChallanDate)}
                      />
                      {viewingDispatch.trackingUrl ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Tracking</dt>
                          <dd>
                            <a
                              href={viewingDispatch.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Boxes className="w-4 h-4" /> Totals
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Stat label="Items" value={viewingDispatch.totalItems} />
                      <Stat
                        label="Quantity"
                        value={viewingDispatch.totalQuantity}
                      />
                      <Stat
                        label="Weight"
                        value={
                          viewingDispatch.totalWeight != null
                            ? `${viewingDispatch.totalWeight} kg`
                            : "—"
                        }
                      />
                      <Stat
                        label="Volume"
                        value={
                          viewingDispatch.totalVolume != null
                            ? `${viewingDispatch.totalVolume} m³`
                            : "—"
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items ({viewingDispatch.items?.length || 0})
                  </h3>
                  {viewingDispatch.items && viewingDispatch.items.length > 0 ? (
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
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Dispatched
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Packed
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Packaging
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Pkg Count
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Pkg Weight
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {viewingDispatch.items.map((item, i) => (
                            <tr key={item.id || item.vroLineId || i}>
                              <td className="px-3 py-2 text-xs text-gray-500">
                                {i + 1}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {item.itemCode}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {item.itemName}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.dispatchedQuantity}
                              </td>
                              <td className="px-3 py-2 text-right text-green-600">
                                {item.packedQuantity}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {item.packagingType || "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.packageCount ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.packageWeight != null
                                  ? `${item.packageWeight} kg`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                      Item details not available in list response.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
                {canConfirm(viewingDispatch) && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = viewingDispatch;
                      handleViewClose();
                      handleConfirmClick(d);
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 inline-flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Confirm Dispatch
                  </button>
                )}
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

        {/* Confirm Dispatch Modal */}
        {showConfirmModal && confirmingDispatch && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl my-4 animate-scale-up">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-100 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Confirm Dispatch
                    </h2>
                    <p className="text-xs text-gray-500">
                      This will mark the dispatch as confirmed
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  disabled={confirming}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Warning */}
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Are you sure?</p>
                    <p className="text-amber-700 mt-0.5">
                      Once confirmed, the dispatch status cannot be reverted.
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Dispatch #</span>
                    <span className="font-medium text-blue-600">
                      {confirmingDispatch.dispatchNumber ||
                        confirmingDispatch.id}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VRO #</span>
                    <span className="font-medium text-gray-800">
                      {confirmingDispatch.returnOrderNumber ||
                        confirmingDispatch.returnOrderId ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Supplier</span>
                    <span className="font-medium text-gray-800">
                      {confirmingDispatch.supplierName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transport</span>
                    <span className="font-medium text-gray-800">
                      {confirmingDispatch.transportModeDisplayName ||
                        confirmingDispatch.transportMode ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">LR #</span>
                    <span className="font-medium text-gray-800">
                      {confirmingDispatch.lrNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Items</span>
                    <span className="font-medium text-gray-800">
                      {confirmingDispatch.totalItems || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Qty</span>
                    <span className="font-medium text-gray-800">
                      {confirmingDispatch.totalQuantity || 0}
                    </span>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Remarks{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={confirmRemarks}
                    onChange={(e) => setConfirmRemarks(e.target.value)}
                    placeholder="Add any notes about this confirmation..."
                    rows={3}
                    disabled={confirming}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  disabled={confirming}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitConfirm}
                  disabled={confirming}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {confirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm Dispatch
                    </>
                  )}
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

/* ---------- Small presentational helpers ---------- */

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800 text-right">{value || "—"}</dd>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-md px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">
        {value != null && value !== "" ? value : "—"}
      </div>
    </div>
  );
}