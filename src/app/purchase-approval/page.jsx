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
  Save,
  X,
} from "lucide-react";
import api from "@/lib/api";
import PurchaseRequestView from "../purchase-requests/components/PurchaseRequestView";

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
const getPurchaseRequestsAPI = async (page = 0, size = 10, searchTerm = "", status = "ALL") => {
  let statusParam = status;
  if (status === "ALL") {
    statusParam = "";
  }
  
  const requestBody = {
    status: statusParam,
    page: page,
    size: size,
    searchTerm: searchTerm || ""
  };
  
  return apiRequest("/purchase-requests/filter", "POST", requestBody);
};

const getPurchaseRequestByIdAPI = async (id) => {
  return apiRequest(`/purchase-requests/${id}`);
};

// Update status API
const updatePurchaseRequestStatusAPI = async (id, status, remarks) => {
  const requestBody = {
    status: status,
    remarks: remarks || ""
  };
  return apiRequest(`/purchase-requests/${id}/status`, "POST", requestBody);
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPR, setViewingPR] = useState(null);
  
  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
        statusFilter
      );
      
      if (response && response.content) {
        setPurchaseRequests(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setPurchaseRequests(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
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

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingPR(null);
  };

  // Status Update Functions
  const handleStatusUpdateClick = (pr) => {
    setSelectedPR(pr);
    setSelectedStatus(pr.status || "");
    setRemarks("");
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      setErrorMessage("Please select a status.");
      return;
    }

    // If rejecting, remarks are required
    if (selectedStatus === "REJECTED" && !remarks.trim()) {
      setErrorMessage("Remarks are required when rejecting a request.");
      return;
    }

    try {
      setUpdatingStatus(true);
      await updatePurchaseRequestStatusAPI(selectedPR.id, selectedStatus, remarks);
      
      setSuccessMessage(`Purchase request status updated to ${selectedStatus} successfully!`);
      setShowSuccess(true);
      setShowStatusModal(false);
      
      // Reset states
      setSelectedPR(null);
      setSelectedStatus("");
      setRemarks("");
      
      // Reload the list
      loadPurchaseRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      setErrorMessage(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedPR(null);
    setSelectedStatus("");
    setRemarks("");
    setErrorMessage("");
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
      PARTIAL: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PENDING: "bg-orange-100 text-orange-700",
      IN_PROGRESS: "bg-indigo-100 text-indigo-700",
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

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = [
      "DRAFT",
      "SUBMITTED",
      "PENDING",
      "APPROVED",
      "REJECTED",
      "PARTIAL",
      "COMPLETED",
      "IN_PROGRESS"
    ];

    // You can customize which statuses are available based on current status
    // For example, if current is DRAFT, only allow SUBMITTED
    // If current is SUBMITTED, allow PENDING, APPROVED, REJECTED
    // etc.
    return allStatuses;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Modal */}
        {showSuccess && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSuccess(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform animate-scale-up pointer-events-auto border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
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
                <h1 className="text-2xl font-bold text-white">Purchase Approval</h1>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PARTIAL">Partial</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
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
                    <tr key={pr.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 cursor-pointer" 
                            onClick={() => handleViewClick(pr)}
                      >
                        <span className="font-medium text-blue-600 hover:text-blue-800">{pr.prNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(pr.prDate)}</td>
                      <td className="px-4 py-3 text-sm">{pr.requestedBy}</td>
                      <td className="px-4 py-3 text-sm">{pr.department}</td>
                      <td className="px-4 py-3 text-sm">{pr.warehouse}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(pr.priority)}`}>
                          <Flag className="w-3 h-3" />
                          {pr.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(pr.requiredDate)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {pr.items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
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
                          <button
                            type="button"
                            onClick={() => handleStatusUpdateClick(pr)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Update Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
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
                Page {currentPage + 1} of {totalPages} | Total: {totalElements} requests
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">
                  {currentPage + 1}
                </span>
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

        {/* Status Update Modal */}
        {showStatusModal && selectedPR && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="fixed inset-0 bg-black/50" onClick={handleStatusModalClose} />
              <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Update Status</h2>
                    <p className="text-sm text-gray-500">
                      {selectedPR.prNumber} - {selectedPR.requestedBy}
                    </p>
                  </div>
                  <button
                    onClick={handleStatusModalClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={updatingStatus}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Status
                      </label>
                      <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPR.status)}`}>
                          {selectedPR.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Status *
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={updatingStatus}
                      >
                        <option value="">Select Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="IN_PROGRESS">In Progress</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks {selectedStatus === "REJECTED" && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows="3"
                        placeholder={selectedStatus === "REJECTED" ? "Please provide reason for rejection..." : "Optional remarks..."}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={updatingStatus}
                      />
                      {selectedStatus === "REJECTED" && (
                        <p className="text-xs text-red-500 mt-1">Remarks are required when rejecting</p>
                      )}
                    </div>

                    {/* Show current PR details */}
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p><span className="font-medium">Requested By:</span> {selectedPR.requestedBy}</p>
                      <p><span className="font-medium">Department:</span> {selectedPR.department}</p>
                      <p><span className="font-medium">Total Items:</span> {selectedPR.items?.length || 0}</p>
                      <p><span className="font-medium">Total Amount:</span> ₹{selectedPR.totalAmount?.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus || !selectedStatus}
                      className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Update Status
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleStatusModalClose}
                      disabled={updatingStatus}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingPR && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                      <div className="fixed inset-0 bg-black/50" onClick={handleViewClose} />
                      <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <PurchaseRequestView 
                          data={viewingPR}
                          onClose={handleViewClose}
                        />
                      </div>
                    </div>
                  </div>
                )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-scale-up { animation: scale-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}