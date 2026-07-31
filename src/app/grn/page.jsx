// app/inbound/page.js
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle,
  Eye,
  FileText,
  Package,
  Truck,
  Calendar,
  Building2,
  Filter,
  Plus,
  Clock,
  X,
  ChevronDown,
  ArrowUpDown,
  Download,
  Printer,
  User,
  Hash,
  Warehouse,
  Box,
  CheckSquare,
  Loader,
  Shield,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import api from "@/lib/api";
import InboundViewModal from "../inbound/component/InboundViewModal";
import QualityInspectionModal from "./QualityInspectionModal";
import { formatDateTime } from "@/lib/utils/common";
import QualityApprovalInspectionModal from "./QualityInspectionModal";

// API Functions
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

const getInboundsAPI = async (
  page = 0,
  size = 10,
  searchTerm = "",
  filterStatus,
) => {
  const requestBody = {
    filters: {
      searchTerm: searchTerm || "",
      status: filterStatus,
    },
    page: page,
    size: size,
  };
  return apiRequest("/inbound/filter", "POST", requestBody);
};

const getInboundByIdAPI = async (id) => {
  return apiRequest(`/inbound/${id}`);
};

const updateGrnStatusAPI = async (inboundId, grnStatus, remarks) => {
  return apiRequest(`/inbound/${inboundId}/grn-status`, "PUT", {
    grnStatus,
    remarks,
  });
};

