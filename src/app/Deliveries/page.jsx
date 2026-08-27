// app/deliveries/page.jsx
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
  Truck,
  Calendar,
  User,
  Building,
  FileText,
  Hash,
  Printer,
  Phone,
  Clock,
  User as UserIcon,
  MapPin,
  Box,
  Barcode,
  Tag,
  UserCheck,
  Clipboard,
  Check,
} from "lucide-react";
import api from "@/lib/api";

export default function Deliveries() {
  // List State
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // UI State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDelivery, setViewingDelivery] = useState(null);

  // Load deliveries
  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("size", pageSize);
      if (searchTerm) params.append("search", searchTerm);

      const response = await api.get(
        `/outbound/deliveries?${params.toString()}`,
      );
      console.log("Deliveries response:", response.data);

      if (response.data) {
        const data = response.data;
        if (data.content && Array.isArray(data.content)) {
          setDeliveries(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        } else if (Array.isArray(data)) {
          setDeliveries(data);
          setTotalPages(Math.ceil(data.length / pageSize));
          setTotalElements(data.length);
        } else {
          setDeliveries([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      }
    } catch (error) {
      console.error("Error loading deliveries:", error);
      setErrorMessage("Failed to load deliveries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDeliveries();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadDeliveries();
  }, [currentPage, pageSize]);

  // Auto-clear messages
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

  const handleViewClick = (delivery) => {
    setViewingDelivery(delivery);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingDelivery(null);
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

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      IN_TRANSIT: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.PENDING;
  };

  const getDeliveryStatusLabel = (status) => {
    const labels = {
      PENDING: "Pending",
      IN_TRANSIT: "In Transit",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
      COMPLETED: "Completed",
    };
    return labels[status] || status || "N/A";
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
                  Delivery Management
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  Track and manage all deliveries
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadDeliveries}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                  title="Refresh"
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
                  placeholder="Search by Delivery #, Shipment #, SO Number, Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Showing {deliveries.length} of {totalElements} deliveries
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
                    Delivery #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      No deliveries found
                    </td>
                  </tr>
                ) : (
                  deliveries.map((delivery) => (
                    <tr
                      key={delivery.id || delivery.deliveryNumber}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-green-600">
                          {delivery.deliveryNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-indigo-600">
                          {delivery.shipmentNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {delivery.soNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.customerName || "N/A"}
                        </div>
                        {delivery.customerCode && (
                          <div className="text-xs text-gray-500">
                            Code: {delivery.customerCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {delivery.packageNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="font-semibold">
                          {delivery.deliveredQuantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.deliveryStatus)}`}
                        >
                          {getDeliveryStatusLabel(delivery.deliveryStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(delivery.deliveryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(delivery)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
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
                deliveries
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

        {/* View/Detail Modal */}
        {showViewModal && viewingDelivery && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleViewClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Delivery Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingDelivery.deliveryNumber}
                    </p>
                  </div>
                  <button
                    onClick={handleViewClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Status Banner */}
                  <div
                    className="mb-6 p-4 rounded-xl border"
                    style={{
                      backgroundColor:
                        viewingDelivery.deliveryStatus === "DELIVERED"
                          ? "#f0fdf4"
                          : viewingDelivery.deliveryStatus === "IN_TRANSIT"
                            ? "#faf5ff"
                            : viewingDelivery.deliveryStatus === "CANCELLED"
                              ? "#fef2f2"
                              : "#fefce8",
                      borderColor:
                        viewingDelivery.deliveryStatus === "DELIVERED"
                          ? "#bbf7d0"
                          : viewingDelivery.deliveryStatus === "IN_TRANSIT"
                            ? "#e9d5ff"
                            : viewingDelivery.deliveryStatus === "CANCELLED"
                              ? "#fecaca"
                              : "#fde68a",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {viewingDelivery.deliveryStatus === "DELIVERED" && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                      {viewingDelivery.deliveryStatus === "IN_TRANSIT" && (
                        <Truck className="w-6 h-6 text-purple-600" />
                      )}
                      {viewingDelivery.deliveryStatus === "CANCELLED" && (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingDelivery.deliveryStatus)}`}
                        >
                          {getDeliveryStatusLabel(viewingDelivery.deliveryStatus)}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {viewingDelivery.deliveryStatus === "DELIVERED" &&
                            "Delivery has been successfully completed"}
                          {viewingDelivery.deliveryStatus === "IN_TRANSIT" &&
                            "Delivery is currently in transit"}
                          {viewingDelivery.deliveryStatus === "CANCELLED" &&
                            "Delivery has been cancelled"}
                          {!viewingDelivery.deliveryStatus && "Delivery is pending"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Delivery Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.deliveryNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Shipment Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.shipmentNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Package Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.packageNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        SO Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.soNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Barcode className="w-3 h-3" />
                        Tracking Number
                      </label>
                      <p className="font-medium text-gray-900 font-mono">
                        {viewingDelivery.trackingNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Delivered Quantity
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.deliveredQuantity || 0}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Delivery Date
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatDate(viewingDelivery.deliveryDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Received By
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.receivedBy || "N/A"}
                      </p>
                    </div>
                    {viewingDelivery.createdAt && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created At
                        </label>
                        <p className="font-medium text-gray-900">
                          {formatDate(viewingDelivery.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-green-600" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Customer Name
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.customerName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Customer Code
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDelivery.customerCode || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Signature & Proof */}
                  {(viewingDelivery.signature || viewingDelivery.deliveryProofUrl) && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                        <Check className="w-4 h-4 text-green-600" />
                        Delivery Verification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                        {viewingDelivery.signature && (
                          <div>
                            <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Signature
                            </label>
                            <p className="text-sm font-mono text-gray-600 break-all mt-1">
                              {viewingDelivery.signature}
                            </p>
                          </div>
                        )}
                        {viewingDelivery.deliveryProofUrl && (
                          <div>
                            <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Delivery Proof URL
                            </label>
                            <a
                              href={viewingDelivery.deliveryProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline break-all block mt-1"
                            >
                              {viewingDelivery.deliveryProofUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Remarks */}
                  {viewingDelivery.remarks && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Clipboard className="w-3 h-3" />
                        Remarks
                      </label>
                      <p className="text-sm text-gray-700 mt-1">
                        {viewingDelivery.remarks}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 mt-6 border-t border-gray-200">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={handleViewClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
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
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}