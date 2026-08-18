// components/ItemTransferPopup.jsx
"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, Package, Warehouse, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ItemTransferPopup({ isOpen, onClose, itemData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sourceLocation: "",
    targetLocation: "",
    itemCode: "",
    quantity: 1,
    inventoryNumber: "",
    transferReason: "",
    remarks: "",
    createdBy: "system_user"
  });

  const [errors, setErrors] = useState({});

  // Pre-fill form when itemData changes
  useEffect(() => {
    if (itemData) {
      // Build source location from item data
      const sourceLocation = [
        itemData.warehouseId,
        itemData.zone,
        itemData.aisle,
        itemData.rack,
        itemData.level,
        itemData.binId
      ].filter(Boolean).join("-");

      setFormData({
        sourceLocation: itemData?.fullLocation || "",
        targetLocation: "",
        itemCode: itemData.itemCode || "",
        quantity: itemData.quantity || 1,
        inventoryNumber: itemData.inventoryNumber || "",
        transferReason: "",
        remarks: "",
        createdBy: "system_user"
      });
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sourceLocation) {
      newErrors.sourceLocation = "Source location is required";
    }
    if (!formData.targetLocation) {
      newErrors.targetLocation = "Target location is required";
    }
    if (!formData.itemCode) {
      newErrors.itemCode = "Item code is required";
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.inventoryNumber) {
      newErrors.inventoryNumber = "Inventory number is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sourceLocation: formData.sourceLocation,
        targetLocation: formData.targetLocation,
        itemCode: formData.itemCode,
        quantity: formData.quantity,
        inventoryNumber: formData.inventoryNumber,
        transferReason: formData.transferReason || "Transfer between locations",
        remarks: formData.remarks || "",
        createdBy: formData.createdBy || "system_user"
      };

      const response = await api.post("/stock-transfers/transfer", payload);
      
      if (response.status === 200 || response.status === 201) {
        toast.success("Item transferred successfully!");
        onSuccess?.();
        handleClose();
      }
    } catch (error) {
      console.error("Transfer error:", error);
      const errorMessage = error.response?.data?.message || "Failed to transfer item";
      toast.error(errorMessage);
      
      // Show specific validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach(key => {
          setErrors(prev => ({ ...prev, [key]: backendErrors[key] }));
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      sourceLocation: "",
      targetLocation: "",
      itemCode: "",
      quantity: 1,
      inventoryNumber: "",
      transferReason: "",
      remarks: "",
      createdBy: "system_user"
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Transfer Item</h2>
              <p className="text-blue-100 text-sm">Move inventory to new location</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-5">
            {/* Item Info Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Item Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Item Code:</span>
                  <span className="ml-2 font-medium">{itemData?.itemCode || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Item Name:</span>
                  <span className="ml-2 font-medium">{itemData?.itemName || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Inventory #:</span>
                  <span className="ml-2 font-medium">{itemData?.inventoryNumber || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Available Qty:</span>
                  <span className="ml-2 font-medium text-green-600">{itemData?.availableQuantity || 0}</span>
                </div>
              </div>
            </div>

            {/* Source Location */}
            <div>
              <Label className="text-sm font-medium">
                Source Location <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.sourceLocation}
                  disabled
                  onChange={(e) => handleChange("sourceLocation", e.target.value)}
                  className={`pl-10 ${errors.sourceLocation ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="e.g., WH-001-ZONE-01-AISLE-01-RACK-01-LEVEL-01-BIN-01"
                />
              </div>
              {errors.sourceLocation && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.sourceLocation}
                </p>
              )}
            </div>

            {/* Target Location */}
            <div>
              <Label className="text-sm font-medium">
                Target Location <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.targetLocation}
                  onChange={(e) => handleChange("targetLocation", e.target.value)}
                  className={`pl-10 ${errors.targetLocation ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="e.g., WH-002-XCXVCX-ASLE_1-WEEWRWE-EW34-BIN_03_UP_2"
                />
              </div>
              {errors.targetLocation && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.targetLocation}
                </p>
              )}
            </div>

            {/* Item Code & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Item Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.itemCode}
                  disabled
                  onChange={(e) => handleChange("itemCode", e.target.value)}
                  className={errors.itemCode ? "border-red-500 focus-visible:ring-red-500" : ""}
                  placeholder="Enter item code"
                />
                {errors.itemCode && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.itemCode}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"

                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)}
                  className={errors.quantity ? "border-red-500 focus-visible:ring-red-500" : ""}
                  placeholder="Enter quantity"
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>

            {/* Inventory Number */}
            <div>
              <Label className="text-sm font-medium">
                Inventory Number <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.inventoryNumber}
                  disabled

                onChange={(e) => handleChange("inventoryNumber", e.target.value)}
                className={errors.inventoryNumber ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="Enter inventory number"
              />
              {errors.inventoryNumber && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.inventoryNumber}
                </p>
              )}
            </div>

            {/* Transfer Reason */}
            <div>
              <Label className="text-sm font-medium">Transfer Reason</Label>
              <Input
                value={formData.transferReason}
                onChange={(e) => handleChange("transferReason", e.target.value)}
                placeholder="e.g., Replenishment from bulk to picking location"
              />
            </div>

            {/* Remarks */}
            <div>
              <Label className="text-sm font-medium">Remarks</Label>
              <Input
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                placeholder="Additional notes about the transfer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Transferring...
                  </div>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Transfer Item
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}