"use client";
import React, { useRef } from "react";
import {
  XCircle,
  Flag,
  Calendar,
  User,
  Building,
  Warehouse,
  FileText,
  Package,
  CheckCircle,
  XCircle as XCircleIcon,
  Clock,
  Printer,
  Download,
} from "lucide-react";

export default function PurchaseRequestView({ data, onClose }) {
  const printRef = useRef();

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

  const getPriorityColorPrint = (priority) => {
    const colors = {
      LOW: "gray",
      NORMAL: "blue",
      MEDIUM: "#D4A017",
      HIGH: "orange",
      URGENT: "red",
    };
    return colors[priority] || "blue";
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-purple-100 text-purple-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusColorPrint = (status) => {
    const colors = {
      DRAFT: "#6B7280",
      SUBMITTED: "#2563EB",
      APPROVED: "#16A34A",
      REJECTED: "#DC2626",
      PARTIALLY_RECEIVED: "#D4A017",
      COMPLETED: "#9333EA",
    };
    return colors[status] || "#6B7280";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DRAFT":
        return <Clock className="w-4 h-4" />;
      case "SUBMITTED":
        return <Clock className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircleIcon className="w-4 h-4" />;
      case "PARTIALLY_RECEIVED":
        return <Package className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const getTotalQuantity = () => {
    if (!data?.items) return 0;
    return data.items.reduce((sum, item) => sum + (item.requestedQty || 0), 0);
  };

  const getItemStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      RECEIVED: "bg-green-100 text-green-700",
      PARTIAL: "bg-blue-100 text-blue-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
    @media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    background: white;
  }

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  #print-area {
    width: 100%;
    background: white;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #ccc;
    padding: 8px;
  }

  tr {
    page-break-inside: avoid;
  }
}
      `}</style>

      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Purchase Request Details
            </h2>
            <span className="text-sm text-gray-500">#{data.prNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Print Area */}
        <div id="print-area">
          {/* Print Header */}
          <div className="print-header text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">PURCHASE REQUEST</h1>
            <p className="text-sm text-gray-600">Warehouse Management System</p>
            <div className="mt-2 flex justify-center gap-8 text-sm">
              <span><strong>PR Number:</strong> {data.prNumber}</span>
              <span><strong>Date:</strong> {formatDate(data.prDate)}</span>
              <span><strong>Status:</strong> {data.status}</span>
            </div>
          </div>

          <div className="p-6">
            {/* Status Banner */}
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${getStatusColor(data.status)} no-print`}>
              {getStatusIcon(data.status)}
              <div>
                <span className="font-medium">Status: {data.status}</span>
                {data.submittedAt && (
                  <span className="text-sm ml-3 opacity-75">
                    Submitted on: {formatDateTime(data.submittedAt)}
                  </span>
                )}
                {data.approvedAt && (
                  <span className="text-sm ml-3 opacity-75">
                    Approved on: {formatDateTime(data.approvedAt)}
                  </span>
                )}
                {data.rejectionReason && (
                  <span className="text-sm ml-3 text-red-600">
                    Reason: {data.rejectionReason}
                  </span>
                )}
              </div>
            </div>

            {/* Print Status Banner */}
            <div className="print-only mb-6 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium">Status: {data.status}</span>
                {data.submittedAt && (
                  <span className="text-sm ml-3">
                    Submitted on: {formatDateTime(data.submittedAt)}
                  </span>
                )}
                {data.approvedAt && (
                  <span className="text-sm ml-3">
                    Approved on: {formatDateTime(data.approvedAt)}
                  </span>
                )}
                {data.rejectionReason && (
                  <span className="text-sm ml-3 text-red-600">
                    Reason: {data.rejectionReason}
                  </span>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR Number
                    </label>
                    <div className="mt-1 text-sm font-medium text-blue-600">
                      {data.prNumber}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR Date
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(data.prDate)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {data.requestedBy}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {data.department}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-gray-400" />
                      {data.warehouse}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(data.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {data.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required Date
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(data.requiredDate)}
                    </div>
                  </div>

                  {data.supplierId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </label>
                      <div className="mt-1 text-sm">
                        {data.supplierName || "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Request Items</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Total Items: <span className="font-medium">{data.items?.length || 0}</span>
                  </span>
                  <span className="text-gray-600">
                    Total Quantity: <span className="font-medium">{getTotalQuantity()}</span>
                  </span>
                </div>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {item.itemCode || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.uom}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.requestedQty}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.currentStock || 0}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.reason || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.itemStatus)}`}>
                            {item.itemStatus || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Information */}
            {(data.remarks || data.createdAt || data.updatedAt) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.remarks && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </label>
                        <div className="mt-1 text-sm flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span>{data.remarks}</span>
                        </div>
                      </div>
                    )}
                    {data.createdAt && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </label>
                        <div className="mt-1 text-sm">
                          {formatDateTime(data.createdAt)}
                        </div>
                      </div>
                    )}
                    {data.updatedAt && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </label>
                        <div className="mt-1 text-sm">
                          {formatDateTime(data.updatedAt)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Print Footer */}
            <div className="print-footer text-center text-xs text-gray-500 border-t pt-4 mt-4">
              <p>Generated on: {new Date().toLocaleString()}</p>
              <p className="mt-1">This is a system-generated document. For any queries, please contact the warehouse department.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}