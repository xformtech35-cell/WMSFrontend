// app/sales-order/components/SalesOrderDetails.jsx
"use client";

import React from "react";
import {
  X,
  Building2,
  Building,
  User,
  MapPin,
  Truck,
  Calendar,
  Package,
  Flag,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Box,
  Weight,
  Hash,
} from "lucide-react";

const SalesOrderDetails = ({ data, onClose }) => {
  if (!data) return null;

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
      CONFIRMED: "bg-blue-100 text-blue-700",
      PROCESSING: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PICKING: "bg-yellow-100 text-yellow-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-indigo-100 text-indigo-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="w-5 h-5" />;
      case "CONFIRMED":
      case "PROCESSING":
        return <Clock className="w-5 h-5" />;
      case "APPROVED":
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5" />;
      case "REJECTED":
      case "CANCELLED":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const DetailRow = ({ icon: Icon, label, value, valueClassName = "" }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 w-5 h-5 text-gray-400 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-sm text-gray-900 break-words ${valueClassName}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Sales Order Details
          </h2>
          <p className="text-sm text-gray-500">{data.soNumber}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Status Banner */}
        <div className="mb-6 p-4 rounded-lg border flex items-center gap-3 bg-gray-50">
          <div className={`p-2 rounded-full ${getStatusColor(data.status)}`}>
            {getStatusIcon(data.status)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Status</p>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}
            >
              {data.status}
            </span>
          </div>
          {data.priority && (
            <div className="ml-auto">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(data.priority)}`}
              >
                <Flag className="w-3 h-3" />
                {data.priority} Priority
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Order Information
            </h3>
            <div className="space-y-2">
              <DetailRow
                icon={Hash}
                label="SO Number"
                value={data.soNumber}
              />
              <DetailRow
                icon={Building}
                label="Customer"
                value={`${data.customerName} (${data.customerCode})`}
              />
              <DetailRow
                icon={Building}
                label="Warehouse"
                value={data.warehouseId}
              />
              <DetailRow
                icon={Calendar}
                label="Order Date"
                value={formatDate(data.soDate)}
              />
              <DetailRow
                icon={Calendar}
                label="Delivery Date"
                value={formatDate(data.deliveryDate)}
              />
              <DetailRow
                icon={Truck}
                label="Shipping Method"
                value={data.shippingMethod}
              />
              <DetailRow
                icon={Box}
                label="Total Quantity"
                value={data.totalQuantity}
              />
              {data.totalWeight && (
                <DetailRow
                  icon={Weight}
                  label="Total Weight"
                  value={`${data.totalWeight} kg`}
                />
              )}
            </div>
          </div>

          {/* Address & Remarks */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Information
            </h3>
            <div className="space-y-2">
              <DetailRow
                icon={MapPin}
                label="Delivery Address"
                value={data.deliveryAddress}
              />
              {data.remarks && (
                <DetailRow
                  icon={FileText}
                  label="Remarks"
                  value={data.remarks}
                />
              )}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order Items
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({data.items?.length || 0} items)
            </span>
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">UOM</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ordered</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Reserved</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Picked</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Shipped</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items?.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.itemCode}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.itemName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.uom}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.orderedQuantity}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {item.reservedQuantity || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-600">
                      {item.pickedQuantity || 0}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {item.shippedQuantity || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.batchNumber || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan="4" className="px-4 py-3 font-medium text-gray-700">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {data.totalQuantity || data.items?.reduce((sum, item) => sum + item.orderedQuantity, 0) || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">
                    {data.items?.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0) || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-yellow-600">
                    {data.items?.reduce((sum, item) => sum + (item.pickedQuantity || 0), 0) || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    {data.items?.reduce((sum, item) => sum + (item.shippedQuantity || 0), 0) || 0}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {data.totalQuantity || 0}
            </p>
            <p className="text-xs text-blue-600">Total Quantity</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">
              {data.items?.length || 0}
            </p>
            <p className="text-xs text-green-600">Total Items</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">
              {data.items?.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0) || 0}
            </p>
            <p className="text-xs text-yellow-600">Reserved</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {data.items?.reduce((sum, item) => sum + (item.shippedQuantity || 0), 0) || 0}
            </p>
            <p className="text-xs text-purple-600">Shipped</p>
          </div>
        </div>

        {/* Audit Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Audit Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-gray-700">{data.createdBy || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created At</p>
              <p className="text-gray-700">{formatDate(data.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Updated By</p>
              <p className="text-gray-700">{data.updatedBy || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Updated At</p>
              <p className="text-gray-700">{formatDate(data.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetails;