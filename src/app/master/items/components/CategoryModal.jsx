"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import apiRequest from "@/components/apiRequest";

export default function CategoryModal({ isOpen = false, onClose, onCategoryChange }) {
  // List & Pagination state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Form / Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
  });

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      resetForm();
    }
  }, [isOpen, currentPage]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
      });
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const response = await apiRequest(`/categories?${params.toString()}`);
      if (response && response.content) {
        setCategories(response.content);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setCategories(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setErrorMessage("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      active: true,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (category) => {
    setIsEditing(true);
    setEditingId(category.id);
    setFormData({
      code: category.code || "",
      name: category.name || "",
      description: category.description || "",
      active: category.active !== undefined ? category.active : true,
    });
  };

  const handleCancelForm = () => {
    resetForm();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setErrorMessage("Code and Name are required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.active,
      };

      if (isEditing && editingId) {
        await apiRequest(`/categories/${editingId}`, "PUT", payload);
        setSuccessMessage("Category updated successfully!");
      } else {
        await apiRequest("/categories", "POST", payload);
        setSuccessMessage("Category created successfully!");
      }

      resetForm();
      loadCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (error) {
      console.error("Error saving category:", error);
      setErrorMessage(
        error.message || `Failed to ${isEditing ? "update" : "create"} category.`
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto z-10">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Categories
                </h2>
                <p className="text-xs text-gray-500">
                  Add and edit product item categories
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Alert Messages */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm animate-slide-down">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm animate-slide-down">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="flex-1">{errorMessage}</span>
                <button onClick={() => setErrorMessage("")}>
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}

            {/* Form Section (Add / Edit) */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit className="w-4 h-4 text-green-600" /> Edit Category
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-purple-600" /> Add New Category
                  </>
                )}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ELEC, RAW"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Electronics"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="All electronic items..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          active: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-gray-700 font-medium">
                      Active
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : isEditing ? (
                        "Update Category"
                      ) : (
                        "Save Category"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* List Header & Search */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Category by Code or Name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-9 pr-3 py-1.5 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={loadCategories}
                className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                title="Refresh category list"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-100 text-xs font-semibold text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                          <span>Loading categories...</span>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">
                        No category records found.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id || cat.code} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {cat.code}
                        </td>
                        <td className="px-4 py-2.5">{cat.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {cat.description || "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              cat.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {cat.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditClick(cat)}
                            className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                            title="Edit Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>
                  Page {currentPage + 1} of {totalPages} ({totalElements} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
