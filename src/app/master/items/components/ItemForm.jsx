"use client";
import apiRequest from "@/components/apiRequest";
import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import UomSelect from "@/components/UomSelect";

const createItemAPI = async (itemData) => {
  return apiRequest("/items", "POST", itemData);
};

const updateItemAPI = async (id, itemData) => {
  return apiRequest(`/items/${id}`, "PUT", itemData);
};

const getItemByIdAPI = async (id) => {
  return apiRequest(`/items/${id}`);
};

export default function ItemForm({
  isOpen = false,
  onClose,
  onSuccess,
  mode = "create",
  itemId = null,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Import state
  const [file, setFile] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // UOM, Category, Brand & Tax options state
  const [uomOptions, setUomOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [gstOptions, setGstOptions] = useState([]);

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    description: "",
    uom: "Nos",
    gstRate: 18.0,
    gstHsnCode: "",
    isGstApplicable: true,
    cgstRate: 9.0,
    sgstRate: 9.0,
    unitPrice: 0.0,
    currentStock: 0,
    minStockLevel: 5,
    reorderLevel: 10,
    category: "",
    brand: "",
    supplierId: null,
    isActive: true,
    notes: "",
  });

  useEffect(() => {
    if (isOpen && mode !== "import") {
      fetchUomOptions();
      fetchCategoryOptions();
      fetchBrandOptions();
      fetchGstOptions();
    }
  }, [isOpen, mode]);

  const fetchUomOptions = async () => {
    try {
      const response = await apiRequest("/uoms?page=0&size=100");
      let list = [];
      if (response && response.content) {
        list = response.content;
      } else if (Array.isArray(response)) {
        list = response;
      }
      if (list && list.length > 0) {
        setUomOptions(list);
      }
    } catch (err) {
      console.error("Error fetching UOM options:", err);
    }
  };

  const fetchCategoryOptions = async () => {
    try {
      const response = await apiRequest("/categories?page=0&size=100");
      let list = [];
      if (response && response.content) {
        list = response.content;
      } else if (Array.isArray(response)) {
        list = response;
      }
      if (list && list.length > 0) {
        setCategoryOptions(list);
      }
    } catch (err) {
      console.error("Error fetching Category options:", err);
    }
  };

  const fetchBrandOptions = async () => {
    try {
      const response = await apiRequest("/brands?page=0&size=100");
      let list = [];
      if (response && response.content) {
        list = response.content;
      } else if (Array.isArray(response)) {
        list = response;
      }
      if (list && list.length > 0) {
        setBrandOptions(list);
      }
    } catch (err) {
      console.error("Error fetching Brand options:", err);
    }
  };

  const fetchGstOptions = async () => {
    try {
      const response = await apiRequest("/gst?page=0&size=100");
      let list = [];
      if (response && response.content) {
        list = response.content;
      } else if (Array.isArray(response)) {
        list = response;
      }
      if (list && list.length > 0) {
        setGstOptions(list);
      }
    } catch (err) {
      console.error("Error fetching Tax options:", err);
    }
  };

  // Load data when in edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && itemId) {
      loadItemData();
    } else if (isOpen && mode === "create") {
      resetForm();
    } else if (isOpen && mode === "import") {
      resetImportState();
    }
  }, [isOpen, mode, itemId]);

  // Auto-close on success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onSuccess, onClose]);

  // Auto-clear error messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const resetForm = () => {
    setFormData({
      itemCode: "",
      itemName: "",
      description: "",
      uom: "Nos",
      gstRate: 18.0,
      gstHsnCode: "",
      isGstApplicable: true,
      cgstRate: 9.0,
      sgstRate: 9.0,
      unitPrice: 0.0,
      currentStock: 0,
      minStockLevel: 5,
      reorderLevel: 10,
      category: "",
      brand: "",
      supplierId: null,
      isActive: true,
      notes: "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowSuccess(false);
  };

  const resetImportState = () => {
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
    setOverwrite(false);
    setErrorMessage("");
    setSuccessMessage("");
    setShowSuccess(false);
  };

  const loadItemData = async () => {
    try {
      setLoading(true);
      const item = await getItemByIdAPI(itemId);
      setFormData({
        itemCode: item.itemCode || "",
        itemName: item.itemName || "",
        description: item.description || "",
        uom: item.uom || "Nos",
        gstRate: item.gstRate || 18.0,
        gstHsnCode: item.gstHsnCode || "",
        isGstApplicable:
          item.isGstApplicable !== undefined ? item.isGstApplicable : true,
        cgstRate: item.cgstRate || 9.0,
        sgstRate: item.sgstRate || 9.0,
        unitPrice: item.unitPrice || 0,
        currentStock: item.currentStock || 0,
        minStockLevel: item.minStockLevel || 5,
        reorderLevel: item.reorderLevel || 10,
        category: item.category || "",
        brand: item.brand || "",
        supplierId: item.supplierId || null,
        isActive: item.isActive !== undefined ? item.isActive : true,
        notes: item.notes || "",
      });
    } catch (error) {
      console.error("Error loading item:", error);
      setErrorMessage("Failed to load item details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? parseFloat(value) || 0
            : value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setErrorMessage("");
    setImportResult(null);

    if (selectedFile) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setErrorMessage("Please upload a valid Excel file (.xlsx or .xls)");
        setFile(null);
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrorMessage("File size should be less than 10MB");
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("overwrite", overwrite);

    try {
      const response = await api.post("/items/bulk/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      });

      const result = response.data.data || response.data;
      setImportResult(result);

      if (result.successCount > 0) {
        setSuccessMessage(
          `Successfully imported ${result.successCount} items!`,
        );
        setShowSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setErrorMessage(`Import failed. ${result.failureCount} errors found.`);
      }
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Import failed. Please check the file and try again.",
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Updated download template function using public folder
  const handleDownloadTemplate = () => {
    try {
      // Create a link to download the template from the public folder
      const link = document.createElement("a");
      link.href = "/item_import_template.xlsx";
      link.download = "item_import_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading template:", error);
      setErrorMessage("Failed to download template. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage("");

      // Validate required fields
      if (!formData.itemCode || !formData.itemName) {
        setErrorMessage("Item Code and Item Name are required.");
        setLoading(false);
        return;
      }

      // Calculate CGST and SGST if Tax is applicable
      if (formData.isGstApplicable && formData.gstRate > 0) {
        const halfGst = formData.gstRate / 2;
        formData.cgstRate = halfGst;
        formData.sgstRate = halfGst;
      }

      let response;
      if (mode === "edit") {
        response = await updateItemAPI(itemId, formData);
        setSuccessMessage("Item updated successfully!");
      } else {
        response = await createItemAPI(formData);
        setSuccessMessage("Item created successfully!");
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("Error saving item:", error);
      setErrorMessage(
        `Failed to ${mode === "edit" ? "update" : "create"} item: ${error.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render Import Mode
  if (mode === "import") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600 mr-2" />
                  Bulk Import Items
                </h2>
                <p className="text-sm text-gray-500">
                  Import multiple items from an Excel file
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6">
              {/* Success Message */}
              {showSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-green-800">{successMessage}</span>
                </div>
              )}

              {/* Error Display */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                  <button
                    onClick={() => setErrorMessage("")}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className="mb-4 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Import Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">
                        Total Records
                      </span>
                      <p className="font-bold">
                        {importResult.totalRecords || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Success</span>
                      <p className="font-bold text-green-600">
                        {importResult.successCount || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Failed</span>
                      <p className="font-bold text-red-600">
                        {importResult.failureCount || 0}
                      </p>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-red-600 mb-1">
                        Errors:
                      </h5>
                      <div className="max-h-40 overflow-y-auto bg-red-50 p-2 rounded">
                        {importResult.errors.map((err, idx) => (
                          <div key={idx} className="text-xs text-red-700 mb-1">
                            Row {err.rowNumber}: {err.errorMessage}
                            {err.itemCode && ` (${err.itemCode})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          disabled={loading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Excel files only (.xlsx, .xls) up to 10MB
                    </p>
                    {file && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          ✅ Selected: {file.name} (
                          {(file.size / 1024).toFixed(0)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="overwrite"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label
                    htmlFor="overwrite"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Overwrite existing items with same item code
                  </label>
                </div>
              </div>

              {/* Download Template */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Excel Template
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Items
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

  // Render Create/Edit Mode
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === "edit" ? "Edit Item" : "Create New Item"}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === "edit"
                  ? "Update item details"
                  : "Add a new item to inventory"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading && mode === "edit" ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading item details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    value={formData.itemCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={mode === "edit"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UOM
                  </label>
                  <UomSelect
                    name="uom"
                    value={formData.uom}
                    onChange={handleChange}
                    fallbackOptions={[
                      "Nos",
                      "Kg",
                      "KG",
                      "Gm",
                      "Ltr",
                      "Mtr",
                      "Pcs",
                      "Box",
                      "Pack",
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.id || cat.code} value={cat.name}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                    {formData.category &&
                      !categoryOptions.some(
                        (c) =>
                          c.name?.toLowerCase() ===
                            formData.category?.toLowerCase() ||
                          c.code?.toLowerCase() ===
                            formData.category?.toLowerCase(),
                      ) && (
                        <option value={formData.category}>
                          {formData.category}
                        </option>
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Brand</option>
                    {brandOptions.map((b) => (
                      <option key={b.id || b.code} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                    {formData.brand &&
                      !brandOptions.some(
                        (b) =>
                          b.name?.toLowerCase() ===
                            formData.brand?.toLowerCase() ||
                          b.code?.toLowerCase() ===
                            formData.brand?.toLowerCase(),
                      ) && (
                        <option value={formData.brand}>{formData.brand}</option>
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <select
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gstRate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {gstOptions.length > 0 ? (
                      gstOptions.map((g) => (
                        <option key={g.id || g.code} value={g.rate}>
                          {g.name} ({g.rate}%)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </>
                    )}
                    {formData.gstRate !== undefined &&
                      formData.gstRate !== null &&
                      gstOptions.length > 0 &&
                      !gstOptions.some((g) => g.rate === formData.gstRate) && (
                        <option value={formData.gstRate}>
                          {formData.gstRate}%
                        </option>
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax HSN Code
                  </label>
                  <input
                    type="text"
                    name="gstHsnCode"
                    value={formData.gstHsnCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier ID
                  </label>
                  <input
                    type="number"
                    name="supplierId"
                    value={formData.supplierId || ""}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-full flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isGstApplicable"
                      checked={formData.isGstApplicable}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      Tax Applicable
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || showSuccess}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === "edit" ? "Update Item" : "Create Item"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
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
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
