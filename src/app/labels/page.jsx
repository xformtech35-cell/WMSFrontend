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
  ClipboardList,
  Tag,
  Layers,
  Check,
  Save,
  FileText,
  Boxes,
  Weight,
  Ruler,
  QrCode,
  PackageOpen,
  Scale,
  Printer,
  Download,
  ExternalLink,
  MapPin as MapPinIcon,
  Phone,
  Mail,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { downloadImage } from "@/components/downloadImage64";
import ShippingLabelModal from "./components/ShippingLabelModal";
import ViewPackageModal from "./components/ViewPackageModal";

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

const getPackagesAPI = async (
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

    const url = `/outbound/shipping-labels${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET packages response:", response);

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
    console.error("Error fetching packages:", error);
    throw error;
  }
};

const getPackageByIdAPI = async (id) => {
  return apiRequest(`/outbound/shipping-labels/${id}`);
};

const deletePackageAPI = async (id) => {
  return apiRequest(`/outbound/shipping-labels/${id}`, "DELETE");
};

// Update package status
const updatePackageStatusAPI = async (packageNumber, status) => {
  return apiRequest(
    `/outbound/shipping-labels/${packageNumber}/status?status=${status}`,
    "PATCH",
  );
};

const decodeBase64Text = (base64String) => {
  if (!base64String) return "";

  try {
    return atob(base64String);
  } catch (error) {
    console.error("Failed to decode label:", error);
    return "";
  }
};

// Create package
const createPackageAPI = async (data) => {
  return apiRequest("/outbound/shipping-labels", "POST", data);
};

// Generate shipping label - returns label data directly
const generateShippingLabelAPI = async (packageNumber) => {
  return apiRequest(`/outbound/shipping-label/${packageNumber}`, "POST");
};

export default function Packages() {
  const router = useRouter();

  // List State
  const [packages, setPackages] = useState([]);
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showShippingLabelModal, setShowShippingLabelModal] = useState(false);
  const [viewingPackage, setViewingPackage] = useState(null);
  const [shippingLabel, setShippingLabel] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState(false);

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
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPackages();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadPackages();
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

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await getPackagesAPI(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter,
      );

      if (response && response.data) {
        setPackages(response.data || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.total || 0);
      } else {
        setPackages([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
      setErrorMessage("Failed to load packages.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (pkg) => {
    try {
      setViewingPackage(pkg);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading details:", error);
      setViewingPackage(pkg);
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingPackage(null);
  };

  const handlePackageClose = () => {
    setShowPackageModal(false);
    resetPackageForm();
  };

  const handleShippingLabelClose = () => {
    setShowShippingLabelModal(false);
    setShippingLabel(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) {
      return;
    }

    try {
      setLoading(true);
      await deletePackageAPI(id);
      setSuccessMessage("Package deleted successfully");
      setShowSuccess(true);
      loadPackages();
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("Failed to delete package.");
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (packageNumber, status, actionLabel) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this package as ${actionLabel}?`,
      )
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await updatePackageStatusAPI(packageNumber, status);
      setSuccessMessage(
        `Package ${packageNumber} marked as ${actionLabel} successfully`,
      );
      setShowSuccess(true);
      loadPackages();

      if (showViewModal) {
        handleViewClose();
      }
    } catch (error) {
      console.error("Status update error:", error);
      setErrorMessage(
        error.message || `Failed to update package status to ${actionLabel}.`,
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle generate shipping label - POST and show modal with response
  const handleGenerateShippingLabel = async (packageNumber) => {
    try {
      console.log("sdasdas", )
      setGeneratingLabel(true);
      // const response = await generateShippingLabelAPI(packageNumber);
      // console.log("Shipping label generated:", response);

      // Set the shipping label data from the response
      setShippingLabel(packageNumber);
      setShowShippingLabelModal(true);
 
      loadPackages();
    } catch (error) {
      console.error("Generate shipping label error:", error);
      setErrorMessage(error.message || "Failed to generate shipping label.");
    } finally {
      setGeneratingLabel(false);
    }
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

  

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PACKED: "bg-blue-100 text-blue-700",
      CONFIRMED: "bg-green-100 text-green-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-indigo-100 text-indigo-700",
      CANCELLED: "bg-red-100 text-red-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const getLabelStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      GENERATED: "bg-blue-100 text-blue-700",
      PRINTED: "bg-green-100 text-green-700",
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

  // Status action buttons configuration for packages
  const getStatusActions = (currentStatus) => {
    const actions = {
      PENDING: [
        {
          status: "PACKED",
          label: "Mark as Packed",
          icon: Package,
          color: "bg-blue-600 hover:bg-blue-700",
        },
      ],
      PACKED: [
        {
          status: "CONFIRMED",
          label: "Confirm Package",
          icon: CheckCircle,
          color: "bg-green-600 hover:bg-green-700",
        },
      ],
      CONFIRMED: [
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

  // Decode base64 image
  const decodeBase64Image = (imageData) => {
    if (!imageData) return null;

    try {
      // Already a data URL
      if (
        typeof imageData === "string" &&
        imageData.startsWith("data:image/")
      ) {
        return imageData;
      }

      // Normal base64 string
      if (typeof imageData === "string") {
        // Detect common image formats from base64 magic bytes
        if (imageData.startsWith("/9j/")) {
          return `data:image/jpeg;base64,${imageData}`;
        }

        if (imageData.startsWith("iVBORw0KGgo")) {
          return `data:image/png;base64,${imageData}`;
        }

        if (imageData.startsWith("R0lGOD")) {
          return `data:image/gif;base64,${imageData}`;
        }

        if (imageData.startsWith("UklGR")) {
          return `data:image/webp;base64,${imageData}`;
        }

        // Default
        return `data:image/png;base64,${imageData}`;
      }

      return null;
    } catch (error) {
      console.error("Error decoding image:", error);
      return null;
    }
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
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Shipping Labels
                </h1>
                <p className="text-purple-100 text-sm mt-1">
                  WMS Warehouse Management System
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadPackages}
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
                  placeholder="Search by Package #, SO Number, Item Code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {packages.length} of {totalElements} packages
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
                    Package #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No packages found
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr
                      key={pkg.id || pkg.packageNumber}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleViewClick(pkg)}
                      >
                        <span className="font-medium text-purple-600 hover:text-purple-800">
                          {pkg.packageNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-mono text-gray-600">
                            {pkg.packageBarcode || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{pkg.soNumber}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {pkg.itemCode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pkg.itemName}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleViewClick(pkg)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleGenerateShippingLabel(pkg)
                            }
                            disabled={generatingLabel}
                            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                            title="Generate Shipping Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pkg.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <XCircle className="w-4 h-4" />
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
                Page {currentPage + 1} of {totalPages} | Total: {totalElements}{" "}
                packages
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
        {showViewModal && viewingPackage && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleViewClose}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      Package Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {viewingPackage.packageNumber}
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
                  {/* Status Actions */}
                  {getStatusActions(viewingPackage.status).length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600 font-medium mr-2">
                        Actions:
                      </span>
                      {getStatusActions(viewingPackage.status).map((action) => (
                        <button
                          key={action.status}
                          onClick={() =>
                            handleStatusUpdate(
                              viewingPackage.packageNumber,
                              action.status,
                              action.label,
                            )
                          }
                          disabled={updatingStatus}
                          className={`px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5 ${action.color} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                        >
                          <action.icon className="w-3.5 h-3.5" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Package Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.packageNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        Package Barcode
                      </label>
                      <p className="font-medium text-gray-900 text-sm font-mono">
                        {viewingPackage.packageBarcode}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Status
                      </label>
                      <p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingPackage.status)}`}
                        >
                          {viewingPackage.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        SO Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.soNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Pick List Number
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.pickListNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Package Type
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.packageType}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Item Code
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.itemCode}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Item Name
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.itemName}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Packed Quantity
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.packedQuantity}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        Weight (kg)
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.weight
                          ? viewingPackage.weight.toFixed(2)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        Dimensions (cm)
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.length ||
                        viewingPackage.width ||
                        viewingPackage.height
                          ? `${viewingPackage.length || 0} × ${viewingPackage.width || 0} × ${viewingPackage.height || 0}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Volume
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.volume || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Packed By
                      </label>
                      <p className="font-medium text-gray-900">
                        {viewingPackage.packedBy}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Packed Date
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatDate(viewingPackage.packedDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Created At
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatDate(viewingPackage.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Label Action */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        handleViewClose();
                        handleGenerateShippingLabel(viewingPackage);
                      }}
                      disabled={generatingLabel}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4" />
                      {generatingLabel
                        ? "Generating..."
                        : "Generate Shipping Label"}
                    </button>
                  </div>

                  {/* Remarks if any */}
                  {viewingPackage.remarks && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs text-gray-500 uppercase font-medium">
                        Remarks
                      </label>
                      <p className="text-sm text-gray-700">
                        {viewingPackage.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Package Creation Modal */}
        {showViewModal && viewingPackage && (
          <ViewPackageModal
            viewingPackage={viewingPackage}
            getStatusColor={getStatusColor}
            getStatusActions={getStatusActions}
            handleStatusUpdate={handleStatusUpdate}
            handleGenerateShippingLabel={handleGenerateShippingLabel}
            handleViewClose={handleViewClose}
            updatingStatus={updatingStatus}
            generatingLabel={generatingLabel}
            formatDate={formatDate}
          />
        )}
        {/* Shipping Label Modal */}
        {showShippingLabelModal && shippingLabel && (
          <ShippingLabelModal
            shippingLabel={shippingLabel}
            handleShippingLabelClose={handleShippingLabelClose}
            getLabelStatusColor={getLabelStatusColor}
            formatDate={formatDate}
            decodeBase64Image={decodeBase64Image}
          />
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
