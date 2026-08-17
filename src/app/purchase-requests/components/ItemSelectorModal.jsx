"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Package,
  AlertCircle,
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

const getItemsAPI = async (page = 0, size = 10, searchTerm = "") => {
  const params = new URLSearchParams({
    page,
    size,
    sort: "id,desc"
  });
  if (searchTerm) {
    params.append("search", searchTerm);
  }
  return apiRequest(`/items?${params.toString()}`);
};

export default function ItemSelectorModal({ 
  isOpen = false, 
  onClose, 
  onSelectItem,
  selectedItems = []
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Load items when modal opens or search changes
  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, currentPage, pageSize]);

  // Debounce search
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setCurrentPage(0);
        loadItems();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await getItemsAPI(currentPage, pageSize, searchTerm);
      
      if (response && response.content) {
        setItems(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setItems(response);
        setTotalPages(Math.ceil(response.length / pageSize) || 0);
        setTotalElements(response.length || 0);
      } else {
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      setErrorMessage("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    // Check if item is already selected
    const isAlreadySelected = selectedItems.some(
      selected => selected.itemId === item.id || selected.itemCode === item.itemCode
    );

    if (isAlreadySelected) {
      setErrorMessage("This item is already added to the request.");
      return;
    }

    setSelectedItem(item);
  };

  const handleConfirmSelection = () => {
    if (selectedItem) {
      onSelectItem({
        itemId: selectedItem.id,
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        description: selectedItem.description || "",
        uom: selectedItem.uom || "Nos",
        requestedQty: 1,
        currentStock: selectedItem.currentStock || 0,
        unitPrice: selectedItem.unitPrice || 0,
        category: selectedItem.category || "",
        brand: selectedItem.brand || "",
        supplierId: selectedItem.supplierId || null,
        isActive: selectedItem.isActive !== undefined ? selectedItem.isActive : true,
        notes: selectedItem.notes || "",
        gstRate: selectedItem.gstRate || 0,
        gstHsnCode: selectedItem.gstHsnCode || "",
        isGstApplicable: selectedItem.isGstApplicable || false,
      });
      
      setSelectedItem(null);
      onClose();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    setErrorMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Item</h2>
              <p className="text-sm text-gray-500">
                Search and select an item to add to your purchase request
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage("")}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Item Code or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Items Table - Horizontal/Raw-wise Layout */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No items found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or create a new item
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Item Code</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Item Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Brand</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">UOM</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Unit Price</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const isAlreadyAdded = selectedItems.some(
                        selected => selected.itemId === item.id || selected.itemCode === item.itemCode
                      );

                      return (
                        <tr 
                          key={item.id}
                          className={`
                            hover:bg-gray-50 transition-colors
                            ${isAlreadyAdded ? 'bg-gray-50 opacity-60' : ''}
                            ${isSelected ? 'bg-blue-50' : ''}
                          `}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.itemCode}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.category || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.brand || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.uom}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            ₹{item.unitPrice?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${item.currentStock <= item.minStockLevel ? 'text-yellow-600' : 'text-gray-700'}`}>
                              {item.currentStock || 0}
                            </span>
                            {item.currentStock <= item.minStockLevel && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                Low
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isAlreadyAdded ? (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                                <Check className="w-3 h-3 mr-1" />
                                Added
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectItem(item)}
                                className={`
                                  px-3 py-1 text-xs font-medium rounded-full transition-colors
                                  ${isSelected 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }
                                `}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-gray-500">
                  Page {currentPage + 1} of {totalPages} | Total: {totalElements} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm">{currentPage + 1}</span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              {selectedItem && (
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium">{selectedItem.itemName}</span>
                  <span className="text-gray-400 ml-2">(₹{selectedItem.unitPrice?.toFixed(2) || "0.00"})</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedItem || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}