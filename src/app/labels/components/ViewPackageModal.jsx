// components/ViewPackageModal.jsx
import React from "react";
import {
  XCircle,
  Package,
  Hash,
  QrCode,
  Scale,
  Ruler,
  Printer,
  CheckCircle,
  Truck,
} from "lucide-react";

const ViewPackageModal = ({
  viewingPackage,
  getStatusColor,
  getStatusActions,
  handleStatusUpdate,
  handleGenerateShippingLabel,
  handleViewClose,
  updatingStatus,
  generatingLabel,
  formatDate,
}) => {
  if (!viewingPackage) return null;

  return (
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
                <Package className="w-5 h-5 text-purple-600" />
                Package Details
              </h2>
              <p className="text-sm text-gray-500">
                {viewingPackage.packageNumber}
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
            {/* Status Actions */}
            {getStatusActions(viewingPackage.status).length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 font-medium mr-2">
                  Actions:
                </span>
                {getStatusActions(viewingPackage.status).map((action) => (
                  <button
                    key={action.status}
                    onClick={() =>
                      handleStatusUpdate(
                        viewingPackage.packageNumber,
                        action.status,
                        action.label
                      )
                    }
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5 ${action.color} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Package Number
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.packageNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  Package Barcode
                </label>
                <p className="font-medium text-gray-900 text-sm font-mono">
                  {viewingPackage.packageBarcode}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Status
                </label>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingPackage.status)}`}
                  >
                    {viewingPackage.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  SO Number
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.soNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Pick List Number
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.pickListNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Package Type
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.packageType}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Item Code
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.itemCode}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Item Name
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.itemName}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Packed Quantity
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.packedQuantity}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  Weight (kg)
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.weight
                    ? viewingPackage.weight.toFixed(2)
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Dimensions (cm)
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.length ||
                  viewingPackage.width ||
                  viewingPackage.height
                    ? `${viewingPackage.length || 0} × ${viewingPackage.width || 0} × ${viewingPackage.height || 0}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Volume
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.volume || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Packed By
                </label>
                <p className="font-medium text-gray-900">
                  {viewingPackage.packedBy}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Packed Date
                </label>
                <p className="font-medium text-gray-900">
                  {formatDate(viewingPackage.packedDate)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Created At
                </label>
                <p className="font-medium text-gray-900">
                  {formatDate(viewingPackage.createdAt)}
                </p>
              </div>
            </div>

            {/* Shipping Label Action */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  handleViewClose();
                  handleGenerateShippingLabel(viewingPackage.packageNumber);
                }}
                disabled={generatingLabel}
                className="px-4 py-2 rounded-lg flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {generatingLabel ? "Generating..." : "Generate Shipping Label"}
              </button>
            </div>

            {/* Remarks if any */}
            {viewingPackage.remarks && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Remarks
                </label>
                <p className="text-sm text-gray-700">
                  {viewingPackage.remarks}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPackageModal;