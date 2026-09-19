// app/sales-order/page.jsx
"use client";

import apiRequest from "@/components/apiRequest";
import { useDateFormat } from "@/context/DateFormatContext";
import UserSelect from "@/components/UserSelect";
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
  ClipboardList,
  Tag,
  Layers,
  Check,
  Save,
} from "lucide-react";
import api from "@/lib/api";
import UserFullName from "@/components/UserFullName";

const getSalesOrdersAPI = async (
  page = 0,
  size = 10,
  searchTerm = "",
  status = "ALL",
) => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (searchTerm) params.append("search", searchTerm);
    if (status && status !== "ALL") params.append("status", status);

    const url = `/outbound/pick-tasks${params.toString() ? `?${params.toString()}` : ""}`;
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
          totalPages:
            data.totalPages ||
            Math.ceil((data.totalElements || data.content.length) / size),
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
  return apiRequest(
    `/outbound/pick-task/${pickListNumber}/status?status=${status}`,
    "PATCH",
  );
};

// Create pick task
const createPickTaskAPI = async (data) => {
  return apiRequest("/outbound/pick-task", "POST", data);
};

// Confirm pick
const confirmPickAPI = async (data) => {
  return apiRequest("/outbound/pick-confirmation", "POST", data);
};

export default function PickListPageConfi() {
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

  // Pick Confirmation Form State
  const [confirmationData, setConfirmationData] = useState({
    pickTaskNumber: "",
    itemCode: "",
    pickedQuantity: 0,
    shortQuantity: 0,
    barcode: "",
    confirmedBy: "",
    remarks: "All items picked successfully",
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
      setViewingSO(so);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading SO details:", error);
      setViewingSO(so);
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
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
    resetConfirmationForm();
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
  const handleStatusUpdate = async (pickTaskNumber, status, actionLabel) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this pick task as ${actionLabel}?`,
      )
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await updatePickListStatusAPI(pickTaskNumber, status);
      setSuccessMessage(
        `Pick task ${pickTaskNumber} marked as ${actionLabel} successfully`,
      );
      setShowSuccess(true);
      loadSalesOrders();

      if (showViewModal) {
        handleViewClose();
      }
    } catch (error) {
      console.error("Status update error:", error);
      setErrorMessage(
        error.message || `Failed to update pick task status to ${actionLabel}.`,
      );
    } finally {
      setUpdatingStatus(false);
    }
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

  // Reset Confirmation Form
  const resetConfirmationForm = () => {
    setConfirmationData({
      pickTaskNumber: "",
      confirmedBy: "",
      remarks: "All items picked successfully",
      items: [],
    });
  };

  // Open Confirmation Modal
  const handleOpenConfirmModal = (so) => {
    setSelectedPickList(so);
    const hasItems = so.items && Array.isArray(so.items) && so.items.length > 0;
    const itemsList = hasItems
      ? so.items.map((i) => ({
          itemCode: i.itemCode || "",
          itemName: i.itemName || "",
          uom: i.uom || "",
          requiredQuantity: i.requiredQuantity || 0,
          pickedQuantity: i.pickedQuantity !== undefined ? i.pickedQuantity : (i.requiredQuantity || 0),
          barcode: i.itemBarcode || i.sourceLocation || i.locationBarcode || "",
          remarks: i.remarks || "Full pick",
        }))
      : [
          {
            itemCode: so.itemCode || "",
            itemName: so.itemName || "",
            uom: so.uom || "",
            requiredQuantity: so.requiredQuantity || 0,
            pickedQuantity: so.pickedQuantity !== undefined ? so.pickedQuantity : (so.requiredQuantity || 0),
            barcode: so.itemBarcode || so.locationBarcode || "",
            remarks: "Full pick",
          },
        ];

    setConfirmationData({
      pickTaskNumber: so.pickTaskNumber || "",
      confirmedBy: so.assignedTo || so.pickerName || "",
      remarks: "All items picked successfully",
      items: itemsList,
    });
    setShowPickTaskModal(true);
  };

  // Handle Confirmation Form Input
  const handleConfirmationInputChange = (e) => {
    const { name, value } = e.target;
    setConfirmationData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Per-Item Input Change
  const handleItemConfirmationChange = (index, field, value) => {
    setConfirmationData((prev) => {
      const updatedItems = [...(prev.items || [])];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
      return { ...prev, items: updatedItems };
    });
  };

  // Handle Confirm Pick Submit
  const handleConfirmPickSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!confirmationData.pickTaskNumber) {
      setErrorMessage("Pick Task Number is required");
      return;
    }
    if (!confirmationData.confirmedBy) {
      setErrorMessage("Confirmed By is required");
      return;
    }

    const itemsPayload =
      confirmationData.items && confirmationData.items.length > 0
        ? confirmationData.items.map((item) => ({
            itemCode: item.itemCode,
            pickedQuantity: Number(item.pickedQuantity || 0),
            barcode: item.barcode || "",
            remarks: item.remarks || "Full pick",
          }))
        : [];

    const payload = {
      pickTaskNumber: confirmationData.pickTaskNumber,
      confirmedBy: confirmationData.confirmedBy,
      remarks: confirmationData.remarks || "All items picked successfully",
      items: itemsPayload,
    };

    try {
      setLoading(true);
      const response = await confirmPickAPI(payload);
      console.log("Pick Confirmation submitted:", response);

      setSuccessMessage(
        `Pick confirmation submitted successfully for ${confirmationData.pickTaskNumber}`,
      );
      setShowSuccess(true);
      loadSalesOrders();
      handlePickTaskClose();
    } catch (error) {
      console.error("Pick Confirmation error:", error);
      setErrorMessage(
        error.message || "Failed to confirm pick. Please try again.",
      );
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
      CONFIRMED: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const getItemStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      PICKED: "bg-green-100 text-green-700",
      SHORT: "bg-red-100 text-red-700",
      CANCELLED: "bg-red-100 text-red-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.PENDING;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const { formatDate } = useDateFormat();

  // Status action buttons configuration
  const getStatusActions = (currentStatus) => {
    const actions = {
      PENDING: [
        {
          status: "CONFIRMED",
          label: "Confirm Pick",
          icon: Check,
          color: "bg-blue-600 hover:bg-blue-700",
        },
      ],
      CONFIRMED: [
        {
          status: "PICKED",
          label: "Mark as Picked",
          icon: CheckSquare,
          color: "bg-green-600 hover:bg-green-700",
        },
      ],
      PICKED: [
        {
          status: "SHIPPED",
          label: "Mark as Shipped",
          icon: Truck,
          color: "bg-purple-600 hover:bg-purple-700",
        },
      ],
      SHIPPED: [
        {
          status: "DELIVERED",
          label: "Mark as Delivered",
          icon: CheckCircle,
          color: "bg-indigo-600 hover:bg-indigo-700",
        },
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
                  Pick Confirmation Management
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
                <input
                  type="text"
                  placeholder="Search by SO Number or Pick Task..."
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
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PICKED">Picked</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
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
                    Pick Task #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pick List #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
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
                    <td colSpan="10" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : salesOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No pick tasks found
                    </td>
                  </tr>
                ) : (
                  salesOrders.map((so) => {
                    const hasItems = so.items && Array.isArray(so.items) && so.items.length > 0;
                    const primaryItem = hasItems ? so.items[0] : null;
                    const itemsCount = so.totalItems !== undefined ? so.totalItems : (hasItems ? so.items.length : 1);
                    const totalQty = so.totalQuantity !== undefined ? so.totalQuantity : (hasItems ? so.items.reduce((acc, i) => acc + (i.requiredQuantity || 0), 0) : (so.requiredQuantity || 0));
                    const assignedUser = so.assignedTo || so.pickerName;

                    return (
                      <tr
                        key={so.id || so.pickTaskNumber}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => handleViewClick(so)}
                        >
                          <span className="font-medium text-blue-600 hover:text-blue-800">
                            {so.pickTaskNumber || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{so.pickListNumber || "N/A"}</td>
                        <td className="px-4 py-3 text-sm">{so.soNumber || "N/A"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                          {so.warehouseId || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {hasItems ? (
                            so.items.length === 1 ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {primaryItem.itemCode}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {primaryItem.itemName}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                  <Box className="w-3 h-3" />
                                  {itemsCount} Items
                                </span>
                                <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]" title={so.items.map(i => i.itemName || i.itemCode).join(", ")}>
                                  {so.items.map(i => i.itemName || i.itemCode).join(", ")}
                                </div>
                              </div>
                            )
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {so.itemCode || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {so.itemName || ""}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-gray-100 px-2.5 py-1 rounded text-xs font-semibold text-gray-800">
                            {totalQty} {primaryItem?.uom || so.uom || ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            <UserFullName username={assignedUser || "Unassigned"} />
                          </div>
                          {assignedUser && (
                            <div className="text-xs text-gray-500">
                              @{assignedUser}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {so.priority && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(so.priority)}`}
                            >
                              {so.priority}
                            </span>
                          )}
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
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenConfirmModal(so)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                              title="Confirm Pick"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      Pick Task Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingSO.pickTaskNumber}
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
                  {getStatusActions(viewingSO.status).length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {getStatusActions(viewingSO.status).map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(
                                viewingSO.pickTaskNumber,
                                action.status,
                                action.label,
                              )
                            }
                            disabled={updatingStatus}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                          >
                            <action.icon className="w-4 h-4" />
                            {updatingStatus ? "Processing..." : action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Pick Task Number
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.pickTaskNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Pick List Number
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.pickListNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        SO Number
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.soNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Warehouse ID
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.warehouseId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Assigned To (Picker)
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        <UserFullName username={viewingSO.assignedTo || viewingSO.pickerName || "N/A"} />
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Priority
                      </label>
                      <p className="mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(viewingSO.priority)}`}
                        >
                          {viewingSO.priority || "NORMAL"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Status
                      </label>
                      <p className="mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingSO.status)}`}
                        >
                          {viewingSO.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Total Items / Qty
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.totalItems || viewingSO.items?.length || 0} items ({viewingSO.totalQuantity !== undefined ? viewingSO.totalQuantity : viewingSO.requiredQuantity || 0} total qty)
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Created By
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        {viewingSO.createdBy || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Created At
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        {viewingSO.createdAt ? formatDate(viewingSO.createdAt) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Updated By
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        {viewingSO.updatedBy || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Completed Date
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        {viewingSO.completedDate ? formatDate(viewingSO.completedDate) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Remarks if any */}
                  {viewingSO.remarks && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Task Remarks
                      </label>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {viewingSO.remarks}
                      </p>
                    </div>
                  )}

                  {/* Items List Table */}
                  {viewingSO.items && Array.isArray(viewingSO.items) && viewingSO.items.length > 0 ? (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-600" />
                        Task Items ({viewingSO.items.length})
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-medium">
                            <tr>
                              <th className="px-3 py-2.5">#</th>
                              <th className="px-3 py-2.5">Item Code & Name</th>
                              <th className="px-3 py-2.5">UOM</th>
                              <th className="px-3 py-2.5 text-right">Required</th>
                              <th className="px-3 py-2.5 text-right">To Pick</th>
                              <th className="px-3 py-2.5 text-right">Picked</th>
                              <th className="px-3 py-2.5 text-right">Short</th>
                              <th className="px-3 py-2.5">Location / Barcode</th>
                              <th className="px-3 py-2.5">Status</th>
                              <th className="px-3 py-2.5">Scan Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {viewingSO.items.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                <td className="px-3 py-2.5">
                                  <div className="font-semibold text-gray-900">{item.itemCode}</div>
                                  <div className="text-xs text-gray-500">{item.itemName}</div>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-700 font-medium">{item.uom || "-"}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-gray-900">{item.requiredQuantity}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-blue-600">{item.quantityToPick}</td>
                                <td className="px-3 py-2.5 text-right font-semibold text-green-700">{item.pickedQuantity}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-red-600">{item.shortQuantity || 0}</td>
                                <td className="px-3 py-2.5 text-xs">
                                  <div className="font-mono text-gray-800 break-all">{item.sourceLocation || item.itemBarcode || item.locationBarcode || "N/A"}</div>
                                  {item.binId && <div className="text-gray-500">Bin: {item.binId}</div>}
                                  {item.batchNumber && <div className="text-gray-500">Batch: {item.batchNumber}</div>}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-xs">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isScanned ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {item.isScanned ? "Scanned" : "Not Scanned"}
                                  </span>
                                  {item.scanTime && (
                                    <div className="text-gray-400 text-[11px] mt-0.5">{formatDate(item.scanTime)}</div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Fallback Single Item Location Details */
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location Barcode
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.locationBarcode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          Item Barcode
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.itemBarcode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Bin ID
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.binId || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          Batch Number
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.batchNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {showPickTaskModal && selectedPickList && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handlePickTaskClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      Confirm Pick
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedPickList?.pickTaskNumber || "Confirm Pick"}
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
                  <form onSubmit={handleConfirmPickSubmit}>
                    {/* Pick Task Summary Header */}
                    <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">
                            Pick Task Number
                          </label>
                          <p className="font-semibold text-gray-900">
                            {selectedPickList?.pickTaskNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">
                            Pick List Number
                          </label>
                          <p className="font-semibold text-gray-900">
                            {selectedPickList?.pickListNumber || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">
                            SO Number
                          </label>
                          <p className="font-semibold text-gray-900">
                            {selectedPickList?.soNumber || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">
                            Warehouse
                          </label>
                          <p className="font-semibold text-gray-900">
                            {selectedPickList?.warehouseId || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Top-Level Form Fields */}
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pick Task Number *
                          </label>
                          <input
                            type="text"
                            name="pickTaskNumber"
                            value={confirmationData.pickTaskNumber}
                            onChange={handleConfirmationInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm text-gray-700"
                            required
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmed By *
                          </label>
                          <UserSelect
                            name="confirmedBy"
                            value={confirmationData.confirmedBy}
                            onChange={(user, e) => {
                              setConfirmationData((prev) => ({
                                ...prev,
                                confirmedBy: e.target.value,
                              }));
                            }}
                            valueKey="username"
                            placeholder="Select confirmer user..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Confirmation Remarks
                        </label>
                        <input
                          type="text"
                          name="remarks"
                          value={confirmationData.remarks}
                          onChange={handleConfirmationInputChange}
                          placeholder="e.g. All items picked successfully"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Items List Section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4 text-green-600" />
                        Items to Confirm ({confirmationData.items?.length || 0})
                      </h3>

                      <div className="space-y-4">
                        {confirmationData.items && confirmationData.items.map((item, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-200 pb-2">
                              <div>
                                <span className="font-semibold text-gray-900 text-sm">
                                  {item.itemCode}
                                </span>
                                {item.itemName && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({item.itemName})
                                  </span>
                                )}
                              </div>
                              {item.requiredQuantity !== undefined && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                                  Required: {item.requiredQuantity} {item.uom || ""}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Picked Quantity *
                                </label>
                                <input
                                  type="number"
                                  value={item.pickedQuantity}
                                  onChange={(e) =>
                                    handleItemConfirmationChange(
                                      index,
                                      "pickedQuantity",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Picked Qty"
                                  min="0"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Location / Barcode
                                </label>
                                <input
                                  type="text"
                                  value={item.barcode}
                                  onChange={(e) =>
                                    handleItemConfirmationChange(
                                      index,
                                      "barcode",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Scan or enter barcode"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Item Remarks
                                </label>
                                <input
                                  type="text"
                                  value={item.remarks}
                                  onChange={(e) =>
                                    handleItemConfirmationChange(
                                      index,
                                      "remarks",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. Full pick"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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
                        className="px-6 py-2 rounded-lg flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? "Confirming..." : "Confirm Pick"}
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
