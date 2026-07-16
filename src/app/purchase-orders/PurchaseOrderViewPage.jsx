// PurchaseOrderViewModal.jsx - Fixed version with proper PDF handling
"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import {
  X,
  Calendar,
  Truck,
  FileText,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Package,
  Clock,
  User,
  Hash,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Printer,
  Download,
  Send,
  Edit,
  Loader2,
} from "lucide-react";
import PurchaseOrderPrintView from "./PurchaseOrderPrintView";

// Import PDF components dynamically only on client
const PDFDownloadLink = React.lazy(() => 
  import("@react-pdf/renderer").then(module => ({
    default: module.PDFDownloadLink
  }))
);

const PurchaseOrderPDF = React.lazy(() => 
  import("@/components/PurchaseOrderPDF")
);

export default function PurchaseOrderViewModal({
  po,
  onClose,
  formatDate,
  formatDateTime,
  formatCurrency,
  getStatusBadgeColor,
  onEdit,
  onSubmit,
  onPrint,
  onDownload,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPDFDownload, setShowPDFDownload] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!po) return null;

  const getLineStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      RECEIVED: "bg-green-100 text-green-700",
      PARTIAL: "bg-orange-100 text-orange-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusIcon = (status) => {
    const icons = {
      DRAFT: <Clock className="w-5 h-5 text-gray-500" />,
      PENDING: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      SUBMITTED: <Send className="w-5 h-5 text-blue-500" />,
      APPROVED: <CheckCircle className="w-5 h-5 text-green-500" />,
      REJECTED: <XCircle className="w-5 h-5 text-red-500" />,
      PARTIAL: <AlertCircle className="w-5 h-5 text-orange-500" />,
      COMPLETED: <CheckCircle className="w-5 h-5 text-purple-500" />,
      CANCELLED: <XCircle className="w-5 h-5 text-red-500" />,
      IN_PROGRESS: <Clock className="w-5 h-5 text-indigo-500" />,
    };
    return icons[status] || icons.DRAFT;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    if (!printWindow) {
      alert('Please allow pop-ups to print the document.');
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(
      <PurchaseOrderPrintView
        po={po}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
    );

    setTimeout(() => {
      const content = container.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${po.poNumber} - Purchase Order</title>
            <meta charset="utf-8" />
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                background: white; 
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 20px;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
      setTimeout(() => {
        document.body.removeChild(container);
      }, 1000);
    }, 800);
  };

  // Simplified PDF download using direct import
  const handleDirectDownload = useCallback(async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setPdfError(null);
    
    try {
      // Dynamic import of PDF components
      const [{ PDFDownloadLink: PDFLink }, { default: PDFDoc }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/PurchaseOrderPDF')
      ]);

      // Create a temporary container for the PDF
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);

      // Create a root and render the PDF download link
      const root = ReactDOM.createRoot(container);
      
      // Render the PDFDownloadLink which will trigger the download
      root.render(
        <PDFLink
          document={<PDFDoc po={po} formatDate={formatDate} />}
          fileName={`${po.poNumber}.pdf`}
        >
          {({ loading }) => {
            if (loading) {
              return <span>Loading...</span>;
            }
            // This will trigger download
            return <span>Download</span>;
          }}
        </PDFLink>
      );

      // Find the download link and click it
      setTimeout(() => {
        const link = container.querySelector('a');
        if (link) {
          link.click();
        }
        // Cleanup
        setTimeout(() => {
          root.unmount();
          document.body.removeChild(container);
        }, 1000);
      }, 100);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      setPdfError('Failed to generate PDF. Please use Print option instead.');
      // Fallback to print
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  }, [po, formatDate, isDownloading]);

  // Alternative: Use window.open with print for PDF
  const handleFallbackDownload = useCallback(() => {
    handlePrint();
  }, []);

  // PDF Download Button Component
  const PDFDownloadButton = () => {
    if (pdfError) {
      return (
        <button
          onClick={handleFallbackDownload}
          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
          title="Print as PDF"
        >
          <Printer className="w-5 h-5" />
        </button>
      );
    }

    return (
      <button
        onClick={handleDirectDownload}
        disabled={isDownloading}
        className={`p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ${
          isDownloading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Download PDF"
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header - Status Bar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {po.poNumber}
                  </h2>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(po.status)}`}
                  >
                    {getStatusIcon(po.status)}
                    <span>{po.status?.replace(/_/g, " ") || "N/A"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {po.supplierName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    PR:{" "}
                    {po.purchaseRequestNumber
                      ? `PR-${po.purchaseRequestNumber}`
                      : "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(po.poDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {po.status === "DRAFT" && (
                  <>
                    <button
                      onClick={() => onEdit && onEdit(po)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit PO"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onSubmit && onSubmit(po)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Submit PO"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Print PO"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <PDFDownloadButton />
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Rest of the modal content - unchanged */}
          <div className="p-6 space-y-6">
            {/* Key Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    PO Date
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(po.poDate)}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <Truck className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Expected Arrival
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(po.expectedArrivalDate)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Total Items
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {po.lines?.length || 0}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Grand Total
                  </span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(po.grandTotal)}
                </p>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Supplier Information
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Supplier Name
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {po.supplierName}
                    </p>
                  </div>
                  {po.supplierEmail && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {po.supplierEmail}
                      </p>
                    </div>
                  )}
                  {po.supplierPhone && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {po.supplierPhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses */}
            {(po.shippingAddress || po.billingAddress) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {po.shippingAddress && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Shipping Address
                      </h3>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-900 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {po.shippingAddress}
                      </p>
                    </div>
                  </div>
                )}
                {po.billingAddress && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Billing Address
                      </h3>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-900 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {po.billingAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PO Lines */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Purchase Order Lines
                </h3>
                <span className="text-sm text-gray-500">
                  Total: {po.lines?.length || 0} items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {po.lines?.map((line, index) => (
                      <tr
                        key={line.id || index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {line.itemCode || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {line.itemName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {line.uom || "Nos"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {line.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(line.totalPrice)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getLineStatusColor(line.lineStatus)}`}
                          >
                            {line.lineStatus || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Financial Summary
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(po.subtotal)}
                    </span>
                  </div>
                  {po.discountAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-600">Discount</span>
                      <span className="text-sm font-medium text-red-600">
                        -{formatCurrency(po.discountAmount)}
                      </span>
                    </div>
                  )}
                  {po.shippingCharges > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-600">
                        Shipping Charges
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(po.shippingCharges)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Total GST</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(po.totalGst)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-800">
                      Grand Total
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(po.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Order Timeline
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">
                      {formatDateTime(po.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-900">
                      {formatDateTime(po.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">PO Date</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(po.poDate)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">
                      Expected Arrival
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(po.expectedArrivalDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {po.remarks && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Remarks
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">{po.remarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              PO ID: {po.id} • Version: {po.version || 1}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
              {po.status === "DRAFT" && (
                <>
                  <button
                    onClick={() => onEdit && onEdit(po)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit PO
                  </button>
                  <button
                    onClick={() => onSubmit && onSubmit(po)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit PO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}