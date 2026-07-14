"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  XCircle,
  Trash2,
  Eye,
  Package,
  CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import ItemForm from "./components/ItemForm";

// API Functions
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

const getItemByIdAPI = async (id) => {
  return apiRequest(`/items/${id}`);
};

const deleteItemAPI = async (id) => {
  return apiRequest(`/items/${id}`, "DELETE");
};

export default function ItemsPage() {
  const router = useRouter();

  // List State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // UI State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  
  // Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingItemId, setEditingItemId] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadItems();
  }, [currentPage, pageSize]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-clear messages
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await getItemsAPI(currentPage, pageSize, searchTerm);
      setItems(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Error loading items:", error);
      setErrorMessage("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormMode("create");
    setEditingItemId(null);
    setShowFormModal(true);
  };

  const handleEditClick = (item) => {
    setFormMode("edit");
    setEditingItemId(item.id);
    setShowFormModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      setLoading(true);
      await deleteItemAPI(id);
      setSuccessMessage("Item deleted successfully!");
      setShowSuccess(true);
      loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      setErrorMessage("Failed to delete item.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (item) => {
    try {
      setLoading(true);
      const fullItem = await getItemByIdAPI(item.id);
      setViewingItem(fullItem);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading item details:", error);
      setErrorMessage("Failed to load item details.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingItem(null);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingItemId(null);
  };

  const handleFormSuccess = () => {
    loadItems();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Modal */}
        {showSuccess && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSuccess(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform animate-scale-up pointer-events-auto border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
                  <p className="text-sm text-gray-600 mb-6">{successMessage}</p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Item Management</h1>
                <p className="text-purple-100 text-sm mt-1">
                  Manage inventory items and products
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/purchase-requests")}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Package className="w-4 h-4" />
                  Purchase Requests
                </button>
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Item
                </button>
                <button
                  type="button"
                  onClick={loadItems}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Item Code or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Showing {items.length} of {totalElements} items
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      No items found. Click "New Item" to create one.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 cursor-pointer" onClick={() => handleViewClick(item)}>
                        <span className="font-medium text-purple-600 hover:text-purple-800">
                          {item.itemCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm">{item.category || "-"}</td>
                      <td className="px-4 py-3 text-sm">{item.uom}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        ₹{item.unitPrice?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`${item.currentStock <= item.minStockLevel ? "text-red-600 font-medium" : ""}`}>
                          {item.currentStock || 0}
                        </span>
                        {item.currentStock <= item.minStockLevel && (
                          <span className="ml-1 text-xs text-red-500">(Low)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.isGstApplicable ? `${item.gstRate}%` : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewClick(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
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
                <span className="text-sm">
                  {currentPage + 1}
                </span>
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

        {/* Item Form Modal - Same component for both Create and Edit */}
        <ItemForm
          isOpen={showFormModal}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          mode={formMode}
          itemId={editingItemId}
        />

        {/* View Modal */}
        {showViewModal && viewingItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="fixed inset-0 bg-black/50" onClick={handleViewClose} />
              <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
                    <p className="text-sm text-gray-500">{viewingItem.itemCode}</p>
                  </div>
                  <button
                    onClick={handleViewClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Item Code</label>
                      <p className="text-sm font-medium text-gray-900">{viewingItem.itemCode}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Item Name</label>
                      <p className="text-sm font-medium text-gray-900">{viewingItem.itemName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Category</label>
                      <p className="text-sm text-gray-700">{viewingItem.category || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Brand</label>
                      <p className="text-sm text-gray-700">{viewingItem.brand || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">UOM</label>
                      <p className="text-sm text-gray-700">{viewingItem.uom}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Unit Price</label>
                      <p className="text-sm text-gray-700">₹{viewingItem.unitPrice?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Current Stock</label>
                      <p className="text-sm text-gray-700">{viewingItem.currentStock || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Min Stock Level</label>
                      <p className="text-sm text-gray-700">{viewingItem.minStockLevel || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Reorder Level</label>
                      <p className="text-sm text-gray-700">{viewingItem.reorderLevel || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">GST Rate</label>
                      <p className="text-sm text-gray-700">
                        {viewingItem.isGstApplicable ? `${viewingItem.gstRate}%` : "Not Applicable"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">GST HSN Code</label>
                      <p className="text-sm text-gray-700">{viewingItem.gstHsnCode || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Supplier ID</label>
                      <p className="text-sm text-gray-700">{viewingItem.supplierId || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500">Description</label>
                      <p className="text-sm text-gray-700">{viewingItem.description || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500">Notes</label>
                      <p className="text-sm text-gray-700">{viewingItem.notes || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Status</label>
                      <p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          viewingItem.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {viewingItem.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Created At</label>
                      <p className="text-sm text-gray-700">{formatDate(viewingItem.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={handleViewClose}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-scale-up { animation: scale-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}