export default function GRN() {
  const router = useRouter();

  // List State
  const [inbounds, setInbounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingInbound, setViewingInbound] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionInbound, setInspectionInbound] = useState(null);
  const [filterStatus, setFilterStatus] = useState("GRN_PENDING");
  const [showGrnStatusModal, setShowGrnStatusModal] = useState(false);
  const [grnStatusInbound, setGrnStatusInbound] = useState(null);
  const [grnStatus, setGrnStatus] = useState("PENDING");
  const [grnRemarks, setGrnRemarks] = useState("");
  const [updatingGrn, setUpdatingGrn] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadInbounds();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on page change
  useEffect(() => {
    loadInbounds();
  }, [currentPage, filterStatus]);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadInbounds = async () => {
    try {
      setLoading(true);
      const response = await getInboundsAPI(
        currentPage,
        pageSize,
        searchTerm,
        filterStatus,
      );

      if (response && response.content) {
        setInbounds(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else {
        setInbounds([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading inbounds:", error);
      setErrorMessage("Failed to load inbound records.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (inbound) => {
    try {
      setViewLoading(true);
      const fullInbound = await getInboundByIdAPI(inbound.id);
      setViewingInbound(fullInbound);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading inbound details:", error);
      setErrorMessage("Failed to load inbound details.");
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingInbound(null);
  };

  const handleInspectionClick = (inbound) => {
    setInspectionInbound(inbound);
    setShowInspectionModal(true);
  };

  const handleInspectionSuccess = (inspectionData) => {
    setSuccessMessage(
      `Quality inspection completed for ${inspectionInbound?.inboundNumber}!`,
    );
    loadInbounds(); // Refresh the list
  };

  const handleGrnStatusClick = (inbound) => {
    setGrnStatusInbound(inbound);
    setGrnStatus(inbound.grnStatus || "PENDING");
    setGrnRemarks("");
    setShowGrnStatusModal(true);
  };

  const handleUpdateGrnStatus = async () => {
    if (!grnStatusInbound) return;

    try {
      setUpdatingGrn(true);
      await updateGrnStatusAPI(grnStatusInbound.id, grnStatus, grnRemarks);

      setSuccessMessage(
        `GRN status updated to ${grnStatus} for ${grnStatusInbound.inboundNumber}!`,
      );
      setShowGrnStatusModal(false);
      loadInbounds(); // Refresh the list
    } catch (error) {
      console.error("Error updating GRN status:", error);
      setErrorMessage("Failed to update GRN status.");
    } finally {
      setUpdatingGrn(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
      PARTIAL: "bg-orange-100 text-orange-700 border-orange-200",
      GRN_PENDING: "bg-green-100 text-green-700 border-green-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
      CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStageColor = (stage) => {
    const colors = {
      PENDING_INBOUND: "bg-purple-100 text-purple-700 border-purple-200",
      GATE_ENTRY: "bg-indigo-100 text-indigo-700 border-indigo-200",
      UNLOADING: "bg-blue-100 text-blue-700 border-blue-200",
      RECEIVING: "bg-cyan-100 text-cyan-700 border-cyan-200",
      INSPECTION: "bg-teal-100 text-teal-700 border-teal-200",
      QUALITY_CHECK: "bg-emerald-100 text-emerald-700 border-emerald-200",
      GRN_GENERATION: "bg-green-100 text-green-700 border-green-200",
      GRN_PENDING: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[stage] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      IN_PROGRESS: <Loader className="w-4 h-4" />,
      PARTIAL: <Package className="w-4 h-4" />,
      GRN_PENDING: <CheckCircle className="w-4 h-4" />,
      REJECTED: <XCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || <FileText className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterToggle = (status) => {
    if (filterStatus === status) {
      setFilterStatus(null);
    } else {
      setFilterStatus(status);
    }
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-slide-down">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
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
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Warehouse className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">GRN</h1>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                
                <button
                  type="button"
                  onClick={loadInbounds}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Inbound Number, PO Number, or Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterToggle("GRN_PENDING")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filterStatus === "GRN_PENDING"
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Clock className="w-4 h-4" />
                Pending Only
              </button>
              <button
                onClick={() => handleFilterToggle(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === null
                    ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Records
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg">
                {totalElements} records
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GRN #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GRN Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GRN Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12">
                      <div className="flex justify-center items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
                        <span className="text-gray-500 font-medium">
                          Loading inbounds...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : inbounds.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Warehouse className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          No inbound records found
                        </p>
                        <p className="text-sm text-gray-400">
                          Try adjusting your search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inbounds.map((inbound) => (
                    <tr
                      key={inbound.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewClick(inbound)}
                          className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                        >
                          {inbound.grnNumber || inbound.inboundNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(inbound.grnDate || inbound.inboundDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600">
                          {inbound.poNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {inbound.supplierName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {inbound.invoiceNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(inbound.status)}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inbound.status)}`}
                          >
                            {inbound.status?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            inbound.grnStatus === "APPROVED"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : inbound.grnStatus === "REJECTED"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {inbound.grnStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {inbound.grnDate
                            ? formatDateTime(inbound.grnDate)
                            : "Not Generated"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleViewClick(inbound)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {inbound.status === "GRN_PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleGrnStatusClick(inbound)}
                              className="px-3 cursor-pointer py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                              title="Quality Inspection"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Generate
                            </button>
                          )}
                          {/* {inbound.grnStatus && (
                            <button
                              type="button"
                              onClick={() => handleGrnStatusClick(inbound)}
                              className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                                inbound.grnStatus === "APPROVED"
                                  ? "text-green-600 bg-green-50 hover:bg-green-100"
                                  : inbound.grnStatus === "REJECTED"
                                  ? "text-red-600 bg-red-50 hover:bg-red-100"
                                  : "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              {inbound.grnStatus}
                            </button>
                          )} */}
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
                records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  {currentPage + 1}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quality Inspection Modal */}

        {/* GRN Status Update Modal */}
        {showGrnStatusModal && grnStatusInbound && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 backdrop-blur-sm transition-opacity"
              onClick={() => setShowGrnStatusModal(false)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-up">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl"></div>

                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Update GRN Status
                        </h3>
                        <p className="text-sm text-gray-500">
                          {grnStatusInbound.inboundNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowGrnStatusModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GRN Status
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGrnStatus("APPROVED")}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          grnStatus === "APPROVED"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ThumbsUp
                            className={`w-4 h-4 ${grnStatus === "APPROVED" ? "text-green-500" : "text-gray-400"}`}
                          />
                          <span
                            className={`font-medium ${grnStatus === "APPROVED" ? "text-green-700" : "text-gray-700"}`}
                          >
                            Approve
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrnStatus("REJECTED")}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          grnStatus === "REJECTED"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ThumbsDown
                            className={`w-4 h-4 ${grnStatus === "REJECTED" ? "text-red-500" : "text-gray-400"}`}
                          />
                          <span
                            className={`font-medium ${grnStatus === "REJECTED" ? "text-red-700" : "text-gray-700"}`}
                          >
                            Reject
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks
                      <span className="text-gray-400 text-xs ml-2">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={grnRemarks}
                      onChange={(e) => setGrnRemarks(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter remarks..."
                    />
                  </div>

                  {/* Current Status Display */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Current Status
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          grnStatusInbound.grnStatus === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : grnStatusInbound.grnStatus === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {grnStatusInbound.grnStatus || "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGrnStatusModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateGrnStatus}
                    disabled={updatingGrn}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all flex items-center gap-2 ${
                      grnStatus === "APPROVED"
                        ? "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                        : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                    }`}
                  >
                    {updatingGrn ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        {/* <Save className="w-4 h-4" /> */}
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingInbound && (
          <InboundViewModal
            isgrn={true}
            inbound={viewingInbound}
            onClose={handleViewClose}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getStageColor={getStageColor}
            onProcess={(inbound) => {
              handleViewClose();
              router.push(`/inbound/process/${inbound.id}`);
            }}
            onPrint={() => window.print()}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
