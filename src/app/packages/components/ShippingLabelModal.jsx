// components/ShippingLabelModal.jsx
import React, { useRef, useState } from "react";
import {
  XCircle,
  Printer,
  Hash,
  Package,
  QrCode,
  User,
  MapPin as MapPinIcon,
  Scale,
  Truck,
  Download,
  Warehouse,
  Calendar,
  Box,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadImage } from "@/components/downloadImage64";
import html2canvas from "html2canvas";

const ShippingLabelModal = ({
  shippingLabel,
  handleShippingLabelClose,
  getLabelStatusColor,
  formatDate,
  decodeBase64Image,
}) => {
  const labelRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!shippingLabel) return null;

  // Sample data for display - in production, this would come from props
  const labelData = {
    shipTo: {
      name: shippingLabel.customerName || "ABC PVT LTD",
      address: shippingLabel.customerAddress || "123, MIDC Industrial Area",
      area: "Bhosari",
      city: "Pune - 411026",
      state: "Maharashtra, India",
      phone: "+91 98765 43210"
    },
    soNumber: shippingLabel.soNumber || "SO-1001",
    packageNumber: shippingLabel.packageNumber || "PKG-000123",
    packageBarcode: shippingLabel.packageBarcode || "PKG000123",
    customer: shippingLabel.customerName || "ABC PVT LTD",
    item: shippingLabel.itemName || "WATER PUMP",
    quantity: shippingLabel.quantity || "10 Nos",
    weight: shippingLabel.weight ? `${shippingLabel.weight} KG` : "50 KG",
    shippingAddress: "Same as Ship To",
    shippingMethod: shippingLabel.shippingMethod || "ROAD",
    trackingNumber: shippingLabel.trackingNumber || "TRK1001",
    shippingDate: shippingLabel.shippingDate ? formatDate(shippingLabel.shippingDate) : "21-May-2026",
    warehouse: "WH01",
    warehouseName: "PUNE WAREHOUSE",
    barcode: shippingLabel.barcode,
  };

  // Function to convert label to image using html2canvas
  const labelToImage = async () => {
    const labelElement = labelRef.current;
    if (!labelElement) {
      throw new Error('Label element not found');
    }

    try {
      const canvas = await html2canvas(labelElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        logging: false,
        width: 400,
        height: 600,
        onclone: (document) => {
          const clonedElement = document.querySelector('.label-container');
          if (clonedElement) {
            clonedElement.style.transform = 'scale(1)';
            clonedElement.style.width = '400px';
            clonedElement.style.minHeight = '600px';
          }
        }
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('html2canvas error:', error);
      // Fallback: Use canvas drawing
      return createFallbackImage();
    }
  };

  // Fallback method using canvas drawing
  const createFallbackImage = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 600;
      const height = 900;
      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Header
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SHIPPING LABEL', width/2, 50);

      // Separator line
      ctx.beginPath();
      ctx.moveTo(20, 65);
      ctx.lineTo(width - 20, 65);
      ctx.stroke();

      // Ship To
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('SHIP TO:', 30, 95);
      ctx.font = '14px Arial';
      let y = 120;
      ctx.fillText(labelData.shipTo.name, 30, y);
      y += 22;
      ctx.fillText(labelData.shipTo.address, 30, y);
      y += 22;
      ctx.fillText(labelData.shipTo.area + ', ' + labelData.shipTo.city, 30, y);
      y += 22;
      ctx.fillText(labelData.shipTo.state, 30, y);
      y += 22;
      ctx.fillText('Ph: ' + labelData.shipTo.phone, 30, y);
      y += 35;

      // Info Grid - Left column
      ctx.font = 'bold 13px Arial';
      ctx.fillText('SO NO. : ' + labelData.soNumber, 30, y);
      y += 22;
      ctx.fillText('CUSTOMER : ' + labelData.customer, 30, y);
      y += 22;
      ctx.fillText('ITEM : ' + labelData.item, 30, y);
      y += 22;
      ctx.fillText('QUANTITY : ' + labelData.quantity, 30, y);
      y += 22;
      ctx.fillText('SHIPPING ADDRESS : ' + labelData.shippingAddress, 30, y);
      y += 22;
      ctx.fillText('SHIPPING METHOD : ' + labelData.shippingMethod, 30, y);

      // Info Grid - Right column
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px Arial';
      let yRight = 150;
      ctx.fillText('PACKAGE NO. : ' + labelData.packageNumber, width - 30, yRight);
      yRight += 22;
      ctx.fillText('', width - 30, yRight);
      yRight += 22;
      ctx.fillText('WEIGHT : ' + labelData.weight, width - 30, yRight);
      yRight += 22;
      ctx.fillText('', width - 30, yRight);
      yRight += 22;
      ctx.fillText('SHIPPING DATE : ' + labelData.shippingDate, width - 30, yRight);
      yRight += 35;

      // Barcode section
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('PACKAGE BARCODE', width/2, y + 50);
      
      // Draw barcode lines
      const barcodeText = labelData.packageBarcode;
      const barcodeWidth = 300;
      const barcodeHeight = 60;
      const xStart = (width - barcodeWidth) / 2;
      const yStart = y + 65;
      
      ctx.fillStyle = '#000000';
      for (let i = 0; i < barcodeText.length; i++) {
        const charCode = barcodeText.charCodeAt(i);
        const barWidth = 2 + (charCode % 4);
        const x = xStart + (i * (barcodeWidth / barcodeText.length));
        ctx.fillRect(x, yStart, barWidth, barcodeHeight);
      }
      
      // Barcode text
      ctx.font = '16px monospace';
      ctx.fillStyle = '#000000';
      ctx.fillText(barcodeText, width/2, yStart + barcodeHeight + 30);

      
      resolve(canvas.toDataURL('image/png'));
    });
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const imageData = await labelToImage();
      const win = window.open('', '_blank');
      if (!win) {
        alert('Please allow pop-ups to print the label');
        return;
      }

      win.document.write(`
        <html>
          <head>
            <title>Shipping Label - ${labelData.packageNumber}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f0f0f0;
                font-family: Arial, sans-serif;
              }
              .print-container {
                background: white;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              @media print {
                body {
                  background: white;
                  padding: 0;
                  margin: 0;
                }
                .print-container {
                  padding: 0;
                  box-shadow: none;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${imageData}" alt="Shipping Label" />
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 500);
            <\/script>
          </body>
        </html>
      `);

      win.document.close();
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print label. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const imageData = await labelToImage();
      
      // Create download link
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `shipping_label_${labelData.packageNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download label. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleShippingLabelClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Shipping Label
              </h2>
              <p className="text-sm text-gray-500">
                {shippingLabel.labelNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={printing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed no-print"
              >
                {printing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Print Label
                  </>
                )}
              </button>
              {/* <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed no-print"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Image
                  </>
                )}
              </button> */}
              <button
                onClick={handleShippingLabelClose}
                className="text-gray-400 hover:text-gray-600 transition-colors no-print"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 flex justify-center">
            {/* Shipping Label - Official 4x6 inch design */}
            <div
              ref={labelRef}
              className="label-container"
              style={{
                width: '400px',
                minHeight: '600px',
                padding: '16px',
                background: 'white',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                border: '3px solid #000000',
                fontFamily: 'Arial, Helvetica, sans-serif',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{
                textAlign: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                borderBottom: '3px solid #000',
                paddingBottom: '8px',
                marginBottom: '10px',
                letterSpacing: '2px',
              }}>
                SHIPPING LABEL
              </div>

              {/* Ship To */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 10px',
                marginBottom: '8px',
                backgroundColor: '#fafafa',
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '13px', 
                  marginBottom: '4px',
                  letterSpacing: '1px',
                }}>
                  SHIP TO:
                </div>
                <div style={{ lineHeight: '1.6', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {labelData.shipTo.name}
                  </div>
                  <div>{labelData.shipTo.address}</div>
                  <div>{labelData.shipTo.area}, {labelData.shipTo.city}</div>
                  <div>{labelData.shipTo.state}</div>
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ fontWeight: 'bold' }}>Ph:</span> {labelData.shipTo.phone}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2px 12px',
                border: '2px solid #000',
                padding: '8px 10px',
                marginBottom: '8px',
                fontSize: '11px',
                backgroundColor: '#fafafa',
              }}>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    SO NO.
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.soNumber}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    PACKAGE NO.
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.packageNumber}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    CUSTOMER
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.customer}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    ITEM
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.item}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    QUANTITY
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.quantity}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    WEIGHT
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.weight}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    SHIPPING ADDRESS
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.shippingAddress}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    SHIPPING METHOD
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.shippingMethod}</div>
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '8px', 
                    textTransform: 'uppercase', 
                    color: '#555',
                    letterSpacing: '1px',
                  }}>
                    SHIPPING DATE
                  </div>
                  <div style={{ fontWeight: 'bold' }}>{labelData.shippingDate}</div>
                </div>
              </div>

              {/* Package Barcode */}
              <div style={{
                border: '2px solid #000',
                padding: '8px',
                marginBottom: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#fafafa',
              }}>
                <div style={{ 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  marginBottom: '4px',
                  letterSpacing: '2px',
                }}>
                  PACKAGE BARCODE
                </div>
                {labelData.barcode ? (
                  <img
                    src={decodeBase64Image(labelData.barcode)}
                    alt="Barcode"
                    style={{
                      maxHeight: '80px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    letterSpacing: '6px',
                    padding: '8px 0',
                  }}>
                    {labelData.packageBarcode}
                  </div>
                )}
              </div>

             
              
             

              
            </div>
          </div>

          {/* Label Info Grid - Additional Details */}
          <div className="px-6 pb-6 no-print">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Label Number
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {shippingLabel.labelNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Package Number
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {shippingLabel.packageNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Label Status
                </label>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getLabelStatusColor(shippingLabel.labelStatus)}`}
                  >
                    {shippingLabel.labelStatus}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Customer
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {shippingLabel.customerName}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Shipping Method
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {shippingLabel.shippingMethod}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Tracking Number
                </label>
                <p className="font-medium text-gray-900 text-sm font-mono">
                  {shippingLabel.trackingNumber || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Printed By
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {shippingLabel.printedBy || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Printed Date
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {formatDate(shippingLabel.printedDate)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium">
                  Created At
                </label>
                <p className="font-medium text-gray-900 text-sm">
                  {formatDate(shippingLabel.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingLabelModal;