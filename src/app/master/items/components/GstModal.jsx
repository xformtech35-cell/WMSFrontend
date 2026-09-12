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
  Percent,
} from "lucide-react";
import apiRequest from "@/components/apiRequest";

export default function GstModal({ isOpen = false, onClose, onGstChange }) {
  // List & Pagination state
  const [gstList, setGstList] = useState([]);
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
    rate: 18.0,
    description: "",
    active: true,
  });

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadGstRecords();
      resetForm();
    }
  }, [isOpen, currentPage]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadGstRecords();
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

  const loadGstRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
      });
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const response = await apiRequest(`/gst?${params.toString()}`);
      if (response && response.content) {
        setGstList(response.content);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setGstList(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setGstList([]);
      }
    } catch (error) {
      console.error("Error loading Tax records:", error);
      setErrorMessage("Failed to load Tax records.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      rate: 18.0,
      description: "",
      active: true,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (gst) => {
    setIsEditing(true);
    setEditingId(gst.id);
    setFormData({
      code: gst.code || "",
      name: gst.name || "",
      rate: gst.rate !== undefined ? gst.rate : 18.0,
      description: gst.description || "",
      active: gst.active !== undefined ? gst.active : true,
    });
  };

  const handleCancelForm = () => {
    resetForm();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // if (!formData.code.trim() || !formData.name.trim()) {
    //   setErrorMessage("Code and Name are required.");
    //   return;
    // }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        code: formData.code.trim() || null,
        name: formData.name.trim(),
        rate: parseFloat(formData.rate) || 0,
        description: formData.description.trim(),
        active: formData.active,
      };

      if (isEditing && editingId) {
        await apiRequest(`/gst/${editingId}`, "PUT", payload);
        setSuccessMessage("Tax rate updated successfully!");
      } else {
        await apiRequest("/gst", "POST", payload);
        setSuccessMessage("Tax rate created successfully!");
      }

      resetForm();
      loadGstRecords();
      if (onGstChange) onGstChange();
    } catch (error) {
      console.error("Error saving Tax rate:", error);
      setErrorMessage(
        error.message ||
          `Failed to ${isEditing ? "update" : "create"} Tax rate.`,
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
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Tax Rates
                </h2>
                <p className="text-xs text-gray-500">
                  Add and edit product tax rates
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
                    <Edit className="w-4 h-4 text-green-600" /> Edit Tax Rate
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-600" /> Add New Tax
                    Rate
                  </>
                )}
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tax Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GST18"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tax 18%"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="18.00"
                      value={formData.rate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Standard Tax rate..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
                      className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : isEditing ? (
                        "Update Tax"
                      ) : (
                        "Save Tax"
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
                  placeholder="Search Tax by Code, Name or Rate..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-9 pr-3 py-1.5 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={loadGstRecords}
                className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                title="Refresh Tax list"
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
                    <th className="px-4 py-2.5">Rate (%)</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-6 text-center text-gray-500"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Loading Tax rates...</span>
                        </div>
                      </td>
                    </tr>
                  ) : gstList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-6 text-center text-gray-500"
                      >
                        No Tax records found.
                      </td>
                    </tr>
                  ) : (
                    gstList.map((gst) => (
                      <tr key={gst.id || gst.code} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {gst.code}
                        </td>
                        <td className="px-4 py-2.5">{gst.name}</td>
                        <td className="px-4 py-2.5 font-semibold text-emerald-700">
                          {gst.rate}%
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {gst.description || "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              gst.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {gst.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditClick(gst)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                            title="Edit Tax Rate"
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
