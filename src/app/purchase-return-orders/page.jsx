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
} from "lucide-react";
import api from "@/lib/api";
import VendorReturnOrderView from "./components/VendorReturnOrderView";

// API Functions
const apiRequest = async (endpoint, method = "GET", data = null, params = null) => {
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

// API function for vendor return orders
const getVendorReturnOrdersAPI = async (
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
    `/vendor-returns/orders?${params.toString()}`,
    "GET",
  );
};

const getVendorReturnOrderByIdAPI = async (id) => {
  return apiRequest(`/vendor-returns/orders/${id}`);
};

// Main Component
export default function VendorReturnOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadOrders();
  }, [currentPage, pageSize, statusFilter]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
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

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getVendorReturnOrdersAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      if (response && response.content) {
        setOrders(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setOrders(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        setOrders([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading vendor return orders:", error);
      setErrorMessage("Failed to load vendor return orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (orderData) => {
    try {
      setLoading(true);
      const fullOrder = await getVendorReturnOrderByIdAPI(orderData.id);
      setViewingOrder(fullOrder);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading order details:", error);
      setErrorMessage("Failed to load vendor return order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingOrder(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      CREATED: "bg-gray-100 text-gray-700",
      PENDING_PICKING: "bg-yellow-100 text-yellow-700",
      PENDING_QC: "bg-blue-100 text-blue-700",
      PENDING_PACKING: "bg-purple-100 text-purple-700",
      PENDING_DISPATCH: "bg-orange-100 text-orange-700",
      DISPATCHED: "bg-green-100 text-green-700",
      RECEIVED: "bg-teal-100 text-teal-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.CREATED;
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

  const getStatusDisplayName = (status) => {
    const names = {
      CREATED: "Created",
      PENDING_PICKING: "Pending Picking",
      PENDING_QC: "Pending QC",
      PENDING_PACKING: "Pending Packing",
      PENDING_DISPATCH: "Pending Dispatch",
      DISPATCHED: "Dispatched",
      RECEIVED: "Received",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return names[status] || status;
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
                  Vendor Return Orders
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  WMS Warehouse Management System
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadOrders}
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
                  placeholder="Search by Order Number, Request Number, or Supplier..."
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
                <option value="CREATED">Created</option>
                <option value="PENDING_PICKING">Pending Picking</option>
                <option value="PENDING_QC">Pending QC</option>
                <option value="PENDING_PACKING">Pending Packing</option>
                <option value="PENDING_DISPATCH">Pending Dispatch</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="RECEIVED">Received</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Showing {orders.length} of {totalElements} orders
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
                    Order No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No vendor return orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(order)}
                      >
                        <span className="font-medium text-blue-600 hover:text-blue-800">
                          {order.vroNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-600">
                          {order.returnRequestNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.supplierName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getReturnTypeColor(order.returnType)}`}
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          {order.returnType?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}
                        >
                          <Flag className="w-3 h-3" />
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {order.lines?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusDisplayName(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(order)}
                            className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.pickListGenerated && (
                            <button
                              type="button"
                              onClick={() => {/* Handle print pick list */}}
                              className="text-green-600 cursor-pointer hover:text-green-800 transition-colors"
                              title="Print Pick List"
                            >
                              <Printer className="w-4 h-4" />
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
                orders
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
        {showViewModal && viewingOrder && (
          <VendorReturnOrderView
            data={viewingOrder}
            onClose={handleViewClose}
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