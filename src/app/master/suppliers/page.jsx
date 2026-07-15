"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  AlertCircle,
  CheckCircle,
  Building2,
  Mail,
  Phone,
  User,
  ChevronLeft,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";

// API Functions
const getSuppliersAPI = async (page = 0, size = 10, search = "", isActive = null) => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (search) params.append("searchTerm", search);
    if (isActive !== null) params.append("isActive", isActive);

    const url = `/suppliers${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET suppliers response:", response);

    // Handle Spring Boot pagination response
    if (response.data && response.data.data) {
      const paginatedData = response.data.data;

      // Check if it's Spring Boot pagination format
      if (paginatedData.content && Array.isArray(paginatedData.content)) {
        return {
          data: paginatedData.content,
          total: paginatedData.totalElements || paginatedData.content.length,
          page: paginatedData.number || page,
          size: paginatedData.size || size,
          totalPages:
            paginatedData.totalPages ||
            Math.ceil(
              (paginatedData.totalElements || paginatedData.content.length) /
                size,
            ),
          first: paginatedData.first,
          last: paginatedData.last,
          numberOfElements: paginatedData.numberOfElements,
        };
      }

      // Handle custom pagination format
      return {
        data: paginatedData.data || paginatedData.content || [],
        total: paginatedData.total || paginatedData.totalElements || 0,
        page: paginatedData.page || paginatedData.number || page,
        size: paginatedData.size || paginatedData.pageSize || size,
        totalPages: paginatedData.totalPages || 0,
      };
    } else if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.data.length,
        page: page,
        size: size,
        totalPages: Math.ceil(response.data.length / size),
      };
    }
    return {
      data: response.data || [],
      total: 0,
      page: page,
      size: size,
      totalPages: 0,
    };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
};

const createSupplierAPI = async (data) => {
  try {
    const response = await api.post("/suppliers", data);
    console.log("Create supplier response:", response);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Create supplier error:", error);
    throw error;
  }
};

const updateSupplierAPI = async (id, data) => {
  try {
    const response = await api.put(`/suppliers/${id}`, data);
    console.log("Update supplier response:", response);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Update supplier error:", error);
    throw error;
  }
};

const deleteSupplierAPI = async (id) => {
  try {
    const response = await api.delete(`/suppliers/${id}`);
    console.log("Delete supplier response:", response);
    return response.data;
  } catch (error) {
    console.error("Delete supplier error:", error);
    throw error;
  }
};

export default function SuppliersPage() {
  const { can } = usePermissions();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    contactPerson: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState("all");
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  // Pagination state - 0-based
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(2);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(true);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, [currentPage, pageSize, searchTerm, filterActive]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine isActive filter value
      let isActiveFilter = null;
      if (filterActive === "active") {
        isActiveFilter = true;
      } else if (filterActive === "inactive") {
        isActiveFilter = false;
      }

      const result = await getSuppliersAPI(
        currentPage,
        pageSize,
        searchTerm,
        isActiveFilter
      );
      console.log("Loaded suppliers:", result);

      // Map backend data to frontend format
      const mappedSuppliers = (result.data || []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        email: s.email,
        phone: s.phone,
        address: s.address || "",
        gst: s.gstNumber || "",
        contactPerson: s.contactPerson || "",
        isActive: s.isActive !== undefined ? s.isActive : true,
      }));

      setSuppliers(mappedSuppliers);
      setTotalItems(result.total || mappedSuppliers.length);
      setTotalPages(
        result.totalPages ||
          Math.ceil((result.total || mappedSuppliers.length) / pageSize),
      );
      setIsFirstPage(
        result.first !== undefined ? result.first : currentPage === 0,
      );
      setIsLastPage(
        result.last !== undefined
          ? result.last
          : currentPage === (result.totalPages || 0) - 1,
      );

      // Clean up selected suppliers - remove any that no longer exist
      setSelectedSuppliers((prev) =>
        prev.filter((id) => mappedSuppliers.some((s) => s.id === id)),
      );
    } catch (error) {
      console.error("Load suppliers error:", error);
      setError(
        "Failed to load suppliers: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced search - resets to page 0
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage !== 0) {
        setCurrentPage(0);
      } else {
        loadSuppliers();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Reload when filter changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0);
    } else {
      loadSuppliers();
    }
  }, [filterActive]);

  const handlePageChange = (newPage) => {
    // newPage is 0-based
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page (0) when changing page size
  };

  const getPaginationRange = () => {
    const range = [];
    const maxVisible = 5;
    // Convert to 1-based for display
    const currentPageDisplay = currentPage + 1;
    const totalPagesDisplay = totalPages;

    let start = Math.max(1, currentPageDisplay - Math.floor(maxVisible / 2));
    let end = Math.min(totalPagesDisplay, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  // Filter suppliers locally (fallback if API filtering doesn't work)
  const filteredSuppliers = suppliers;

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      gstNumber: "",
      contactPerson: "",
      isActive: true,
    });
    setEditingSupplier(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (supplier) => {
    console.log("Editing supplier:", supplier);
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      code: supplier.code || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      gstNumber: supplier.gst || "",
      contactPerson: supplier.contactPerson || "",
      isActive: supplier.isActive !== undefined ? supplier.isActive : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteSupplierAPI(id);
      setSuccess("Supplier deleted successfully");

      // Reload current page to get fresh data
      await loadSuppliers();
    } catch (error) {
      console.error("Delete error:", error);
      setError(error.message || "Failed to delete supplier");
      await loadSuppliers();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSuppliers.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSuppliers.length} suppliers?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(selectedSuppliers.map((id) => deleteSupplierAPI(id)));
      setSuccess(`${selectedSuppliers.length} suppliers deleted successfully`);

      setSelectedSuppliers([]);

      // Reload current page
      await loadSuppliers();
    } catch (error) {
      console.error("Bulk delete error:", error);
      setError("Failed to delete selected suppliers");
      await loadSuppliers();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.name.trim()) {
        throw new Error("Supplier name is required");
      }
      if (!formData.code.trim()) {
        throw new Error("Supplier code is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.phone.trim()) {
        throw new Error("Phone number is required");
      }

      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address?.trim() || "",
        gstNumber: formData.gstNumber?.trim() || "",
        contactPerson: formData.contactPerson?.trim() || "",
        isActive: formData.isActive,
      };

      console.log("Submitting data:", submitData);

      let result;
      if (editingSupplier) {
        result = await updateSupplierAPI(editingSupplier.id, submitData);
        setSuccess("Supplier updated successfully");

        // Update the supplier in the list
        setSuppliers((prevSuppliers) =>
          prevSuppliers.map((s) =>
            s.id === editingSupplier.id
              ? {
                  ...s,
                  ...submitData,
                  gst: submitData.gstNumber,
                  id: s.id,
                }
              : s,
          ),
        );
      } else {
        result = await createSupplierAPI(submitData);
        setSuccess("Supplier created successfully");

        // Reload to get updated list with proper pagination
        await loadSuppliers();
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save supplier",
      );
      await loadSuppliers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSuppliers(filteredSuppliers.map((s) => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelectSupplier = (id) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive === true ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span>
        Inactive
      </span>
    );
  };

  const exportToCSV = () => {
    // Export all suppliers, not just current page
    const allSuppliers = suppliers;
    const headers = [
      "Name",
      "Code",
      "Email",
      "Phone",
      "Address",
      "GST",
      "Contact Person",
      "Status",
    ];
    const data = allSuppliers.map((s) => [
      s.name,
      s.code,
      s.email,
      s.phone,
      s.address || "",
      s.gst || "",
      s.contactPerson || "",
      s.isActive ? "Active" : "Inactive",
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `suppliers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (!can("MASTER_VIEW")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Supplier Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your suppliers and vendor information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={loadSuppliers}
              className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search suppliers by name, code, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterActive("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterActive === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterActive("active")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterActive === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterActive("inactive")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterActive === "inactive"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-gray-500">
              Showing {suppliers.length} of {totalItems} suppliers
              {loading && " (loading...)"}
            </span>
            {selectedSuppliers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedSuppliers.length})
              </button>
            )}
          </div>
        </div>

        {/* Supplier Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading suppliers...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No suppliers found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedSuppliers.length ===
                            filteredSuppliers.length &&
                          filteredSuppliers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier.id)}
                          onChange={() => handleSelectSupplier(supplier.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          {supplier.contactPerson && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              <User className="w-3 h-3 inline mr-1" />
                              {supplier.contactPerson}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600">
                          {supplier.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {supplier.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {supplier.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600">
                          {supplier.gst || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(supplier.isActive)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(0)}
                disabled={isFirstPage || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronFirst className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={isFirstPage || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {getPaginationRange().map((pageDisplay) => {
                  // Convert 1-based display to 0-based for API
                  const pageZeroBased = pageDisplay - 1;
                  return (
                    <button
                      key={pageDisplay}
                      onClick={() => handlePageChange(pageZeroBased)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentPage === pageZeroBased
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      disabled={loading}
                    >
                      {pageDisplay}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={isLastPage || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={isLastPage || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLast className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
              {totalItems > 0 && ` (${totalItems} total items)`}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Supplier Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., SUP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter GST number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Active Supplier
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting
                    ? "Saving..."
                    : editingSupplier
                      ? "Update Supplier"
                      : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}