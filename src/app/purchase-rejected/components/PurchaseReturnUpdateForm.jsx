"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Package,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Info,
  ArrowLeftRight,
  User,
  Hash,
  List,
  XCircle,
  Send,
  MapPin,
  RefreshCw,
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

// Get purchase return by ID
const getPurchaseReturnByIdAPI = async (id) => {
  return apiRequest(`/purchase-returns/${id}`);
};

// Update purchase return API
const updatePurchaseReturnAPI = async (id, data) => {
  return apiRequest(`/purchase-returns/${id}`, "PUT", data);
};

// Update status API
const updatePurchaseReturnStatusAPI = async (id, status, remarks) => {
  const requestBody = {
    status: status,
    remarks: remarks || "",
  };
  return apiRequest(`/purchase-returns/${id}/status`, "POST", requestBody);
};

// Send vendor return request API
const sendVendorReturnRequestAPI = async (data) => {
  return apiRequest("/vendor-returns/requests", "POST", data);
};

// Update rejected area API
const updateRejectedAreaAPI = async (lineId, rejectedArea) => {
  return apiRequest(
    `/purchase-returns/lines/${lineId}/rejected-area?rejectedArea=${rejectedArea}`,
    "PATCH",
    null,
  );
};

export default function PurchaseReturnUpdateForm({
  returnId,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Header fields
    poNumber: "",
    grnNumber: "",
    invoiceNumber: "",
    supplierName: "",
    supplierCode: "",
    supplierId: null,
    requestDate: "",
    returnType: "",
    returnReason: "",
    priority: "MEDIUM",
    remarks: "",

    // Status fields
    status: "",
    rejectionReason: "",
    approvedBy: "",
    approvedDate: "",
    purchseReturnId: "",
    // Lines
    lines: [],
  });

  const [originalStatus, setOriginalStatus] = useState("");
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // State for rejected area update
  const [updatingRejectedArea, setUpdatingRejectedArea] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [rejectedAreaValue, setRejectedAreaValue] = useState("");
  const [showRejectedAreaModal, setShowRejectedAreaModal] = useState(false);

  // State for rocks dropdown
  const [rocks, setRocks] = useState([]);
  const [loadingRocks, setLoadingRocks] = useState(false);

  // Return types options
  const returnTypes = [
    { value: "QUALITY_ISSUE", label: "Quality Issue" },
    { value: "DAMAGE", label: "Damage" },
    { value: "WRONG_ITEM", label: "Wrong Item" },
    { value: "EXCESS_QUANTITY", label: "Excess Quantity" },
    { value: "OTHER", label: "Other" },
  ];

  // Priority options
  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];

  // Status options for update
  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "COMPLETED", label: "Completed" },
    { value: "PROCESSING", label: "Processing" },
  ];

  // Fetch rocks
  const fetchRocks = async () => {
    try {
      setLoadingRocks(true);
      const response = await api.get(`/rocks`);
      const data = response.data?.data?.content || response.data || [];
      setRocks(data);
    } catch (error) {
      console.error("Error fetching rocks:", error);
      setRocks([]);
    } finally {
      setLoadingRocks(false);
    }
  };

  // Load return data
  useEffect(() => {
    if (returnId) {
      loadReturnData();
    }
  }, [returnId]);

  // Fetch rocks when modal opens
  useEffect(() => {
    if (showRejectedAreaModal) {
      fetchRocks();
    }
  }, [showRejectedAreaModal]);

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

  const loadReturnData = async () => {
    try {
      setLoading(true);
      const data = await getPurchaseReturnByIdAPI(returnId);
      console.log("Loaded return data:", data);
      if (data) {
        setFormData({
          purchseReturnId: data.id || "",
          poNumber: data.poNumber || "",
          grnNumber: data.grnNumber || "",
          invoiceNumber: data.invoiceNumber || "",
          supplierName: data.supplierName || "",
          supplierCode: data.supplierCode || "",
          supplierId: data.supplierId || null,
          requestDate: data.returnDate
            ? formatDateForInput(data.returnDate)
            : "",
          returnType: data.returnType || "",
          returnReason: data.reason || "",
          priority: data.priority || "MEDIUM",
          remarks: data.remarks || "",
          status: data.status || "",
          rejectionReason: data.rejectionReason || "",
          approvedBy: data.approvedBy || "",
          approvedDate: data.approvedDate || "",
          lines: data.lines || [],
        });
        setOriginalStatus(data.status || "");
        setSelectedStatus(data.status || "");
      }
    } catch (error) {
      console.error("Error loading return data:", error);
      setErrorMessage("Failed to load purchase return data.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${Number(amount).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      PROCESSING: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.lines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      lines: updatedLines,
    }));
  };

  const handleAddLine = () => {
    const newLine = {
      itemCode: "",
      itemName: "",
      uom: "",
      returnQuantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      reason: "",
      batchNumber: "",
      expiryDate: "",
      remarks: "",
      rejectedArea: "",
    };
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
  };

  const handleRemoveLine = (index) => {
    if (formData.lines.length <= 1) {
      setErrorMessage("Cannot remove the last line item.");
      return;
    }
    const updatedLines = formData.lines.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      lines: updatedLines,
    }));
  };

  const calculateLineTotal = (index) => {
    const line = formData.lines[index];
    if (line.returnQuantity && line.unitPrice) {
      const total = Number(line.returnQuantity) * Number(line.unitPrice);
      handleLineChange(index, "totalAmount", total);
    }
  };

  const calculateTotalAmount = () => {
    return formData.lines.reduce(
      (sum, line) => sum + (Number(line.totalAmount) || 0),
      0,
    );
  };

  // Handle rejected area update
  const handleUpdateRejectedArea = (lineId, currentRejectedArea) => {
    setSelectedLineId(lineId);
    setRejectedAreaValue(currentRejectedArea || "");
    setShowRejectedAreaModal(true);
  };

  const handleSubmitRejectedArea = async () => {
    if (!selectedLineId) return;

    try {
      setUpdatingRejectedArea(true);
      await updateRejectedAreaAPI(selectedLineId, rejectedAreaValue);

      // Update the line in local state
      const updatedLines = formData.lines.map((line) =>
        line.id === selectedLineId
          ? { ...line, rejectedArea: rejectedAreaValue }
          : line,
      );
      setFormData((prev) => ({
        ...prev,
        lines: updatedLines,
      }));

      setSuccessMessage("Rejected area updated successfully!");
      setShowSuccess(true);
      setShowRejectedAreaModal(false);
      setSelectedLineId(null);
      setRejectedAreaValue("");
    } catch (error) {
      console.error("Error updating rejected area:", error);
      setErrorMessage(`Failed to update rejected area: ${error.message}`);
    } finally {
      setUpdatingRejectedArea(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.returnType) {
      setErrorMessage("Please select a return type.");
      return;
    }
    if (!formData.returnReason) {
      setErrorMessage("Please provide a return reason.");
      return;
    }
    if (formData.lines.length === 0) {
      setErrorMessage("Please add at least one line item.");
      return;
    }

    // Validate lines
    for (const line of formData.lines) {
      if (!line.itemCode) {
        setErrorMessage("Please enter item code for all line items.");
        return;
      }
      if (!line.itemName) {
        setErrorMessage("Please enter item name for all line items.");
        return;
      }
      if (!line.returnQuantity || line.returnQuantity <= 0) {
        setErrorMessage("Please enter valid quantity for all line items.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      // Prepare data for update
      const updateData = {
        purchseReturnId: formData.purchseReturnId,
        poNumber: formData.poNumber,
        grnNumber: formData.grnNumber,
        invoiceNumber: formData.invoiceNumber,
        supplierName: formData.supplierName,
        supplierCode: formData.supplierCode,
        supplierId: formData.supplierId,
        returnDate: formData.requestDate,
        returnType: formData.returnType,
        reason: formData.returnReason,
        priority: formData.priority,
        remarks: formData.remarks,
        lines: formData.lines.map((line) => ({
          itemCode: line.itemCode,
          itemName: line.itemName,
          uom: line.uom,
          returnQuantity: Number(line.returnQuantity),
          unitPrice: Number(line.unitPrice) || 0,
          totalAmount: Number(line.totalAmount) || 0,
          reason: line.reason || "",
          batchNumber: line.batchNumber || "",
          expiryDate: line.expiryDate || "",
          remarks: line.remarks || "",
          rejectedArea: line.rejectedArea || "",
        })),
      };

      await updatePurchaseReturnAPI(returnId, updateData);

      setSuccessMessage("Purchase return updated successfully!");
      setShowSuccess(true);

      // Reload data
      await loadReturnData();

      if (onSuccess) {
        onSuccess(updateData);
      }
    } catch (error) {
      console.error("Error updating return:", error);
      setErrorMessage(`Failed to update: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Send to Vendor Handler
  const handleSendToVendor = async () => {
    try {
      setSubmitting(true);

      const vendorRequestData = {
        purchseReturnId: formData.purchseReturnId,

        poNumber: formData.poNumber,
        grnNumber: formData.grnNumber || "",
        invoiceNumber: formData.invoiceNumber || "",
        supplierName: formData.supplierName,
        supplierCode: formData.supplierCode || "",
        supplierId: formData.supplierId,
        requestDate: formData.requestDate,
        returnType: formData.returnType,
        returnReason: formData.returnReason,
        priority: formData.priority || "MEDIUM",
        remarks: formData.remarks || "",
        lines: formData.lines.map((line) => ({
          itemCode: line.itemCode,
          itemName: line.itemName,
          uom: line.uom || "",
          requestedQuantity: Number(line.returnQuantity),
          unitPrice: Number(line.unitPrice) || 0,
          totalAmount: Number(line.totalAmount) || 0,
          originalQuantity:
            Number(line.originalQuantity) || Number(line.returnQuantity),
          receivedQuantity: Number(line.receivedQuantity) || 0,
          batchNumber: line.batchNumber || "",
          expiryDate: line.expiryDate || "",
          reason: line.reason || "",
          remarks: line.remarks || "",
          inboundLineId: line.inboundLineId || 0,
          rejectedArea: line.rejectedArea || "",
        })),
      };

      const response = await sendVendorReturnRequestAPI(vendorRequestData);

      setSuccessMessage(
        `Vendor return request sent successfully! Reference: ${response?.requestNumber || "N/A"}`,
      );
      setShowSuccess(true);

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error("Error sending to vendor:", error);
      setErrorMessage(`Failed to send to vendor: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading return data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Update Purchase Return
              </h2>
              <p className="text-green-100 text-sm">
                Return #{returnId} | Status:
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}
                >
                  {formData.status || "N/A"}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Success Message */}
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
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

            <form onSubmit={handleSubmit}>
              {/* Status Update Section */}
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Current Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}
                  >
                    {formData.status || "DRAFT"}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto"></div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) =>
                      handleInputChange("poNumber", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GRN Number
                  </label>
                  <input
                    type="text"
                    value={formData.grnNumber || ""}
                    onChange={(e) =>
                      handleInputChange("grnNumber", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter GRN number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber || ""}
                    onChange={(e) =>
                      handleInputChange("invoiceNumber", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter invoice number"
                  />
                </div>
              </div>

              {/* Supplier Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) =>
                      handleInputChange("supplierName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Code
                  </label>
                  <input
                    type="text"
                    value={formData.supplierCode || ""}
                    onChange={(e) =>
                      handleInputChange("supplierCode", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) =>
                      handleInputChange("requestDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Type *
                  </label>
                  <select
                    value={formData.returnType}
                    onChange={(e) =>
                      handleInputChange("returnType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Return Type</option>
                    {returnTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Return Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Reason *
                </label>
                <textarea
                  value={formData.returnReason}
                  onChange={(e) =>
                    handleInputChange("returnReason", e.target.value)
                  }
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the reason for return..."
                  required
                />
              </div>

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks || ""}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional remarks..."
                />
              </div>

              {/* Line Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Line Items ({formData.lines.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formData.lines.map((line, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Item #{index + 1}
                        </h4>
                        <div className="flex items-center gap-2">
                          {/* Rejected Area Button */}
                          {line.id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateRejectedArea(
                                  line.id,
                                  line.rejectedArea,
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              {line.rejectedArea ? "Update Area" : "Set Area"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="text-red-600 hover:text-red-800"
                            disabled={formData.lines.length <= 1}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Item Code *
                          </label>
                          <input
                            type="text"
                            value={line.itemCode}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "itemCode",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Item code"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Item Name *
                          </label>
                          <input
                            type="text"
                            value={line.itemName}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "itemName",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Item name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            UOM
                          </label>
                          <input
                            type="text"
                            value={line.uom || ""}
                            onChange={(e) =>
                              handleLineChange(index, "uom", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Unit"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Return Quantity *
                          </label>
                          <input
                            type="number"
                            value={line.returnQuantity}
                            onChange={(e) => {
                              handleLineChange(
                                index,
                                "returnQuantity",
                                Number(e.target.value),
                              );
                              calculateLineTotal(index);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            step="1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            value={line.unitPrice || 0}
                            onChange={(e) => {
                              handleLineChange(
                                index,
                                "unitPrice",
                                Number(e.target.value),
                              );
                              calculateLineTotal(index);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Total Amount
                          </label>
                          <input
                            type="text"
                            value={formatCurrency(line.totalAmount)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Batch Number
                          </label>
                          <input
                            type="text"
                            value={line.batchNumber || ""}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "batchNumber",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Batch"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={line.expiryDate || ""}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "expiryDate",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Item Reason
                        </label>
                        <input
                          type="text"
                          value={line.reason || ""}
                          onChange={(e) =>
                            handleLineChange(index, "reason", e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Reason for this item return"
                        />
                      </div>
                      {/* Display rejected area if set */}
                      {line.rejectedArea && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>
                            Rejected Area:{" "}
                            <span className="font-medium">
                              {line.rejectedArea}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="mt-4 p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-gray-700">
                    Total Return Amount:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateTotalAmount())}
                  </span>
                </div>
              </div>

              {/* Approval Info (if available) */}
              {(formData.approvedBy || formData.approvedDate) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Approval Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.approvedBy && (
                      <div>
                        <p className="text-xs text-gray-500">Approved By</p>
                        <p className="text-sm text-gray-900">
                          {formData.approvedBy}
                        </p>
                      </div>
                    )}
                    {formData.approvedDate && (
                      <div>
                        <p className="text-xs text-gray-500">Approved Date</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(formData.approvedDate)}
                        </p>
                      </div>
                    )}
                    {formData.rejectionReason && (
                      <div>
                        <p className="text-xs text-gray-500">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-600">
                          {formData.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendToVendor}
                  disabled={submitting || formData.status !== "PENDING"}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                    formData.status === "PENDING" && !submitting
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  title={
                    formData.status !== "PENDING"
                      ? "Only PENDING returns can be sent to vendor"
                      : ""
                  }
                >
                  <Send className="w-4 h-4" />
                  Send to Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Rejected Area Modal with Rocks Dropdown */}
      {showRejectedAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Update Rejected Area
                </h3>
                <button
                  onClick={() => {
                    setShowRejectedAreaModal(false);
                    setSelectedLineId(null);
                    setRejectedAreaValue("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejected Area / Rock
                </label>
                <div className="relative">
                  <select
                    value={rejectedAreaValue}
                    onChange={(e) => setRejectedAreaValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={loadingRocks}
                  >
                    <option value="">Select a rock location</option>
                    {rocks.map((rock) => (
                      <option
                        key={rock.id || rock.code}
                        value={rock.name || rock.code || rock.location}
                      >
                        {rock.name || rock.code || rock.location}
                      </option>
                    ))}
                  </select>
                  {loadingRocks && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={fetchRocks}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600"
                    disabled={loadingRocks}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingRocks ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select a rock location where rejected items are stored
                </p>
              </div>

              {/* Custom input option */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Enter Custom Location
                </label>
                <input
                  type="text"
                  value={rejectedAreaValue}
                  onChange={(e) => setRejectedAreaValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter custom location"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectedAreaModal(false);
                    setSelectedLineId(null);
                    setRejectedAreaValue("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRejectedArea}
                  disabled={updatingRejectedArea || !rejectedAreaValue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingRejectedArea ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Area
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
