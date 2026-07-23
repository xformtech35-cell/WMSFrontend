"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Building2,
  Users,
  FileText,
  AlertCircle,
  Send,
  XCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  Package,
  DollarSign,
  Hash,
  ChevronLeft,
  ChevronRight,
  Search,
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

const getSuppliersAPI = async (
  page = 0,
  size = 10,
  search = "",
  isActive = null,
) => {
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

const createRFQFromPRAPI = async (data) => {
  return apiRequest("/rfqs/create-from-pr", "POST", data);
};

export default function RFQForm({
  isOpen,
  onClose,
  purchaseRequest,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    rfqDate: new Date().toISOString().split("T")[0],
    closingDate: "",
    purchaseRequestId: null,
    referenceNumber: "",
    remarks: "",
    termsAndConditions: "",
    deliveryTerms: "",
    paymentTerms: "",
    supplierIds: [],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [showItems, setShowItems] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSuppliers(0, "");
      if (purchaseRequest) {
        setFormData((prev) => ({
          ...prev,
          purchaseRequestId: purchaseRequest.id,
          referenceNumber: purchaseRequest.prNumber || "",
          remarks: `RFQ for ${purchaseRequest.prNumber} - ${purchaseRequest.requestedBy || ""}`,
        }));
      }
    }
  }, [isOpen, purchaseRequest]);

  // Debounce search
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadSuppliers(0, searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const loadSuppliers = async (page = 0, search = "") => {
    try {
      setLoadingSuppliers(true);
      const response = await getSuppliersAPI(page, pageSize, search, true);
      setSuppliers(response.data || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.total || 0);
      setCurrentPage(response.page || 0);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setErrorMessage("Failed to load suppliers.");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadSuppliers(newPage, searchTerm);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSupplierSelection = (supplier) => {
    setSelectedSuppliers((prev) => {
      const isSelected = prev.some((s) => s.id === supplier.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== supplier.id);
      } else {
        return [...prev, supplier];
      }
    });
  };

  const removeSupplier = (supplierId) => {
    setSelectedSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validate
      if (!formData.closingDate) {
        throw new Error("Please select a closing date");
      }
      if (selectedSuppliers.length === 0) {
        throw new Error("Please select at least one supplier");
      }

      // Prepare data
      const submitData = {
        rfqDate: formData.rfqDate,
        closingDate: formData.closingDate,
        purchaseRequestId: formData.purchaseRequestId,
        referenceNumber: formData.referenceNumber,
        remarks: formData.remarks || "",
        termsAndConditions: formData.termsAndConditions || "",
        deliveryTerms: formData.deliveryTerms || "",
        paymentTerms: formData.paymentTerms || "",
        supplierIds: selectedSuppliers.map((s) => s.id),
      };

      const result = await createRFQFromPRAPI(submitData);

      setSuccessMessage(
        `RFQ created successfully! Reference: ${result.referenceNumber || "N/A"}`,
      );

      if (onSuccess) {
        onSuccess(result);
      }

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      setErrorMessage(
        error.message || "Failed to create RFQ. Please try again.",
      );
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
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create RFQ from Purchase Request
              </h2>
              <p className="text-sm text-gray-500">
                {purchaseRequest?.prNumber} - {purchaseRequest?.requestedBy}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800">{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage("")}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PR Details Summary */}
            {purchaseRequest && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-blue-800">
                    Purchase Request Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowItems(!showItems)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showItems ? "Hide Items" : "Show Items"} (
                    {purchaseRequest.items?.length || 0})
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">PR Number:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {purchaseRequest.prNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested By:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {purchaseRequest.requestedBy}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {purchaseRequest.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Items:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {purchaseRequest.items?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                {showItems &&
                  purchaseRequest.items &&
                  purchaseRequest.items.length > 0 && (
                    <div className="mt-3 border-t border-blue-200 pt-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        Items List
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-blue-200">
                          <thead className="bg-blue-100/50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Item Code
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Item Name
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                UOM
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Qty
                              </th>
                              {/* <th className="px-3 py-2 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">
                              Unit Price
                            </th> */}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {purchaseRequest.items.map((item, index) => (
                              <tr key={index} className="hover:bg-blue-50/50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {index + 1}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {item.itemCode || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {item.itemName}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500 max-w-[150px] truncate">
                                  {item.description || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {item.uom || "Nos"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {item.requestedQty || 0}
                                </td>
                                {/* <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                ₹{(item.unitPrice || 0).toFixed(2)}
                              </td> */}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-blue-50/50">
                            <tr>
                              <td className="px-3 py-2 text-sm font-medium text-gray-700 text-left">
                                Total Items:
                              </td>
                              <td className="px-3 py-2 text-sm font-bold text-gray-900 text-left">
                                {purchaseRequest.items?.length || 0}
                              </td>
                              <td
                                colSpan="3"
                                className="px-3 py-2 text-sm font-medium text-gray-700 text-right"
                              >
                                {" "}
                                Total Qty:
                              </td>
                              <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">
                                {purchaseRequest.items?.reduce(
                                  (total, item) =>
                                    total + (Number(item.requestedQty) || 0),
                                  0,
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* RFQ Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  RFQ Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RFQ Date *
                    </label>
                    <div className="relative">
                      {/* <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /> */}
                      <input
                        type="date"
                        name="rfqDate"
                        value={formData.rfqDate}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Closing Date *
                    </label>
                    <div className="relative">
                      {/* <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /> */}
                      <input
                        type="date"
                        name="closingDate"
                        value={formData.closingDate}
                        onChange={handleInputChange}
                        min={formData.rfqDate}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <div className="relative">
                      {/* <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /> */}
                      <input
                        type="text"
                        name="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Reference number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks
                    </label>
                    <div className="relative">
                      {/* <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" /> */}
                      <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        rows="1"
                        className="w-full pl-2 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Additional remarks"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Terms & Conditions
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Terms
                    </label>
                    <input
                      type="text"
                      name="deliveryTerms"
                      value={formData.deliveryTerms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., FOB - Mumbai"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Net 30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <input
                      type="text"
                      name="termsAndConditions"
                      value={formData.termsAndConditions}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Payment within 30 days"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Selection */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
  <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-wrap gap-3">
    <div>
      <h3 className="text-lg font-semibold text-gray-800">
        Select Suppliers *
      </h3>
      <p className="text-sm text-gray-500">
        {selectedSuppliers.length} supplier(s) selected
      </p>
    </div>
    <div className="relative">
      <input
        type="text"
        placeholder="Search suppliers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  </div>

  {/* Selected Suppliers */}
  {selectedSuppliers.length > 0 && (
    <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-wrap gap-2">
        {selectedSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <Building2 className="w-3 h-3" />
            <span>{supplier.name}</span>
            <button
              type="button"
              onClick={() => removeSupplier(supplier.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  <div className="p-6">
    {loadingSuppliers ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">
          Loading suppliers...
        </p>
      </div>
    ) : suppliers.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        {searchTerm
          ? "No suppliers found matching your search"
          : "No suppliers available"}
      </div>
    ) : (
      <>
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
                    onChange={() => {
                      if (selectedSuppliers.length === suppliers.length) {
                        // Deselect all
                        suppliers.forEach(s => removeSupplier(s.id));
                      } else {
                        // Select all
                        suppliers.forEach(s => toggleSupplierSelection(s));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact Person</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">VAT/GST</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((supplier) => {
                const isSelected = selectedSuppliers.some(
                  (s) => s.id === supplier.id,
                );
                return (
                  <tr
                    key={supplier.id}
                    onClick={() => toggleSupplierSelection(supplier)}
                    className={`cursor-pointer transition-all hover:bg-gray-50 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900">
                          {supplier.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {supplier.contactPerson || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {supplier.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {supplier.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {supplier.gstNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Selected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Available
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {suppliers.length} of {totalElements} suppliers
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
</div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedSuppliers.length === 0}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create RFQ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
