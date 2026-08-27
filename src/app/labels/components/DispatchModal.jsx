// app/sales-order/components/DispatchModal.jsx
"use client";

import React, { useState } from "react";
import {
  XCircle,
  Truck,
  Package,
  User,
  Phone,
  Building,
  Hash,
  Calendar,
  User as UserIcon,
  Clipboard,
  CheckCircle,
  AlertCircle,
  Send,
  FileText,
  MapPin,
} from "lucide-react";
import api from "@/lib/api";

export default function DispatchModal({
  viewingPackage,
  onClose,
  onSuccess,
  formatDate,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dispatchData, setDispatchData] = useState({
    soNumber: viewingPackage?.soNumber || "",
    packageNumber: viewingPackage?.packageNumber || "",
    customerCode: viewingPackage?.customerCode || "",
    customerName: viewingPackage?.customerName || "",
    transporter: "",
    vehicleNumber: "",
    driverName: "",
    driverMobile: "",
    invoiceNumber: "",
    deliveryChallan: "",
    dispatchDate: new Date().toISOString().slice(0, 16),
    dispatchedBy: "",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDispatchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      const requiredFields = [
        "soNumber",
        "packageNumber",
        "customerName",
        "transporter",
        "vehicleNumber",
        "driverName",
        "driverMobile",
        "invoiceNumber",
        "deliveryChallan",
        "dispatchDate",
        "dispatchedBy",
      ];

      for (const field of requiredFields) {
        if (!dispatchData[field] || dispatchData[field].trim() === "") {
          setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          setLoading(false);
          return;
        }
      }

      // Format dispatch date
      const formattedDate = new Date(dispatchData.dispatchDate).toISOString();

      const payload = {
        ...dispatchData,
        dispatchDate: formattedDate,
        createdBy: dispatchData.dispatchedBy || "system_user",
      };

      const response = await api.post("/outbound/dispatch", payload);
      
      console.log("Dispatch response:", response.data);

      setSuccess("Package dispatched successfully!");
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data);
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Dispatch error:", error);
      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to dispatch package. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!viewingPackage) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Dispatch Package
              </h2>
              <p className="text-sm text-gray-500">
                {viewingPackage.packageNumber} - {viewingPackage.soNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 text-sm">{success}</span>
              </div>
            )}

            {/* Package Info Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Package Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Package #</span>
                  <p className="font-medium text-gray-900">{viewingPackage.packageNumber}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">SO Number</span>
                  <p className="font-medium text-gray-900">{viewingPackage.soNumber}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">Customer</span>
                  <p className="font-medium text-gray-900">{viewingPackage.customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">Item</span>
                  <p className="font-medium text-gray-900">{viewingPackage.itemCode} - {viewingPackage.itemName}</p>
                </div>
              </div>
            </div>

            {/* Dispatch Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transporter Information */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  Transporter Details
                </h4>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transporter Name *
                </label>
                <input
                  type="text"
                  name="transporter"
                  value={dispatchData.transporter}
                  onChange={handleChange}
                  placeholder="e.g., XYZ Logistics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={dispatchData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="e.g., MH12AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Driver Information */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 mt-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Driver Details
                </h4>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={dispatchData.driverName}
                  onChange={handleChange}
                  placeholder="e.g., Ramesh Kumar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Driver Mobile *
                </label>
                <input
                  type="tel"
                  name="driverMobile"
                  value={dispatchData.driverMobile}
                  onChange={handleChange}
                  placeholder="e.g., 9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Document Information */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 mt-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Document Details
                </h4>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={dispatchData.invoiceNumber}
                  onChange={handleChange}
                  placeholder="e.g., INV-20260826-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Delivery Challan Number *
                </label>
                <input
                  type="text"
                  name="deliveryChallan"
                  value={dispatchData.deliveryChallan}
                  onChange={handleChange}
                  placeholder="e.g., DC-20260826-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Dispatch Details */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 mt-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Dispatch Details
                </h4>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dispatch Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="dispatchDate"
                  value={dispatchData.dispatchDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dispatched By *
                </label>
                <input
                  type="text"
                  name="dispatchedBy"
                  value={dispatchData.dispatchedBy}
                  onChange={handleChange}
                  placeholder="e.g., Amit Sharma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Remarks */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={dispatchData.remarks}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes about dispatch..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                {loading ? "Dispatching..." : "Dispatch Package"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}