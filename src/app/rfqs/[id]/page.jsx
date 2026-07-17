"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  Package,
  Truck,
  CreditCard,
  Building2,
  Send,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import ComparisonPopup from "../components/ComparisonPopup";

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

const getRFQByIdAPI = async (id) => {
  return apiRequest(`/rfqs/${id}`);
};

const submitVendorQuotationAPI = async (rfqId, data) => {
  return apiRequest(`/rfqs/${rfqId}/vendor-quotations`, "POST", data);
};

const compareQuotationsAPI = async (rfqId) => {
  return apiRequest(`/rfqs/${rfqId}/compare`, "POST");
};
// http://localhost:8081/xformwms/api/rfqs/vendor-quotations/13/convert-to-po

const ConvertPO = async (rfqId) => {
  return apiRequest(`/rfqs/vendor-quotations/${rfqId}/convert-to-po`, "POST");
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

export default function RFQDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params?.id;

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comparing, setComparing] = useState(false);

  const [comparisonData, setComparisonData] = useState(null);
  const [showComparisonPopup, setShowComparisonPopup] = useState(false);
  // Quotation Form State
  const [quotationForm, setQuotationForm] = useState({
    supplierId: "",
    quotationDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    validTill: "",
    discountAmount: 0,
    shippingCharges: 0,
    remarks: "",
    items: [],
  });

  // Supplier pagination state
  const [suppliers, setSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierTotalPages, setSupplierTotalPages] = useState(0);
  const [supplierTotalElements, setSupplierTotalElements] = useState(0);
  const [pageSize] = useState(10);

  useEffect(() => {
    if (rfqId) {
      loadRFQ();
    }
  }, [rfqId]);

  const loadRFQ = async () => {
    try {
      setLoading(true);
      const data = await getRFQByIdAPI(rfqId);
      setRfq(data);

      // Initialize quotation form with items from RFQ
      if (data && data.items) {
        const formItems = data.items.map((item) => ({
          itemCode: item.itemCode || "",
          itemName: item.itemName || "",
          description: item.description || "",
          uom: item.uom || "Nos",
          quantity: item.quantity || item.requestedQty || 0,
          unitPrice: 0,
          gstRate: item.gstRate || 0,
          cgstRate: item.cgstRate || 0,
          sgstRate: item.sgstRate || 0,
          discountPercentage: 0,
        }));
        setQuotationForm((prev) => ({
          ...prev,
          items: formItems,
        }));
      }
    } catch (error) {
      console.error("Error loading RFQ:", error);
      setErrorMessage("Failed to load RFQ details.");
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async (page = 0, search = "") => {
    try {
      setLoadingSuppliers(true);
      const response = await getSuppliersAPI(page, pageSize, search, true);
      const supplierData = response.data || [];
      setAllSuppliers(supplierData);

      // Filter suppliers based on RFQ's supplierIds
      if (rfq && rfq.supplierIds) {
        let supplierIds = [];
        try {
          if (typeof rfq.supplierIds === "string") {
            supplierIds = JSON.parse(rfq.supplierIds);
          } else if (Array.isArray(rfq.supplierIds)) {
            supplierIds = rfq.supplierIds;
          }
        } catch (e) {
          console.error("Error parsing supplierIds:", e);
        }

        if (supplierIds.length > 0) {
          const filtered = supplierData.filter((supplier) =>
            supplierIds.includes(supplier.id),
          );
          setSuppliers(filtered);
        } else {
          setSuppliers(supplierData);
        }
      } else {
        setSuppliers(supplierData);
      }

      setSupplierTotalPages(response.totalPages || 0);
      setSupplierTotalElements(response.total || 0);
      setSupplierPage(response.page || 0);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setErrorMessage("Failed to load suppliers.");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleSupplierSearch = (searchTerm) => {
    setSupplierSearchTerm(searchTerm);
    loadSuppliers(0, searchTerm);
  };

  const handleSupplierPageChange = (newPage) => {
    if (newPage >= 0 && newPage < supplierTotalPages) {
      setSupplierPage(newPage);
      loadSuppliers(newPage, supplierSearchTerm);
    }
  };

  const handleQuotationChange = (e) => {
    const { name, value } = e.target;
    setQuotationForm((prev) => ({
      ...prev,
      [name]:
        name === "discountAmount" || name === "shippingCharges"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...quotationForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]:
        field === "unitPrice" ||
        field === "gstRate" ||
        field === "cgstRate" ||
        field === "sgstRate" ||
        field === "discountPercentage" ||
        field === "quantity"
          ? parseFloat(value) || 0
          : value,
    };
    setQuotationForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validate
      if (!quotationForm.supplierId) {
        throw new Error("Please select a supplier");
      }
      if (!quotationForm.deliveryDate) {
        throw new Error("Please select delivery date");
      }
      if (!quotationForm.validTill) {
        throw new Error("Please select validity date");
      }

      // Check if any item has unit price
      const hasUnitPrice = quotationForm.items.some(
        (item) => item.unitPrice > 0,
      );
      if (!hasUnitPrice) {
        throw new Error("Please enter unit price for at least one item");
      }

      const submitData = {
        supplierId: parseInt(quotationForm.supplierId),
        quotationDate: quotationForm.quotationDate,
        deliveryDate: quotationForm.deliveryDate,
        validTill: quotationForm.validTill,
        discountAmount: quotationForm.discountAmount || 0,
        shippingCharges: quotationForm.shippingCharges || 0,
        remarks: quotationForm.remarks || "",
        items: quotationForm.items.map((item) => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description || "",
          uom: item.uom,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          gstRate: item.gstRate || 0,
          cgstRate: item.cgstRate || 0,
          sgstRate: item.sgstRate || 0,
          discountPercentage: item.discountPercentage || 0,
        })),
      };

      await submitVendorQuotationAPI(rfqId, submitData);

      setSuccessMessage("Quotation submitted successfully!");
      setShowQuotationForm(false);

      // Reload RFQ to get updated data
      await loadRFQ();

      // Auto-compare quotations after submission
      await handleCompareQuotations();
    } catch (error) {
      console.error("Error submitting quotation:", error);
      setErrorMessage(error.message || "Failed to submit quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompareQuotations = async () => {
    try {
      setComparing(true);
      const result = await compareQuotationsAPI(rfqId);

      // The API returns the comparison data directly
      // Store it in state and show the popup
      setComparisonData(result);
      setShowComparisonPopup(true);

      // Reload RFQ to get updated data with ranks
      await loadRFQ();
    } catch (error) {
      console.error("Error comparing quotations:", error);
      setErrorMessage("Failed to compare quotations.");
    } finally {
      setComparing(false);
    }
  };
  const handleConvertToPO = async (quotationId) => {
    try {
      const result = await ConvertPO(quotationId);
      setSuccessMessage("Quotation converted to PO successfully!");
      // Reload the data
      await loadRFQ();
      // Close the popup
      setShowComparisonPopup(false);
      setComparisonData(null);
    } catch (error) {
      console.error("Error converting to PO:", error);
      setErrorMessage("Failed to convert quotation to PO.");
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
      SUBMITTED: "bg-purple-100 text-purple-700 border-purple-200",
      APPROVED: "bg-green-100 text-green-700 border-green-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
      COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-200",
      EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
      CANCELLED: "bg-red-100 text-red-500 border-red-200",
    };
    return colors[status] || colors.DRAFT;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "items", label: "Items", icon: Package },
    { id: "quotations", label: "Quotations", icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">RFQ Not Found</h2>
          <p className="text-gray-600 mt-2">
            The requested RFQ could not be found.
          </p>
          <button
            onClick={() => router.push("/rfqs")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to RFQs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-slide-down">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-slide-down">
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

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/rfqs")}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {rfq.rfqNumber}
                  </h1>
                  <p className="text-blue-100 text-sm">
                    PR: {rfq.prNumber} | Reference:{" "}
                    {rfq.referenceNumber || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(rfq.status)}`}
                >
                  {rfq.status?.replace(/_/g, " ") || "N/A"}
                </span>
                <button
                  onClick={loadRFQ}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === "quotations" && (
                      <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {rfq.vendorQuotations?.length || 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <OverviewTab
                rfq={rfq}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                getStatusBadgeColor={getStatusBadgeColor}
              />
            )}

            {activeTab === "items" && <ItemsTab rfq={rfq} />}

            {activeTab === "quotations" && (
              <QuotationsTab
                rfq={rfq}
                formatDate={formatDate}
                onAddQuotation={() => {
                  setShowQuotationForm(true);
                  loadSuppliers(0, "");
                }}
                load={() => loadRFQ()}
                ConvertPO={ConvertPO}
                onCompare={handleCompareQuotations}
                comparing={comparing}
                setSuccessMessage={setSuccessMessage}
              />
            )}
          </div>
        </div>

        {/* Submit Quotation Modal */}
        {showQuotationForm && (
          <QuotationFormModal
            rfq={rfq}
            quotationForm={quotationForm}
            setQuotationForm={setQuotationForm}
            suppliers={suppliers}
            allSuppliers={allSuppliers}
            supplierSearchTerm={supplierSearchTerm}
            setSupplierSearchTerm={setSupplierSearchTerm}
            loadingSuppliers={loadingSuppliers}
            supplierPage={supplierPage}
            supplierTotalPages={supplierTotalPages}
            supplierTotalElements={supplierTotalElements}
            onSearch={handleSupplierSearch}
            onPageChange={handleSupplierPageChange}
            onSubmit={handleSubmitQuotation}
            onClose={() => setShowQuotationForm(false)}
            submitting={submitting}
            handleQuotationChange={handleQuotationChange}
            handleItemChange={handleItemChange}
          />
        )}
        {showComparisonPopup && comparisonData && (
          <ComparisonPopup
            data={comparisonData}
            onClose={() => {
              setShowComparisonPopup(false);
              setComparisonData(null);
            }}
            onConvertToPO={handleConvertToPO}
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
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ rfq, formatDate, formatDateTime, getStatusBadgeColor }) {
  // Parse supplierIds for display
  let supplierIds = [];
  try {
    if (typeof rfq.supplierIds === "string") {
      supplierIds = JSON.parse(rfq.supplierIds);
    } else if (Array.isArray(rfq.supplierIds)) {
      supplierIds = rfq.supplierIds;
    }
  } catch (e) {
    console.error("Error parsing supplierIds:", e);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">RFQ Date</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(rfq.rfqDate)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Closing Date</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(rfq.closingDate)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border inline-block ${getStatusBadgeColor(rfq.status)}`}
          >
            {rfq.status?.replace(/_/g, " ") || "N/A"}
          </span>
        </div>
      </div>

      {/* Show Supplier IDs */}
      {supplierIds.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Associated Suppliers
          </h4>
          <div className="flex flex-wrap gap-2">
            {supplierIds.map((id, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                Supplier #{id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rfq.deliveryTerms && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">Delivery Terms</span>
            </div>
            <p className="text-sm text-gray-900">{rfq.deliveryTerms}</p>
          </div>
        )}
        {rfq.paymentTerms && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Payment Terms</span>
            </div>
            <p className="text-sm text-gray-900">{rfq.paymentTerms}</p>
          </div>
        )}
        {rfq.termsAndConditions && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Terms & Conditions</span>
            </div>
            <p className="text-sm text-gray-900">{rfq.termsAndConditions}</p>
          </div>
        )}
      </div>

      {rfq.remarks && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Remarks</h4>
          <p className="text-sm text-gray-600">{rfq.remarks}</p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 flex justify-between text-xs text-gray-500">
        <span>Created: {formatDateTime(rfq.createdAt)}</span>
        <span>Updated: {formatDateTime(rfq.updatedAt)}</span>
      </div>
    </div>
  );
}

// Items Tab Component - Improved Layout
function ItemsTab({ rfq }) {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Items ({rfq.items?.length || 0})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Item Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Item Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                UOM
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rfq.items?.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                  {item.itemCode || "-"}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.itemName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                  {item.description || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {item.uom || "Nos"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                  {item.quantity || item.requestedQty || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  ₹{(item.estimatedUnitPrice || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  ₹{(item.estimatedTotal || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan="5"
                className="px-4 py-3 text-sm font-medium text-gray-700 text-right border-t"
              >
                Total Items:
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right border-t">
                {rfq.items?.length || 0}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right border-t">
                ₹
                {(
                  rfq.items?.reduce(
                    (sum, item) =>
                      sum +
                      (item.estimatedUnitPrice || 0) *
                        (item.quantity || item.requestedQty || 0),
                    0,
                  ) || 0
                ).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* Comparison Popup */}
    </div>
  );
}

// Quotations Tab Component
function QuotationsTab({
  rfq,
  formatDate,
  onAddQuotation,
  onCompare,
  comparing,
  ConvertPO,
  setSuccessMessage,
  load,
}) {
  const handleCOnvertToPO = async (quotationId) => {
    const result = await ConvertPO(quotationId);
    console.log("jjj", result);
    setSuccessMessage("Quotation converted to PO successfully!");
    load()
  };
  return (
    <div>
      <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Vendor Quotations ({rfq.vendorQuotations?.length || 0})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onAddQuotation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Quotation
          </button>
          {rfq.vendorQuotations && rfq.vendorQuotations.length > 1 && (
            <button
              onClick={onCompare}
              disabled={comparing}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
            >
              {comparing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Compare Quotations
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {rfq.vendorQuotations?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No quotations received yet
        </div>
      ) : (
        <div className="space-y-6">
          {rfq.vendorQuotations?.map((quotation, index) => (
            <div
              key={quotation.id || index}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`px-4 py-3 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2 ${
                  quotation.rank === 1 ? "bg-green-50" : "bg-gray-50"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {quotation.quotationNumber}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-3 h-3" />
                    <span>{quotation.supplierName}</span>
                    {quotation.supplierCode && (
                      <span className="text-xs text-gray-400">
                        ({quotation.supplierCode})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCOnvertToPO(quotation.id)}
                    disabled={comparing}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
                  >
                    Convert To PO
                  </button>
                  {quotation.rank && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        quotation.rank === 1
                          ? "bg-green-100 text-green-800"
                          : quotation.rank === 2
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Rank #{quotation.rank}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      quotation.status === "COMPARED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {quotation.status || "PENDING"}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">
                      Quotation Date
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(quotation.quotationDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Delivery Date</span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(quotation.deliveryDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Valid Till</span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(quotation.validTill)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Grand Total</span>
                    <p
                      className={`text-sm font-bold ${
                        quotation.rank === 1
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      ₹{quotation.grandTotal?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                {quotation.items && quotation.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Item
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            UOM
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                            Unit Price
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {quotation.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 py-2 text-gray-900 font-medium">
                              {item.itemName}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {item.uom || "Nos"}
                            </td>
                            <td className="px-3 py-2 text-gray-900 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-gray-900 text-right">
                              ₹{item.unitPrice?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900 text-right">
                              ₹{item.totalAmount?.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {quotation.remarks && (
                  <div className="mt-3 text-xs text-gray-500">
                    <span className="font-medium">Remarks:</span>{" "}
                    {quotation.remarks}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Quotation Form Modal Component
function QuotationFormModal({
  rfq,
  quotationForm,
  setQuotationForm,
  suppliers,
  allSuppliers,
  supplierSearchTerm,
  setSupplierSearchTerm,
  loadingSuppliers,
  supplierPage,
  supplierTotalPages,
  supplierTotalElements,
  onSearch,
  onPageChange,
  onSubmit,
  onClose,
  submitting,
  handleQuotationChange,
  handleItemChange,
}) {
  // Parse supplierIds from RFQ
  let supplierIds = [];
  try {
    if (typeof rfq?.supplierIds === "string") {
      supplierIds = JSON.parse(rfq.supplierIds);
    } else if (Array.isArray(rfq?.supplierIds)) {
      supplierIds = rfq.supplierIds;
    }
  } catch (e) {
    console.error("Error parsing supplierIds:", e);
  }

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSupplierSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Submit Vendor Quotation
              </h2>
              <p className="text-sm text-gray-500">
                {rfq?.rfqNumber} - {rfq?.prNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6">
            {/* Supplier Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Supplier *
              </label>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={supplierSearchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              {/* Supplier List */}
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {loadingSuppliers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-1">
                      Loading suppliers...
                    </p>
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {supplierSearchTerm
                      ? "No suppliers found matching your search"
                      : "No suppliers available"}
                  </div>
                ) : (
                  suppliers.map((supplier) => {
                    const isInRFQ = supplierIds.includes(supplier.id);
                    return (
                      <div
                        key={supplier.id}
                        onClick={() => {
                          if (!submitting && isInRFQ) {
                            handleQuotationChange({
                              target: {
                                name: "supplierId",
                                value: supplier.id.toString(),
                              },
                            });
                          }
                        }}
                        className={`px-4 py-2 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                          parseInt(quotationForm.supplierId) === supplier.id
                            ? "bg-blue-50"
                            : isInRFQ
                              ? "hover:bg-gray-50"
                              : "opacity-50 cursor-not-allowed bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span
                                className={`font-medium ${isInRFQ ? "text-gray-900" : "text-gray-400"}`}
                              >
                                {supplier.name}
                              </span>
                              {!isInRFQ && (
                                <span className="text-xs text-red-400">
                                  (Not in RFQ)
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-sm ml-6 ${isInRFQ ? "text-gray-500" : "text-gray-400"}`}
                            >
                              {supplier.code}{" "}
                              {supplier.contactPerson &&
                                `- ${supplier.contactPerson}`}
                            </div>
                          </div>
                          {parseInt(quotationForm.supplierId) ===
                            supplier.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {supplierTotalPages > 0 && (
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-gray-500">
                    Showing {suppliers.length} of {supplierTotalElements}{" "}
                    suppliers
                    {supplierIds.length > 0 &&
                      ` (${supplierIds.length} in RFQ)`}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPageChange(supplierPage - 1)}
                      disabled={supplierPage === 0}
                      className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {supplierPage + 1} / {supplierTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPageChange(supplierPage + 1)}
                      disabled={supplierPage === supplierTotalPages - 1}
                      className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quotation Date *
                </label>
                <input
                  type="date"
                  name="quotationDate"
                  value={quotationForm.quotationDate}
                  onChange={handleQuotationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={quotationForm.deliveryDate}
                  onChange={handleQuotationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Till *
                </label>
                <input
                  type="date"
                  name="validTill"
                  value={quotationForm.validTill}
                  onChange={handleQuotationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Items *
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">
                        Item
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">
                        UOM
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                        Unit Price *
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                        GST %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotationForm.items.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {item.itemCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{item.uom}</td>
                        <td className="px-3 py-2 text-right text-gray-900 font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-end">
                          <input
                            type="number"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitPrice",
                                e.target.value,
                              )
                            }
                            className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            disabled={submitting}
                          />
                        </td>
                        <td className="px-3 py-2  text-end">
                          <input
                            type="number"
                            value={item.gstRate || ""}
                            onChange={(e) =>
                              handleItemChange(index, "gstRate", e.target.value)
                            }
                            className="w-16 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                            step="0.01"
                            min="0"
                            disabled={submitting}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Charges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  name="discountAmount"
                  value={quotationForm.discountAmount || ""}
                  onChange={handleQuotationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Charges
                </label>
                <input
                  type="number"
                  name="shippingCharges"
                  value={quotationForm.shippingCharges || ""}
                  onChange={handleQuotationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={quotationForm.remarks}
                onChange={handleQuotationChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional remarks..."
                disabled={submitting}
              />
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
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Quotation
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
