// components/inbound/QualityInspectionModal.jsx
"use client";
import React, { useState, useRef } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Send,
  Clock,
  User,
  Package,
  Box,
  Loader,
  Truck,
  UserCheck,
  FileText,
  Calendar,
  Clipboard,
  CheckSquare,
  Edit,
  Save,
  Shield,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Search,
  XCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";

const QualityApprovalInspectionModal = ({
  isOpen,
  onClose,
  inbound,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("PENDING");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && inbound) {
      setApprovalStatus("PENDING");
      setApprovalRemarks(`Quality inspection for ${inbound.inboundNumber}`);
      setRejectionReason("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen, inbound]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate
      if (approvalStatus === "REJECTED" && !rejectionReason.trim()) {
        throw new Error("Please provide a rejection reason");
      }

      const payload = {
        approvalStatus: approvalStatus,
        approvalRemarks: approvalRemarks || null,
        rejectionReason: approvalStatus === "REJECTED" ? rejectionReason : null,
        approvedBy: 1, // Default to current user
      };

      const response = await api.post(
        `/inbound/${inbound.id}/quality-inspection/approve-reject`,
        payload,
      );

      if (response.data.success) {
        setSuccess(true);
        onSuccess?.(response.data.data);
        await api.post(`/inbound/${inbound.id}/generate-grn`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(
          response.data.message ||
            "Failed to approve/reject quality inspection",
        );
      }
    } catch (err) {
      console.error("Quality approval error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to approve/reject quality inspection",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      APPROVED: "bg-green-100 text-green-700 border-green-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-5 h-5 text-yellow-500" />,
      APPROVED: <ThumbsUp className="w-5 h-5 text-green-500" />,
      REJECTED: <ThumbsDown className="w-5 h-5 text-red-500" />,
    };
    return icons[status] || <Clock className="w-5 h-5 text-yellow-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-up">
          {/* Decorative gradient header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-t-2xl"></div>

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pt-7 border-b border-gray-100 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Quality Inspection Approval
                </h3>
                <p className="text-sm text-gray-500">
                  {inbound?.inboundNumber} • {inbound?.poNumber}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3 animate-slide-down flex-shrink-0">
              <div className="p-1.5 bg-green-500 rounded-full">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Quality Inspection{" "}
                  {approvalStatus === "APPROVED" ? "Approved" : "Rejected"}{" "}
                  Successfully!
                </p>
                <p className="text-xs text-green-600">Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down flex-shrink-0">
              <div className="p-1 bg-red-500 rounded-full mt-0.5">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Inbound Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Inbound Number</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inbound?.inboundNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PO Number</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inbound?.poNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inbound?.supplierName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Stage</p>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      QUALITY INSPECTION
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              {/* <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Inspection Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="text-xl font-bold text-gray-900">
                      {inbound?.lines?.length || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                    <p className="text-xs text-gray-500">Accepted</p>
                    <p className="text-xl font-bold text-green-600">
                      {inbound?.lines?.filter(l => l.qualityStatus === "ACCEPTED").length || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                    <p className="text-xs text-gray-500">Rejected</p>
                    <p className="text-xl font-bold text-red-600">
                      {inbound?.lines?.filter(l => l.qualityStatus === "REJECTED").length || 0}
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Approval Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Approval Decision
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalStatus("APPROVED")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      approvalStatus === "APPROVED"
                        ? "border-green-500 bg-green-50 shadow-lg shadow-green-100"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <ThumbsUp
                        className={`w-6 h-6 ${approvalStatus === "APPROVED" ? "text-green-500" : "text-gray-400"}`}
                      />
                      <div className="text-left">
                        <p
                          className={`font-semibold ${approvalStatus === "APPROVED" ? "text-green-700" : "text-gray-700"}`}
                        >
                          Approve
                        </p>
                        <p className="text-xs text-gray-500">
                          Accept all items
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalStatus("REJECTED")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      approvalStatus === "REJECTED"
                        ? "border-red-500 bg-red-50 shadow-lg shadow-red-100"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <ThumbsDown
                        className={`w-6 h-6 ${approvalStatus === "REJECTED" ? "text-red-500" : "text-gray-400"}`}
                      />
                      <div className="text-left">
                        <p
                          className={`font-semibold ${approvalStatus === "REJECTED" ? "text-red-700" : "text-gray-700"}`}
                        >
                          Reject
                        </p>
                        <p className="text-xs text-gray-500">
                          Reject all items
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Approval Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Approval Remarks
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <textarea
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                  placeholder="Enter approval remarks..."
                />
              </div>

              {/* Rejection Reason (shown only when rejected) */}
              {approvalStatus === "REJECTED" && (
                <div className="animate-slide-down">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all resize-none"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}

              {/* Status Indicator */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    {getStatusIcon(approvalStatus)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Current Status
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(approvalStatus)}`}
                    >
                      {approvalStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || success || approvalStatus === "PENDING"}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                approvalStatus === "APPROVED"
                  ? "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-green-200"
                  : approvalStatus === "REJECTED"
                    ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-red-200"
                    : "bg-gray-400"
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Completed!
                </>
              ) : (
                <>
                  {approvalStatus === "APPROVED" ? (
                    <ThumbsUp className="w-4 h-4" />
                  ) : approvalStatus === "REJECTED" ? (
                    <ThumbsDown className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  {approvalStatus === "APPROVED"
                    ? "Approve Inspection"
                    : approvalStatus === "REJECTED"
                      ? "Reject Inspection"
                      : "Select Decision"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
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
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QualityApprovalInspectionModal;
