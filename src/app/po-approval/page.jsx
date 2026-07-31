// app/purchase-orders/page.js
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
  Package,
  Truck,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Filter,
  Plus,
  Edit,
  Printer,
  Send,
  Download,
  RotateCw,
  ThumbsUp,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
// import PurchaseOrderViewModal from "./PurchaseOrderViewPage";
import InboundCreationModal from "../purchase-orders/component/InboundCreationModal";
import StatusUpdateModal from "../purchase-orders/component/StatusUpdateModal";
import PurchaseOrderViewModal from "../purchase-orders/PurchaseOrderViewPage";
// import StatusUpdateModal from "./component/StatusUpdateModal";
// import InboundCreationModal from "./component/InboundCreationModal";
// import StatusUpdateModal from "@/components/purchase-orders/StatusUpdateModal";

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

const getPurchaseOrdersAPI = async (page = 0, size = 10, searchTerm = "") => {
  const requestBody = {
    searchTerm: searchTerm || "",
    page: page,
    size: size,
  };
  return apiRequest("/purchase-orders/filter", "POST", requestBody);
};

const getPurchaseOrderByIdAPI = async (id) => {
  return apiRequest(`/purchase-orders/${id}`);
};

const updatePurchaseOrderStatusAPI = async (id, statusData) => {
  return apiRequest(`/purchase-orders/${id}/status`, "POST", statusData);
};

export default function PurchaseOrderPage() {
  const router = useRouter();

  // List State
  const [purchaseOrders, setPurchaseOrders] = useState([]);
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
  const [viewingPO, setViewingPO] = useState(null);

  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdatePO, setStatusUpdatePO] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundPO, setInboundPO] = useState(null);
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPurchaseOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadPurchaseOrders();
  }, [currentPage]);

  // Auto-clear messages after 5 seconds
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
 const allStatuses = [
  { 
    value: 'PENDING', 
    label: 'PENDING', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className="w-4 h-4" />,
    bgColor: 'hover:bg-amber-50'
  },
  { 
    value: 'APPROVED', 
    label: 'APPROVED', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <ThumbsUp className="w-4 h-4" />,
    bgColor: 'hover:bg-blue-50'
  },
  { 
    value: 'SEND', 
    label: 'SEND', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: <Send className="w-4 h-4" />,
    bgColor: 'hover:bg-cyan-50'
  },
  { 
    value: 'ACCEPTED', 
    label: 'ACCEPTED', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
    bgColor: 'hover:bg-green-50'
  },
  { 
    value: 'REJECTED', 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-4 h-4" />,
    bgColor: 'hover:bg-red-50'
  },
];
  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseOrdersAPI(
        currentPage,
        pageSize,
        searchTerm,
      );

      if (response && response.content) {
        setPurchaseOrders(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else {
        setPurchaseOrders([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      setErrorMessage("Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (po) => {
    try {
      setLoading(true);
      const fullPO = await getPurchaseOrderByIdAPI(po.id);
      setViewingPO(fullPO);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading PO details:", error);
      setErrorMessage("Failed to load purchase order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingPO(null);
  };

  const handleStatusUpdateClick = (po) => {
    setStatusUpdatePO(po);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (id, statusData) => {
    try {
      setStatusUpdateLoading(true);
      await updatePurchaseOrderStatusAPI(id, statusData);
      setSuccessMessage(`Purchase Order status updated successfully!`);
      await loadPurchaseOrders();
      setShowStatusModal(false);
      setStatusUpdatePO(null);

      // Check if status is ACCEPTED - show Inbound modal
      if (statusData.status === "ACCEPTED") {
        const updatedPO = await getPurchaseOrderByIdAPI(id);
        setInboundPO(updatedPO);
        setShowInboundModal(true);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      throw new Error(error.message || "Failed to update status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  const handleInboundSuccess = (inboundData) => {
    setSuccessMessage(
      `Inbound ${inboundData.inboundNumber} created successfully!`,
    );
    // Optionally navigate to inbound details
    // router.push(`/inbound/${inboundData.id}`);
  };
  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
      REJECTED: "bg-red-100 text-red-700",
      PARTIAL: "bg-orange-100 text-orange-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      CANCELLED: "bg-red-100 text-red-500",
      IN_PROGRESS: "bg-indigo-100 text-indigo-700",
      SHIPPED: "bg-cyan-100 text-cyan-700",
      DELIVERED: "bg-teal-100 text-teal-700",
      CLOSED: "bg-gray-100 text-gray-500",
      ACCEPTED: "bg-green-100 text-green-700 border-green-200",
      SEND: "bg-cyan-100 text-cyan-700 border-cyan-200",

    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
      SEND: "bg-cyan-100 text-cyan-700 border-cyan-200",
      ACCEPTED: "bg-green-100 text-green-700 border-green-200",
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

  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
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
                  Purchase Order Approval
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Manage and track purchase orders
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* <button
                  type="button"
                  onClick={() => router.push("/purchase-orders/create")}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create PO
                </button> */}
                <button
                  type="button"
                  onClick={loadPurchaseOrders}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by PO Number, Supplier, or PR Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {purchaseOrders.length} of {totalElements} POs
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
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PR Reference
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grand Total
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
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => handleViewClick(po)}
                        >
                          {po.poNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(po.poDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {po.supplierName}
                          </span>
                          {po.supplierEmail && (
                            <div className="text-xs text-gray-500">
                              {po.supplierEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {po.purchaseRequestNumber
                          ? `${po.purchaseRequestNumber}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(po.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}
                        >
                          {po.status?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(po)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdateClick(po)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Update Status"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          {/* {po.status === "PENDING" && ( */}
                            {/* <> */}
                              <button
                                type="button"
                                className="text-green-600 hover:text-green-800 transition-colors"
                                title="Submit PO"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                                title="Edit PO"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            {/* </> */}
                          {/* )} */}
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
                POs
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

        {/* Status Update Modal */}
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setStatusUpdatePO(null);
          }}
          allStatuses={allStatuses}

          purchaseOrder={statusUpdatePO}
          onStatusUpdate={handleStatusUpdate}
          loading={statusUpdateLoading}
        />

        {/* View Modal */}
        {showViewModal && viewingPO && (
          <PurchaseOrderViewModal
            po={viewingPO}
            onClose={handleViewClose}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            formatCurrency={formatCurrency}
            getStatusBadgeColor={getStatusBadgeColor}
            onEdit={(po) => {
              handleViewClose();
              router.push(`/purchase-orders/edit/${po.id}`);
            }}
            onSubmit={(po) => {
              handleViewClose();
              handleStatusUpdateClick(po);
            }}
            onPrint={(po) => {
              window.print();
            }}
            onDownload={(po) => {
              // Add your download logic here
            }}
          />
        )}
        <InboundCreationModal
          isOpen={showInboundModal}
          onClose={() => {
            setShowInboundModal(false);
            setInboundPO(null);
          }}
          purchaseOrder={inboundPO}
          onSuccess={handleInboundSuccess}
        />
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
