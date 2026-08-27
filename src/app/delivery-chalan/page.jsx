"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle,
  Package,
  Truck,
  Printer,
  Trash2,
  FileText,
} from "lucide-react";
import api from "@/lib/api";
import DeliveryChallanForm from "./components/DeliveryChallanForm";
import DeliveryChallanView from "./components/DeliveryChallanView";

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
      throw new Error(result?.message || `API request failed: ${response.status}`);
    }
    return result?.data || result;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "API request failed"
    );
  }
};

// Get delivery challans
const getDeliveryChallansAPI = async (page = 0, size = 10, searchTerm = "") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (searchTerm) params.append("search", searchTerm);

    const url = `/outbound/delivery-challan${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET delivery challans response:", response);

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
    console.error("Error fetching delivery challans:", error);
    throw error;
  }
};

// Get delivery challan by ID
const getDeliveryChallanByIdAPI = async (id) => {
  return apiRequest(`/outbound/delivery-challan/${id}`);
};

// Create delivery challan
const createDeliveryChallanAPI = async (data) => {
  return apiRequest("/outbound/delivery-challan", "POST", data);
};

// Update delivery challan
const updateDeliveryChallanAPI = async (id, data) => {
  return apiRequest(`/outbound/delivery-challan/${id}`, "PUT", data);
};

// Delete delivery challan
const deleteDeliveryChallanAPI = async (id) => {
  return apiRequest(`/outbound/delivery-challan/${id}`, "DELETE");
};

export default function DeliveryChallan() {
  // List State
  const [challans, setChallans] = useState([]);
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
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);
  const [viewingChallan, setViewingChallan] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    shipmentNumber: "",
    transporter: "",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    remarks: "",
    packages: [],
  });

  // Debounce search term for main list
  useEffect(() => {
    const timer = setTimeout(() => {
      loadChallans();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadChallans();
  }, [currentPage, pageSize]);

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

  const loadChallans = async () => {
    try {
      setLoading(true);
      const response = await getDeliveryChallansAPI(currentPage, pageSize, searchTerm);

      if (response && response.data) {
        setChallans(response.data || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.total || 0);
      } else {
        setChallans([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading delivery challans:", error);
      setErrorMessage("Failed to load delivery challans.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = async (challan) => {
    try {
      setLoading(true);
      const data = await getDeliveryChallanByIdAPI(challan.challanNumber);
      setViewingChallan(data || challan);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error loading details:", error);
      setViewingChallan(challan);
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingChallan(null);
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setEditingChallan(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = async (challan) => {
    try {
      setLoading(true);
      const data = await getDeliveryChallanByIdAPI(challan.challanNumber);
      const challanData = data || challan;
      
      setEditingChallan(challanData);
      setIsEditMode(true);
      
      // Populate form with existing data
      setFormData({
        shipmentNumber: challanData.shipmentNumber || `SHP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        transporter: challanData.transporter || "",
        vehicleNumber: challanData.vehicleNumber || "",
        driverName: challanData.driverName || "",
        driverPhone: challanData.driverPhone || "",
        remarks: challanData.remarks || "",
        packages: challanData.packages || [],
      });
      
      setShowModal(true);
    } catch (error) {
      console.error("Error loading challan for edit:", error);
      setErrorMessage("Failed to load challan details for editing.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery challan?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteDeliveryChallanAPI(id);
      setSuccessMessage("Delivery challan deleted successfully");
      setShowSuccess(true);
      loadChallans();
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("Failed to delete delivery challan.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      shipmentNumber: `SHP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      transporter: "",
      vehicleNumber: "",
      driverName: "",
      driverPhone: "",
      remarks: "",
      packages: [],
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingChallan(null);
    setIsEditMode(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.packages.length === 0) {
      setErrorMessage("Please add at least one package to the delivery challan.");
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        createdBy: "system_user",
      };

      if (isEditMode && editingChallan) {
        await updateDeliveryChallanAPI(editingChallan.challanNumber, submitData);
        setSuccessMessage("Delivery challan updated successfully!");
      } else {
        await createDeliveryChallanAPI(submitData);
        setSuccessMessage("Delivery challan created successfully!");
      }

      setShowSuccess(true);
      handleModalClose();
      loadChallans();
    } catch (error) {
      console.error("Submit error:", error);
      setErrorMessage(error.message || "Failed to save delivery challan.");
    } finally {
      setSubmitting(false);
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

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Delivery Challans</h1>
                <p className="text-blue-100 text-sm mt-1">
                  WMS Warehouse Management System - Delivery Challan Management
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="bg-white cursor-pointer text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Challan
                </button>
                <button
                  type="button"
                  onClick={loadChallans}
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
                  placeholder="Search by Shipment #, SO Number, Customer, Item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {challans.length} of {totalElements} challans
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
                    Challan #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Packages
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : challans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No delivery challans found
                    </td>
                  </tr>
                ) : (
                  challans.map((challan) => (
                    <tr key={challan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">
                          {challan.challanNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {challan.shipmentNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{challan.transporter || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">{challan.vehicleNumber || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <Package className="w-3 h-3" />
                          {challan.packages?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          challan.status === 'CREATED' ? 'bg-green-100 text-green-700' :
                          challan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          challan.status === 'SHIPPED' ? 'bg-purple-100 text-purple-700' :
                          challan.status === 'DELIVERED' ? 'bg-indigo-100 text-indigo-700' :
                          challan.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {challan.status || "DRAFT"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(challan.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleViewClick(challan)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditClick(challan)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                         
                          <button
                            type="button"
                            onClick={() => handleDelete(challan.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
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
                Page {currentPage + 1} of {totalPages} | Total: {totalElements} challans
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

        {/* Add/Edit Modal */}
        {showModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={handleModalClose} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {isEditMode ? "Edit Delivery Challan" : "Create New Delivery Challan"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {isEditMode ? "Update existing delivery challan" : "Add a new delivery challan to the system"}
                    </p>
                  </div>
                  <button
                    onClick={handleModalClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <DeliveryChallanForm
                  isEditMode={isEditMode}
                  editingChallan={editingChallan}
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={handleModalClose}
                  submitting={submitting}
                />
              </div>
            </div>
          </>
        )}

        {/* View Modal */}
        {showViewModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={handleViewClose} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <DeliveryChallanView
                viewingChallan={viewingChallan}
                onClose={handleViewClose}
                onEdit={handleEditClick}
                generating={generating}
                formatDate={formatDate}
              />
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