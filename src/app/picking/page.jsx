// app/sales-order/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  XCircle,
  Building2,
  Flag,
  CheckCircle,
  Package,
  Truck,
  Calendar,
  User,
  Building,
  MapPin,
  CheckSquare,
  Clock,
  Send,
  Archive,
  Barcode,
  Scan,
  User as UserIcon,
  Warehouse,
  Hash,
  Box,
} from "lucide-react";
import api from "@/lib/api";

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

const getSalesOrdersAPI = async (page = 0, size = 10, searchTerm = "", status = "ALL") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (searchTerm) params.append("search", searchTerm);
    if (status && status !== "ALL") params.append("status", status);

    const url = `/outbound/pick-lists${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET sales orders response:", response);

    if (response.data) {
      const data = response.data;

      if (data.content && Array.isArray(data.content)) {
        return {
          data: data.content,
          total: data.totalElements || data.content.length,
          page: data.number || page,
          size: data.size || size,
          totalPages: data.totalPages || Math.ceil((data.totalElements || data.content.length) / size),
          first: data.first,
          last: data.last,
        };
      }

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
    console.error("Error fetching sales orders:", error);
    throw error;
  }
};

const getSalesOrderByIdAPI = async (id) => {
  return apiRequest(`/outbound/sales-order/${id}`);
};

const deleteSalesOrderAPI = async (id) => {
  return apiRequest(`/outbound/sales-order/${id}`, "DELETE");
};

// Update pick list status
const updatePickListStatusAPI = async (pickListNumber, status) => {
  return apiRequest(`/outbound/pick-list/${pickListNumber}/status?status=${status}`, "PATCH");
};

// Create pick task
const createPickTaskAPI = async (data) => {
  return apiRequest("/outbound/pick-task", "POST", data);
};

export default function PickListPage() {
  const router = useRouter();

  // List State
  const [salesOrders, setSalesOrders] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPickTaskModal, setShowPickTaskModal] = useState(false);
  const [editingSO, setEditingSO] = useState(null);
  const [viewingSO, setViewingSO] = useState(null);
  const [selectedPickList, setSelectedPickList] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Pick Task Form State
  const [pickTaskData, setPickTaskData] = useState({
    pickListNumber: "",
    itemCode: "",
    requiredQuantity: 0,
    locationBarcode: "",
    itemBarcode: "",
    binId: "",
    batchNumber: "",
    pickerId: "",
    pickerName: "",
    createdBy: "system_user",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSalesOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadSalesOrders();
  }, [currentPage, pageSize, statusFilter]);

  // Auto-clear messages after 5 seconds
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

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await getSalesOrdersAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      if (response && response.data) {
        setSalesOrders(response.data || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.total || 0);
      } else {
        setSalesOrders([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading sales orders:", error);
      setErrorMessage("Failed to load sales orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (so) => {
    try {
      if (so.items && so.items.length > 0) {
        setViewingSO(so);
        setShowViewModal(true);
        return;
      }
      
      setLoading(true);
      const fullSO = await getSalesOrderByIdAPI(so.soNumber);
      setViewingSO(fullSO);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading SO details:", error);
      setViewingSO(so);
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (so) => {
    try {
      setLoading(true);
      const fullSO = await getSalesOrderByIdAPI(so.soNumber);
      setEditingSO(so);
      setFormMode("edit");
      setShowFormModal(true);
    } catch (error) {
      console.error("Error loading SO details:", error);
      setErrorMessage("Failed to load sales order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingSO(null);
    setFormMode("create");
    setShowFormModal(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingSO(null);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingSO(null);
  };

  const handlePickTaskClose = () => {
    setShowPickTaskModal(false);
    setSelectedPickList(null);
    resetPickTaskForm();
  };

  const handleFormSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    loadSalesOrders();
    handleFormClose();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sales order?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteSalesOrderAPI(id);
      setSuccessMessage("Sales order deleted successfully");
      setShowSuccess(true);
      loadSalesOrders();
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("Failed to delete sales order.");
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (pickListNumber, status, actionLabel) => {
    if (!window.confirm(`Are you sure you want to mark this pick list as ${actionLabel}?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await updatePickListStatusAPI(pickListNumber, status);
      setSuccessMessage(`Pick list ${pickListNumber} marked as ${actionLabel} successfully`);
      setShowSuccess(true);
      loadSalesOrders();
      
      if (showViewModal) {
        handleViewClose();
      }
    } catch (error) {
      console.error("Status update error:", error);
      setErrorMessage(error.message || `Failed to update pick list status to ${actionLabel}.`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open Pick Task Modal
  const handleOpenPickTask = (pickList) => {
    setSelectedPickList(pickList);
    // Pre-fill form with pick list data
    setPickTaskData({
      pickListNumber: pickList.pickListNumber || "",
      itemCode: pickList.items?.[0]?.itemCode || "",
      requiredQuantity: pickList.items?.[0]?.requiredQuantity || 0,
      locationBarcode: pickList.items?.[0]?.sourceLocation || "",
      itemBarcode: "",
      binId: "",
      batchNumber: pickList.items?.[0]?.batchNumber || "",
      pickerId: "",
      pickerName: "",
      createdBy: "system_user",
    });
    setShowPickTaskModal(true);
  };

  // Reset Pick Task Form
  const resetPickTaskForm = () => {
    setPickTaskData({
      pickListNumber: "",
      itemCode: "",
      requiredQuantity: 0,
      locationBarcode: "",
      itemBarcode: "",
      binId: "",
      batchNumber: "",
      pickerId: "",
      pickerName: "",
      createdBy: "system_user",
    });
  };

  // Handle Pick Task Form Input
  const handlePickTaskInputChange = (e) => {
    const { name, value } = e.target;
    setPickTaskData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Pick Task Submit
  const handlePickTaskSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!pickTaskData.pickListNumber) {
      setErrorMessage("Pick List Number is required");
      return;
    }
    if (!pickTaskData.itemCode) {
      setErrorMessage("Item Code is required");
      return;
    }
    if (!pickTaskData.requiredQuantity || pickTaskData.requiredQuantity <= 0) {
      setErrorMessage("Required Quantity must be greater than 0");
      return;
    }
    if (!pickTaskData.pickerId) {
      setErrorMessage("Picker ID is required");
      return;
    }
    if (!pickTaskData.pickerName) {
      setErrorMessage("Picker Name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await createPickTaskAPI(pickTaskData);
      console.log("Pick Task created:", response);
      
      setSuccessMessage(`Pick task created successfully for ${pickTaskData.pickListNumber}`);
      setShowSuccess(true);
      loadSalesOrders();
      handlePickTaskClose();
    } catch (error) {
      console.error("Pick Task creation error:", error);
      setErrorMessage(error.message || "Failed to create pick task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
      MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      URGENT: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[priority] || colors.NORMAL;
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PROCESSING: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PICKING: "bg-yellow-100 text-yellow-700",
      PICKED: "bg-green-100 text-green-700",
      RELEASED: "bg-purple-100 text-purple-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-indigo-100 text-indigo-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const getItemStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      PICKED: "bg-green-100 text-green-700",
      SHORT: "bg-red-100 text-red-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status action buttons configuration
  const getStatusActions = (currentStatus) => {
    const actions = {
      RELEASED: [
        { status: "PICKING", label: "Start Picking", icon: Clock, color: "bg-blue-600 hover:bg-blue-700" },
      ],
      PICKING: [
        { status: "PICKED", label: "Mark as Picked", icon: CheckSquare, color: "bg-green-600 hover:bg-green-700" },
      ],
      PICKED: [
        { status: "SHIPPED", label: "Mark as Shipped", icon: Truck, color: "bg-purple-600 hover:bg-purple-700" },
      ],
      SHIPPED: [
        { status: "DELIVERED", label: "Mark as Delivered", icon: CheckCircle, color: "bg-indigo-600 hover:bg-indigo-700" },
      ],
      PENDING: [
        { status: "PICKED", label: "Mark as Picked", icon: CheckSquare, color: "bg-green-600 hover:bg-green-700" },
      ],
    };
    return actions[currentStatus] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Modal */}
        {showSuccess && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSuccess(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform animate-scale-up pointer-events-auto border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Success!
                  </h3>
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Pick List Management
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  WMS Warehouse Management System
                </p>
              </div>
              <div className="flex items-center gap-3">
                
                <button
                  type="button"
                  onClick={loadSalesOrders}
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
                  placeholder="Search by SO Number or Pick List..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="RELEASED">Released</option>
                <option value="PICKING">Picking</option>
                <option value="PICKED">Picked</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {salesOrders.length} of {totalElements} orders
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
                    Pick List #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
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
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : salesOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      No pick lists found
                    </td>
                  </tr>
                ) : (
                  salesOrders.map((so) => (
                    <tr
                      key={so.id || so.pickListNumber}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(so)}
                      >
                        <span className="font-medium text-blue-600 hover:text-blue-800">
                          {so.pickListNumber || "N/A"}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(so)}
                      >
                        <span className="text-sm">{so.soNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(so.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {so.assignedTo || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{so.warehouseId}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {so.totalItems || so.items?.length || 0} items
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          Qty: {so.totalQuantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(so.priority)}`}
                        >
                          <Flag className="w-3 h-3" />
                          {so.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(so.status)}`}
                        >
                          {so.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleViewClick(so)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* {(so.status === "RELEASED" /|| so.status === "PENDING") && ( */}
                            <button
                              type="button"
                              onClick={() => handleOpenPickTask(so)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Create Pick Task"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          {/* )} */}
                          {(so.status === "DRAFT" || so.status === "PROCESSING" || so.status === "PENDING") && (
                            <button
                              type="button"
                              onClick={() => handleEditClick(so)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {(so.status === "DRAFT" || so.status === "PROCESSING" || so.status === "PENDING") && (
                            <button
                              type="button"
                              onClick={() => handleDelete(so.soNumber)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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
                Page {currentPage + 1} of {totalPages} | Total: {totalElements}{" "}
                orders
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

        {/* View/Detail Modal */}
        {showViewModal && viewingSO && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleViewClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Pick List Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingSO.pickListNumber}
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
                  {/* Status Update Actions */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {getStatusActions(viewingSO.status).map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          onClick={() => 
                            handleStatusUpdate(
                              viewingSO.pickListNumber, 
                              action.status, 
                              action.label
                            )
                          }
                          disabled={updatingStatus}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                        >
                          <action.icon className="w-4 h-4" />
                          {updatingStatus ? "Processing..." : action.label}
                        </button>
                      ))}
                      {/* Create Pick Task button in view modal */}
                      {(viewingSO.status === "RELEASED" || viewingSO.status === "PENDING") && (
                        <button
                          type="button"
                          onClick={() => {
                            handleViewClose();
                            handleOpenPickTask(viewingSO);
                          }}
                          className="px-4 py-2 rounded-lg flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Create Pick Task
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Pick List Number</label>
                      <p className="font-medium text-gray-900">{viewingSO.pickListNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">SO Number</label>
                      <p className="font-medium text-gray-900">{viewingSO.soNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Status</label>
                      <p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingSO.status)}`}>
                          {viewingSO.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Priority</label>
                      <p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(viewingSO.priority)}`}>
                          <Flag className="w-3 h-3" />
                          {viewingSO.priority}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Assigned To</label>
                      <p className="font-medium text-gray-900">{viewingSO.assignedTo || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Warehouse</label>
                      <p className="font-medium text-gray-900">{viewingSO.warehouseId}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Created</label>
                      <p className="font-medium text-gray-900">{formatDate(viewingSO.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Completed</label>
                      <p className="font-medium text-gray-900">
                        {viewingSO.completedDate ? formatDate(viewingSO.completedDate) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  {viewingSO.items && viewingSO.items.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Items ({viewingSO.items.length})
                        </h3>
                        <span className="text-sm text-gray-500">
                          Total Quantity: {viewingSO.totalQuantity || 0}
                        </span>
                      </div>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Picked</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {viewingSO.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">{item.itemCode}</td>
                                <td className="px-4 py-3">{item.itemName}</td>
                                <td className="px-4 py-3">{item.uom}</td>
                                <td className="px-4 py-3 font-medium">{item.requiredQuantity}</td>
                                <td className="px-4 py-3">{item.pickedQuantity || 0}</td>
                                <td className="px-4 py-3">{item.shortQuantity || 0}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                                    {item.status || "PENDING"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                  {item.sourceLocation || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Remarks if any */}
                  {viewingSO.remarks && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs text-gray-500 uppercase font-medium">Remarks</label>
                      <p className="text-sm text-gray-700">{viewingSO.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pick Task Modal */}
        {showPickTaskModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handlePickTaskClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-600" />
                      Create Pick Task
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedPickList?.pickListNumber || "New Pick Task"}
                    </p>
                  </div>
                  <button
                    onClick={handlePickTaskClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handlePickTaskSubmit}>
                    {/* Pick List Info */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Pick List Number</label>
                          <p className="font-medium text-gray-900">{selectedPickList?.pickListNumber}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">SO Number</label>
                          <p className="font-medium text-gray-900">{selectedPickList?.soNumber}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Warehouse</label>
                          <p className="font-medium text-gray-900">{selectedPickList?.warehouseId}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">Priority</label>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedPickList?.priority)}`}>
                            <Flag className="w-3 h-3" />
                            {selectedPickList?.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Code *
                          </label>
                          <div className="relative">
                            <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="itemCode"
                              value={pickTaskData.itemCode}
                              onChange={handlePickTaskInputChange}
                              placeholder="Enter item code"
                              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Required Quantity *
                          </label>
                          <input
                            type="number"
                            name="requiredQuantity"
                            value={pickTaskData.requiredQuantity}
                            onChange={handlePickTaskInputChange}
                            placeholder="Enter quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location Barcode *
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="locationBarcode"
                              value={pickTaskData.locationBarcode}
                              onChange={handlePickTaskInputChange}
                              placeholder="Scan or enter location"
                              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Barcode
                          </label>
                          <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="itemBarcode"
                              value={pickTaskData.itemBarcode}
                              onChange={handlePickTaskInputChange}
                              placeholder="Scan or enter item barcode"
                              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bin ID
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="binId"
                              value={pickTaskData.binId}
                              onChange={handlePickTaskInputChange}
                              placeholder="Enter bin ID"
                              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batch Number
                          </label>
                          <input
                            type="text"
                            name="batchNumber"
                            value={pickTaskData.batchNumber}
                            onChange={handlePickTaskInputChange}
                            placeholder="Enter batch number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Picker ID *
                          </label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="pickerId"
                              value={pickTaskData.pickerId}
                              onChange={handlePickTaskInputChange}
                              placeholder="Enter picker ID"
                              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Picker Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="pickerName"
                              value={pickTaskData.pickerName}
                              onChange={handlePickTaskInputChange}
                              placeholder="Enter picker name"
                              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="hidden">
                        <input
                          type="text"
                          name="pickListNumber"
                          value={pickTaskData.pickListNumber}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={handlePickTaskClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        {loading ? "Creating..." : "Create Pick Task"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}