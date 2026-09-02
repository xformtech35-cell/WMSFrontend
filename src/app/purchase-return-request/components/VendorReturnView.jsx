"use client";

import React, { useState } from "react";
import {
  FileText,
  X,
  Flag,
  ArrowLeftRight,
  Building2,
  Package,
  Calendar,
  CreditCard,
  Info,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const VendorReturnView = ({ data, onClose, onApprove, onReject, users }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedApprover, setSelectedApprover] = useState("");
  const [selectedRejector, setSelectedRejector] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PROCESSING: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.DRAFT;
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

  const handleApprove = async () => {
    if (!onApprove) return;
    if (!selectedApprover) {
      alert("Please select an approver.");
      return;
    }
    try {
      setIsProcessing(true);
      await onApprove(data.id, selectedApprover);
      setShowApproveConfirm(false);
      setSelectedApprover("");
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    if (!selectedRejector) {
      alert("Please select a rejector.");
      return;
    }
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      setIsProcessing(true);
      await onReject(data.id, selectedRejector, rejectionReason);
      setShowRejectModal(false);
      setSelectedRejector("");
      setRejectionReason("");
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if actions are allowed (only for PENDING or PENDING_APPROVAL status)
  const canApproveOrReject =
    data.status === "PENDING" || data.status === "PENDING_APPROVAL";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Vendor Return Request
              </h2>
              <p className="text-green-100 text-sm">
                {data.returnRequestNumber}
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
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}
              >
                Status: {data.status}
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
                <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                {data.returnType?.replace("_", " ")}
              </span>
            </div>

            {/* Action Buttons - Only for PENDING */}
            {canApproveOrReject && (
              <div className="mb-6 flex gap-3">
                <button
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}

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
                  Request Date
                </div>
                <p className="font-medium text-gray-900">
                  {formatDate(data.requestDate)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CreditCard className="w-4 h-4" />
                  Total Amount
                </div>
                <p className="font-medium text-green-600 text-lg">
                  {formatCurrency(
                    data.lines?.reduce(
                      (sum, line) => sum + (line.totalAmount || 0),
                      0,
                    ),
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Items: {data.lines?.length || 0}
                </p>
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
                  <p className="font-medium text-gray-900">
                    {data.invoiceNumber}
                  </p>
                </div>
              )}
              {data.createdAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Created At
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(data.createdAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Reason & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {data.returnReason && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Info className="w-4 h-4" />
                    Return Reason
                  </div>
                  <p className="text-gray-900">{data.returnReason}</p>
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
            {(data.approvedBy ||
              data.approvedDate ||
              data.rejectionReason ||
              data.rejectedBy) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  Approval Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {data.approvedBy && (
                    <div>
                      <p className="text-xs text-gray-500">Approved By</p>
                      <p className="text-sm text-gray-900">
                        {data.approvedByName || data.approvedBy}
                      </p>
                    </div>
                  )}
                  {data.approvedDate && (
                    <div>
                      <p className="text-xs text-gray-500">Approved Date</p>
                      <p className="text-sm text-gray-900">
                        {formatDateTime(data.approvedDate)}
                      </p>
                    </div>
                  )}
                  {data.rejectedBy && (
                    <div>
                      <p className="text-xs text-gray-500">Rejected By</p>
                      <p className="text-sm text-gray-900">
                        {data.rejectedByName || data.rejectedBy}
                      </p>
                    </div>
                  )}
                  {data.rejectionReason && (
                    <div>
                      <p className="text-xs text-gray-500">Rejection Reason</p>
                      <p className="text-sm text-red-600">
                        {data.rejectionReason}
                      </p>
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
                        Requested Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
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
                          {line.requestedQuantity}
                          {line.approvedQuantity && (
                            <span className="text-xs text-green-600 block">
                              Approved: {line.approvedQuantity}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(line.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {line.batchNumber || "-"}
                          {line.expiryDate && (
                            <span className="text-xs text-gray-400 block">
                              Exp: {formatDate(line.expiryDate)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {line.reason || "-"}
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
                        {formatCurrency(
                          data.lines?.reduce(
                            (sum, line) => sum + (line.totalAmount || 0),
                            0,
                          ),
                        )}
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

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowApproveConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                Approve Request
              </h3>
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request: {data.returnRequestNumber}
                </label>
                <p className="text-sm text-gray-500">
                  Supplier: {data.supplierName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Approver *
                </label>
                <select
                  value={selectedApprover}
                  onChange={(e) => setSelectedApprover(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Approver</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name ||
                        user.username ||
                        user.email ||
                        `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                Reject Request
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request: {data.returnRequestNumber}
                </label>
                <p className="text-sm text-gray-500">
                  Supplier: {data.supplierName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Rejector *
                </label>
                <select
                  value={selectedRejector}
                  onChange={(e) => setSelectedRejector(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Rejector</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name ||
                        user.username ||
                        user.email ||
                        `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Please provide a detailed reason for rejecting this return request..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-4 h-4" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VendorReturnView;