// app/dispatch/page.jsx
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
  Send,
  Phone,
  MapPin,
  Box,
  Scale,
  Ruler,
  Clock,
  User as UserIcon,
  Check,
  Save,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
} from "lucide-react";
import api from "@/lib/api";

export default function DispatchPage() {
  // List State
  const [dispatches, setDispatches] = useState([]);
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
  const [viewingDispatch, setViewingDispatch] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentDispatch, setShipmentDispatch] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // Shipment Confirmation State
  const [shipmentData, setShipmentData] = useState({
    dispatchNumber: "",
    soNumber: "",
    transporter: "",
    trackingNumber: "",
    shippingMethod: "ROAD",
    vehicleNumber: "",
    dispatchDate: "",
    expectedDeliveryDate: "",
    confirmedBy: "",
    remarks: "",
  });

  // Load dispatches
  const loadDispatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("size", pageSize);
      if (searchTerm) params.append("search", searchTerm);

      const response = await api.get(`/outbound/dispatches?${params.toString()}`);
      console.log("Dispatches response:", response.data);

      if (response.data) {
        const data = response.data;
        if (data.content && Array.isArray(data.content)) {
          setDispatches(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        } else if (Array.isArray(data)) {
          setDispatches(data);
          setTotalPages(Math.ceil(data.length / pageSize));
          setTotalElements(data.length);
        } else {
          setDispatches([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      }
    } catch (error) {
      console.error("Error loading dispatches:", error);
      setErrorMessage("Failed to load dispatches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDispatches();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadDispatches();
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

  const handleViewClick = (dispatch) => {
    setViewingDispatch(dispatch);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingDispatch(null);
  };

  const handleShipmentClick = (dispatch) => {
    setShipmentDispatch(dispatch);
    setShipmentData({
      dispatchNumber: dispatch.dispatchNumber || "",
      soNumber: dispatch.soNumber || "",
      transporter: dispatch.transporter || "",
      trackingNumber: "",
      shippingMethod: "ROAD",
      vehicleNumber: dispatch.vehicleNumber || "",
      dispatchDate: new Date().toISOString().slice(0, 16),
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      confirmedBy: "",
      remarks: "",
    });
    setShowShipmentModal(true);
  };

  const handleShipmentClose = () => {
    setShowShipmentModal(false);
    setShipmentDispatch(null);
    setShipmentData({
      dispatchNumber: "",
      soNumber: "",
      transporter: "",
      trackingNumber: "",
      shippingMethod: "ROAD",
      vehicleNumber: "",
      dispatchDate: "",
      expectedDeliveryDate: "",
      confirmedBy: "",
      remarks: "",
    });
  };

  const handleShipmentChange = (e) => {
    const { name, value } = e.target;
    setShipmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShipmentConfirm = async (e) => {
    e.preventDefault();
    setConfirming(true);
    // setError("");

    try {
      // Validate required fields
      const requiredFields = [
        "dispatchNumber",
        "soNumber",
        "transporter",
        "trackingNumber",
        "shippingMethod",
        "vehicleNumber",
        "dispatchDate",
        "expectedDeliveryDate",
        "confirmedBy",
      ];

      for (const field of requiredFields) {
        if (!shipmentData[field] || shipmentData[field].trim() === "") {
          setErrorMessage(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          setConfirming(false);
          return;
        }
      }

      // Format dates
      const formattedPayload = {
        ...shipmentData,
        dispatchDate: new Date(shipmentData.dispatchDate).toISOString(),
        expectedDeliveryDate: new Date(shipmentData.expectedDeliveryDate).toISOString(),
        createdBy: shipmentData.confirmedBy || "system_user",
      };

      const response = await api.post("/outbound/shipment-confirmation", formattedPayload);
      console.log("Shipment confirmation response:", response.data);

      setSuccessMessage(`Shipment ${shipmentData.dispatchNumber} confirmed successfully!`);
      setShowSuccess(true);
      
      setTimeout(() => {
        handleShipmentClose();
        loadDispatches();
      }, 1500);
    } catch (error) {
      console.error("Shipment confirmation error:", error);
      setErrorMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to confirm shipment. Please try again."
      );
    } finally {
      setConfirming(false);
    }
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
      DISPATCHED: "bg-blue-100 text-blue-700",
      IN_TRANSIT: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
      CONFIRMED: "bg-indigo-100 text-indigo-700",
    };
    return colors[status] || colors.PENDING;
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
                  Dispatch Management
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Track and manage all dispatches
                </p>
              </div>
              <div className="flex items-center gap-3">
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Dispatch #, Package #, SO Number, Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                    Package #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatch Date
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
                ) : dispatches.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      No dispatches found
                    </td>
                  </tr>
                ) : (
                  dispatches.map((dispatch) => (
                    <tr
                      key={dispatch.id || dispatch.dispatchNumber}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">
                          {dispatch.dispatchNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {dispatch.packageNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {dispatch.soNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {dispatch.customerName || "N/A"}
                        </div>
                        {dispatch.customerCode && (
                          <div className="text-xs text-gray-500">
                            Code: {dispatch.customerCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {dispatch.transporter || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {dispatch.vehicleNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dispatch.status)}`}
                        >
                          {dispatch.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(dispatch.dispatchDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(dispatch)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShipmentClick(dispatch)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Confirm Shipment"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Print Challan"
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

        {/* Shipment Confirmation Modal */}
        {showShipmentModal && shipmentDispatch && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleShipmentClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      Confirm Shipment
                    </h2>
                    <p className="text-sm text-gray-500">
                      {shipmentDispatch.dispatchNumber} - {shipmentDispatch.soNumber}
                    </p>
                  </div>
                  <button
                    onClick={handleShipmentClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleShipmentConfirm} className="p-6">
                  {/* Package Info Summary */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      Dispatch Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Dispatch #</span>
                        <p className="font-medium text-gray-900">{shipmentDispatch.dispatchNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Package #</span>
                        <p className="font-medium text-gray-900">{shipmentDispatch.packageNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">SO Number</span>
                        <p className="font-medium text-gray-900">{shipmentDispatch.soNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Customer</span>
                        <p className="font-medium text-gray-900">{shipmentDispatch.customerName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Transporter</span>
                        <p className="font-medium text-gray-900">{shipmentDispatch.transporter}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Vehicle</span>
                        <p className="font-medium text-gray-900">{shipmentDispatch.vehicleNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Confirmation Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tracking Number *
                      </label>
                      <input
                        type="text"
                        name="trackingNumber"
                        value={shipmentData.trackingNumber}
                        onChange={handleShipmentChange}
                        placeholder="e.g., TRK123456789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Shipping Method *
                      </label>
                      <select
                        name="shippingMethod"
                        value={shipmentData.shippingMethod}
                        onChange={handleShipmentChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="ROAD">Road</option>
                        <option value="AIR">Air</option>
                        <option value="RAIL">Rail</option>
                        <option value="SEA">Sea</option>
                        <option value="COURIER">Courier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Confirmed By *
                      </label>
                      <input
                        type="text"
                        name="confirmedBy"
                        value={shipmentData.confirmedBy}
                        onChange={handleShipmentChange}
                        placeholder="e.g., Amit Sharma"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Dispatch Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="dispatchDate"
                        value={shipmentData.dispatchDate}
                        onChange={handleShipmentChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Expected Delivery Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="expectedDeliveryDate"
                        value={shipmentData.expectedDeliveryDate}
                        onChange={handleShipmentChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        name="remarks"
                        value={shipmentData.remarks}
                        onChange={handleShipmentChange}
                        rows="3"
                        placeholder="Additional notes about shipment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleShipmentClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      disabled={confirming}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={confirming}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      {confirming ? "Confirming..." : "Confirm Shipment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* View/Detail Modal */}
        {showViewModal && viewingDispatch && (
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
                      <Truck className="w-5 h-5 text-blue-600" />
                      Dispatch Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingDispatch.dispatchNumber}
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
                  <div className="mb-6 p-4 rounded-xl border" style={{
                    backgroundColor: viewingDispatch.status === 'DELIVERED' ? '#f0fdf4' : 
                                   viewingDispatch.status === 'IN_TRANSIT' ? '#faf5ff' :
                                   viewingDispatch.status === 'DISPATCHED' ? '#eff6ff' :
                                   viewingDispatch.status === 'CONFIRMED' ? '#eef2ff' :
                                   viewingDispatch.status === 'CANCELLED' ? '#fef2f2' : '#fefce8',
                    borderColor: viewingDispatch.status === 'DELIVERED' ? '#bbf7d0' :
                                viewingDispatch.status === 'IN_TRANSIT' ? '#e9d5ff' :
                                viewingDispatch.status === 'DISPATCHED' ? '#bfdbfe' :
                                viewingDispatch.status === 'CONFIRMED' ? '#c7d2fe' :
                                viewingDispatch.status === 'CANCELLED' ? '#fecaca' : '#fde68a'
                  }}>
                    <div className="flex items-center gap-3">
                      {viewingDispatch.status === 'DELIVERED' && <CheckCircle className="w-6 h-6 text-green-600" />}
                      {viewingDispatch.status === 'IN_TRANSIT' && <Truck className="w-6 h-6 text-purple-600" />}
                      {viewingDispatch.status === 'DISPATCHED' && <Send className="w-6 h-6 text-blue-600" />}
                      {viewingDispatch.status === 'CONFIRMED' && <Check className="w-6 h-6 text-indigo-600" />}
                      {viewingDispatch.status === 'CANCELLED' && <XCircle className="w-6 h-6 text-red-600" />}
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingDispatch.status)}`}>
                          {viewingDispatch.status || "PENDING"}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {viewingDispatch.status === 'DELIVERED' && 'Package has been successfully delivered'}
                          {viewingDispatch.status === 'IN_TRANSIT' && 'Package is currently in transit'}
                          {viewingDispatch.status === 'DISPATCHED' && 'Package has been dispatched'}
                          {viewingDispatch.status === 'CONFIRMED' && 'Shipment has been confirmed'}
                          {viewingDispatch.status === 'CANCELLED' && 'Dispatch has been cancelled'}
                          {!viewingDispatch.status && 'Dispatch is pending'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Information Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Dispatch Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.dispatchNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Package Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.packageNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        SO Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.soNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Invoice Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.invoiceNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Delivery Challan
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.deliveryChallan || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Dispatch Date
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatDate(viewingDispatch.dispatchDate)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Customer Name
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.customerName}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Customer Code
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.customerCode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        Dispatched By
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.dispatchedBy || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Transporter & Driver Information */}
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Transporter & Driver Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Transporter
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.transporter || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Vehicle Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.vehicleNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Driver Name
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.driverName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Driver Mobile
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingDispatch.driverMobile || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Remarks */}
                  {viewingDispatch.remarks && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Remarks
                      </label>
                      <p className="text-sm text-gray-700 mt-1">
                        {viewingDispatch.remarks}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 mt-6 border-t border-gray-200">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Challan
                    </button>
                    <button
                      onClick={() => {
                        handleViewClose();
                        handleShipmentClick(viewingDispatch);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Confirm Shipment
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