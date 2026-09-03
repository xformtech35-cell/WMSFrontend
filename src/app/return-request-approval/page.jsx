"use client";

import React, { useState, useEffect } from "react";
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
  Send,
  RotateCw,
  ArrowLeftRight,
  FileText,
  Package,
  Calendar,
  User,
  CreditCard,
  Info,
  Clock,
  Shield,
  AlertTriangle,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import api from "@/lib/api";
import VendorReturnView from "./components/VendorReturnView";
import VendorReturnOrderForm from "./components/VendorReturnOrderForm";

// API Functions (keep all your API functions here)
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

// API function for vendor return requests
const getVendorReturnRequestsAPI = async (
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
    `/vendor-returns/requests/search?${params.toString()}`,
    "GET",
  );
};

const getVendorReturnRequestByIdAPI = async (id) => {
  return apiRequest(`/vendor-returns/requests/${id}`);
};

// Approve API - Send approvedBy as userId
const approveVendorReturnAPI = async (id, approvedBy) => {
  const requestBody = {
    approvedBy: approvedBy,
  };
  return apiRequest(
    `/vendor-returns/requests/${id}/approve`,
    "PATCH",
    null,
    requestBody,
  );
};

// Reject API - Send rejectedBy as userId and rejectionReason
const rejectVendorReturnAPI = async (id, rejectedBy, rejectionReason) => {
  const requestBody = {
    rejectedBy: rejectedBy,
    rejectionReason: rejectionReason || "",
  };
  return apiRequest(
    `/vendor-returns/requests/${id}/reject`,
    "PATCH",
    null,
    requestBody,
  );
};

// Main Component
export default function VendorReturnRequestPage() {
  // List State
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Users State
  const [users, setUsers] = useState([]);

  // UI State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingReturn, setViewingReturn] = useState(null);
  // Add to state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedReturnForOrder, setSelectedReturnForOrder] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      const userData =
        response.data?.data?.content ||
        response.data?.content ||
        response.data ||
        [];
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback: Try alternative endpoints
      try {
        const fallbackResponse = await api.get("/users/all");
        setUsers(fallbackResponse.data?.data || fallbackResponse.data || []);
      } catch (fallbackError) {
        console.error("Error fetching users from fallback:", fallbackError);
        setUsers([]);
      }
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadReturns();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadReturns();
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
  // Add handler functions
  const handleCreateOrder = (returnData) => {
    setSelectedReturnForOrder(returnData);
    setShowOrderForm(true);
  };

  const handleOrderFormClose = () => {
    setShowOrderForm(false);
    setSelectedReturnForOrder(null);
  };

  const handleOrderSuccess = (response) => {
    setSuccessMessage("Vendor return order created successfully!");
    setShowSuccess(true);
    loadReturns(); // Refresh the list
  };

  const handleOrderError = (error) => {
    setErrorMessage(error || "Failed to create vendor return order");
  };

  const loadReturns = async () => {
    try {
      setLoading(true);
      const response = await getVendorReturnRequestsAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      if (response && response.content) {
        setReturns(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setReturns(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        setReturns([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading vendor returns:", error);
      setErrorMessage("Failed to load vendor return requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (returnData) => {
    try {
      setLoading(true);
      const fullReturn = await getVendorReturnRequestByIdAPI(returnData.id);
      setViewingReturn(fullReturn);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading return details:", error);
      setErrorMessage("Failed to load vendor return details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingReturn(null);
  };

  // Approve Handler
  const handleApprove = async (id, approvedBy) => {
    try {
      const response = await approveVendorReturnAPI(id, approvedBy);
      setSuccessMessage(`Vendor return request ${id} approved successfully!`);
      setShowSuccess(true);
      setShowViewModal(false);
      loadReturns();
      return response;
    } catch (error) {
      console.error("Error approving request:", error);
      setErrorMessage(`Failed to approve: ${error.message}`);
      throw error;
    }
  };

  // Reject Handler
  const handleReject = async (id, rejectedBy, rejectionReason) => {
    try {
      const response = await rejectVendorReturnAPI(
        id,
        rejectedBy,
        rejectionReason,
      );
      setSuccessMessage(`Vendor return request ${id} rejected.`);
      setShowSuccess(true);
      setShowViewModal(false);
      loadReturns();
      return response;
    } catch (error) {
      console.error("Error rejecting request:", error);
      setErrorMessage(`Failed to reject: ${error.message}`);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PROCESSING: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.DRAFT;
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

  const getReturnTypeColor = (type) => {
    const colors = {
      QUALITY_ISSUE: "bg-red-100 text-red-700",
      DAMAGE: "bg-orange-100 text-orange-700",
      WRONG_ITEM: "bg-yellow-100 text-yellow-700",
      EXCESS_QUANTITY: "bg-blue-100 text-blue-700",
      OTHER: "bg-gray-100 text-gray-700",
    };
    return colors[type] || colors.OTHER;
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${Number(amount).toFixed(2)}`;
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
                  Reject Return Requests Approval
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  WMS Warehouse Management System
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadReturns}
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
                  placeholder="Search by Request Number, PO Number, or Supplier..."
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
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Showing {returns.length} of {totalElements} requests
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
                    Request No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
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
                    <td colSpan="9" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      No vendor return requests found
                    </td>
                  </tr>
                ) : (
                  returns.map((returnData) => (
                    <tr
                      key={returnData.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(returnData)}
                      >
                        <span className="font-medium text-blue-600 hover:text-blue-800">
                          {returnData.returnRequestNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(returnData.requestDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {returnData.poNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {returnData.supplierName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getReturnTypeColor(returnData.returnType)}`}
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          {returnData.returnType?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(returnData.priority)}`}
                        >
                          <Flag className="w-3 h-3" />
                          {returnData.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {returnData.lines?.length || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnData.status)}`}
                        >
                          {returnData.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(returnData)}
                            className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* {(returnData.status === "APPROVED" ||
                            returnData.status === "COMPLETED") && (
                            <button
                              type="button"
                              onClick={() => handleCreateOrder(returnData)}
                              className="text-green-600 cursor-pointer hover:text-green-800 transition-colors"
                              title="Create Order"
                            >
                              <Package className="w-4 h-4" />
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

        {/* View Modal - Using the separated component */}
        {showViewModal && viewingReturn && (
          <VendorReturnView
            data={viewingReturn}
            onClose={handleViewClose}
            onApprove={handleApprove}
            onReject={handleReject}
            users={users}
          />
        )}
        {showOrderForm && selectedReturnForOrder && (
          <VendorReturnOrderForm
            returnRequest={selectedReturnForOrder}
            onClose={handleOrderFormClose}
            onSuccess={handleOrderSuccess}
            onError={handleOrderError}
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
