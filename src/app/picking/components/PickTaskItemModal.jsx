"use client";

import React, { useState, useEffect } from "react";
import apiRequest from "@/components/apiRequest";
import {
  XCircle,
  Scan,
  Barcode,
  CheckCircle,
  AlertCircle,
  PackageCheck,
  MapPin,
} from "lucide-react";

export default function PickTaskItemModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}) {
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [pickedQuantity, setPickedQuantity] = useState(0);
  const [shortQuantity, setShortQuantity] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    if (item) {
      setPickedQuantity(item.quantityToPick || item.requiredQuantity || 0);
      setShortQuantity(item.shortQuantity || 0);
      setScannedBarcode(item.itemBarcode || "");
      setRemarks(item.remarks || "");
      setErrorMessage("");
      setIsMatched(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const expectedLocation = item.locationBarcode || item.sourceLocation || "";

  const handleBarcodeChange = (val) => {
    setScannedBarcode(val);
    setErrorMessage("");
    if (val.trim() && expectedLocation.trim()) {
      if (val.trim().toLowerCase() === expectedLocation.trim().toLowerCase()) {
        setIsMatched(true);
      } else {
        setIsMatched(false);
      }
    } else {
      setIsMatched(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      expectedLocation &&
      scannedBarcode.trim().toLowerCase() !==
        expectedLocation.trim().toLowerCase()
    ) {
      setErrorMessage(
        `Scanned barcode does not match expected location barcode (${expectedLocation}).`,
      );
      return;
    }

    if (pickedQuantity < 0) {
      setErrorMessage("Picked quantity cannot be negative.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const totalRequired = item.quantityToPick;

      const payload = {
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        requiredQuantity: totalRequired,
        pickedQuantity: Number(pickedQuantity),
        itemBarcode: scannedBarcode,
        sourceLocation: item.sourceLocation || item.locationBarcode,
        status: "PICKED",
        priority: item.priority || "HIGH",
        isScanned: true,
        remarks:
          remarks ||
          (Number(pickedQuantity) >= Number(totalRequired)
            ? "Full pick"
            : "Partial pick"),
      };

      const response = await apiRequest(
        `/outbound/PickTaskItem/${item.id}`,
        "PUT",
        payload,
      );

      console.log("PickTaskItem PUT response:", response);
      onSuccess?.(
        `Item ${item.itemCode} updated successfully (Status: PICKED)`,
      );
      onClose();
    } catch (error) {
      console.error("Error updating PickTaskItem:", error);
      setErrorMessage(
        error.message || "Failed to update item pick status. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 animate-scale-up">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center z-10 text-white rounded-t-2xl">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PackageCheck className="w-5 h-5" />
                Pick Item: {item.itemCode}
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">{item.itemName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Target Location Info */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
              <label className="text-xs font-semibold uppercase text-indigo-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Source / Location Barcode
              </label>
              <p className="font-mono text-sm font-bold text-indigo-950 break-all">
                {expectedLocation || "N/A"}
              </p>
            </div>

            {/* Barcode Scanner Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase mb-1 flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-blue-600" />
                Scan Item Barcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan or type barcode to match location..."
                  value={scannedBarcode}
                  onChange={(e) => handleBarcodeChange(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:outline-none transition-all ${
                    isMatched
                      ? "border-green-500 bg-green-50/50 focus:ring-green-500 text-green-900"
                      : scannedBarcode
                        ? "border-amber-400 bg-amber-50/30 focus:ring-amber-500"
                        : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <Scan className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                {isMatched && (
                  <CheckCircle className="w-5 h-5 text-green-600 absolute right-3 top-2.5" />
                )}
              </div>
              {scannedBarcode && !isMatched && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Barcode does not match source location yet.
                </p>
              )}
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                  Picked Quantity ({item.uom || "Pcs"})
                </label>
                <input
                  type="number"
                  min="0"
                  max={item.requiredQuantity || item.quantityToPick}
                  value={pickedQuantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPickedQuantity(val);
                    const req =
                      item.requiredQuantity || item.quantityToPick || 0;
                    setShortQuantity(Math.max(0, req - val));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                  Short Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={shortQuantity}
                  onChange={(e) => setShortQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                Remarks
              </label>
              <input
                type="text"
                placeholder="Optional remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isMatched}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Pick
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
