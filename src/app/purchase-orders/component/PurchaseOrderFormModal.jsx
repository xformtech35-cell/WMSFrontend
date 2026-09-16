"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Package,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  AlertCircle,
  Save,
  Search,
  RefreshCw,
} from "lucide-react";
import apiRequest from "@/components/apiRequest";
import ItemPickerModal from "./ItemPickerModal";
import SupplierPickerModal from "./SupplierPickerModal";
import { FormattedCurrency, useCurrency } from "@/context/CurrencyContext";

export default function PurchaseOrderFormModal({
  isOpen,
  onClose,
  onSuccess,
  editPoData = null,
}) {
  const isEditing = Boolean(editPoData && editPoData.id);

  // Main Form State
  const [formData, setFormData] = useState({
    poNumber: "",
    poDate: new Date().toISOString().split("T")[0],
    expectedArrivalDate: new Date(Date.now() + 10 * 86400000)
      .toISOString()
      .split("T")[0],
    status: "DRAFT",
    subtotal: 0,
    totalGst: 0,
    grandTotal: 0,
    discountAmount: 0,
    shippingCharges: 0,
    remarks: "",
    termsAndConditions: "Payment within 30 days. Delivery at warehouse dock 3.",
    supplierName: "",
    supplierEmail: "",
    supplierPhone: "",
    shippingAddress: "",
    billingAddress: "",
    purchaseRequestNumber: "",
    purchaseRequestId: null,
    createdBy: 1,
    lines: [],
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  // Populate data if editing
  useEffect(() => {
    if (isOpen) {
      if (editPoData && editPoData.id) {
        setFormData({
          poNumber: editPoData.poNumber || "",
          poDate: editPoData.poDate || new Date().toISOString().split("T")[0],
          expectedArrivalDate:
            editPoData.expectedArrivalDate ||
            new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
          status: editPoData.status || "PENDING",
          subtotal: editPoData.subtotal || 0,
          totalGst: editPoData.totalGst || 0,
          grandTotal: editPoData.grandTotal || 0,
          discountAmount: editPoData.discountAmount || 0,
          shippingCharges: editPoData.shippingCharges || 0,
          remarks: editPoData.remarks || "",
          termsAndConditions: editPoData.termsAndConditions || "",
          supplierName: editPoData.supplierName || "",
          supplierEmail: editPoData.supplierEmail || "",
          supplierPhone: editPoData.supplierPhone || "",
          shippingAddress: editPoData.shippingAddress || "",
          billingAddress:
            editPoData.billingAddress || editPoData.shippingAddress || "",
          purchaseRequestNumber: editPoData.purchaseRequestNumber || "",
          purchaseRequestId: editPoData.purchaseRequestId || null,
          createdBy: editPoData.createdBy || 1,
          lines: editPoData.lines
            ? editPoData.lines.map((l) => ({
                id: l.id,
                itemId: l.itemId || null,
                itemCode: l.itemCode || "",
                itemName: l.itemName || "",
                description: l.description || "",
                hsnCode: l.hsnCode || "",
                uom: l.uom || "PCS",
                quantity: l.quantity || 1,
                gstRate: l.gstRate ?? 18.0,
                sgstRate: l.sgstRate ?? (l.gstRate ? l.gstRate / 2 : 9.0),
                cgstRate: l.cgstRate ?? (l.gstRate ? l.gstRate / 2 : 9.0),
                igstRate: l.igstRate ?? 0.0,
                unitPrice: l.unitPrice || 0,
                discountPercentage: l.discountPercentage || 0,
                discountAmount: l.discountAmount || 0,
                totalPrice: l.totalPrice || 0,
                gstAmount: l.gstAmount || 0,
                totalWithGst: l.totalWithGst || 0,
                receivedQuantity: l.receivedQuantity || 0,
                pendingQuantity: l.pendingQuantity ?? (l.quantity || 1),
                lineStatus: l.lineStatus || "PENDING",
              }))
            : [],
        });
      } else {
        // Create Reset
        resetForm();
      }
    }
  }, [isOpen, editPoData]);

  const resetForm = () => {
    setFormData({
      poNumber: "",
      poDate: new Date().toISOString().split("T")[0],
      expectedArrivalDate: new Date(Date.now() + 10 * 86400000)
        .toISOString()
        .split("T")[0],
      status: "DRAFT",
      subtotal: 0,
      totalGst: 0,
      grandTotal: 0,
      discountAmount: 0,
      shippingCharges: 0,
      remarks: "",
      termsAndConditions:
        "Payment within 30 days. Delivery at warehouse dock 3.",
      supplierName: "",
      supplierEmail: "",
      supplierPhone: "",
      shippingAddress: "",
      billingAddress: "",
      purchaseRequestNumber: "",
      purchaseRequestId: null,
      createdBy: 1,
      lines: [],
    });
    setErrorMessage("");
  };

  // Recalculate totals whenever lines, discountAmount, or shippingCharges change
  useEffect(() => {
    calculateTotals();
  }, [formData.lines, formData.discountAmount, formData.shippingCharges]);

  const calculateTotals = () => {
    let newSubtotal = 0;
    let newTotalGst = 0;

    formData.lines.forEach((line) => {
      newSubtotal += Number(line.totalPrice || 0);
      newTotalGst += Number(line.gstAmount || 0);
    });

    const discount = Number(formData.discountAmount || 0);
    const shipping = Number(formData.shippingCharges || 0);
    const grandTotal = newSubtotal + newTotalGst - discount + shipping;

    setFormData((prev) => ({
      ...prev,
      subtotal: Number(newSubtotal.toFixed(2)),
      totalGst: Number(newTotalGst.toFixed(2)),
      grandTotal: Number(Math.max(0, grandTotal).toFixed(2)),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Select Supplier from SupplierPickerModal
  const handleSupplierSelect = (supplier) => {
    setFormData((prev) => ({
      ...prev,
      supplierName: supplier.name || supplier.supplierName || "",
      supplierEmail: supplier.email || supplier.supplierEmail || "",
      supplierPhone: supplier.phone || supplier.supplierPhone || "",
      shippingAddress:
        supplier.address || supplier.shippingAddress || prev.shippingAddress,
    }));
  };

  // Select Item from ItemPickerModal
  const handleItemSelect = (item) => {
    const qty = 100;
    const unitPrice =
      item.purchasePrice || item.unitPrice || item.price || 250.0;
    const gstRate = item.gstRate || item.taxRate || 18.0;
    const discPct = 0;
    const discAmt = (unitPrice * qty * discPct) / 100;
    const totalPrice = unitPrice * qty - discAmt;
    const gstAmount = (totalPrice * gstRate) / 100;
    const totalWithGst = totalPrice + gstAmount;

    const newLine = {
      itemId: item.id || null,
      itemCode: item.skuCode || item.itemCode || item.code || "ITM-NEW",
      itemName: item.name || item.itemName || "Item Name",
      description: item.description || item.name || "",
      hsnCode: item.hsnCode || "7214",
      uom: item.uom || item.unit || "KG",
      quantity: qty,
      gstRate: gstRate,
      sgstRate: gstRate / 2,
      cgstRate: gstRate / 2,
      igstRate: 0.0,
      unitPrice: unitPrice,
      discountPercentage: discPct,
      discountAmount: discAmt,
      totalPrice: totalPrice,
      gstAmount: gstAmount,
      totalWithGst: totalWithGst,
      receivedQuantity: 0,
      pendingQuantity: qty,
      lineStatus: "PENDING",
    };

    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.lines];
    const line = { ...updatedLines[index], [field]: value };

    if (
      field === "quantity" ||
      field === "unitPrice" ||
      field === "gstRate" ||
      field === "discountPercentage"
    ) {
      const qty = Number(line.quantity || 0);
      const price = Number(line.unitPrice || 0);
      const gstRate = Number(line.gstRate || 0);
      const discPct = Number(line.discountPercentage || 0);

      const discAmt = (price * qty * discPct) / 100;
      const totalPrice = price * qty - discAmt;
      const gstAmount = (totalPrice * gstRate) / 100;
      const totalWithGst = totalPrice + gstAmount;

      line.discountAmount = Number(discAmt.toFixed(2));
      line.totalPrice = Number(totalPrice.toFixed(2));
      line.gstAmount = Number(gstAmount.toFixed(2));
      line.totalWithGst = Number(totalWithGst.toFixed(2));
      line.pendingQuantity = qty - (line.receivedQuantity || 0);
      line.sgstRate = Number((gstRate / 2).toFixed(2));
      line.cgstRate = Number((gstRate / 2).toFixed(2));
    }

    updatedLines[index] = line;
    setFormData((prev) => ({
      ...prev,
      lines: updatedLines,
    }));
  };

  const handleRemoveLine = (index) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName.trim()) {
      setErrorMessage("Supplier Name is required.");
      return;
    }
    if (formData.lines.length === 0) {
      setErrorMessage("Please add at least one line item from Item Master.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        poDate: formData.poDate,
        expectedArrivalDate: formData.expectedArrivalDate,
        status: formData.status,
        subtotal: Number(formData.subtotal),
        totalGst: Number(formData.totalGst),
        grandTotal: Number(formData.grandTotal),
        discountAmount: Number(formData.discountAmount || 0),
        shippingCharges: Number(formData.shippingCharges || 0),
        remarks: formData.remarks,
        termsAndConditions: formData.termsAndConditions,
        supplierName: formData.supplierName,
        supplierEmail: formData.supplierEmail,
        supplierPhone: formData.supplierPhone,
        shippingAddress: formData.shippingAddress,
        purchaseRequestNumber: formData.purchaseRequestNumber || null,
        createdBy: formData.createdBy || 1,
        lines: formData.lines.map((l) => ({
          ...(l.id ? { id: l.id } : {}),
          ...(l.itemId ? { itemId: l.itemId } : {}),
          itemCode: l.itemCode,
          itemName: l.itemName,
          description: l.description,
          hsnCode: l.hsnCode,
          uom: l.uom,
          quantity: Number(l.quantity),
          gstRate: Number(l.gstRate),
          sgstRate: Number(l.sgstRate),
          cgstRate: Number(l.cgstRate),
          igstRate: Number(l.igstRate || 0),
          unitPrice: Number(l.unitPrice),
          discountPercentage: Number(l.discountPercentage || 0),
          discountAmount: Number(l.discountAmount || 0),
          totalPrice: Number(l.totalPrice),
          gstAmount: Number(l.gstAmount),
          totalWithGst: Number(l.totalWithGst),
          receivedQuantity: Number(l.receivedQuantity || 0),
          pendingQuantity: Number(l.pendingQuantity || l.quantity),
          lineStatus: l.lineStatus || "PENDING",
        })),
      };

      if (isEditing) {
        payload.poNumber = formData.poNumber;
        payload.billingAddress =
          formData.billingAddress || formData.shippingAddress;
        if (formData.purchaseRequestId) {
          payload.purchaseRequestId = formData.purchaseRequestId;
        }
        await apiRequest(`/purchase-orders/${editPoData.id}`, "PUT", payload);
      } else {
        await apiRequest("/purchase-orders", "POST", payload);
      }

      onSuccess(
        isEditing
          ? "Purchase Order updated successfully!"
          : "Purchase Order created successfully!",
      );
      onClose();
    } catch (error) {
      console.error("Error saving purchase order:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save purchase order.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  const { currencySymbol, currencyCode } = useCurrency();

  // Selected item codes for disabling in ItemPickerModal
  const selectedItemCodes = formData.lines
    .map((l) => l.itemCode || l.itemId)
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl my-8 flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">
              {isEditing
                ? `Edit Purchase Order #${editPoData.poNumber || editPoData.id}`
                : "Create Purchase Order"}
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">
              Fill in supplier details, line items, and financial parameters
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[75vh]"
        >
          {/* Supplier & Header Details */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" /> Supplier &
                Information
              </h3>
              <button
                type="button"
                onClick={() => setShowSupplierPicker(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> Select Supplier from Master
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  placeholder="e.g. ABC Suppliers Pvt Ltd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supplier Email
                </label>
                <input
                  type="email"
                  name="supplierEmail"
                  value={formData.supplierEmail}
                  onChange={handleInputChange}
                  placeholder="contact@abcsuppliers.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supplier Phone
                </label>
                <input
                  type="text"
                  name="supplierPhone"
                  value={formData.supplierPhone}
                  onChange={handleInputChange}
                  placeholder="+91-9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  PO Date *
                </label>
                <input
                  type="date"
                  name="poDate"
                  value={formData.poDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expected Arrival Date *
                </label>
                <input
                  type="date"
                  name="expectedArrivalDate"
                  value={formData.expectedArrivalDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SEND">SEND</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
              </div>

              {/* <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Purchase Request Number
                </label>
                <input
                  type="text"
                  name="purchaseRequestNumber"
                  value={formData.purchaseRequestNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. PR-2024-055"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div> */}

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shipping Address
                </label>
                <input
                  type="text"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleInputChange}
                  placeholder="Warehouse 5, Industrial Area, Mumbai, MH 400001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-600" /> Line Items (
                {formData.lines.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowItemPicker(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> Select Item from Master
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5">Code</th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5">HSN</th>
                    <th className="px-3 py-2.5">UOM</th>
                    <th className="px-3 py-2.5 w-20">Qty</th>
                    <th className="px-3 py-2.5 w-24">
                      Price ({currencySymbol})
                    </th>
                    <th className="px-3 py-2.5 w-20">Disc %</th>
                    <th className="px-3 py-2.5 w-20">Tax %</th>
                    <th className="px-3 py-2.5 text-right">Total ({currencySymbol})</th>
                    <th className="px-3 py-2.5 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.lines.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="py-8 text-center text-gray-400"
                      >
                        No line items added yet. Click &quot;Select Item from
                        Master&quot; to add lines.
                      </td>
                    </tr>
                  ) : (
                    formData.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-3 py-2 font-semibold text-blue-600">
                          {line.itemCode}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {line.itemName}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {line.hsnCode}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{line.uom}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineChange(idx, "quantity", e.target.value)
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-right font-medium"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) =>
                              handleLineChange(idx, "unitPrice", e.target.value)
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs text-right font-medium"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={line.discountPercentage}
                            onChange={(e) =>
                              handleLineChange(
                                idx,
                                "discountPercentage",
                                e.target.value,
                              )
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-right font-medium"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={line.gstRate}
                            onChange={(e) =>
                              handleLineChange(idx, "gstRate", e.target.value)
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-right font-medium"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {/* ₹{line.totalWithGst ? Number(line.totalWithGst).toFixed(2) : "0.00"} */}
                          <FormattedCurrency value={line.totalWithGst} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation & Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  name="remarks"
                  rows="2"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Urgent order for Q2 stock replenishment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Terms and Conditions
                </label>
                <textarea
                  name="termsAndConditions"
                  rows="2"
                  value={formData.termsAndConditions}
                  onChange={handleInputChange}
                  placeholder="Payment within 30 days. Delivery at warehouse dock 3."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <h4 className="font-bold text-gray-700 pb-1 border-b border-gray-200">
                Order Summary
              </h4>
              <div className="flex justify-between py-1 text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {/* ₹{formData.subtotal.toFixed(2)} */}
                  <FormattedCurrency value={formData.subtotal} />
                </span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>Total Tax:</span>
                <span className="font-medium text-gray-900">
                  {/* ₹{formData.totalGst.toFixed(2)} */}
                  <FormattedCurrency value={formData.totalGst} />
                </span>
              </div>
              <div className="flex justify-between py-1 text-gray-600 items-center">
                <span>Discount Amount:</span>
                <input
                  type="number"
                  name="discountAmount"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  className="w-24 px-2 py-0.5 border border-gray-300 rounded text-right text-xs"
                />
              </div>
              <div className="flex justify-between py-1 text-gray-600 items-center">
                <span>Shipping Charges:</span>
                <input
                  type="number"
                  name="shippingCharges"
                  step="0.01"
                  min="0"
                  value={formData.shippingCharges}
                  onChange={handleInputChange}
                  className="w-24 px-2 py-0.5 border border-gray-300 rounded text-right text-xs"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="text-green-600">
                  {/* ₹{formData.grandTotal.toFixed(2)} */}
                  <FormattedCurrency value={formData.grandTotal} />
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : isEditing ? "Update PO" : "Save PO"}
            </button>
          </div>
        </form>

        {/* Item Picker Modal */}
        <ItemPickerModal
          isOpen={showItemPicker}
          onClose={() => setShowItemPicker(false)}
          onSelectItem={handleItemSelect}
          selectedItemCodes={selectedItemCodes}
        />

        {/* Supplier Picker Modal */}
        <SupplierPickerModal
          isOpen={showSupplierPicker}
          onClose={() => setShowSupplierPicker(false)}
          onSelectSupplier={handleSupplierSelect}
        />
      </div>
    </div>
  );
}
