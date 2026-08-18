// components/TransferDetailsPopup.jsx
"use client";

import { X, Package, ArrowRight, Warehouse, MapPin, User, Calendar, Hash, FileText, CheckCircle, Clock, AlertCircle, Layers, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TransferDetailsPopup({ isOpen, onClose, transferData }) {
  if (!isOpen || !transferData) return null;

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
      COMPLETED: "bg-green-100 text-green-700 border-green-200",
      FAILED: "bg-red-100 text-red-700 border-red-200",
      CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return statusMap[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      PENDING: Clock,
      IN_PROGRESS: RefreshCw,
      COMPLETED: CheckCircle,
      FAILED: AlertCircle,
      CANCELLED: X,
    };
    const Icon = iconMap[status] || FileText;
    return Icon;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const StatusIcon = getStatusIcon(transferData.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Transfer Details
              </h2>
              <div className="flex items-center gap-2 text-purple-100 text-sm">
                <span>{transferData.transferNumber}</span>
                <span className="text-purple-300">•</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getStatusBadge(
                    transferData.status
                  )}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {transferData.status || "PENDING"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <Label className="text-xs text-muted-foreground">Item</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Package className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-medium">{transferData.itemCode || "-"}</p>
                    <p className="text-xs text-gray-500">{transferData.itemName || "-"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-lg">
                    {transferData.quantityTransferred || 0}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <Label className="text-xs text-muted-foreground">Created By</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-green-600" />
                  <p className="font-medium">{transferData.createdBy || "-"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <Label className="text-xs text-muted-foreground">Transfer Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <p className="font-medium text-sm">
                    {formatDate(transferData.transferDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <Warehouse className="w-4 h-4" />
                  <span className="font-medium">Source Location</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-mono bg-white/60 p-1.5 rounded border border-blue-200/50 break-all">
                        {transferData.sourceLocation || "-"}
                      </p>
                      <button
                        onClick={() => copyToClipboard(transferData.sourceLocation)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                  {transferData.details?.[0]?.sourceOldQuantity !== undefined && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Old Qty: 
                        <span className="font-medium ml-1">{transferData.details[0].sourceOldQuantity}</span>
                      </span>
                      <span className="text-gray-600">New Qty: 
                        <span className="font-medium ml-1">{transferData.details[0].sourceNewQuantity}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <Warehouse className="w-4 h-4" />
                  <span className="font-medium">Target Location</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-mono bg-white/60 p-1.5 rounded border border-green-200/50 break-all">
                        {transferData.targetLocation || "-"}
                      </p>
                      <button
                        onClick={() => copyToClipboard(transferData.targetLocation)}
                        className="text-xs text-green-600 hover:text-green-800 mt-1 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                  {transferData.details?.[0]?.targetOldQuantity !== undefined && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Old Qty: 
                        <span className="font-medium ml-1">{transferData.details[0].targetOldQuantity}</span>
                      </span>
                      <span className="text-gray-600">New Qty: 
                        <span className="font-medium ml-1">{transferData.details[0].targetNewQuantity}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transferData.inventoryNumber && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Label className="text-xs text-muted-foreground">Inventory Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <p className="font-medium font-mono text-sm">
                      {transferData.inventoryNumber}
                    </p>
                  </div>
                </div>
              )}
              {transferData.grnNumber && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Label className="text-xs text-muted-foreground">GRN Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="font-medium font-mono text-sm">
                      {transferData.grnNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Reason & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transferData.transferReason && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Label className="text-xs text-muted-foreground">Transfer Reason</Label>
                  <p className="text-sm mt-1 text-gray-700">{transferData.transferReason}</p>
                </div>
              )}
              {transferData.remarks && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Label className="text-xs text-muted-foreground">Remarks</Label>
                  <p className="text-sm mt-1 text-gray-700">{transferData.remarks}</p>
                </div>
              )}
            </div>

            {/* Transfer Details Table */}
            {transferData.details && transferData.details.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Transfer Details
                </h3>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Source Bin</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Target Bin</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Transferred Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transferData.details.map((detail, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm font-mono">{detail.sourceBinId || "-"}</td>
                          <td className="px-4 py-2 text-sm font-mono">{detail.targetBinId || "-"}</td>
                          <td className="px-4 py-2 text-center text-sm font-medium">
                            {detail.transferredQuantity || 0}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(detail.status)}`}>
                              {detail.status || "PENDING"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end pt-4 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}