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
  Clock,
  User as UserIcon,
  Check,
  MapPin,
  Box,
  Barcode,
  Tag,
  Upload,
  Signature,
  UserCheck,
  Clipboard,
} from "lucide-react";
import api from "@/lib/api";

export default function ShipmentConfirmation() {
  // List State
  const [shipments, setShipments] = useState([]);
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
  const [viewingShipment, setViewingShipment] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentDispatch, setShipmentDispatch] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryShipment, setDeliveryShipment] = useState(null);
  const [delivering, setDelivering] = useState(false);

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

  // Delivery Confirmation State
  const [deliveryData, setDeliveryData] = useState({
    shipmentNumber: "",
    soNumber: "",
    packageNumber: "",
    receivedBy: "",
    deliveredQuantity: 1,
    signature: "",
    deliveryProofUrl: "",
    remarks: "",
  });

  // Load shipments
  const loadShipments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("size", pageSize);
      if (searchTerm) params.append("search", searchTerm);

      const response = await api.get(
        `/outbound/shipment-confirmations?${params.toString()}`,
      );
      console.log("Shipments response:", response.data);

      if (response.data) {
        const data = response.data;
        if (data.content && Array.isArray(data.content)) {
          setShipments(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        } else if (Array.isArray(data)) {
          setShipments(data);
          setTotalPages(Math.ceil(data.length / pageSize));
          setTotalElements(data.length);
        } else {
          setShipments([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      }
    } catch (error) {
      console.error("Error loading shipments:", error);
      setErrorMessage("Failed to load shipments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadShipments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadShipments();
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

  const handleViewClick = (shipment) => {
    setViewingShipment(shipment);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingShipment(null);
  };

  const handleShipmentClick = (dispatch) => {
    setShipmentDispatch(dispatch);
    setShipmentData({
      dispatchNumber: dispatch.dispatchNumber || "",
      soNumber: dispatch.soNumber || "",
      transporter: dispatch.transporter || "",
      trackingNumber: dispatch.trackingNumber || "",
      shippingMethod: dispatch.shippingMethod || "ROAD",
      vehicleNumber: dispatch.vehicleNumber || "",
      dispatchDate: dispatch.dispatchDate
        ? new Date(dispatch.dispatchDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      expectedDeliveryDate: dispatch.expectedDeliveryDate
        ? new Date(dispatch.expectedDeliveryDate).toISOString().slice(0, 16)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
      confirmedBy: dispatch.confirmedBy || "",
      remarks: dispatch.remarks || "",
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
    setErrorMessage("");

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
          setErrorMessage(
            `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
          );
          setConfirming(false);
          return;
        }
      }

      // Format dates
      const formattedPayload = {
        ...shipmentData,
        dispatchDate: new Date(shipmentData.dispatchDate).toISOString(),
        expectedDeliveryDate: new Date(
          shipmentData.expectedDeliveryDate,
        ).toISOString(),
        createdBy: shipmentData.confirmedBy || "system_user",
      };

      const response = await api.post(
        "/outbound/shipment-confirmation",
        formattedPayload,
      );
      console.log("Shipment confirmation response:", response.data);

      setSuccessMessage(
        `Shipment ${shipmentData.dispatchNumber} confirmed successfully!`,
      );
      setShowSuccess(true);

      setTimeout(() => {
        handleShipmentClose();
        loadShipments();
      }, 1500);
    } catch (error) {
      console.error("Shipment confirmation error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to confirm shipment. Please try again.",
      );
    } finally {
      setConfirming(false);
    }
  };

  // Delivery Confirmation Handlers
  const handleDeliveryClick = (shipment) => {
    setDeliveryShipment(shipment);
    setDeliveryData({
      shipmentNumber: shipment.shipmentNumber || "",
      soNumber: shipment.soNumber || "",
      packageNumber: shipment.packageNumber || "",
      receivedBy: "",
      deliveredQuantity: 1,
      signature: "",
      deliveryProofUrl: "",
      remarks: "",
    });
    setShowDeliveryModal(true);
  };

  const handleDeliveryClose = () => {
    setShowDeliveryModal(false);
    setDeliveryShipment(null);
    setDeliveryData({
      shipmentNumber: "",
      soNumber: "",
      packageNumber: "",
      receivedBy: "",
      deliveredQuantity: 1,
      signature: "",
      deliveryProofUrl: "",
      remarks: "",
    });
  };

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    if (name === "deliveredQuantity") {
      const numValue = parseInt(value) || 0;
      setDeliveryData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setDeliveryData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDeliveryConfirm = async (e) => {
    e.preventDefault();
    setDelivering(true);
    setErrorMessage("");

    try {
      // Validate required fields
      const requiredFields = [
        "shipmentNumber",
        "soNumber",
        "packageNumber",
        "receivedBy",
        "deliveredQuantity",
      ];

      for (const field of requiredFields) {
        const value = deliveryData[field];
        // Check if value is null, undefined, or empty
        if (value === null || value === undefined || value === "") {
          setErrorMessage(
            `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
          );
          setDelivering(false);
          return;
        }
        // If it's a string, check if it's empty after trimming
        if (typeof value === "string" && value.trim() === "") {
          setErrorMessage(
            `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
          );
          setDelivering(false);
          return;
        }
        // If it's a number, check if it's 0 or negative
        if (field === "deliveredQuantity" && typeof value === "number" && value <= 0) {
          setErrorMessage("Delivered quantity must be greater than 0");
          setDelivering(false);
          return;
        }
      }

      const payload = {
        ...deliveryData,
        deliveredQuantity: parseInt(deliveryData.deliveredQuantity) || 1,
        createdBy: "system_user",
      };

      const response = await api.post("/outbound/delivery", payload);
      console.log("Delivery confirmation response:", response.data);

      setSuccessMessage(
        `Delivery confirmed for shipment ${deliveryData.shipmentNumber}!`,
      );
      setShowSuccess(true);

      setTimeout(() => {
        handleDeliveryClose();
        loadShipments();
      }, 1500);
    } catch (error) {
      console.error("Delivery confirmation error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to confirm delivery. Please try again.",
      );
    } finally {
      setDelivering(false);
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
      CONFIRMED: "bg-indigo-100 text-indigo-700",
      IN_TRANSIT: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.PENDING;
  };

  const getShippingMethodLabel = (method) => {
    const methods = {
      ROAD: "Road",
      AIR: "Air",
      RAIL: "Rail",
      SEA: "Sea",
      COURIER: "Courier",
    };
    return methods[method] || method || "N/A";
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
                  Shipment & Delivery Management
                </h1>
                <p className="text-indigo-100 text-sm mt-1">
                  Manage shipments, confirm deliveries, and track status
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadShipments}
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
                  placeholder="Search by Shipment #, Dispatch #, SO Number, Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Showing {shipments.length} of {totalElements} shipments
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
                    Shipment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dispatch #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      No shipments found
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => (
                    <tr
                      key={shipment.id || shipment.shipmentNumber}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-indigo-600">
                          {shipment.shipmentNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {shipment.dispatchNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {shipment.soNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {shipment.trackingNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {shipment.transporter || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {getShippingMethodLabel(shipment.shippingMethod)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                        >
                          {shipment.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(shipment.expectedDeliveryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(shipment)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {shipment.status !== "DELIVERED" && (
                            <button
                              type="button"
                              onClick={() => handleDeliveryClick(shipment)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Confirm Delivery"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
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
                shipments
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

        {/* Delivery Confirmation Modal */}
        {showDeliveryModal && deliveryShipment && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleDeliveryClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      Confirm Delivery
                    </h2>
                    <p className="text-sm text-gray-500">
                      {deliveryShipment.shipmentNumber} - {deliveryShipment.soNumber}
                    </p>
                  </div>
                  <button
                    onClick={handleDeliveryClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleDeliveryConfirm} className="p-6">
                  {/* Shipment Info Summary */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      Shipment Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Shipment #</span>
                        <p className="font-medium text-gray-900">{deliveryShipment.shipmentNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Dispatch #</span>
                        <p className="font-medium text-gray-900">{deliveryShipment.dispatchNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">SO Number</span>
                        <p className="font-medium text-gray-900">{deliveryShipment.soNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Package #</span>
                        <p className="font-medium text-gray-900">{deliveryShipment.packageNumber || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Tracking #</span>
                        <p className="font-medium text-gray-900 font-mono">{deliveryShipment.trackingNumber || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Transporter</span>
                        <p className="font-medium text-gray-900">{deliveryShipment.transporter}</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Received By *
                      </label>
                      <input
                        type="text"
                        name="receivedBy"
                        value={deliveryData.receivedBy}
                        onChange={handleDeliveryChange}
                        placeholder="e.g., Abhinav Sukla"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Delivered Quantity *
                      </label>
                      <input
                        type="number"
                        name="deliveredQuantity"
                        value={deliveryData.deliveredQuantity}
                        onChange={handleDeliveryChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Signature (Base64)
                      </label>
                      <textarea
                        name="signature"
                        value={deliveryData.signature}
                        onChange={handleDeliveryChange}
                        rows="2"
                        placeholder="Paste base64 encoded signature here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Delivery Proof URL
                      </label>
                      <input
                        type="url"
                        name="deliveryProofUrl"
                        value={deliveryData.deliveryProofUrl}
                        onChange={handleDeliveryChange}
                        placeholder="https://example.com/delivery-proof/12345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        name="remarks"
                        value={deliveryData.remarks}
                        onChange={handleDeliveryChange}
                        rows="3"
                        placeholder="Additional notes about delivery..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleDeliveryClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      disabled={delivering}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={delivering}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {delivering ? "Confirming..." : "Confirm Delivery"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* View/Detail Modal */}
        {showViewModal && viewingShipment && (
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
                      <Truck className="w-5 h-5 text-indigo-600" />
                      Shipment Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingShipment.shipmentNumber}
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
                        viewingShipment.status === "DELIVERED"
                          ? "#f0fdf4"
                          : viewingShipment.status === "IN_TRANSIT"
                            ? "#faf5ff"
                            : viewingShipment.status === "CONFIRMED"
                              ? "#eef2ff"
                              : viewingShipment.status === "CANCELLED"
                                ? "#fef2f2"
                                : "#fefce8",
                      borderColor:
                        viewingShipment.status === "DELIVERED"
                          ? "#bbf7d0"
                          : viewingShipment.status === "IN_TRANSIT"
                            ? "#e9d5ff"
                            : viewingShipment.status === "CONFIRMED"
                              ? "#c7d2fe"
                              : viewingShipment.status === "CANCELLED"
                                ? "#fecaca"
                                : "#fde68a",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {viewingShipment.status === "DELIVERED" && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                      {viewingShipment.status === "IN_TRANSIT" && (
                        <Truck className="w-6 h-6 text-purple-600" />
                      )}
                      {viewingShipment.status === "CONFIRMED" && (
                        <Check className="w-6 h-6 text-indigo-600" />
                      )}
                      {viewingShipment.status === "CANCELLED" && (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingShipment.status)}`}
                        >
                          {viewingShipment.status || "PENDING"}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {viewingShipment.status === "DELIVERED" &&
                            "Shipment has been successfully delivered"}
                          {viewingShipment.status === "IN_TRANSIT" &&
                            "Shipment is currently in transit"}
                          {viewingShipment.status === "CONFIRMED" &&
                            "Shipment has been confirmed"}
                          {viewingShipment.status === "CANCELLED" &&
                            "Shipment has been cancelled"}
                          {!viewingShipment.status && "Shipment is pending"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Information Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Shipment Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.shipmentNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Dispatch Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.dispatchNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Package Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.packageNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        SO Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.soNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Barcode className="w-3 h-3" />
                        Tracking Number
                      </label>
                      <p className="font-medium text-gray-900 font-mono">
                        {viewingShipment.trackingNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Shipping Method
                      </label>
                      <p className="font-medium text-gray-900">
                        {getShippingMethodLabel(viewingShipment.shippingMethod)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Dispatch Date
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatDate(viewingShipment.dispatchDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expected Delivery
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatDate(viewingShipment.expectedDeliveryDate)}
                      </p>
                    </div>
                    {viewingShipment.actualDeliveryDate && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Actual Delivery
                        </label>
                        <p className="font-medium text-gray-900">
                          {formatDate(viewingShipment.actualDeliveryDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Transporter Information */}
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Transporter Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Transporter
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.transporter || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Vehicle Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.vehicleNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        Confirmed By
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingShipment.confirmedBy || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Remarks */}
                  {viewingShipment.remarks && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Remarks
                      </label>
                      <p className="text-sm text-gray-700 mt-1">
                        {viewingShipment.remarks}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 mt-6 border-t border-gray-200">
                    {viewingShipment.status !== "DELIVERED" && (
                      <button
                        onClick={() => {
                          handleViewClose();
                          handleDeliveryClick(viewingShipment);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Delivery
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
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