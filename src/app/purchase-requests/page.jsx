"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  XCircle,
  Building2,
  Flag,
  CheckCircle,
  Send,
} from "lucide-react";
import api from "@/lib/api";
import PurchaseRequestForm from "./components/PurchaseRequestForm";
import PurchaseRequestView from "./components/PurchaseRequestView";
import RFQForm from "../purchase-approval/components/RFQForm";

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

// Updated API function to use filter endpoint
const getPurchaseRequestsAPI = async (
  page = 0,
  size = 10,
  searchTerm = "",
  status = "ALL",
) => {
  // Convert status filter to match backend expectations
  let statusParam = status;
  if (status === "ALL") {
    statusParam = ""; // Or you can send null/undefined, adjust based on your backend
  }

  const requestBody = {
    filters: { status: statusParam, searchTerm: searchTerm || "" },
    page: page,
    size: size,
  };

  return apiRequest("/purchase-requests/filter", "POST", requestBody);
};

const getPurchaseRequestByIdAPI = async (id) => {
  return apiRequest(`/purchase-requests/${id}`);
};

export default function PurchaseRequestPage() {
  const router = useRouter();

  // List State
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // UI State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingPR, setEditingPR] = useState(null);
  const [viewingPR, setViewingPR] = useState(null);
  const [formMode, setFormMode] = useState("create"); // "create" or "edit"
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [selectedPRForRFQ, setSelectedPRForRFQ] = useState(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPurchaseRequests();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadPurchaseRequests();
  }, [currentPage, pageSize, statusFilter]);

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

  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseRequestsAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      // Handle different response structures
      if (response && response.content) {
        setPurchaseRequests(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        // If response is directly an array
        setPurchaseRequests(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        // Fallback
        setPurchaseRequests([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading purchase requests:", error);
      setErrorMessage("Failed to load purchase requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (pr) => {
    try {
      setLoading(true);
      const fullPR = await getPurchaseRequestByIdAPI(pr.id);
      setViewingPR(fullPR);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading PR details:", error);
      setErrorMessage("Failed to load purchase request details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (pr) => {
    try {
      setLoading(true);
      const fullPR = await getPurchaseRequestByIdAPI(pr.id);
      setEditingPR(fullPR);
      setFormMode("edit");
      setShowFormModal(true);
    } catch (error) {
      console.error("Error loading PR details:", error);
      setErrorMessage("Failed to load purchase request details.");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateRFQ = (pr) => {
    setSelectedPRForRFQ(pr);
    setShowRFQForm(true);
  };
  const handleRFQClose = () => {
    setShowRFQForm(false);
    setSelectedPRForRFQ(null);
  };
  const handleRFQSuccess = (result) => {
    setSuccessMessage(
      `RFQ created successfully! Reference: ${result.referenceNumber || "N/A"}`,
    );
    setShowSuccess(true);
    setShowRFQForm(false);
    setSelectedPRForRFQ(null);
    // Reload the list to update status
    loadPurchaseRequests();
  };
  const handleCreateClick = () => {
    setEditingPR(null);
    setFormMode("create");
    setShowFormModal(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingPR(null);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingPR(null);
  };

  const handleFormSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    loadPurchaseRequests();
    handleFormClose();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
      MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      URGENT: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[priority] || colors.NORMAL;
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PENDING: "bg-orange-100 text-orange-700",
    };
    return colors[status] || colors.DRAFT;
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
    });
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
                  Purchase Requests
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  WMS Warehouse Management System
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/master/suppliers")}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Building2 className="w-4 h-4" />
                  Suppliers
                </button>
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Request
                </button>
                <button
                  type="button"
                  onClick={loadPurchaseRequests}
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
                  placeholder="Search by PR Number or Requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {purchaseRequests.length} of {totalElements} requests
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
                    PR Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PR Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required Date
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
                    <td colSpan="10" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : purchaseRequests.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No purchase requests found
                    </td>
                  </tr>
                ) : (
                  purchaseRequests.map((pr) => (
                    <tr
                      key={pr.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(pr)}
                      >
                        <span className="font-medium text-blue-600 hover:text-blue-800">
                          {pr.prNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(pr.prDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">{pr.requestedBy}</td>
                      <td className="px-4 py-3 text-sm">{pr.department}</td>
                      <td className="px-4 py-3 text-sm">{pr.warehouse}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(pr.priority)}`}
                        >
                          <Flag className="w-3 h-3" />
                          {pr.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(pr.requiredDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {pr.items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}
                        >
                          {pr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(pr)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {pr.status === "DRAFT" && (
                            <button
                              type="button"
                              onClick={() => handleEditClick(pr)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {(pr.status === "SUBMITTED" ||
                            pr.status === "APPROVED" ||
                            pr.status === "PENDING") && (
                            <button
                              type="button"
                              onClick={() => handleCreateRFQ(pr)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Create RFQ"
                            >
                              <Send className="w-4 h-4" />
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
                requests
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

        {/* Create/Edit Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={handleFormClose}
              />
              <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <PurchaseRequestForm
                  mode={formMode}
                  initialData={editingPR}
                  onClose={handleFormClose}
                  onSuccess={handleFormSuccess}
                />
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingPR && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={handleViewClose}
              />
              <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <PurchaseRequestView
                  data={viewingPR}
                  onClose={handleViewClose}
                />
              </div>
            </div>
          </div>
        )}
        {showRFQForm && selectedPRForRFQ && (
          <RFQForm
            isOpen={showRFQForm}
            onClose={handleRFQClose}
            purchaseRequest={selectedPRForRFQ}
            onSuccess={handleRFQSuccess}
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
