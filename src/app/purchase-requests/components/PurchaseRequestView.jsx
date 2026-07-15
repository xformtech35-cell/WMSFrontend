"use client";
import React, { useRef } from "react";
import {
  XCircle,
  Flag,
  Calendar,
  User,
  Building,
  Warehouse,
  FileText,
  Package,
  CheckCircle,
  XCircle as XCircleIcon,
  Clock,
  Printer,
  Download,
} from "lucide-react";

export default function PurchaseRequestView({ data, onClose }) {
  const printRef = useRef();

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

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-purple-100 text-purple-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DRAFT":
        return <Clock className="w-4 h-4" />;
      case "SUBMITTED":
        return <Clock className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircleIcon className="w-4 h-4" />;
      case "PARTIALLY_RECEIVED":
        return <Package className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const getTotalQuantity = () => {
    if (!data?.items) return 0;
    return data.items.reduce((sum, item) => sum + (item.requestedQty || 0), 0);
  };

  const getItemStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      RECEIVED: "bg-green-100 text-green-700",
      PARTIAL: "bg-blue-100 text-blue-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.PENDING;
  };

  // Generate complete HTML for print/PDF
  const generatePrintHTML = () => {
    // Generate item rows
    let itemRows = '';
    if (data?.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        itemRows += `
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px;">${item.itemCode || "-"}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px; font-weight: 500;">${item.itemName}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px;">${item.description || "-"}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px; text-align: center;">${item.uom}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px; text-align: right;">${item.requestedQty}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px; text-align: right;">${item.currentStock || 0}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px;">${item.reason || "-"}</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 13px; text-align: center;">
              <span style="background: ${item.itemStatus === 'RECEIVED' ? '#D1FAE5' : item.itemStatus === 'PARTIAL' ? '#DBEAFE' : item.itemStatus === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'}; 
                           color: ${item.itemStatus === 'RECEIVED' ? '#065F46' : item.itemStatus === 'PARTIAL' ? '#1E40AF' : item.itemStatus === 'REJECTED' ? '#991B1B' : '#92400E'}; 
                           padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500;">
                ${item.itemStatus || "PENDING"}
              </span>
            </td>
          </tr>
        `;
      });
    } else {
      itemRows = `
        <tr>
          <td colspan="8" style="padding: 20px; text-align: center; color: #6B7280;">No items found</td>
        </tr>
      `;
    }

    // Generate status info
    let statusInfo = data.status;
    if (data.submittedAt) statusInfo += ` | Submitted: ${formatDateTime(data.submittedAt)}`;
    if (data.approvedAt) statusInfo += ` | Approved: ${formatDateTime(data.approvedAt)}`;
    if (data.rejectionReason) statusInfo += ` | Reason: ${data.rejectionReason}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Request - ${data.prNumber}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: white;
              padding: 30px;
              color: #1F2937;
            }
            
            .print-container {
              max-width: 1100px;
              margin: 0 auto;
            }
            
            /* Header */
            .header {
              text-align: center;
              border-bottom: 3px double #1F2937;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #1F2937;
            }
            
            .header .subtitle {
              color: #6B7280;
              font-size: 14px;
              margin-top: 4px;
            }
            
            .header .pr-info {
              display: flex;
              justify-content: center;
              gap: 30px;
              margin-top: 10px;
              font-size: 14px;
            }
            
            .header .pr-info strong {
              font-weight: 600;
            }
            
            /* Status Banner */
            .status-banner {
              background: #F3F4F6;
              padding: 12px 16px;
              border-radius: 6px;
              margin-bottom: 25px;
              border-left: 4px solid ${data.status === 'APPROVED' ? '#16A34A' : data.status === 'REJECTED' ? '#DC2626' : data.status === 'SUBMITTED' ? '#2563EB' : '#6B7280'};
              font-size: 14px;
            }
            
            .status-banner .status-label {
              font-weight: 600;
            }
            
            /* Section */
            .section {
              margin-bottom: 25px;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .section-header {
              background: #F9FAFB;
              padding: 12px 20px;
              border-bottom: 1px solid #E5E7EB;
              font-size: 16px;
              font-weight: 600;
              color: #1F2937;
            }
            
            .section-body {
              padding: 20px;
            }
            
            /* Info Grid */
            .info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
            }
            
            .info-item {
              display: flex;
              flex-direction: column;
            }
            
            .info-item .label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6B7280;
              margin-bottom: 4px;
            }
            
            .info-item .value {
              font-size: 14px;
              font-weight: 500;
            }
            
            .info-item .value.blue {
              color: #2563EB;
            }
            
            .priority-badge {
              display: inline-block;
              padding: 2px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              background: ${data.priority === 'URGENT' ? '#FEE2E2' : data.priority === 'HIGH' ? '#FFEDD5' : data.priority === 'MEDIUM' ? '#FEF3C7' : data.priority === 'NORMAL' ? '#DBEAFE' : '#F3F4F6'};
              color: ${data.priority === 'URGENT' ? '#991B1B' : data.priority === 'HIGH' ? '#9A3412' : data.priority === 'MEDIUM' ? '#92400E' : data.priority === 'NORMAL' ? '#1E40AF' : '#374151'};
            }
            
            /* Table */
            .table-container {
              overflow-x: auto;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            
            thead {
              background: #F9FAFB;
            }
            
            th {
              padding: 10px 12px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6B7280;
              border-bottom: 2px solid #E5E7EB;
            }
            
            th.text-right {
              text-align: right;
            }
            
            th.text-center {
              text-align: center;
            }
            
            td {
              padding: 8px 12px;
              border-bottom: 1px solid #E5E7EB;
            }
            
            tr:last-child td {
              border-bottom: none;
            }
            
            /* Footer */
            .footer {
              text-align: center;
              font-size: 12px;
              color: #6B7280;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
              margin-top: 20px;
            }
            
            .footer .timestamp {
              margin-top: 4px;
            }
            
            /* Print styles */
            @media print {
              body {
                padding: 15px;
              }
              
              .no-print {
                display: none !important;
              }
              
              .section {
                page-break-inside: avoid;
              }
              
              table {
                page-break-inside: auto;
              }
              
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              
              thead {
                display: table-header-group;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Header -->
            <div class="header">
              <h1>PURCHASE REQUEST</h1>
              <div class="subtitle">Warehouse Management System</div>
              <div class="pr-info">
                <span><strong>PR Number:</strong> ${data.prNumber}</span>
                <span><strong>Date:</strong> ${formatDate(data.prDate)}</span>
                <span><strong>Status:</strong> ${data.status}</span>
              </div>
            </div>

            <!-- Status Banner -->
            <div class="status-banner">
              <span class="status-label">Status:</span> ${statusInfo}
            </div>

            <!-- Basic Information -->
            <div class="section">
              <div class="section-header">Basic Information</div>
              <div class="section-body">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">PR Number</span>
                    <span class="value blue">${data.prNumber}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">PR Date</span>
                    <span class="value">${formatDate(data.prDate)}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Requested By</span>
                    <span class="value">${data.requestedBy}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Department</span>
                    <span class="value">${data.department}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Warehouse</span>
                    <span class="value">${data.warehouse}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Priority</span>
                    <span class="priority-badge">${data.priority}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Required Date</span>
                    <span class="value">${formatDate(data.requiredDate)}</span>
                  </div>
                  ${data.supplierId ? `
                    <div class="info-item">
                      <span class="label">Supplier</span>
                      <span class="value">${data.supplierName || "N/A"}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="section">
              <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Request Items</span>
                <span style="font-size: 13px; font-weight: 400; color: #6B7280;">
                  Total Items: ${data.items?.length || 0} | Total Quantity: ${getTotalQuantity()}
                </span>
              </div>
              <div class="section-body" style="padding: 0;">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Description</th>
                        <th style="text-align: center;">UOM</th>
                        <th style="text-align: right;">Requested Qty</th>
                        <th style="text-align: right;">Current Stock</th>
                        <th>Reason</th>
                        <th style="text-align: center;">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemRows}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Additional Information -->
            ${(data.remarks || data.createdAt || data.updatedAt) ? `
              <div class="section">
                <div class="section-header">Additional Information</div>
                <div class="section-body">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    ${data.remarks ? `
                      <div style="grid-column: 1 / -1;">
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 4px;">Remarks</div>
                        <div style="font-size: 14px;">${data.remarks}</div>
                      </div>
                    ` : ''}
                    ${data.createdAt ? `
                      <div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 4px;">Created At</div>
                        <div style="font-size: 14px;">${formatDateTime(data.createdAt)}</div>
                      </div>
                    ` : ''}
                    ${data.updatedAt ? `
                      <div>
                        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 4px;">Last Updated</div>
                        <div style="font-size: 14px;">${formatDateTime(data.updatedAt)}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              <div>This is a system-generated document. For any queries, please contact the warehouse department.</div>
              <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Print function
  const handlePrint = () => {
    const printHTML = generatePrintHTML();
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (!printWindow) {
      alert('Please allow popups to print this document');
      return;
    }

    printWindow.document.write(printHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };

  // PDF Download function
  const handleDownloadPDF = () => {
    const printHTML = generatePrintHTML();
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (!printWindow) {
      alert('Please allow popups to download PDF');
      return;
    }

    printWindow.document.write(printHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: white;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          #print-area {
            width: 100%;
            background: white;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: 8px;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Purchase Request Details
            </h2>
            <span className="text-sm text-gray-500">#{data.prNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button> */}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Print Area */}
        <div id="print-area">
          {/* Print Header */}
          <div className="print-header text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">PURCHASE REQUEST</h1>
            <p className="text-sm text-gray-600">Warehouse Management System</p>
            <div className="mt-2 flex justify-center gap-8 text-sm">
              <span><strong>PR Number:</strong> {data.prNumber}</span>
              <span><strong>Date:</strong> {formatDate(data.prDate)}</span>
              <span><strong>Status:</strong> {data.status}</span>
            </div>
          </div>

          <div className="p-6">
            {/* Status Banner - Screen */}
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${getStatusColor(data.status)} no-print`}>
              {getStatusIcon(data.status)}
              <div>
                <span className="font-medium">Status: {data.status}</span>
                {data.submittedAt && (
                  <span className="text-sm ml-3 opacity-75">
                    Submitted on: {formatDateTime(data.submittedAt)}
                  </span>
                )}
                {data.approvedAt && (
                  <span className="text-sm ml-3 opacity-75">
                    Approved on: {formatDateTime(data.approvedAt)}
                  </span>
                )}
                {/* {data.rejectionReason && ( */}
                  <span className="text-sm ml-3">
                    Reason: {data.aprovalRemarks}
                  </span>
                {/* )} */}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR Number
                    </label>
                    <div className="mt-1 text-sm font-medium text-blue-600">
                      {data.prNumber}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR Date
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(data.prDate)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {data.requestedBy}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {data.department}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-gray-400" />
                      {data.warehouse}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(data.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {data.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required Date
                    </label>
                    <div className="mt-1 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(data.requiredDate)}
                    </div>
                  </div>

                  {data.supplierId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </label>
                      <div className="mt-1 text-sm">
                        {data.supplierName || "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Request Items</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Total Items: <span className="font-medium">{data.items?.length || 0}</span>
                  </span>
                  <span className="text-gray-600">
                    Total Quantity: <span className="font-medium">{getTotalQuantity()}</span>
                  </span>
                </div>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {item.itemCode || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.uom}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.requestedQty}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.currentStock || 0}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.reason || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.itemStatus)}`}>
                            {item.itemStatus || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Information */}
            {(data.remarks || data.createdAt || data.updatedAt) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.remarks && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </label>
                        <div className="mt-1 text-sm flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span>{data.remarks}</span>
                        </div>
                      </div>
                    )}
                    {data.createdAt && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </label>
                        <div className="mt-1 text-sm">
                          {formatDateTime(data.createdAt)}
                        </div>
                      </div>
                    )}
                    {data.updatedAt && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </label>
                        <div className="mt-1 text-sm">
                          {formatDateTime(data.updatedAt)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Print Footer */}
            <div className="print-footer text-center text-xs text-gray-500 border-t pt-4 mt-4">
              <p>Generated on: {new Date().toLocaleString()}</p>
              <p className="mt-1">This is a system-generated document. For any queries, please contact the warehouse department.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              {/* <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}