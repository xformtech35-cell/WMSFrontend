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
  Building2,
  Calendar,
  Eye,
  FileText,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Filter,
  Package,
  Truck,
  CreditCard,
  Hash,
  Mail,
  Phone,
  User,
  Building,
} from "lucide-react";
import api from "@/lib/api";

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

const getRFQsAPI = async (page = 0, size = 10, searchTerm = "") => {
  const requestBody = {
    filters: {
      searchTerm: searchTerm || "",
    },
    page: page,
    size: size,
    sortBy: "createdAt",
    sortDir: "desc",
  };
  return apiRequest("/rfqs/filter", "POST", requestBody);
};

const getRFQByIdAPI = async (id) => {
  return apiRequest(`/rfqs/${id}`);
};

export default function RFQPage() {
  const router = useRouter();

  // List State
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRFQ, setViewingRFQ] = useState(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRFQs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadRFQs();
  }, [currentPage]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadRFQs = async () => {
    try {
      setLoading(true);
      const response = await getRFQsAPI(currentPage, pageSize, searchTerm);

      if (response && response.content) {
        setRFQs(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else {
        setRFQs([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading RFQs:", error);
      setErrorMessage("Failed to load RFQs.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (rfq) => {
    try {
      setLoading(true);
      const fullRFQ = await getRFQByIdAPI(rfq.id);
      setViewingRFQ(fullRFQ);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading RFQ details:", error);
      setErrorMessage("Failed to load RFQ details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingRFQ(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      SUBMITTED: "bg-purple-100 text-purple-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-indigo-100 text-indigo-700",
      EXPIRED: "bg-gray-100 text-gray-500",
      CANCELLED: "bg-red-100 text-red-500",
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
      SUBMITTED: "bg-purple-100 text-purple-700 border-purple-200",
      APPROVED: "bg-green-100 text-green-700 border-green-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
      COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-200",
      EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
      CANCELLED: "bg-red-100 text-red-500 border-red-200",
    };
    return colors[status] || colors.DRAFT;
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
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
                  Request for Quotations (RFQ)
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Manage and track RFQs for purchase requests
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadRFQs}
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
                  placeholder="Search by RFQ Number, PR Number, or Reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {rfqs.length} of {totalElements} RFQs
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
                    RFQ Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PR Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFQ Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Closing Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : rfqs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No RFQs found
                    </td>
                  </tr>
                ) : (
                  rfqs.map((rfq) => (
                    <tr
                      key={rfq.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">
                          {rfq.rfqNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {rfq.prNumber || "N/A"}
                          </span>
                          {rfq.referenceNumber && (
                            <div className="text-xs text-gray-500">
                              Ref: {rfq.referenceNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(rfq.rfqDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(rfq.closingDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {rfq.items?.length || 0} items
                        </span>
                        {rfq.vendorQuotations && (
                          <span className="ml-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            {rfq.vendorQuotations.length} quotes
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}
                        >
                          {rfq.status?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {/* // In the RFQPage component, update the view button: */}
                        <button
                          type="button"
                          onClick={() => router.push(`/rfqs/${rfq.id}`)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
                RFQs
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
        {showViewModal && viewingRFQ && (
          <RFQViewModal
            rfq={viewingRFQ}
            onClose={handleViewClose}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusBadgeColor={getStatusBadgeColor}
          />
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

// RFQ View Modal Component
function RFQViewModal({
  rfq,
  onClose,
  formatDate,
  formatDateTime,
  getStatusBadgeColor,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!rfq) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "items", label: "Items", icon: Package },
    { id: "quotations", label: "Quotations", icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {rfq.rfqNumber}
              </h2>
              <p className="text-sm text-gray-500">
                PR: {rfq.prNumber} | Reference: {rfq.referenceNumber || "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(rfq.status)}`}
              >
                {rfq.status?.replace(/_/g, " ") || "N/A"}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === "quotations" && (
                      <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {rfq.vendorQuotations?.length || 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* RFQ Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">RFQ Date</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(rfq.rfqDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Closing Date</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(rfq.closingDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border inline-block ${getStatusBadgeColor(rfq.status)}`}
                    >
                      {rfq.status?.replace(/_/g, " ") || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rfq.deliveryTerms && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Truck className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Delivery Terms
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {rfq.deliveryTerms}
                      </p>
                    </div>
                  )}
                  {rfq.paymentTerms && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Payment Terms
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {rfq.paymentTerms}
                      </p>
                    </div>
                  )}
                  {rfq.termsAndConditions && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Terms & Conditions
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {rfq.termsAndConditions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                {rfq.remarks && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </h4>
                    <p className="text-sm text-gray-600">{rfq.remarks}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t border-gray-200 pt-4 flex justify-between text-xs text-gray-500">
                  <span>Created: {formatDateTime(rfq.createdAt)}</span>
                  <span>Updated: {formatDateTime(rfq.updatedAt)}</span>
                </div>
              </div>
            )}

            {activeTab === "items" && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Items ({rfq.items?.length || 0})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UOM
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rfq.items?.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.itemCode || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                            {item.description || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.uom || "Nos"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.quantity || item.requestedQty || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ₹{(item.estimatedUnitPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ₹{(item.estimatedTotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-3 text-right font-medium text-gray-700"
                        >
                          Total Items:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {rfq.items?.length || 0}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "quotations" && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Vendor Quotations ({rfq.vendorQuotations?.length || 0})
                  </h3>
                </div>
                {rfq.vendorQuotations?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No quotations received yet
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rfq.vendorQuotations?.map((quotation, index) => (
                      <div
                        key={quotation.id || index}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {quotation.quotationNumber}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 className="w-3 h-3" />
                              <span>{quotation.supplierName}</span>
                              {quotation.supplierCode && (
                                <span className="text-xs text-gray-400">
                                  ({quotation.supplierCode})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {quotation.rank && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                Rank #{quotation.rank}
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                quotation.status === "COMPARED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {quotation.status || "PENDING"}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div>
                              <span className="text-xs text-gray-500">
                                Quotation Date
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(quotation.quotationDate)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Delivery Date
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(quotation.deliveryDate)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Valid Till
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(quotation.validTill)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Grand Total
                              </span>
                              <p className="text-sm font-bold text-green-600">
                                ₹{quotation.grandTotal?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                          </div>

                          {quotation.items && quotation.items.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                      Item
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                      UOM
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      Qty
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      Unit Price
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quotation.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-gray-900">
                                        {item.itemName}
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">
                                        {item.uom || "Nos"}
                                      </td>
                                      <td className="px-3 py-2 text-gray-900 text-right">
                                        {item.quantity}
                                      </td>
                                      <td className="px-3 py-2 text-gray-900 text-right">
                                        ₹{item.unitPrice?.toFixed(2) || "0.00"}
                                      </td>
                                      <td className="px-3 py-2 font-medium text-gray-900 text-right">
                                        ₹
                                        {item.totalAmount?.toFixed(2) || "0.00"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {quotation.remarks && (
                            <div className="mt-3 text-xs text-gray-500">
                              <span className="font-medium">Remarks:</span>{" "}
                              {quotation.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
