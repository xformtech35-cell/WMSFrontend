"use client";

import React, { useRef } from "react";
import {
  Edit,
  Printer,
  XCircle,
  Package,
  Truck,
  User,
  Phone,
  Clock,
  FileText,
  Hash,
  MapPin,
  Building,
  Calendar,
  Weight,
  Box,
  User as UserIcon,
  Clipboard,
} from "lucide-react";

export default function DeliveryChallanView({
  viewingChallan,
  onClose,
  onEdit,
  generating = false,
  formatDate,
}) {
  const printRef = useRef();

  if (!viewingChallan) return null;

  const getStatusBadge = (status) => {
    if (!status) return null;
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PACKED: "bg-blue-100 text-blue-700",
      CONFIRMED: "bg-green-100 text-green-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-indigo-100 text-indigo-700",
      CANCELLED: "bg-red-100 text-red-700",
      CREATED: "bg-green-100 text-green-700",
      PRINTED: "bg-blue-100 text-blue-700",
      GENERATED: "bg-purple-100 text-purple-700",
    };
    return colors[status] || colors.DRAFT;
  };

  const totalPackages = viewingChallan.packages?.length || 0;
  const totalQuantity = viewingChallan.packages?.reduce((sum, pkg) => sum + (pkg.dispatchedQuantity || 0), 0) || 0;
  const totalWeight = viewingChallan.packages?.reduce((sum, pkg) => sum + (pkg.weight || 0), 0) || 0;

  const handlePrint = () => {
    // Get the print content HTML
    const printContent = document.getElementById('print-content');
    if (!printContent) {
      alert('Print content not found');
      return;
    }

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
      alert('Please allow popups for this site');
      return;
    }

    // Get the HTML content
    const contentHTML = printContent.innerHTML;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Challan - ${viewingChallan.challanNumber || viewingChallan.shipmentNumber || 'N/A'}</title>
          <style>
            @media print {
              * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 20px; background: white; }
              .no-print { display: none !important; }
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 40px 30px;
              background: white;
              color: #1a1a1a;
              max-width: 1200px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px double #1a1a1a;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }

            .company-info {
              flex: 1;
            }

            .company-info h1 {
              font-size: 28px;
              font-weight: bold;
              margin: 0 0 4px 0;
              color: #1a1a1a;
            }

            .company-info .subtitle {
              font-size: 14px;
              color: #555;
              margin: 2px 0;
            }

            .company-info .address {
              font-size: 12px;
              color: #666;
              margin: 2px 0;
            }

            .doc-title {
              text-align: right;
              border-left: 3px solid #1a1a1a;
              padding-left: 20px;
            }

            .doc-title h2 {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              text-transform: uppercase;
              color: #1a1a1a;
            }

            .doc-title .doc-number {
              font-size: 16px;
              color: #333;
              font-weight: 600;
              margin: 4px 0 0 0;
            }

            .doc-title .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 6px;
              background: #e5e7eb;
              color: #374151;
            }

            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px 40px;
              background: #f9fafb;
              padding: 16px 20px;
              border-radius: 6px;
              margin-bottom: 20px;
              border: 1px solid #e5e7eb;
            }

            .detail-item {
              display: flex;
              flex-direction: column;
            }

            .detail-item .label {
              font-size: 10px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: 600;
              letter-spacing: 0.5px;
            }

            .detail-item .value {
              font-size: 14px;
              font-weight: 500;
              color: #1a1a1a;
              margin-top: 2px;
            }

            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1a1a1a;
              margin: 20px 0 10px 0;
              padding-bottom: 6px;
              border-bottom: 2px solid #e5e7eb;
            }

            .summary-cards {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }

            .summary-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px 16px;
              text-align: center;
            }

            .summary-card .label {
              font-size: 10px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: 600;
              letter-spacing: 0.5px;
            }

            .summary-card .value {
              font-size: 22px;
              font-weight: 700;
              color: #1a1a1a;
              margin-top: 2px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin: 12px 0 16px 0;
            }

            table thead {
              background: #f3f4f6;
            }

            table th {
              padding: 8px 10px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border: 1px solid #d1d5db;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            table td {
              padding: 8px 10px;
              border: 1px solid #d1d5db;
              vertical-align: top;
              color: #1f2937;
            }

            table .text-center {
              text-align: center;
            }

            .customer-detail {
              font-size: 11px;
              line-height: 1.5;
            }

            .customer-detail .name {
              font-weight: 600;
              color: #1a1a1a;
            }

            .customer-detail .code {
              color: #6b7280;
              font-size: 10px;
            }

            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #6b7280;
            }

            .footer .signature {
              display: flex;
              gap: 40px;
            }

            .footer .signature div {
              text-align: center;
            }

            .footer .signature .line {
              width: 120px;
              border-top: 1px solid #1a1a1a;
              margin: 30px auto 4px auto;
            }

            .footer .signature .label {
              font-size: 10px;
              color: #6b7280;
            }

            .remarks-box {
              background: #fffbeb;
              border: 1px solid #fcd34d;
              border-radius: 4px;
              padding: 10px 14px;
              margin: 12px 0;
              font-size: 13px;
              color: #78350f;
            }

            .remarks-box .label {
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              color: #92400e;
            }

            .print-btn-container {
              text-align: center;
              margin: 20px 0 0 0;
            }

            .print-btn {
              background: #1a1a1a;
              color: white;
              border: none;
              padding: 10px 30px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
            }

            .print-btn:hover {
              background: #333;
            }

            @media (max-width: 768px) {
              .header { flex-direction: column; align-items: stretch; }
              .doc-title { text-align: left; border-left: none; padding-left: 0; margin-top: 10px; }
              .details-grid { grid-template-columns: 1fr; }
              .summary-cards { grid-template-columns: 1fr 1fr; }
              .footer { flex-direction: column; gap: 20px; }
              .footer .signature { flex-wrap: wrap; gap: 20px; }
              table { font-size: 10px; }
              table th, table td { padding: 4px 6px; }
            }
          </style>
        </head>
        <body>
          ${contentHTML}
          <div class="print-btn-container no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print Challan</button>
            <button class="print-btn" onclick="window.close()" style="margin-left:10px;background:#6b7280;">Close</button>
          </div>
          <script>
            // Auto-print when opened
            setTimeout(() => window.print(), 800);
          <\/script>
        </body>
      </html>
    `);

    win.document.close();
  };

  // ============================================
  // ORIGINAL VIEW PAGE - FULLY VISIBLE
  // ============================================
  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Delivery Challan Details
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-sm text-gray-500">
              {viewingChallan.challanNumber || viewingChallan.shipmentNumber || "N/A"}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(viewingChallan.status)}`}>
              {viewingChallan.status || "DRAFT"}
            </span>
            {viewingChallan.soNumber && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                SO: {viewingChallan.soNumber}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Packages</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{totalPackages}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 text-green-600">
              <Box className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Total Quantity</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{totalQuantity}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 text-purple-600">
              <Weight className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Total Weight</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-1">{totalWeight.toFixed(2)} g</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Created</span>
            </div>
            <p className="text-sm font-medium text-orange-700 mt-1">{formatDate(viewingChallan.createdAt)}</p>
          </div>
        </div>

        {/* Challan Information */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-blue-600" />
            Challan Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Challan Number
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.challanNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Shipment Number
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.shipmentNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Building className="w-3 h-3" />
                Transporter
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.transporter || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Vehicle Number
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.vehicleNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                Created By
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.createdBy || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated At
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {formatDate(viewingChallan.updatedAt)}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Package className="w-3 h-3" />
                Total Packages
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.totalPackages || totalPackages}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Weight className="w-3 h-3" />
                Total Weight
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.totalWeight || totalWeight.toFixed(2)} g
              </p>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-blue-600" />
            Driver Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <User className="w-3 h-3" />
                Driver Name
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.driverName || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Driver Phone
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {viewingChallan.driverPhone || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Updated At
              </label>
              <p className="font-medium text-gray-900 text-sm">
                {formatDate(viewingChallan.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Packages List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Packages ({totalPackages})
            </h3>
            <span className="text-xs text-gray-500">
              {totalPackages} package(s)
            </span>
          </div>
          
          {viewingChallan.packages && viewingChallan.packages.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SO Number</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package #</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (g)</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {viewingChallan.packages.map((pkg, index) => (
                    <tr key={pkg.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-3 py-3 text-sm font-medium text-blue-600">{pkg.invoiceNumber || "N/A"}</td>
                      <td className="px-3 py-3 font-medium text-gray-900 text-sm">{pkg.soNumber || "N/A"}</td>
                      <td className="px-3 py-3 text-sm font-mono text-gray-600">{pkg.packageNumber || "N/A"}</td>
                      <td className="px-3 py-3 text-sm">
                        <div className="font-medium text-gray-900">{pkg.customerName || "N/A"}</div>
                        {pkg.customerCode && <div className="text-xs text-gray-500">Code: {pkg.customerCode}</div>}
                        {pkg.customerGst && <div className="text-xs text-gray-500">GST: {pkg.customerGst}</div>}
                        {pkg.customerPhone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {pkg.customerPhone}
                          </div>
                        )}
                        {pkg.customerAddress && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {pkg.customerAddress}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900 text-sm">{pkg.itemName || "N/A"}</div>
                        <div className="text-xs text-gray-500">Code: {pkg.itemCode}</div>
                        {pkg.uom && <div className="text-xs text-gray-500">UOM: {pkg.uom}</div>}
                        {pkg.batchNumber && <div className="text-xs text-gray-500">Batch: {pkg.batchNumber}</div>}
                      </td>
                      <td className="px-3 py-3 text-center text-sm">{pkg.dispatchedQuantity || 0}</td>
                      <td className="px-3 py-3 text-center text-sm">{pkg.weight ? pkg.weight.toFixed(2) : "N/A"}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(pkg.status)}`}>
                          {pkg.status || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No packages in this challan</p>
            </div>
          )}
        </div>

        {/* Remarks */}
        {viewingChallan.remarks && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
              <Clipboard className="w-3 h-3" />
              Remarks
            </label>
            <p className="text-sm text-gray-700 mt-1">{viewingChallan.remarks}</p>
          </div>
        )}

        {/* Hidden Print Content */}
        <div id="print-content" style={{ display: 'none' }}>
          {/* Header */}
          <div className="header">
            <div className="company-info">
              <h1>{viewingChallan.companyName || 'ABC CORPORATION'}</h1>
              <div className="subtitle">{viewingChallan.companyAddress || '123 Business Park, Mumbai - 400001'}</div>
              <div className="subtitle">GST: {viewingChallan.companyGst || '27AABC1234D1ZP'} | PAN: {viewingChallan.companyPan || 'ABCDE1234F'}</div>
              <div className="address">Phone: {viewingChallan.companyPhone || '+91 98765 43210'} | Email: {viewingChallan.companyEmail || 'info@abccorp.com'}</div>
            </div>
            <div className="doc-title">
              <h2>Delivery Challan</h2>
              <div className="doc-number">{viewingChallan.challanNumber || viewingChallan.shipmentNumber || 'N/A'}</div>
              <div className="status">{viewingChallan.status || 'DRAFT'}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <span className="label">Shipment Number</span>
              <span className="value">{viewingChallan.shipmentNumber || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">SO Number</span>
              <span className="value">{viewingChallan.soNumber || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Transporter</span>
              <span className="value">{viewingChallan.transporter || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Vehicle Number</span>
              <span className="value">{viewingChallan.vehicleNumber || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Driver Name</span>
              <span className="value">{viewingChallan.driverName || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Driver Phone</span>
              <span className="value">{viewingChallan.driverPhone || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Created Date</span>
              <span className="value">{formatDate(viewingChallan.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Created By</span>
              <span className="value">{viewingChallan.createdBy || 'N/A'}</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="label">Total Packages</div>
              <div className="value">{totalPackages}</div>
            </div>
            <div className="summary-card">
              <div className="label">Total Quantity</div>
              <div className="value">{totalQuantity}</div>
            </div>
            <div className="summary-card">
              <div className="label">Total Weight</div>
              <div className="value">{totalWeight.toFixed(2)} g</div>
            </div>
            <div className="summary-card">
              <div className="label">Status</div>
              <div className="value" style={{fontSize: '14px', fontWeight: '600'}}>{viewingChallan.status || 'DRAFT'}</div>
            </div>
          </div>

          {/* Packages Table */}
          <div className="section-title">Package Details</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice #</th>
                <th>SO #</th>
                <th>Package #</th>
                <th>Customer</th>
                <th>Item</th>
                <th className="text-center">Qty</th>
                <th className="text-center">Weight (g)</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {viewingChallan.packages?.map((pkg, index) => (
                <tr key={pkg.id || index}>
                  <td>{index + 1}</td>
                  <td>{pkg.invoiceNumber || 'N/A'}</td>
                  <td>{pkg.soNumber || 'N/A'}</td>
                  <td>{pkg.packageNumber || 'N/A'}</td>
                  <td>
                    <div className="customer-detail">
                      <div className="name">{pkg.customerName || 'N/A'}</div>
                      {pkg.customerCode && <div className="code">Code: {pkg.customerCode}</div>}
                      {pkg.customerGst && <div className="code">GST: {pkg.customerGst}</div>}
                      {pkg.customerPhone && <div className="code">📞 {pkg.customerPhone}</div>}
                      {pkg.customerAddress && <div className="code">📍 {pkg.customerAddress}</div>}
                    </div>
                  </td>
                  <td>
                    <div><strong>{pkg.itemName || 'N/A'}</strong></div>
                    <div style={{fontSize: '10px', color: '#6b7280'}}>Code: {pkg.itemCode || 'N/A'}</div>
                    {pkg.batchNumber && <div style={{fontSize: '10px', color: '#6b7280'}}>Batch: {pkg.batchNumber}</div>}
                    {pkg.uom && <div style={{fontSize: '10px', color: '#6b7280'}}>UOM: {pkg.uom}</div>}
                  </td>
                  <td className="text-center">{pkg.dispatchedQuantity || 0}</td>
                  <td className="text-center">{pkg.weight ? pkg.weight.toFixed(2) : 'N/A'}</td>
                  <td className="text-center">
                    <span style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600'}}>
                      {pkg.status || 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Remarks */}
          {viewingChallan.remarks && (
            <div className="remarks-box">
              <div className="label">Remarks</div>
              <div style={{marginTop: '4px'}}>{viewingChallan.remarks}</div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div>
              <div><strong>Terms & Conditions:</strong></div>
              <div style={{fontSize: '11px', marginTop: '4px', lineHeight: '1.6'}}>
                1. Goods once dispatched cannot be returned without prior approval.<br />
                2. The receiver must verify the package count and condition before signing.<br />
                3. Any discrepancy must be reported within 24 hours of receipt.
              </div>
            </div>
            <div className="signature">
              <div>
                <div className="line"></div>
                <div className="label">Receiver's Signature</div>
                <div style={{fontSize: '10px', color: '#9ca3af'}}>Date: __________</div>
              </div>
              <div>
                <div className="line"></div>
                <div className="label">Authorized Signatory</div>
                <div style={{fontSize: '10px', color: '#9ca3af'}}>Date: __________</div>
              </div>
            </div>
          </div>

          <div style={{textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '12px'}}>
            This is a system-generated delivery challan. | {formatDate(new Date())}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Official Challan
          </button>
         
         
        </div>
      </div>
    </div>
  );
}