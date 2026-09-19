// app/sales-order/page.jsx
"use client";

import apiRequest from "@/components/apiRequest";
import UserSelect from "@/components/UserSelect";
import { useDateFormat } from "@/context/DateFormatContext";
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
  FileText,
  Boxes,
  Weight,
  Ruler,
  PackagePlus,
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

    const url = `/outbound/pick-confirmations${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET pick confirmations response:", response);

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
    console.error("Error fetching pick confirmations:", error);
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

// Create package
const createPackageAPI = async (data) => {
  return apiRequest("/outbound/package", "POST", data);
};

export default function PickListPageConfiAll() {
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
  const [statusFilter, setStatusFilter] = useState("CONFIRMED");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPickTaskModal, setShowPickTaskModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingSO, setEditingSO] = useState(null);
  const [viewingSO, setViewingSO] = useState(null);
  const [selectedPickList, setSelectedPickList] = useState(null);
  const [selectedPackageItem, setSelectedPackageItem] = useState(null);
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
  });

  // Package Form State
  const [packageData, setPackageData] = useState({
    soNumber: "",
    pickListNumber: "",
    itemCode: "",
    packedQuantity: 0,
    packageType: "BOX",
    weight: "",
    length: "",
    width: "",
    height: "",
    packedBy: "",
    confirmationNumber: "",
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
      console.error("Error loading pick confirmations:", error);
      setErrorMessage("Failed to load pick confirmations.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (so) => {
    try {
      setViewingSO(so);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading details:", error);
      setViewingSO(so);
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
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

  const handlePackageClose = () => {
    setShowPackageModal(false);
    setSelectedPackageItem(null);
    resetPackageForm();
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
      itemCode: "",
      pickedQuantity: 0,
      shortQuantity: 0,
      barcode: "",
      confirmedBy: "",
    });
  };

  // Reset Package Form
  const resetPackageForm = () => {
    setPackageData({
      soNumber: "",
      pickListNumber: "",
      itemCode: "",
      packedQuantity: 0,
      packageType: "BOX",
      weight: "",
      length: "",
      width: "",
      height: "",
      packedBy: "",
    });
  };

  
  // Handle Package Form Input
  const handlePackageInputChange = (e) => {
    const { name, value } = e.target;
    setPackageData((prev) => ({ ...prev, [name]: value }));
  };

  
  // Handle Create Package Submit
  const handleCreatePackageSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!packageData.soNumber) {
      setErrorMessage("SO Number is required");
      return;
    }
    if (!packageData.pickListNumber) {
      setErrorMessage("Pick List Number is required");
      return;
    }
     
    if (!packageData.packedQuantity || packageData.packedQuantity <= 0) {
      setErrorMessage("Packed Quantity must be greater than 0");
      return;
    }
    if (!packageData.packageType) {
      setErrorMessage("Package Type is required");
      return;
    }
    if (!packageData.packedBy) {
      setErrorMessage("Packed By is required");
      return;
    }

    // Validate weight and dimensions if provided
    if (packageData.weight && isNaN(parseFloat(packageData.weight))) {
      setErrorMessage("Weight must be a valid number");
      return;
    }
    if (packageData.length && isNaN(parseFloat(packageData.length))) {
      setErrorMessage("Length must be a valid number");
      return;
    }
    if (packageData.width && isNaN(parseFloat(packageData.width))) {
      setErrorMessage("Width must be a valid number");
      return;
    }
    if (packageData.height && isNaN(parseFloat(packageData.height))) {
      setErrorMessage("Height must be a valid number");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        confirmationNumber: packageData.confirmationNumber,
        soNumber: packageData.soNumber,
        pickListNumber: packageData.pickListNumber,
        itemCode: packageData.itemCode,
        packedQuantity: parseInt(packageData.packedQuantity),
        packageType: packageData.packageType,
        packedBy: packageData.packedBy,
      };

      // Add optional fields if provided
      if (packageData.weight) payload.weight = parseFloat(packageData.weight);
      if (packageData.length) payload.length = parseFloat(packageData.length);
      if (packageData.width) payload.width = parseFloat(packageData.width);
      if (packageData.height) payload.height = parseFloat(packageData.height);

      const response = await createPackageAPI(payload);
      console.log("Package created:", response);

      setSuccessMessage(
        `Package created successfully for ${packageData.soNumber}`,
      );
      setShowSuccess(true);
      loadSalesOrders();
      handlePackageClose();
    } catch (error) {
      console.error("Create Package error:", error);
      setErrorMessage(
        error.message || "Failed to create package. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Open package modal with pre-filled data from selected confirmation
  const handleOpenPackageModal = (so) => {
    setSelectedPackageItem(so);
    setPackageData({
      confirmationNumber: so.confirmationNumber || "",
      soNumber: so.soNumber || "",
      pickListNumber: so.pickListNumber || "",
      itemCode: so.itemCode || "",
      packedQuantity: so.totalPickedQuantity || 0,
      packageType: "BOX",
      weight: "",
      length: "",
      width: "",
      height: "",
      packedBy: "",
    });
    setShowPackageModal(true);
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
                  placeholder="Search by Confirmation #, SO Number or Pick Task..."
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
                <option value="CONFIRMED">Confirmed</option>
                <option value="PICKED">Picked</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {salesOrders.length} of {totalElements} confirmations
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
                    Confirmation #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pick Task #
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
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmed By
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
                      No pick confirmations found
                    </td>
                  </tr>
                ) : (
                  salesOrders.map((so) => {
                    const hasItems = so.items && Array.isArray(so.items) && so.items.length > 0;
                    const primaryItem = hasItems ? so.items[0] : null;
                    const itemsCount = so.totalItems !== undefined ? so.totalItems : (hasItems ? so.items.length : 1);
                    const totalPicked = so.totalPickedQuantity !== undefined ? so.totalPickedQuantity : (hasItems ? so.items.reduce((acc, i) => acc + (i.pickedQuantity || 0), 0) : (so.pickedQuantity || 0));
                    const totalShort = so.totalShortQuantity !== undefined ? so.totalShortQuantity : (hasItems ? so.items.reduce((acc, i) => acc + (i.shortQuantity || 0), 0) : (so.shortQuantity || 0));

                    return (
                      <tr
                        key={so.id || so.confirmationNumber}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => handleViewClick(so)}
                        >
                          <span className="font-medium text-blue-600 hover:text-blue-800">
                            {so.confirmationNumber || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{so.pickTaskNumber || "N/A"}</td>
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
                          <div>
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                              Picked: {totalPicked}
                            </span>
                            {totalShort > 0 && (
                              <span className="ml-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                                Short: {totalShort}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            <UserFullName username={so.confirmedBy || "N/A"} />
                          </div>
                          {so.confirmedDate && (
                            <div className="text-xs text-gray-500">
                              {formatDate(so.confirmedDate)}
                            </div>
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
                            {so?.status === "CONFIRMED" && (
                              <button
                                type="button"
                                onClick={() => handleOpenPackageModal(so)}
                                className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                                title="Create Package"
                              >
                                <PackagePlus className="w-4 h-4" />
                              </button>
                            )}
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
                confirmations
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
                      <FileText className="w-5 h-5 text-blue-600" />
                      Pick Confirmation Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingSO.confirmationNumber}
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
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Confirmation Number
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.confirmationNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
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
                        Confirmed By
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        <UserFullName
                          username={viewingSO.confirmedBy || "N/A"}
                        />
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Confirmed Date
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        {viewingSO.confirmedDate ? formatDate(viewingSO.confirmedDate) : "N/A"}
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
                        Total Items / Picked Qty
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.totalItems || viewingSO.items?.length || 0} items ({viewingSO.totalPickedQuantity !== undefined ? viewingSO.totalPickedQuantity : viewingSO.pickedQuantity || 0} total picked)
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Total Short Quantity
                      </label>
                      <p className="font-semibold text-gray-900 text-sm">
                        {viewingSO.totalShortQuantity !== undefined ? viewingSO.totalShortQuantity : viewingSO.shortQuantity || 0}
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
                        Updated At
                      </label>
                      <p className="font-medium text-gray-900 text-sm">
                        {viewingSO.updatedAt ? formatDate(viewingSO.updatedAt) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Remarks if any */}
                  {viewingSO.remarks && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Confirmation Remarks
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
                        Confirmed Items ({viewingSO.items.length})
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-medium">
                            <tr>
                              <th className="px-3 py-2.5">#</th>
                              <th className="px-3 py-2.5">Item Code & Name</th>
                              <th className="px-3 py-2.5">UOM</th>
                              <th className="px-3 py-2.5 text-right">Required</th>
                              <th className="px-3 py-2.5 text-right">Picked</th>
                              <th className="px-3 py-2.5 text-right">Short</th>
                              <th className="px-3 py-2.5">Barcode / Location</th>
                              <th className="px-3 py-2.5">Status</th>
                              <th className="px-3 py-2.5">Remarks</th>
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
                                <td className="px-3 py-2.5 text-right font-semibold text-green-700">{item.pickedQuantity}</td>
                                <td className="px-3 py-2.5 text-right font-medium text-red-600">{item.shortQuantity || 0}</td>
                                <td className="px-3 py-2.5 text-xs font-mono text-gray-800 break-all">
                                  {item.barcode || "N/A"}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-600">{item.remarks || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Fallback Single Item Detail */
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium">
                          Item Code
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.itemCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium">
                          Item Name
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.itemName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-medium">
                          Barcode
                        </label>
                        <p className="font-medium text-gray-900 text-sm">
                          {viewingSO.barcode || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Package Action Button in View Modal */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        handleViewClose();
                        handleOpenPackageModal(viewingSO);
                      }}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Create Package
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

       
        {/* Package Creation Modal */}
        {showPackageModal && selectedPackageItem && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handlePackageClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      Create Package
                    </h2>
                    <p className="text-sm text-gray-500">
                      SO: {selectedPackageItem.soNumber} |{" "}
                      {selectedPackageItem.itemCode} | Confirmation:{" "}
                      {packageData.confirmationNumber}
                    </p>
                  </div>
                  <button
                    onClick={handlePackageClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handleCreatePackageSubmit}>
                    {/* Reference Info */}
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">
                            SO Number
                          </label>
                          <p className="font-medium text-gray-900">
                            {selectedPackageItem.soNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-medium">
                            Pick List Number
                          </label>
                          <p className="font-medium text-gray-900">
                            {selectedPackageItem.pickListNumber}
                          </p>
                        </div>
                       
                      
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      {/* Hidden/readonly fields */}
                      <input
                        type="hidden"
                        name="soNumber"
                        value={packageData.soNumber}
                      />
                      <input
                        type="hidden"
                        name="pickListNumber"
                        value={packageData.pickListNumber}
                      />
                      

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Packed Quantity *
                          </label>
                          <input
                            type="number"
                            name="packedQuantity"
                            value={packageData.packedQuantity}
                            onChange={handlePackageInputChange}
                            placeholder="Enter packed quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="1"
                            max={selectedPackageItem.pickedQuantity}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Max: {selectedPackageItem.pickedQuantity}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Package Type *
                          </label>
                          <select
                            name="packageType"
                            value={packageData.packageType}
                            onChange={handlePackageInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          >
                            <option value="BOX">Box</option>
                            <option value="CARTON">Carton</option>
                            <option value="PALLET">Pallet</option>
                            <option value="BAG">Bag</option>
                            <option value="ENVELOPE">Envelope</option>
                            <option value="TUBE">Tube</option>
                            <option value="CRATE">Crate</option>
                            <option value="DRUM">Drum</option>
                            <option value="BUNDLE">Bundle</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex items-center gap-1">
                              <Weight className="w-4 h-4" />
                              Weight (kg)
                            </div>
                          </label>
                          <input
                            type="number"
                            name="weight"
                            value={packageData.weight}
                            onChange={handlePackageInputChange}
                            placeholder="Enter weight"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex items-center gap-1">
                              <Ruler className="w-4 h-4" />
                              Packed By *
                            </div>
                          </label>
                          <UserSelect
                            name="packedBy"
                            value={packageData.packedBy}
                            onChange={(user, e) => {
                              setPackageData((prev) => ({
                                ...prev,
                                packedBy: e.target.value,
                              }));
                            }}
                            valueKey="username"
                            placeholder="Select packer user..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" />
                            Dimensions (cm)
                          </div>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">
                              Length
                            </label>
                            <input
                              type="number"
                              name="length"
                              value={packageData.length}
                              onChange={handlePackageInputChange}
                              placeholder="L"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">
                              Width
                            </label>
                            <input
                              type="number"
                              name="width"
                              value={packageData.width}
                              onChange={handlePackageInputChange}
                              placeholder="W"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">
                              Height
                            </label>
                            <input
                              type="number"
                              name="height"
                              value={packageData.height}
                              onChange={handlePackageInputChange}
                              placeholder="H"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={handlePackageClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Package className="w-4 h-4" />
                        {loading ? "Creating..." : "Create Package"}
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
