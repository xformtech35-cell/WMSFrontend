"use client";
import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

const apiRequest = async (endpoint, method = "GET", data = null) => {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
    });

    const result = response.data;
    if (result && result.success === false) {
      throw new Error(
        result?.message || `API request failed: ${response.status}`,
      );
    }
    return result?.data || result;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "API request failed",
    );
  }
};

const createItemAPI = async (itemData) => {
  return apiRequest("/items", "POST", itemData);
};

const updateItemAPI = async (id, itemData) => {
  return apiRequest(`/items/${id}`, "PUT", itemData);
};

const getItemByIdAPI = async (id) => {
  return apiRequest(`/items/${id}`);
};

export default function ItemForm({ 
  isOpen = false, 
  onClose, 
  onSuccess,
  mode = "create",
  itemId = null
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    description: "",
    uom: "Nos",
    gstRate: 18.0,
    gstHsnCode: "",
    isGstApplicable: true,
    cgstRate: 9.0,
    sgstRate: 9.0,
    unitPrice: 0.00,
    currentStock: 0,
    minStockLevel: 5,
    reorderLevel: 10,
    category: "",
    brand: "",
    supplierId: null,
    isActive: true,
    notes: ""
  });

  // Load data when in edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && itemId) {
      loadItemData();
    } else if (isOpen && mode === "create") {
      resetForm();
    }
  }, [isOpen, mode, itemId]);

  // Auto-close on success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onSuccess, onClose]);

  // Auto-clear error messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const resetForm = () => {
    setFormData({
      itemCode: "",
      itemName: "",
      description: "",
      uom: "Nos",
      gstRate: 18.0,
      gstHsnCode: "",
      isGstApplicable: true,
      cgstRate: 9.0,
      sgstRate: 9.0,
      unitPrice: 0.00,
      currentStock: 0,
      minStockLevel: 5,
      reorderLevel: 10,
      category: "",
      brand: "",
      supplierId: null,
      isActive: true,
      notes: ""
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowSuccess(false);
  };

  const loadItemData = async () => {
    try {
      setLoading(true);
      const item = await getItemByIdAPI(itemId);
      setFormData({
        itemCode: item.itemCode || "",
        itemName: item.itemName || "",
        description: item.description || "",
        uom: item.uom || "Nos",
        gstRate: item.gstRate || 18.0,
        gstHsnCode: item.gstHsnCode || "",
        isGstApplicable: item.isGstApplicable !== undefined ? item.isGstApplicable : true,
        cgstRate: item.cgstRate || 9.0,
        sgstRate: item.sgstRate || 9.0,
        unitPrice: item.unitPrice || 0,
        currentStock: item.currentStock || 0,
        minStockLevel: item.minStockLevel || 5,
        reorderLevel: item.reorderLevel || 10,
        category: item.category || "",
        brand: item.brand || "",
        supplierId: item.supplierId || null,
        isActive: item.isActive !== undefined ? item.isActive : true,
        notes: item.notes || ""
      });
    } catch (error) {
      console.error("Error loading item:", error);
      setErrorMessage("Failed to load item details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage("");

      // Validate required fields
      if (!formData.itemCode || !formData.itemName) {
        setErrorMessage("Item Code and Item Name are required.");
        setLoading(false);
        return;
      }

      // Calculate CGST and SGST if GST is applicable
      if (formData.isGstApplicable && formData.gstRate > 0) {
        const halfGst = formData.gstRate / 2;
        formData.cgstRate = halfGst;
        formData.sgstRate = halfGst;
      }

      let response;
      if (mode === "edit") {
        response = await updateItemAPI(itemId, formData);
        setSuccessMessage("Item updated successfully!");
      } else {
        response = await createItemAPI(formData);
        setSuccessMessage("Item created successfully!");
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("Error saving item:", error);
      setErrorMessage(`Failed to ${mode === "edit" ? "update" : "create"} item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === "edit" ? "Edit Item" : "Create New Item"}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === "edit" ? "Update item details" : "Add a new item to inventory"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading && mode === "edit" ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading item details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    value={formData.itemCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={mode === "edit"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UOM
                  </label>
                  <select
                    name="uom"
                    value={formData.uom}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Kg">Kg</option>
                    <option value="Gm">Gm</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST HSN Code
                  </label>
                  <input
                    type="text"
                    name="gstHsnCode"
                    value={formData.gstHsnCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier ID
                  </label>
                  <input
                    type="number"
                    name="supplierId"
                    value={formData.supplierId || ""}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-full flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isGstApplicable"
                      checked={formData.isGstApplicable}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">GST Applicable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || showSuccess}
                  className="px-6 py-2 text-blue-600 text-white rounded-lg hover:bg-blue-600 cursor-pointer bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === "edit" ? "Update Item" : "Create Item"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
}