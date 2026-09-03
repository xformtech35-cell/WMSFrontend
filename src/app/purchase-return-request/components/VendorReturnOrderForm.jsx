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
  Truck,
  Flag,
  FileText,
  User,
  CreditCard,
  Info,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/api";

const VendorReturnOrderForm = ({ 
  returnRequest, 
  onClose, 
  onSuccess,
  onError 
}) => {
  const [formData, setFormData] = useState({
    returnRequestId: returnRequest?.id || null,
    orderDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: "",
    shippingAddress: "",
    shippingMethod: "Road Transport",
    priority: "MEDIUM",
    lines: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize lines from return request
  useEffect(() => {
    if (returnRequest?.lines) {
      const initialLines = returnRequest.lines.map(line => ({
        returnRequestLineId: line.id,
        itemCode: line.itemCode || "",
        itemName: line.itemName || "",
        uom: line.uom || "",
        orderQuantity: line.requestedQuantity || line.approvedQuantity || 0,
        unitPrice: line.unitPrice || 0,
        totalAmount: (line.unitPrice || 0) * (line.requestedQuantity || line.approvedQuantity || 0),
        batchNumber: line.batchNumber || "",
        expiryDate: line.expiryDate || "",
        rejectedArea: line.rejectedArea || "",
      }));
      setFormData(prev => ({ ...prev, lines: initialLines }));
    }
  }, [returnRequest]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${Number(amount).toFixed(2)}`;
  };

  const validateForm = () => {
    const newErrors = {};
    const newValidationErrors = [];

    if (!formData.orderDate) {
      newErrors.orderDate = "Order date is required";
      newValidationErrors.push("Order date is required");
    }

    if (!formData.expectedReturnDate) {
      newErrors.expectedReturnDate = "Expected return date is required";
      newValidationErrors.push("Expected return date is required");
    }

    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress = "Shipping address is required";
      newValidationErrors.push("Shipping address is required");
    }

    if (!formData.shippingMethod) {
      newErrors.shippingMethod = "Shipping method is required";
      newValidationErrors.push("Shipping method is required");
    }

    if (formData.lines.length === 0) {
      newValidationErrors.push("At least one return line is required");
    }

    formData.lines.forEach((line, index) => {
      if (!line.itemCode) {
        newErrors[`line_${index}_itemCode`] = "Item code is required";
        newValidationErrors.push(`Line ${index + 1}: Item code is required`);
      }
      if (!line.itemName) {
        newErrors[`line_${index}_itemName`] = "Item name is required";
        newValidationErrors.push(`Line ${index + 1}: Item name is required`);
      }
      if (!line.uom) {
        newErrors[`line_${index}_uom`] = "UOM is required";
        newValidationErrors.push(`Line ${index + 1}: UOM is required`);
      }
      if (!line.orderQuantity || line.orderQuantity <= 0) {
        newErrors[`line_${index}_orderQuantity`] = "Valid order quantity is required";
        newValidationErrors.push(`Line ${index + 1}: Valid order quantity is required`);
      }
      if (!line.unitPrice || line.unitPrice < 0) {
        newErrors[`line_${index}_unitPrice`] = "Valid unit price is required";
        newValidationErrors.push(`Line ${index + 1}: Valid unit price is required`);
      }
    });

    setErrors(newErrors);
    setValidationErrors(newValidationErrors);
    return Object.keys(newErrors).length === 0 && newValidationErrors.length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.lines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value
    };

    // Recalculate total amount if quantity or unit price changes
    if (field === 'orderQuantity' || field === 'unitPrice') {
      const quantity = field === 'orderQuantity' ? parseFloat(value) || 0 : parseFloat(updatedLines[index].orderQuantity) || 0;
      const price = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(updatedLines[index].unitPrice) || 0;
      updatedLines[index].totalAmount = quantity * price;
    }

    setFormData(prev => ({
      ...prev,
      lines: updatedLines
    }));

    // Clear line error
    const errorKey = `line_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: "" }));
    }
  };

  const removeLine = (index) => {
    const updatedLines = formData.lines.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      lines: updatedLines
    }));
  };

  const addLine = () => {
    const newLine = {
      returnRequestLineId: null,
      itemCode: "",
      itemName: "",
      uom: "",
      orderQuantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      batchNumber: "",
      expiryDate: "",
    };
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
  };

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => sum + (line.totalAmount || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the request body
      const requestBody = {
        returnRequestId: formData.returnRequestId,
        orderDate: formData.orderDate,
        expectedReturnDate: formData.expectedReturnDate,
        shippingAddress: formData.shippingAddress,
        shippingMethod: formData.shippingMethod,
        priority: formData.priority,
        lines: formData.lines.map(line => ({
          returnRequestLineId: line.returnRequestLineId,
          itemCode: line.itemCode,
          itemName: line.itemName,
          uom: line.uom,
          orderQuantity: parseFloat(line.orderQuantity) || 0,
          unitPrice: parseFloat(line.unitPrice) || 0,
          totalAmount: parseFloat(line.totalAmount) || 0,
          batchNumber: line.batchNumber || "",
          expiryDate: line.expiryDate || "",
          rejectedArea: line.rejectedArea || "",
        }))
      };

      const response = await api.post("/vendor-returns/orders", requestBody);
      
      setSuccessMessage("Vendor return order created successfully!");
      setShowSuccess(true);
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close after showing success
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error creating vendor return order:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to create vendor return order";
      setValidationErrors([errorMsg]);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // If no return request data is provided
  if (!returnRequest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Return Request Selected</h3>
            <p className="text-gray-600 mb-4">Please select a return request to create an order.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Create Vendor Return Order
              </h2>
              <p className="text-green-100 text-sm">
                Request: {returnRequest.returnRequestNumber} - {returnRequest.supplierName}
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
            {/* Success Alert */}
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Please fix the following errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Return Request Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Building2 className="w-4 h-4" />
                  Supplier
                </div>
                <p className="font-medium text-gray-900">{returnRequest.supplierName}</p>
                {returnRequest.supplierCode && (
                  <p className="text-xs text-gray-500">Code: {returnRequest.supplierCode}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  PO Number
                </div>
                <p className="font-medium text-gray-900">{returnRequest.poNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Flag className="w-4 h-4" />
                  Priority
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  returnRequest.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  returnRequest.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  returnRequest.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {returnRequest.priority}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CreditCard className="w-4 h-4" />
                  Total Amount
                </div>
                <p className="font-medium text-green-600 text-lg">
                  {formatCurrency(returnRequest.lines?.reduce((sum, line) => sum + (line.totalAmount || 0), 0))}
                </p>
                <p className="text-xs text-gray-500">Items: {returnRequest.lines?.length || 0}</p>
              </div>
            </div>

            {/* Order Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.orderDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.orderDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.orderDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Return Date *
                  </label>
                  <input
                    type="date"
                    name="expectedReturnDate"
                    value={formData.expectedReturnDate}
                    onChange={handleInputChange}
                    min={formData.orderDate}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.expectedReturnDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expectedReturnDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.expectedReturnDate}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Address *
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Enter complete shipping address"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.shippingAddress && (
                    <p className="mt-1 text-xs text-red-600">{errors.shippingAddress}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Method *
                  </label>
                  <select
                    name="shippingMethod"
                    value={formData.shippingMethod}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.shippingMethod ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Road Transport">Road Transport</option>
                    <option value="Rail Transport">Rail Transport</option>
                    <option value="Air Transport">Air Transport</option>
                    <option value="Sea Transport">Sea Transport</option>
                    <option value="Courier">Courier</option>
                    <option value="Pickup">Pickup</option>
                  </select>
                  {errors.shippingMethod && (
                    <p className="mt-1 text-xs text-red-600">{errors.shippingMethod}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Order Lines */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order Lines ({formData.lines.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addLine}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code *
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name *
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UOM *
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity *
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price *
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.lines.map((line, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.itemCode}
                              onChange={(e) => handleLineChange(index, 'itemCode', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm ${
                                errors[`line_${index}_itemCode`] ? 'border-red-500' : 'border-gray-300'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="Item code"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.itemName}
                              onChange={(e) => handleLineChange(index, 'itemName', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm ${
                                errors[`line_${index}_itemName`] ? 'border-red-500' : 'border-gray-300'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="Item name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.uom}
                              onChange={(e) => handleLineChange(index, 'uom', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm ${
                                errors[`line_${index}_uom`] ? 'border-red-500' : 'border-gray-300'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="UOM"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={line.orderQuantity}
                              onChange={(e) => handleLineChange(index, 'orderQuantity', e.target.value)}
                              min="1"
                              step="1"
                              className={`w-full px-2 py-1 border rounded text-sm text-right ${
                                errors[`line_${index}_orderQuantity`] ? 'border-red-500' : 'border-gray-300'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                              min="0"
                              step="0.01"
                              className={`w-full px-2 py-1 border rounded text-sm text-right ${
                                errors[`line_${index}_unitPrice`] ? 'border-red-500' : 'border-gray-300'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-medium text-green-600">
                            {formatCurrency(line.totalAmount)}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={line.batchNumber}
                              onChange={(e) => handleLineChange(index, 'batchNumber', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Batch #"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              disabled={formData.lines.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-medium">
                      <tr>
                        <td colSpan="5" className="px-3 py-2 text-right text-sm">
                          Total Order Amount
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-green-600">
                          {formatCurrency(calculateTotal())}
                        </td>
                        <td colSpan="2" className="px-3 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorReturnOrderForm;