"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
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
  MapPin,
  Eye,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { usePermissions } from "@/lib/hooks/usePermissions";
import CustomerForm from "./component/CustomerForm";
import CustomerDetails from "./component/CustomerDetails";

// API Functions
const getCustomersAPI = async (page = 0, size = 10, search = "", status = null) => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const url = `/customers${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET customers response:", response);

    // Handle Spring Boot pagination response
    if (response.data) {
      const data = response.data;

      // Check if it's Spring Boot pagination format
      if (data.content && Array.isArray(data.content)) {
        return {
          data: data.content,
          total: data.totalElements || data.content.length,
          page: data.number || page,
          size: data.size || size,
          totalPages: data.totalPages || Math.ceil((data.totalElements || data.content.length) / size),
          first: data.first,
          last: data.last,
          numberOfElements: data.numberOfElements,
        };
      }

      // Handle custom pagination format
      if (data.data && Array.isArray(data.data)) {
        return {
          data: data.data,
          total: data.total || 0,
          page: data.page || page,
          size: data.size || size,
          totalPages: data.totalPages || 0,
        };
      }

      // Handle array response
      if (Array.isArray(data)) {
        return {
          data: data,
          total: data.length,
          page: page,
          size: size,
          totalPages: Math.ceil(data.length / size),
        };
      }
    }

    return {
      data: response.data?.content || response.data?.data || [],
      total: response.data?.totalElements || response.data?.total || 0,
      page: page,
      size: size,
      totalPages: response.data?.totalPages || 0,
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

const createCustomerAPI = async (data) => {
  try {
    const response = await api.post("/customers", data);
    console.log("Create customer response:", response);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Create customer error:", error);
    throw error;
  }
};

const updateCustomerAPI = async (id, data) => {
  try {
    const response = await api.put(`/customers/${id}`, data);
    console.log("Update customer response:", response);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Update customer error:", error);
    throw error;
  }
};

const deleteCustomerAPI = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    console.log("Delete customer response:", response);
    return response.data;
  } catch (error) {
    console.error("Delete customer error:", error);
    throw error;
  }
};

export default function CustomerPage() {
  const { can } = usePermissions();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Pagination state - 0-based
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(true);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, [currentPage, pageSize, searchTerm, filterStatus]);

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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine status filter value
      let statusFilter = null;
      if (filterStatus !== "all") {
        statusFilter = filterStatus;
      }

      const result = await getCustomersAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter
      );
      console.log("Loaded customers:", result);

      setCustomers(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(
        result.totalPages || Math.ceil((result.total || 0) / pageSize)
      );
      setIsFirstPage(
        result.first !== undefined ? result.first : currentPage === 0
      );
      setIsLastPage(
        result.last !== undefined
          ? result.last
          : currentPage === (result.totalPages || 0) - 1
      );

      // Clean up selected customers - remove any that no longer exist
      setSelectedCustomers((prev) =>
        prev.filter((id) => (result.data || []).some((c) => c.id === id))
      );
    } catch (error) {
      console.error("Load customers error:", error);
      setError(
        "Failed to load customers: " + (error.message || "Unknown error")
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
        loadCustomers();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Reload when filter changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0);
    } else {
      loadCustomers();
    }
  }, [filterStatus]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const getPaginationRange = () => {
    const range = [];
    const maxVisible = 5;
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

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteCustomerAPI(id);
      setSuccess("Customer deleted successfully");
      await loadCustomers();
    } catch (error) {
      console.error("Delete error:", error);
      setError(error.message || "Failed to delete customer");
      await loadCustomers();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedCustomers.length} customers?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(selectedCustomers.map((id) => deleteCustomerAPI(id)));
      setSuccess(`${selectedCustomers.length} customers deleted successfully`);
      setSelectedCustomers([]);
      await loadCustomers();
    } catch (error) {
      console.error("Bulk delete error:", error);
      setError("Failed to delete selected customers");
      await loadCustomers();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (submitData) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let result;
      if (editingCustomer) {
        result = await updateCustomerAPI(editingCustomer.id, submitData);
        setSuccess("Customer updated successfully");
      } else {
        result = await createCustomerAPI(submitData);
        setSuccess("Customer created successfully");
      }

      setShowForm(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save customer"
      );
      await loadCustomers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedCustomer(null);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(customers.map((c) => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (id) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: {
        bg: "bg-green-100",
        text: "text-green-800",
        dot: "bg-green-500",
        label: "Active",
      },
      INACTIVE: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        dot: "bg-gray-500",
        label: "Inactive",
      },
      SUSPENDED: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        dot: "bg-yellow-500",
        label: "Suspended",
      },
      BLOCKED: {
        bg: "bg-red-100",
        text: "text-red-800",
        dot: "bg-red-500",
        label: "Blocked",
      },
    };

    const style = statusMap[status] || statusMap.ACTIVE;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`}></span>
        {style.label}
      </span>
    );
  };

  const getCustomerTypeBadge = (type) => {
    const typeMap = {
      CORPORATE: { bg: "bg-blue-100", text: "text-blue-800", label: "Corporate" },
      INDIVIDUAL: { bg: "bg-purple-100", text: "text-purple-800", label: "Individual" },
      RETAIL: { bg: "bg-orange-100", text: "text-orange-800", label: "Retail" },
      WHOLESALE: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Wholesale" },
    };

    const style = typeMap[type] || typeMap.CORPORATE;

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
    );
  };

  const exportToCSV = () => {
    const allCustomers = customers;
    const headers = [
      "Customer Code",
      "Customer Name",
      "Company Name",
      "Email",
      "Phone",
      "Mobile",
      "City",
      "State",
      "Country",
      "Customer Type",
      "Status",
      "GST Number",
      "PAN Number",
      "Contact Person",
      "Total Orders",
      "Total Spent",
    ];
    const data = allCustomers.map((c) => [
      c.customerCode || "",
      c.customerName || "",
      c.companyName || "",
      c.email || "",
      c.phone || "",
      c.mobile || "",
      c.city || "",
      c.state || "",
      c.country || "",
      c.customerType || "",
      c.status || "",
      c.gstNumber || "",
      c.panNumber || "",
      c.contactPerson || "",
      c.totalOrders || 0,
      c.totalSpent || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
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
                Customer Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your customers and client information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={loadCustomers}
              className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  loading ? "animate-spin" : ""
                }`}
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
                setEditingCustomer(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Customer
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
                placeholder="Search customers by name, code, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "ACTIVE"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("INACTIVE")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "INACTIVE"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Inactive
              </button>
              <button
                onClick={() => setFilterStatus("SUSPENDED")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "SUSPENDED"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Suspended
              </button>
              <button
                onClick={() => setFilterStatus("BLOCKED")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "BLOCKED"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Blocked
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-gray-500">
              Showing {customers.length} of {totalItems} customers
              {loading && " (loading...)"}
            </span>
            {selectedCustomers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedCustomers.length})
              </button>
            )}
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No customers found</p>
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
                          selectedCustomers.length === customers.length &&
                          customers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
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
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
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
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.customerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.companyName}
                          </div>
                          {customer.contactPerson && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              <User className="w-3 h-3 inline mr-1" />
                              {customer.contactPerson}
                              {customer.contactDesignation && ` - ${customer.contactDesignation}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600">
                          {customer.customerCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {customer.email}
                            </span>
                          </div>
                          {customer.contactEmail && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {customer.contactEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-sm text-gray-600">
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.mobile && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {customer.mobile}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {customer.city || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.state && `${customer.state}, `}
                            {customer.country || "India"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getCustomerTypeBadge(customer.customerType)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(customer)}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            title="View Details"
                            disabled={loading}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
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

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSave={handleSubmit}
        editingCustomer={editingCustomer}
        isSubmitting={isSubmitting}
      />

      {/* Customer Details Modal */}
      <CustomerDetails
        customer={selectedCustomer}
        isOpen={showDetails}
        onClose={handleDetailsClose}
      />
    </div>
  );
}