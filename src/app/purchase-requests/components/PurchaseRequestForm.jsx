"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Send,
  Save,
  Calendar,
  AlertCircle,
  Flag,
  XCircle,
  Building2,
  User,
  Building,
  Warehouse,
  FileText,
  Search,
} from "lucide-react";
import api from "@/lib/api";
import ItemSelectorModal from "./ItemSelectorModal";

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

// Get all suppliers
const getSuppliersAPI = async () => {
  try {
    return await apiRequest("/suppliers");
  } catch (error) {
    console.warn("Failed to fetch suppliers, using fallback data");
    return [
      {
        id: 1,
        name: "ABC Suppliers",
        code: "SUP001",
        email: "contact@abc.com",
        phone: "9876543210",
        address: "123 Main St, Mumbai",
        gst: "GST123456",
        contactPerson: "John Doe",
      },
      {
        id: 2,
        name: "XYZ Distributors",
        code: "SUP002",
        email: "info@xyz.com",
        phone: "9876543211",
        address: "456 Park Ave, Delhi",
        gst: "GST789012",
        contactPerson: "Jane Smith",
      },
      {
        id: 3,
        name: "Global Traders",
        code: "SUP003",
        email: "sales@global.com",
        phone: "9876543212",
        address: "789 Trade Center, Bangalore",
        gst: "GST345678",
        contactPerson: "Mike Johnson",
      },
    ];
  }
};

// Get all warehouses
const getWarehousesAPI = async () => {
  try {
    const response = await api.get("/warehouses");
    const data = response.data?.data?.content || response.data?.content || response.data || [];
    return data;
  } catch (error) {
    console.warn("Failed to fetch warehouses, using fallback data");
    return [
      { id: 1, warehouseId: "WH-001", name: "Mumbai WH", location: "Mumbai" },
      { id: 2, warehouseId: "WH-002", name: "Pune WH", location: "Pune" },
      { id: 3, warehouseId: "WH-003", name: "Delhi WH", location: "Delhi" },
      { id: 4, warehouseId: "WH-004", name: "Bangalore WH", location: "Bangalore" },
      { id: 5, warehouseId: "WH-005", name: "Chennai WH", location: "Chennai" },
    ];
  }
};

const createPurchaseRequestAPI = async (data) => {
  return apiRequest("/purchase-requests", "POST", data);
};

const updatePurchaseRequestAPI = async (id, data) => {
  return apiRequest(`/purchase-requests/${id}`, "PUT", data);
};

const submitPurchaseRequestAPI = async (id) => {
  return apiRequest(`/purchase-requests/${id}/submit`, "POST");
};

