"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Package,
  Building2,
  Calendar,
  Truck,
  Flag,
  CreditCard,
  Info,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  RotateCw,
} from "lucide-react";

const VendorReturnOrderView = ({ data, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

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

  const getQCStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
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
    return `₹${Number(amount).toFixed(2)}`;
  };

  const getStatusProgress = (status) => {
    const progress = {
      CREATED: 10,
      PENDING_PICKING: 25,
      PENDING_QC: 40,
      PENDING_PACKING: 60,
      PENDING_DISPATCH: 80,
      DISPATCHED: 90,
      RECEIVED: 95,
      COMPLETED: 100,
      CANCELLED: 0,
    };
    return progress[status] || 0;
  };

  if (!data) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Vendor Return Order
              </h2>
              <p className="text-green-100 text-sm">
                {data.vroNumber} | {data.returnRequestNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
             
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Status and Progress */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}
                  >
                    Status: {data.statusDisplayName || data.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(data.priority)}`}
                  >
                    <Flag className="w-3 h-3 inline mr-1" />
                    {data.priority}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getReturnTypeColor(data.returnType)}`}
                  >
                    {data.returnType?.replace("_", " ")}
                  </span>
                  {data.pickListGenerated && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Pick List Generated
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Created: {formatDateTime(data.createdAt)}
                </span>
              </div>

              
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
                  <p className="text-xs text-gray-500">
                    Code: {data.supplierCode}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  Request Number
                </div>
                <p className="font-medium text-gray-900">
                  {data.returnRequestNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Return Type: {data.returnType?.replace("_", " ")}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Order Details
                </div>
                <p className="font-medium text-gray-900">
                  Order: {formatDate(data.orderDate)}
                </p>
                {data.expectedReturnDate && (
                  <p className="text-xs text-gray-500">
                    Expected: {formatDate(data.expectedReturnDate)}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CreditCard className="w-4 h-4" />
                  Total Amount
                </div>
                <p className="font-medium text-green-600 text-lg">
                  {formatCurrency(data.totalAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  Items: {data.lines?.length || 0} | Qty: {data.totalQuantity || 0}
                </p>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {data.shippingAddress && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Truck className="w-4 h-4" />
                    Shipping Address
                  </div>
                  <p className="text-gray-900 whitespace-pre-line">
                    {data.shippingAddress}
                  </p>
                  {data.shippingMethod && (
                    <p className="text-xs text-gray-500 mt-1">
                      Method: {data.shippingMethod}
                    </p>
                  )}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Info className="w-4 h-4" />
                  Additional Information
                </div>
                {data.trackingNumber && (
                  <p className="text-sm text-gray-900">
                    Tracking: {data.trackingNumber}
                  </p>
                )}
                {data.dispatchNumber && (
                  <p className="text-sm text-gray-900">
                    Dispatch: {data.dispatchNumber}
                  </p>
                )}
                {data.returnReason && (
                  <p className="text-sm text-gray-600 mt-1">
                    Reason: {data.returnReason}
                  </p>
                )}
                {!data.trackingNumber && !data.dispatchNumber && !data.returnReason && (
                  <p className="text-sm text-gray-500">No additional information</p>
                )}
              </div>
            </div>

            {/* Order Progress Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Picking</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.pickingProgress ?? 0}%
                </p>
                {data.pickedBy && (
                  <p className="text-xs text-gray-500">
                    By: {data.pickedByName || data.pickedBy}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">QC Verification</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.qcProgress ?? 0}%
                </p>
                {data.qcVerifiedBy && (
                  <p className="text-xs text-gray-500">
                    By: {data.qcVerifiedByName || data.qcVerifiedBy}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Packing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.packingProgress ?? 0}%
                </p>
                {data.packedBy && (
                  <p className="text-xs text-gray-500">
                    By: {data.packedByName || data.packedBy}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Dispatch</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.dispatchProgress ?? 0}%
                </p>
                {data.dispatchedBy && (
                  <p className="text-xs text-gray-500">
                    By: {data.dispatchedByName || data.dispatchedBy}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items ({data.lines?.length || 0})
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
                        Order Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Picked
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QC
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Packed
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispatched
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QC Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
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
                          {line.orderQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {line.pickedQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {line.qcQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {line.packedQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {line.dispatchedQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(line.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getQCStatusColor(line.qcStatus)}`}
                          >
                            {line.qcStatusDisplayName || line.qcStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {line.batchNumber || "-"}
                          {line.expiryDate && (
                            <span className="text-xs text-gray-400 block">
                              Exp: {formatDate(line.expiryDate)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td colSpan="9" className="px-4 py-3 text-right text-sm">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600">
                        {formatCurrency(data.totalAmount)}
                      </td>
                      <td colSpan="2" className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

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

export default VendorReturnOrderView;