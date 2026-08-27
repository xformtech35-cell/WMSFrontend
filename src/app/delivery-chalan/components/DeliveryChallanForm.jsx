"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Package,
  User as UserIcon,
  List,
  Check,
  X,
  Save,
  FileText,
} from "lucide-react";

// Get shipping labels (packages) for selection with pagination
const getShippingLabelsAPI = async (page = 0, size = 10, searchTerm = "") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (searchTerm) params.append("search", searchTerm);

    const url = `/outbound/shipping-labels${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    console.log("GET shipping labels response:", response);

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
    console.error("Error fetching shipping labels:", error);
    throw error;
  }
};

export default function DeliveryChallanForm({
  isEditMode = false,
  editingChallan = null,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  // Package form state for manual entry
  const [packageForm, setPackageForm] = useState({
    soNumber: "",
    packageNumber: "",
    packageBarcode: "",
    customerCode: "",
    customerName: "",
    customerAddress: "",
    customerGst: "",
    customerPhone: "",
    invoiceNumber: "",
    orderDate: "",
    dispatchDate: "",
    expectedDeliveryDate: "",
    itemCode: "",
    itemName: "",
    uom: "Pcs",
    orderedQuantity: 1,
    dispatchedQuantity: 1,
    deliveredQuantity: 0,
    shortQuantity: 0,
    batchNumber: "",
    serialNumbers: "",
    unitPrice: 0,
    totalPrice: 0,
    weight: 0,
    volume: 0,
    remarks: "",
  });

  const [editingPackageIndex, setEditingPackageIndex] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Package selector state
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [packageSearchTerm, setPackageSearchTerm] = useState("");
  const [packageLoading, setPackageLoading] = useState(false);
  const [selectedPackageIndices, setSelectedPackageIndices] = useState([]);
  
  // Package pagination state
  const [packageCurrentPage, setPackageCurrentPage] = useState(0);
  const [packageTotalPages, setPackageTotalPages] = useState(0);
  const [packageTotalElements, setPackageTotalElements] = useState(0);
  const [packagePageSize, setPackagePageSize] = useState(10);

  const [errorMessage, setErrorMessage] = useState("");

  // Debounce search term for package selector
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showPackageSelector) {
        loadAvailablePackages();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [packageSearchTerm]);

  // Load packages when package page changes
  useEffect(() => {
    if (showPackageSelector) {
      loadAvailablePackages();
    }
  }, [packageCurrentPage, packagePageSize]);

  const loadAvailablePackages = async () => {
    try {
      setPackageLoading(true);
      const response = await getShippingLabelsAPI(packageCurrentPage, packagePageSize, packageSearchTerm);
      if (response && response.data) {
        setAvailablePackages(response.data || []);
        setPackageTotalPages(response.totalPages || 0);
        setPackageTotalElements(response.total || 0);
        setSelectedPackageIndices([]);
      } else {
        setAvailablePackages([]);
        setPackageTotalPages(0);
        setPackageTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
      setErrorMessage("Failed to load available packages.");
    } finally {
      setPackageLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePackageFormChange = (e) => {
    const { name, value } = e.target;
    setPackageForm((prev) => ({
      ...prev,
      [name]: name === "orderedQuantity" || name === "dispatchedQuantity" || 
              name === "deliveredQuantity" || name === "shortQuantity" ||
              name === "unitPrice" || name === "weight" || name === "volume"
              ? parseFloat(value) || 0
              : value,
    }));
  };

  // Open package selector modal
  const openPackageSelector = () => {
    setShowPackageSelector(true);
    setPackageCurrentPage(0);
    setPackageSearchTerm("");
    setSelectedPackageIndices([]);
    loadAvailablePackages();
  };

  // Toggle package selection
  const togglePackageSelection = (index) => {
    setSelectedPackageIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // Add selected packages to challan
  const addSelectedPackages = () => {
    const selectedPackages = selectedPackageIndices.map((index) => {
      const pkg = availablePackages[index];
      return {
        soNumber: pkg.soNumber || "",
        packageNumber: pkg.packageNumber || `PKG-${Date.now()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        packageBarcode: pkg.packageBarcode || "",
        customerCode: pkg.customerCode || "",
        customerName: pkg.customerName || "",
        customerAddress: pkg.customerAddress || "",
        customerGst: pkg.customerGst || "",
        customerPhone: pkg.customerPhone || "",
        invoiceNumber: pkg.invoiceNumber || "",
        orderDate: pkg.orderDate || new Date().toISOString(),
        dispatchDate: pkg.dispatchDate || new Date().toISOString(),
        expectedDeliveryDate: pkg.expectedDeliveryDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        itemCode: pkg.itemCode || "",
        itemName: pkg.itemName || "",
        uom: pkg.uom || "Pcs",
        orderedQuantity: pkg.quantity || pkg.orderedQuantity || 1,
        dispatchedQuantity: pkg.quantity || pkg.dispatchedQuantity || 1,
        deliveredQuantity: 0,
        shortQuantity: 0,
        batchNumber: pkg.batchNumber || "",
        serialNumbers: pkg.serialNumbers || "",
        unitPrice: pkg.unitPrice || 0,
        totalPrice: (pkg.unitPrice || 0) * (pkg.quantity || pkg.dispatchedQuantity || 1),
        weight: pkg.weight || 0,
        volume: pkg.volume || 0,
        remarks: pkg.remarks || "",
        labelNumber: pkg.labelNumber,
        trackingNumber: pkg.trackingNumber,
        shippingMethod: pkg.shippingMethod,
      };
    });

    setFormData((prev) => ({
      ...prev,
      packages: [...prev.packages, ...selectedPackages],
    }));

    setShowPackageSelector(false);
    setSelectedPackageIndices([]);
  };

  const addManualPackage = () => {
    if (!packageForm.soNumber || !packageForm.itemCode || !packageForm.itemName) {
      setErrorMessage("Please fill in SO Number, Item Code, and Item Name at minimum.");
      return;
    }

    const newPackage = {
      ...packageForm,
      totalPrice: packageForm.unitPrice * packageForm.dispatchedQuantity,
      orderDate: packageForm.orderDate || new Date().toISOString(),
      dispatchDate: packageForm.dispatchDate || new Date().toISOString(),
      expectedDeliveryDate: packageForm.expectedDeliveryDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (editingPackageIndex !== null) {
      const updatedPackages = [...formData.packages];
      updatedPackages[editingPackageIndex] = newPackage;
      setFormData((prev) => ({
        ...prev,
        packages: updatedPackages,
      }));
      setEditingPackageIndex(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        packages: [...prev.packages, newPackage],
      }));
    }

    setPackageForm({
      soNumber: "",
      packageNumber: "",
      packageBarcode: "",
      customerCode: "",
      customerName: "",
      customerAddress: "",
      customerGst: "",
      customerPhone: "",
      invoiceNumber: "",
      orderDate: new Date().toISOString(),
      dispatchDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      itemCode: "",
      itemName: "",
      uom: "Pcs",
      orderedQuantity: 1,
      dispatchedQuantity: 1,
      deliveredQuantity: 0,
      shortQuantity: 0,
      batchNumber: "",
      serialNumbers: "",
      unitPrice: 0,
      totalPrice: 0,
      weight: 0,
      volume: 0,
      remarks: "",
    });
    setIsManualEntry(false);
  };

  const editPackage = (index) => {
    setEditingPackageIndex(index);
    setPackageForm(formData.packages[index]);
    setIsManualEntry(true);
  };

  const removePackage = (index) => {
    const updatedPackages = formData.packages.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      packages: updatedPackages,
    }));
    if (editingPackageIndex === index) {
      setEditingPackageIndex(null);
      setPackageForm({
        soNumber: "",
        packageNumber: "",
        packageBarcode: "",
        customerCode: "",
        customerName: "",
        customerAddress: "",
        customerGst: "",
        customerPhone: "",
        invoiceNumber: "",
        orderDate: new Date().toISOString(),
        dispatchDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        itemCode: "",
        itemName: "",
        uom: "Pcs",
        orderedQuantity: 1,
        dispatchedQuantity: 1,
        deliveredQuantity: 0,
        shortQuantity: 0,
        batchNumber: "",
        serialNumbers: "",
        unitPrice: 0,
        totalPrice: 0,
        weight: 0,
        volume: 0,
        remarks: "",
      });
      setIsManualEntry(false);
    }
  };

  const handlePackagePageChange = (newPage) => {
    if (newPage >= 0 && newPage < packageTotalPages) {
      setPackageCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span className="text-red-800 text-sm">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit}>
        {/* Challan Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipment Number *
            </label>
            <input
              type="text"
              name="shipmentNumber"
              value={formData.shipmentNumber}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transporter
            </label>
            <input
              type="text"
              name="transporter"
              value={formData.transporter}
              onChange={handleFormChange}
              placeholder="e.g., XYZ Logistics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleFormChange}
              placeholder="e.g., MH12AB1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleFormChange}
              placeholder="Delivery challan remarks"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Driver Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="col-span-full text-sm font-semibold text-gray-700 flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Driver Information
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <input
              type="text"
              name="driverName"
              value={formData.driverName}
              onChange={handleFormChange}
              placeholder="Driver name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone
            </label>
            <input
              type="tel"
              name="driverPhone"
              value={formData.driverPhone}
              onChange={handleFormChange}
              placeholder="Driver phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Packages Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Packages ({formData.packages.length})
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsManualEntry(!isManualEntry);
                  if (!isManualEntry) {
                    setPackageForm({
                      soNumber: "",
                      packageNumber: "",
                      packageBarcode: "",
                      customerCode: "",
                      customerName: "",
                      customerAddress: "",
                      customerGst: "",
                      customerPhone: "",
                      invoiceNumber: "",
                      orderDate: new Date().toISOString(),
                      dispatchDate: new Date().toISOString(),
                      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                      itemCode: "",
                      itemName: "",
                      uom: "Pcs",
                      orderedQuantity: 1,
                      dispatchedQuantity: 1,
                      deliveredQuantity: 0,
                      shortQuantity: 0,
                      batchNumber: "",
                      serialNumbers: "",
                      unitPrice: 0,
                      totalPrice: 0,
                      weight: 0,
                      volume: 0,
                      remarks: "",
                    });
                    setEditingPackageIndex(null);
                  }
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1"
              >
                {isManualEntry ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {isManualEntry ? "Cancel Manual" : "Manual Entry"}
              </button>
              <button
                type="button"
                onClick={openPackageSelector}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <List className="w-3.5 h-3.5" />
                Select from Labels
              </button>
            </div>
          </div>

          {/* Manual Package Entry */}
          {isManualEntry && (
            <div className="p-4 bg-gray-50 rounded-xl mb-4 border-2 border-blue-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">
                  {editingPackageIndex !== null ? "Edit Package" : "Add Manual Package"}
                </h4>
                <span className="text-xs text-gray-500">
                  {editingPackageIndex !== null ? `Editing package ${editingPackageIndex + 1}` : "Enter package details"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    SO Number *
                  </label>
                  <input
                    type="text"
                    name="soNumber"
                    value={packageForm.soNumber}
                    onChange={handlePackageFormChange}
                    placeholder="SO Number"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Package Number
                  </label>
                  <input
                    type="text"
                    name="packageNumber"
                    value={packageForm.packageNumber}
                    onChange={handlePackageFormChange}
                    placeholder="PKG-xxxxxx"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={packageForm.invoiceNumber}
                    onChange={handlePackageFormChange}
                    placeholder="INV-xxxxxx"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={packageForm.customerName}
                    onChange={handlePackageFormChange}
                    placeholder="Customer name"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Address
                  </label>
                  <input
                    type="text"
                    name="customerAddress"
                    value={packageForm.customerAddress}
                    onChange={handlePackageFormChange}
                    placeholder="Address"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer GST
                  </label>
                  <input
                    type="text"
                    name="customerGst"
                    value={packageForm.customerGst}
                    onChange={handlePackageFormChange}
                    placeholder="GST Number"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    value={packageForm.itemCode}
                    onChange={handlePackageFormChange}
                    placeholder="Item code"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={packageForm.itemName}
                    onChange={handlePackageFormChange}
                    placeholder="Item name"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    UOM
                  </label>
                  <select
                    name="uom"
                    value={packageForm.uom}
                    onChange={handlePackageFormChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Box">Box</option>
                    <option value="Carton">Carton</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dispatched Quantity
                  </label>
                  <input
                    type="number"
                    name="dispatchedQuantity"
                    value={packageForm.dispatchedQuantity}
                    onChange={handlePackageFormChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={packageForm.unitPrice}
                    onChange={handlePackageFormChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Total Price
                  </label>
                  <input
                    type="number"
                    value={packageForm.unitPrice * packageForm.dispatchedQuantity}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Weight (g)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={packageForm.weight}
                    onChange={handlePackageFormChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={packageForm.batchNumber}
                    onChange={handlePackageFormChange}
                    placeholder="Batch #"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Package Remarks
                  </label>
                  <input
                    type="text"
                    name="remarks"
                    value={packageForm.remarks}
                    onChange={handlePackageFormChange}
                    placeholder="Package remarks"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                {editingPackageIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPackageIndex(null);
                      setPackageForm({
                        soNumber: "",
                        packageNumber: "",
                        packageBarcode: "",
                        customerCode: "",
                        customerName: "",
                        customerAddress: "",
                        customerGst: "",
                        customerPhone: "",
                        invoiceNumber: "",
                        orderDate: new Date().toISOString(),
                        dispatchDate: new Date().toISOString(),
                        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                        itemCode: "",
                        itemName: "",
                        uom: "Pcs",
                        orderedQuantity: 1,
                        dispatchedQuantity: 1,
                        deliveredQuantity: 0,
                        shortQuantity: 0,
                        batchNumber: "",
                        serialNumbers: "",
                        unitPrice: 0,
                        totalPrice: 0,
                        weight: 0,
                        volume: 0,
                        remarks: "",
                      });
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={addManualPackage}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editingPackageIndex !== null ? "Update Package" : "Add Package"}
                </button>
              </div>
            </div>
          )}

          {/* Package List */}
          {formData.packages.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">SO #</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">UOM</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.packages.map((pkg, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2 font-medium">{pkg.soNumber}</td>
                      <td className="px-3 py-2">{pkg.customerName}</td>
                      <td className="px-3 py-2">{pkg.itemName}</td>
                      <td className="px-3 py-2">{pkg.dispatchedQuantity}</td>
                      <td className="px-3 py-2">{pkg.uom}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => editPackage(index)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePackage(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Saving..." : isEditMode ? "Update Challan" : "Create Challan"}
          </button>
        </div>
      </form>

      {/* Package Selector Modal with Pagination */}
      {showPackageSelector && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPackageSelector(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <List className="w-5 h-5 text-blue-600" />
                    Select Packages from Shipping Labels
                  </h2>
                  <p className="text-sm text-gray-500">
                    Select packages to add to the delivery challan
                  </p>
                </div>
                <button
                  onClick={() => setShowPackageSelector(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search packages by SO, Customer, Item..."
                      value={packageSearchTerm}
                      onChange={(e) => setPackageSearchTerm(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Package List */}
                {packageLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading packages...</p>
                  </div>
                ) : availablePackages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No shipping labels available
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left w-10">
                              <input
                                type="checkbox"
                                checked={selectedPackageIndices.length === availablePackages.length && availablePackages.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPackageIndices(availablePackages.map((_, i) => i));
                                  } else {
                                    setSelectedPackageIndices([]);
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </th>
                            <th className="px-3 py-2 text-left">Label #</th>
                            <th className="px-3 py-2 text-left">Package #</th>
                            <th className="px-3 py-2 text-left">SO #</th>
                            <th className="px-3 py-2 text-left">Customer</th>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-left">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {availablePackages.map((pkg, index) => (
                            <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => togglePackageSelection(index)}>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedPackageIndices.includes(index)}
                                  onChange={() => togglePackageSelection(index)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-blue-600">
                                {pkg.labelNumber || "N/A"}
                              </td>
                              <td className="px-3 py-2">{pkg.packageNumber || "N/A"}</td>
                              <td className="px-3 py-2">{pkg.soNumber || "N/A"}</td>
                              <td className="px-3 py-2">{pkg.customerName || "N/A"}</td>
                              <td className="px-3 py-2">
                                <div className="font-medium">{pkg.itemName || "N/A"}</div>
                                <div className="text-xs text-gray-500">{pkg.itemCode}</div>
                              </td>
                              <td className="px-3 py-2">{pkg.quantity || pkg.dispatchedQuantity || 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Package Pagination */}
                    {packageTotalPages > 0 && (
                      <div className="mt-4 px-2 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                        <div className="text-sm text-gray-500">
                          Page {packageCurrentPage + 1} of {packageTotalPages} | Total: {packageTotalElements} packages
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePackagePageChange(packageCurrentPage - 1)}
                            disabled={packageCurrentPage === 0}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm">{packageCurrentPage + 1}</span>
                          <button
                            onClick={() => handlePackagePageChange(packageCurrentPage + 1)}
                            disabled={packageCurrentPage === packageTotalPages - 1}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-4">
                  <span className="text-sm text-gray-500">
                    {selectedPackageIndices.length} package(s) selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPackageSelector(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addSelectedPackages}
                      disabled={selectedPackageIndices.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Add Selected Packages
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}