export default function PurchaseRequestForm({
  mode = "create",
  initialData = null,
  onClose,
  onSuccess,
}) {
  const router = useRouter();

  // Form State
  const [prData, setPrData] = useState({
    prNumber: `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    prDate: new Date().toISOString().split("T")[0],
    requestedBy: "",
    department: "",
    warehouse: "",
    priority: "NORMAL",
    requiredDate: "",
    remarks: "",
    status: "draft",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      itemId: null,
      itemCode: "",
      itemName: "",
      description: "",
      uom: "Nos",
      requestedQty: 1,
      currentStock: 0,
      reason: "",
      unitPrice: 0,
      category: "",
      brand: "",
      supplierId: null,
      gstRate: 0,
      gstHsnCode: "",
      isGstApplicable: false,
    },
  ]);

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedPRId, setSavedPRId] = useState(null);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);

  // Load suppliers and warehouses on mount
  useEffect(() => {
    loadSuppliers();
    loadWarehouses();
  }, []);

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      loadInitialData();
    }
  }, [mode, initialData]);

  const loadSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      const supplierList = await getSuppliersAPI();
      setSuppliers(supplierList || []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setErrorMessage("Failed to load suppliers.");
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      setIsLoadingWarehouses(true);
      const warehouseList = await getWarehousesAPI();
      setWarehouses(warehouseList || []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      setErrorMessage("Failed to load warehouses.");
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const loadInitialData = () => {
    try {
      setIsLoading(true);

      // Set PR data
      setPrData({
        prNumber:
          initialData.prNumber ||
          `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        prDate: initialData.prDate || new Date().toISOString().split("T")[0],
        requestedBy: initialData.requestedBy || "",
        department: initialData.department || "",
        warehouse: initialData.warehouse || "",
        priority: initialData.priority || "NORMAL",
        requiredDate: initialData.requiredDate || "",
        remarks: initialData.remarks || "",
        status: initialData.status || "draft",
      });

      // Set saved PR ID for updates
      if (initialData.id) {
        setSavedPRId(initialData.id);
      }

      // Set supplier if exists
      if (initialData.supplierId) {
        setSelectedSupplier(initialData.supplierId.toString());
      }

      // Set items
      if (initialData.items && initialData.items.length > 0) {
        const formattedItems = initialData.items.map((item, index) => ({
          id: index + 1,
          itemId: item.itemId || null,
          itemCode: item.itemCode || "",
          itemName: item.itemName || "",
          description: item.description || "",
          uom: item.uom || "Nos",
          requestedQty: item.requestedQty || 1,
          currentStock: item.currentStock || 0,
          reason: item.reason || "",
          unitPrice: item.unitPrice || 0,
          category: item.category || "",
          brand: item.brand || "",
          supplierId: item.supplierId || null,
          gstRate: item.gstRate || 0,
          gstHsnCode: item.gstHsnCode || "",
          isGstApplicable: item.isGstApplicable || false,
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      setErrorMessage("Failed to load purchase request data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPrData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const handleSelectItemFromModal = (selectedItem) => {
    const newId = Math.max(...items.map((i) => i.id), 0) + 1;
    const newItem = {
      id: newId,
      itemId: selectedItem.itemId,
      itemCode: selectedItem.itemCode,
      itemName: selectedItem.itemName,
      description: selectedItem.description || "",
      uom: selectedItem.uom || "Nos",
      requestedQty: 1,
      currentStock: selectedItem.currentStock || 0,
      reason: "",
      unitPrice: selectedItem.unitPrice || 0,
      category: selectedItem.category || "",
      brand: selectedItem.brand || "",
      supplierId: selectedItem.supplierId || null,
      gstRate: selectedItem.gstRate || 0,
      gstHsnCode: selectedItem.gstHsnCode || "",
      isGstApplicable: selectedItem.isGstApplicable || false,
    };
    setItems([...items, newItem]);
  };

  const addItem = () => {
    setShowItemSelector(true);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      setErrorMessage("At least one item is required");
    }
  };

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.requestedQty || 0), 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.length;
  }, [items]);

  const prepareRequestData = () => {
    if (!prData.requiredDate) {
      throw new Error("Please select a required date");
    }
    if (!prData.requestedBy) {
      throw new Error("Please enter requested by name");
    }
    if (!prData.department) {
      throw new Error("Please select a department");
    }
    if (!prData.warehouse) {
      throw new Error("Please select a warehouse");
    }
    if (items.length === 0) {
      throw new Error("Please add at least one item");
    }
    for (let item of items) {
      if (!item.itemName || item.itemName.trim() === "") {
        throw new Error("Please enter item name for all items");
      }
      if (item.requestedQty <= 0) {
        throw new Error("Requested quantity must be greater than 0");
      }
    }

    return {
      prDate: prData.prDate,
      requestedBy: prData.requestedBy,
      department: prData.department,
      warehouse: prData.warehouse,
      priority: prData.priority,
      requiredDate: prData.requiredDate,
      remarks: prData.remarks || null,
      
      supplierId: selectedSupplier ? parseInt(selectedSupplier) : null,
      items: items.map((item) => ({
        itemId: item.itemId || null,
        itemCode: item.itemCode || null,
        itemName: item.itemName,
        description: item.description || null,
        uom: item.uom,
        requestedQty: parseInt(item.requestedQty),
        currentStock: parseInt(item.currentStock) || 0,
        reason: item.reason || null,
        unitPrice: item.unitPrice || 0,
        category: item.category || null,
        brand: item.brand || null,
        supplierId: item.supplierId || null,
        gstRate: item.gstRate || 0,
        gstHsnCode: item.gstHsnCode || null,
        isGstApplicable: item.isGstApplicable || false,
      })),
    };
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorMessage("");

    try {
      const requestData = prepareRequestData();
      let result;

      if (mode === "edit" && savedPRId) {
        result = await updatePurchaseRequestAPI(savedPRId, requestData);
        if (onSuccess) {
          onSuccess(
            `Draft updated successfully! PR Number: ${result.prNumber}`,
          );
        }
      } else {
        result = await createPurchaseRequestAPI(requestData);
        setSavedPRId(result.id);
        setPrData((prev) => ({ ...prev, prNumber: result.prNumber }));
        if (onSuccess) {
          onSuccess(`Draft saved successfully! PR Number: ${result.prNumber}`);
        }
      }

      onClose();
    } catch (error) {
      console.error("Save draft error:", error);
      setErrorMessage(error.message || "Error saving draft. Please try again.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      let purchaseRequestId = savedPRId;
      let requestData;

      if (mode === "edit" && purchaseRequestId) {
        requestData = prepareRequestData();
        await updatePurchaseRequestAPI(purchaseRequestId, {...requestData, status:'PENDING'});
        
        if (onSuccess) {
          onSuccess(
            `Purchase Request updated successfully with ${prData.priority} priority!`,
          );
        }
        onClose();
        return;
      }

      if (!purchaseRequestId) {
        requestData = prepareRequestData();
        const created = await createPurchaseRequestAPI(requestData);
        purchaseRequestId = created.id;
        setSavedPRId(purchaseRequestId);
      }

      if (onSuccess) {
        onSuccess(
          `Purchase Request submitted successfully with ${prData.priority} priority!`,
        );
      }

      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(
        error.message || "Error submitting purchase request. Please try again.",
      );
    } finally {
      setSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase request...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
        <h2 className="text-xl font-semibold text-gray-800">
          {mode === "edit"
            ? "Edit Purchase Request"
            : "Create New Purchase Request"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Basic Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mode === "edit" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PR Number
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="font-medium text-blue-600">
                        {prData.prNumber}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PR Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="prDate"
                      value={prData.prDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requested By *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="requestedBy"
                      value={prData.requestedBy}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter requester name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={prData.department}
                      onChange={handleInputChange}
                      className="w-full pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Production">Production</option>
                      <option value="Quality">Quality</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warehouse *
                  </label>
                  <div className="relative">
                    <select
                      name="warehouse"
                      value={prData.warehouse}
                      onChange={handleInputChange}
                      className="w-full pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                      disabled={isLoadingWarehouses}
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.name || warehouse.warehouseId}>
                          {warehouse.name} ({warehouse.warehouseId}) - {warehouse.location || ""}
                        </option>
                      ))}
                    </select>
                    {isLoadingWarehouses && (
                      <p className="text-xs text-gray-400 mt-1">Loading warehouses...</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level *
                  </label>
                  <div className="relative">
                    <select
                      name="priority"
                      value={prData.priority}
                      onChange={handleInputChange}
                      className="w-full pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="LOW">Low - Standard Processing</option>
                      <option value="NORMAL">Normal - Regular Priority</option>
                      <option value="MEDIUM">Medium - Moderate Priority</option>
                      <option value="HIGH">High - Urgent Requirement</option>
                      <option value="URGENT">Urgent - Critical/Immediate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="requiredDate"
                      value={prData.requiredDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {prData.priority && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
                  <span className="text-sm text-gray-600">
                    Selected Priority:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(prData.priority)}`}
                  >
                    <Flag className="w-3 h-3" />
                    {prData.priority}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Request Items
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Qty *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "itemCode",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Code"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "itemName",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Item name"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.uom}
                          onChange={(e) =>
                            handleItemChange(item.id, "uom", e.target.value)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Kg">Kg</option>
                          <option value="Liters">Liters</option>
                          <option value="Boxes">Boxes</option>
                          <option value="Packs">Packs</option>
                          <option value="Rolls">Rolls</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.requestedQty}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "requestedQty",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="1"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.currentStock}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "currentStock",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="0"
                          placeholder="0"
                        />
                      </td>
                   
                      <td className="px-4 py-3">
                         <input
                          type="text"
                          value={item.reason}
                          onChange={(e) =>
                                                        handleItemChange(item.id, "reason", e.target.value)

                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Reason"
                          required
                        />
                       
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Summary & Additional Info
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
                    <textarea
                      name="remarks"
                      value={prData.remarks}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional information or special requirements..."
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Request Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Priority:</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(prData.priority)}`}
                      >
                        <Flag className="w-3 h-3" />
                        {prData.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-medium">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">
                        {prData.department || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Warehouse:</span>
                      <span className="font-medium">
                        {prData.warehouse || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                prData.priority === "URGENT"
                  ? "bg-red-600 hover:bg-red-700"
                  : prData.priority === "HIGH"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              <Send className="w-4 h-4" />
              {submitting
                ? "Submitting..."
                : mode === "edit"
                  ? "Update & Submit"
                  : "Save Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Item Selector Modal */}
      <ItemSelectorModal
        isOpen={showItemSelector}
        onClose={() => setShowItemSelector(false)}
        onSelectItem={handleSelectItemFromModal}
        selectedItems={items}
      />
    </div>
  );
}