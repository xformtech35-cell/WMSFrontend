// components/inbound/InboundViewModal.jsx
import React, { useState } from "react";
import {
  X,
  Eye,
  FileText,
  Package,
  Truck,
  Calendar,
  Building2,
  User,
  Phone,
  Hash,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer,
  Download,
  ArrowUpDown,
  Box,
  Clipboard,
  CheckSquare,
  Loader,
  Warehouse,
} from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import { API_ROOT } from "@/lib/config";

const InboundViewModal = ({
  inbound,
  onClose,
  formatDate,
  formatDateTime,
  formatCurrency,
  getStatusColor,
  getStageColor,
  onProcess,
  onPrint,
  isgrn = false,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!inbound) return null;

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-5 h-5 text-yellow-500" />,
      IN_PROGRESS: <Loader className="w-5 h-5 text-blue-500" />,
      PARTIAL: <Package className="w-5 h-5 text-orange-500" />,
      COMPLETED: <CheckCircle className="w-5 h-5 text-green-500" />,
      REJECTED: <XCircle className="w-5 h-5 text-red-500" />,
      CANCELLED: <XCircle className="w-5 h-5 text-gray-500" />,
    };
    return icons[status] || <FileText className="w-5 h-5 text-gray-500" />;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <Eye className="w-4 h-4" /> },
    { id: "items", label: "Items", icon: <Package className="w-4 h-4" /> },
    { id: "tracking", label: "Tracking", icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full z-10 items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Decorative header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl"></div>

          {/* Header - Fixed */}
          <div className="sticky top-0 bg-white z-10 flex items-start justify-between p-6 pt-7 border-b border-gray-100 rounded-t-2xl flex-shrink-0">
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900">
                    {isgrn ? inbound.grnNumber : inbound.inboundNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inbound.status)}`}
                  >
                    {inbound.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  PO: {inbound.poNumber} • {inbound.supplierName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onPrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print"
              >
                <Printer className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs - Fixed */}
          <div className="sticky top-[73px] bg-white z-10 px-6 border-b border-gray-100 flex-shrink-0">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Status & Stage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(inbound.status)}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inbound.status)}`}
                      >
                        {inbound.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clipboard className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Stage</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStageColor(inbound.stage)}`}
                    >
                      {inbound.stage?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Inbound Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(inbound.inboundDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Expected Arrival
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {inbound.expectedArrivalDate
                        ? formatDate(inbound.expectedArrivalDate)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Arrival Rock
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                     {inbound.rock
                        ? `${inbound?.rock.name} -${inbound?.rock?.warehouse?.name} `
                        : "Not Arrived"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
                    <p className="text-sm font-medium text-gray-900">
                      {inbound.invoiceNumber || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Delivery Challan
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {inbound.deliveryChallan || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    Supplier Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Supplier Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inbound.supplierName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">PO Number</p>
                      <p className="text-sm font-medium text-blue-600">
                        {inbound.poNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {inbound.remarks && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Remarks</p>
                    <p className="text-sm text-gray-700">{inbound.remarks}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
                  <p>Created: {formatDateTime(inbound.createdAt)}</p>
                  <p>Last Updated: {formatDateTime(inbound.updatedAt)}</p>
                </div>
              </div>
            )}

            {activeTab === "items" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Items ({inbound.lines?.length || 0})
                  </h4>
                  <span className="text-xs text-gray-500">
                    Total:{" "}
                    {inbound.lines?.reduce(
                      (sum, item) => sum + item.totalQuantity,
                      0,
                    ) || 0}{" "}
                    units
                  </span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                          Item Code
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                          Item Name
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                          Ordered
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                          Received
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                          Pending
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                          Accept
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                          Reject
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                          Images
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inbound.lines?.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                            {item.itemCode}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-600 text-right">
                            {item.orderedQuantity}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-blue-600 text-right">
                            {item.receivedQuantity}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-orange-600 text-right">
                            {item.pendingQuantity}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-green-600 text-right">
                            {item.acceptedQuantity}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-orange-600 text-right">
                            {item.rejectedQuantity}
                          </td>
                          <td className="px-4 py-2.5">
                            <ImageGallery
                              images={item.images}
                              baseUrl={API_ROOT} // your image server URL
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.qualityStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : item.qualityStatus === "ACCEPTED"
                                    ? "bg-green-100 text-green-700"
                                    : item.qualityStatus === "REJECTED"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {item.qualityStatus || "PENDING"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "tracking" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Tracking Number
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {inbound.trackingNumber || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Tracking Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {inbound.trackingName || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Gate Entry Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-500" />
                    Gate Entry Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Gate Entry Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inbound.gateEntryNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gate Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inbound.gateNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Driver Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inbound.driverName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Driver Contact</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inbound.driverContact || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">
                        Gate Entry Date & Time
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {inbound.gateEntryDateTime
                          ? formatDateTime(inbound.gateEntryDateTime)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unloading Info */}
                {inbound.unloadingStartTime && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Box className="w-4 h-4 text-blue-500" />
                      Unloading Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Boxes Unloaded</p>
                        <p className="text-sm font-medium text-gray-900">
                          {inbound.boxesUnloadedQuantity || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unloaded By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {inbound.unloadedBy || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unloading Start</p>
                        <p className="text-sm font-medium text-gray-900">
                          {inbound.unloadingStartTime
                            ? formatDateTime(inbound.unloadingStartTime)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unloading End</p>
                        <p className="text-sm font-medium text-gray-900">
                          {inbound.unloadingEndTime
                            ? formatDateTime(inbound.unloadingEndTime)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions - Fixed */}
          {/* <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {inbound.status === "PENDING" && (
              <button
                onClick={() => onProcess(inbound)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-700 rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all flex items-center gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                Process Inbound
              </button>
            )}
          </div> */}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default InboundViewModal;
