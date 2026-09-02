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
  Send,
  RotateCw,
  ArrowLeftRight,
  FileText,
  Package,
  Calendar,
  User,
  CreditCard,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import PurchaseReturnUpdateForm from "./components/PurchaseReturnUpdateForm";

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

// API function for purchase returns
const getPurchaseReturnsAPI = async (
  page = 0,
  size = 10,
  searchTerm = "",
  status = "ALL",
) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('size', size);
  
  if (searchTerm) {
    params.append('searchTerm', searchTerm);
  }
  
  if (status && status !== "ALL") {
    params.append('status', status);
  }

  return apiRequest(`/purchase-returns/search?${params.toString()}`, "GET");
};

const getPurchaseReturnByIdAPI = async (id) => {
  return apiRequest(`/purchase-returns/${id}`);
};

// Update status API
const updatePurchaseReturnStatusAPI = async (id, status, remarks) => {
  const requestBody = {
    status: status,
    remarks: remarks || "",
  };
  return apiRequest(`/purchase-returns/${id}/status`, "POST", requestBody);
};

// Purchase Return View Component
const PurchaseReturnView = ({ data, onClose }) => {
  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PROCESSING: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.DRAFT;
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
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}

          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700  px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Purchase Return Details
              </h2>
              <p className="text-green-100 text-sm">
                {data.returnNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                Status: {data.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReturnTypeColor(data.returnType)}`}>
                <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                {data.returnType?.replace('_', ' ')}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Building2 className="w-4 h-4" />
                  Supplier
                </div>
                <p className="font-medium text-gray-900">{data.supplierName}</p>
                {data.supplierCode && (
                  <p className="text-xs text-gray-500">Code: {data.supplierCode}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Package className="w-4 h-4" />
                  PO Number
                </div>
                <p className="font-medium text-gray-900">{data.poNumber}</p>
                {data.grnNumber && (
                  <p className="text-xs text-gray-500">GRN: {data.grnNumber}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Return Date
                </div>
                <p className="font-medium text-gray-900">{formatDate(data.returnDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CreditCard className="w-4 h-4" />
                  Total Amount
                </div>
                <p className="font-medium text-green-600 text-lg">{formatCurrency(data.totalAmount)}</p>
                <p className="text-xs text-gray-500">Qty: {data.totalQuantity}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {data.invoiceNumber && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    Invoice Number
                  </div>
                  <p className="font-medium text-gray-900">{data.invoiceNumber}</p>
                </div>
              )}
              {data.trackingNumber && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Info className="w-4 h-4" />
                    Tracking Number
                  </div>
                  <p className="font-medium text-gray-900">{data.trackingNumber}</p>
                </div>
              )}
            </div>

            {/* Reason & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {data.reason && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Info className="w-4 h-4" />
                    Reason
                  </div>
                  <p className="text-gray-900">{data.reason}</p>
                </div>
              )}
              {data.remarks && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Info className="w-4 h-4" />
                    Remarks
                  </div>
                  <p className="text-gray-900">{data.remarks}</p>
                </div>
              )}
            </div>

            {/* Approval Info */}
            {(data.approvedBy || data.approvedDate || data.rejectionReason) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Approval Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.approvedBy && (
                    <div>
                      <p className="text-xs text-gray-500">Approved By</p>
                      <p className="text-sm text-gray-900">{data.approvedBy}</p>
                    </div>
                  )}
                  {data.approvedDate && (
                    <div>
                      <p className="text-xs text-gray-500">Approved Date</p>
                      <p className="text-sm text-gray-900">{formatDateTime(data.approvedDate)}</p>
                    </div>
                  )}
                  {data.rejectionReason && (
                    <div>
                      <p className="text-xs text-gray-500">Rejection Reason</p>
                      <p className="text-sm text-red-600">{data.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Return Items ({data.lines?.length || 0})
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.lines?.map((line) => (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">
                          {line.itemCode}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {line.itemName}
                        </td>
                        <td className="px-4 py-3 text-sm">{line.uom}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {line.returnQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(line.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {line.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right text-sm">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600">
                        {formatCurrency(data.totalAmount)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Created At */}
            {data.createdAt && (
              <div className="mt-4 text-xs text-gray-400 text-right">
                Created: {formatDateTime(data.createdAt)}
                {data.createdBy && ` by ${data.createdBy}`}
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PurchaseReturnPage() {
  const router = useRouter();

  // List State
  const [purchaseReturns, setPurchaseReturns] = useState([]);
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
  const [viewingReturn, setViewingReturn] = useState(null);

  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Return Form State
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedPRForReturn, setSelectedPRForReturn] = useState(null);

   const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState(null);

  const handleUpdateClick = (returnId) => {
    setSelectedReturnId(returnId);
    setShowUpdateForm(true);
  };

  const handleUpdateSuccess = (updatedData) => {
    console.log('Return updated:', updatedData);
    setShowUpdateForm(false);
    // Refresh the list
    loadPurchaseReturns();
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPurchaseReturns();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadPurchaseReturns();
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

  const loadPurchaseReturns = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseReturnsAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      if (response && response.content) {
        setPurchaseReturns(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setPurchaseReturns(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        setPurchaseReturns([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading purchase returns:", error);
      setErrorMessage("Failed to load purchase returns.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (returnData) => {
    try {
      setLoading(true);
      const fullReturn = await getPurchaseReturnByIdAPI(returnData.id);
      setViewingReturn(fullReturn);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading return details:", error);
      setErrorMessage("Failed to load purchase return details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingReturn(null);
  };

  // Status Update Functions
  const handleStatusUpdateClick = (returnData) => {
    setSelectedReturn(returnData);
    setSelectedStatus(returnData.status || "");
    setRemarks("");
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      setErrorMessage("Please select a status.");
      return;
    }

    if (selectedStatus === "REJECTED" && !remarks.trim()) {
      setErrorMessage("Remarks are required when rejecting a return.");
      return;
    }

    try {
      setUpdatingStatus(true);
      await updatePurchaseReturnStatusAPI(
        selectedReturn.id,
        selectedStatus,
        remarks,
      );

      setSuccessMessage(
        `Purchase return status updated to ${selectedStatus} successfully!`,
      );
      setShowSuccess(true);
      setShowStatusModal(false);

      setSelectedReturn(null);
      setSelectedStatus("");
      setRemarks("");

      loadPurchaseReturns();
    } catch (error) {
      console.error("Error updating status:", error);
      setErrorMessage(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedReturn(null);
    setSelectedStatus("");
    setRemarks("");
    setErrorMessage("");
  };

  // Return Form Functions
  const handleCreateReturn = (purchaseRequest) => {
    setSelectedPRForReturn(purchaseRequest);
    setShowReturnForm(true);
  };

  const handleReturnSuccess = (result) => {
    setSuccessMessage(`Purchase return created successfully! Reference: ${result.returnNumber || 'N/A'}`);
    setShowSuccess(true);
    setShowReturnForm(false);
    setSelectedPRForReturn(null);
    loadPurchaseReturns();
  };

  const handleReturnClose = () => {
    setShowReturnForm(false);
    setSelectedPRForReturn(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PROCESSING: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.DRAFT;
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
    return `₹${amount.toFixed(2)}`;
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
                  Purchase Rejected
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  WMS Warehouse Management System
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadPurchaseReturns}
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
                  placeholder="Search by Return Number, PO Number, or Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {purchaseReturns.length} of {totalElements} returns
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
                    Return Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Date
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
                    Return Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : purchaseReturns.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No purchase returns found
                    </td>
                  </tr>
                ) : (
                  purchaseReturns.map((returnData) => (
                    <tr
                      key={returnData.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(returnData)}
                      >
                        <span className="font-medium text-green-600 hover:text-green-800">
                          {returnData.returnNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(returnData.returnDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {returnData.poNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{returnData.supplierName}</td>
                      <td className="px-4 py-3 text-sm">{returnData.invoiceNumber || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getReturnTypeColor(returnData.returnType)}`}
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          {returnData.returnType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(returnData.totalAmount)}
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
                            className="text-green-600 cursor-pointer hover:text-green-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleUpdateClick(returnData.id)}>
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
                Page {currentPage + 1} of {totalPages} | Total: {totalElements}{" "}
                returns
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

       
 {showUpdateForm && (
        <PurchaseReturnUpdateForm
          returnId={selectedReturnId}
          onClose={() => setShowUpdateForm(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
        {/* View Modal */}
        {showViewModal && viewingReturn && (
          <PurchaseReturnView
            data={viewingReturn}
            onClose={handleViewClose}
          />
        )}

        {/* Return Form Modal */}
        {/* {showReturnForm && selectedPRForReturn && (
          <ReturnForm
            isOpen={showReturnForm}
            onClose={handleReturnClose}
            purchaseRequest={selectedPRForReturn}
            onSuccess={handleReturnSuccess}
          />
        )} */}
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