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
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

const ShippingLabelModal = ({
  shippingLabel,
  handleShippingLabelClose,
  getLabelStatusColor,
  formatDate,
  decodeBase64Image,
}) => {
  const labelRef = useRef(null);
  const hiddenPrintRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [labelMode, setLabelMode] = useState("COMBINED"); // "COMBINED" or "ITEM_WISE"
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  if (!shippingLabel) return null;

  // Extract items list
  const rawItems =
    shippingLabel.pickConfirmation?.items &&
    Array.isArray(shippingLabel.pickConfirmation.items) &&
    shippingLabel.pickConfirmation.items.length > 0
      ? shippingLabel.pickConfirmation.items
      : shippingLabel.items &&
        Array.isArray(shippingLabel.items) &&
        shippingLabel.items.length > 0
      ? shippingLabel.items
      : [
          {
            itemCode: shippingLabel.itemCode || "-",
            itemName: shippingLabel.itemName || "-",
            pickedQuantity: shippingLabel.quantity || 1,
            requiredQuantity: shippingLabel.quantity || 1,
            uom: shippingLabel.uom || "",
            barcode: shippingLabel.barcode || shippingLabel.packageBarcode,
            remarks: shippingLabel.remarks || "",
          },
        ];

  const totalItemsCount = rawItems.length;

  const shipToData = {
    name: shippingLabel.customerName || "-",
    address: shippingLabel.customerAddress || "-",
  };

  // Convert label to image using html2canvas
  const labelToImage = async (targetElement) => {
    const labelElement = targetElement || labelRef.current;
    if (!labelElement) {
      throw new Error("Label element not found");
    }

    const images = Array.from(labelElement.querySelectorAll("img"));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () =>
            reject(new Error(`Failed to load image: ${img.src}`));
        });
      }),
    );

    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      const canvas = await html2canvas(labelElement, {
        scale: 4,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: labelElement.scrollWidth,
        height: labelElement.scrollHeight,
        onclone: (clonedDocument) => {
          clonedDocument
            .querySelectorAll("style, link[rel='stylesheet']")
            .forEach((element) => element.remove());

          const clonedElement = clonedDocument.querySelector(".label-container");
          if (!clonedElement) return;

          clonedElement.style.width = "400px";
          clonedElement.style.minHeight = "600px";
          clonedElement.style.height = "auto";
          clonedElement.style.transform = "none";
          clonedElement.style.backgroundColor = "#ffffff";
          clonedElement.style.color = "#000000";

          const clonedImages = clonedElement.querySelectorAll("img");
          clonedImages.forEach((img) => {
            img.style.display = "block";
            img.style.visibility = "visible";
            img.style.opacity = "1";
          });
        },
      });

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("html2canvas error:", error);
      throw error;
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      let printContent = "";

      if (labelMode === "ITEM_WISE" && hiddenPrintRef.current) {
        printContent = hiddenPrintRef.current.innerHTML;
      } else {
        const labelElement = labelRef.current;
        if (!labelElement) throw new Error("Label element not found");
        printContent = labelElement.outerHTML;
      }

      const win = window.open("", "_blank");
      if (!win) {
        alert("Please allow pop-ups to print the label");
        return;
      }

      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Label - ${shippingLabel.packageNumber || shippingLabel.labelNumber}</title>
            <style>
              @page {
                size: 4in 6in;
                margin: 0;
              }
              * {
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 4in;
                background: white;
                font-family: Arial, Helvetica, sans-serif;
              }
              .label-container {
                width: 4in !important;
                min-height: 6in !important;
                height: 6in !important;
                margin: 0 auto !important;
                padding: 16px !important;
                background: white !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                border: 3px solid #000000 !important;
                page-break-after: always;
                page-break-inside: avoid;
              }
              .label-container:last-child {
                page-break-after: auto;
              }
              .label-container img {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              @media print {
                html, body {
                  width: 4in;
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function () {
                setTimeout(function () {
                  window.print();
                }, 500);
              };
            <\/script>
          </body>
        </html>
      `);

      win.document.close();
    } catch (error) {
      console.error("Print error:", error);
      alert("Failed to print label. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const imageData = await labelToImage();
      const filename =
        labelMode === "ITEM_WISE"
          ? `shipping_label_${rawItems[selectedItemIndex]?.itemCode || "item"}_${shippingLabel.packageNumber}.png`
          : `shipping_label_combined_${shippingLabel.packageNumber}.png`;

      const link = document.createElement("a");
      link.href = imageData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download label. Please try again.");
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
          {/* Top Bar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Shipping Label Print
              </h2>
              <p className="text-sm text-gray-500">
                Label #: {shippingLabel.labelNumber} | Package: {shippingLabel.packageNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={printing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {printing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Print {labelMode === "ITEM_WISE" ? `All (${totalItemsCount} Labels)` : "Label"}
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              </button>
              <button
                onClick={handleShippingLabelClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Mode Selection Toggle */}
            <div className="mb-6 p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <label className="text-xs uppercase font-semibold text-blue-800 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Label Print Mode
                  </label>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {totalItemsCount > 1
                      ? `This package contains ${totalItemsCount} items. Choose how to format your label(s).`
                      : "Choose between single combined label or item-wise label format."}
                  </p>
                </div>
                <div className="inline-flex p-1 bg-white border border-blue-200 rounded-lg shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLabelMode("COMBINED")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      labelMode === "COMBINED"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Combined Label (All Items)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelMode("ITEM_WISE")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      labelMode === "ITEM_WISE"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Item-Wise Labels ({totalItemsCount})
                  </button>
                </div>
              </div>

              {/* Item Selector Tabs in Item-Wise Mode */}
              {labelMode === "ITEM_WISE" && totalItemsCount > 1 && (
                <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                    Preview Item:
                  </span>
                  {rawItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                        selectedItemIndex === idx
                          ? "bg-blue-100 text-blue-800 border-blue-300 font-semibold"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      Item {idx + 1}: {item.itemCode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Label Preview Container */}
            <div className="flex justify-center my-4">
              {labelMode === "COMBINED" ? (
                /* COMBINED LABEL PREVIEW */
                <div
                  ref={labelRef}
                  className="label-container shadow-lg"
                  style={{
                    width: "400px",
                    minHeight: "600px",
                    padding: "16px",
                    background: "white",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    border: "3px solid #000000",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      borderBottom: "3px solid #000",
                      paddingBottom: "6px",
                      marginBottom: "8px",
                      letterSpacing: "1.5px",
                    }}
                  >
                    SHIPPING LABEL
                  </div>

                  {/* Ship To */}
                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "11px",
                        marginBottom: "2px",
                        letterSpacing: "1px",
                      }}
                    >
                      SHIP TO:
                    </div>
                    <div style={{ lineHeight: "1.4", fontSize: "11px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                        {shipToData.name}
                      </div>
                      <div>{shipToData.address}</div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "2px 8px",
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      fontSize: "10px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        SO NO.
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.soNumber || "-"}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        PACKAGE NO.
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.packageNumber || "-"}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        TOTAL ITEMS
                      </div>
                      <div style={{ fontWeight: "bold" }}>{totalItemsCount} Items</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        WEIGHT
                      </div>
                      <div style={{ fontWeight: "bold" }}>
                        {shippingLabel.weight ? `${shippingLabel.weight} KG` : "-"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        METHOD
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.shippingMethod || "ROAD"}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        DATE
                      </div>
                      <div style={{ fontWeight: "bold" }}>
                        {shippingLabel.printedDate
                          ? formatDate(shippingLabel.printedDate)
                          : formatDate(shippingLabel.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Combined Items Summary Table */}
                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "10px",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #ddd",
                        paddingBottom: "2px",
                      }}
                    >
                      Package Items ({totalItemsCount})
                    </div>
                    <table style={{ width: "100%", fontSize: "10px", textAlign: "left", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #000" }}>
                          <th style={{ textAlign: "left", paddingBottom: "2px" }}>Code</th>
                          <th style={{ textAlign: "left", paddingBottom: "2px" }}>Item Name</th>
                          <th style={{ textAlign: "right", paddingBottom: "2px" }}>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rawItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < rawItems.length - 1 ? "1px dashed #eee" : "none" }}>
                            <td style={{ fontWeight: "bold", padding: "2px 0" }}>{item.itemCode}</td>
                            <td style={{ padding: "2px 0", color: "#444" }}>{item.itemName}</td>
                            <td style={{ fontWeight: "bold", textAlign: "right", padding: "2px 0" }}>
                              {item.pickedQuantity || item.requiredQuantity || item.quantity || 1} {item.uom || ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Package Barcode */}
                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px",
                      marginTop: "auto",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "8px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                        letterSpacing: "1px",
                      }}
                    >
                      PACKAGE BARCODE
                    </div>
                    {shippingLabel.barcode ? (
                      <img
                        src={decodeBase64Image(shippingLabel.barcode)}
                        alt="Barcode"
                        style={{
                          maxHeight: "75px",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "20px",
                          fontWeight: "bold",
                          letterSpacing: "4px",
                          padding: "6px 0",
                        }}
                      >
                        {shippingLabel.packageBarcode || shippingLabel.labelNumber}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ITEM-WISE SINGLE LABEL PREVIEW */
                <div
                  ref={labelRef}
                  className="label-container shadow-lg"
                  style={{
                    width: "400px",
                    minHeight: "600px",
                    padding: "16px",
                    background: "white",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    border: "3px solid #000000",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                      borderBottom: "3px solid #000",
                      paddingBottom: "4px",
                      marginBottom: "8px",
                      letterSpacing: "1px",
                    }}
                  >
                    SHIPPING LABEL (ITEM {selectedItemIndex + 1}/{totalItemsCount})
                  </div>

                  {/* Ship To */}
                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "11px",
                        marginBottom: "2px",
                        letterSpacing: "1px",
                      }}
                    >
                      SHIP TO:
                    </div>
                    <div style={{ lineHeight: "1.4", fontSize: "11px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                        {shipToData.name}
                      </div>
                      <div>{shipToData.address}</div>
                    </div>
                  </div>

                  {/* Specific Item Details */}
                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "8px",
                      marginBottom: "6px",
                      backgroundColor: "#f0f7ff",
                    }}
                  >
                    <div style={{ fontSize: "8px", fontWeight: "bold", color: "#1e40af", textTransform: "uppercase" }}>
                      ITEM DETAILS
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#000", marginTop: "2px" }}>
                      {rawItems[selectedItemIndex]?.itemCode}
                    </div>
                    <div style={{ fontSize: "11px", color: "#333", marginTop: "1px" }}>
                      {rawItems[selectedItemIndex]?.itemName}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", fontWeight: "bold" }}>
                      <span>Qty: {rawItems[selectedItemIndex]?.pickedQuantity || rawItems[selectedItemIndex]?.requiredQuantity || 1} {rawItems[selectedItemIndex]?.uom || ""}</span>
                      {rawItems[selectedItemIndex]?.remarks && <span>Remarks: {rawItems[selectedItemIndex]?.remarks}</span>}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "2px 8px",
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      fontSize: "10px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        SO NO.
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.soNumber || "-"}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        PACKAGE NO.
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.packageNumber || "-"}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        CUSTOMER
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shipToData.name}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>
                        METHOD
                      </div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.shippingMethod || "ROAD"}</div>
                    </div>
                  </div>

                  {/* Item / Package Barcode */}
                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px",
                      marginTop: "auto",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "8px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                        letterSpacing: "1px",
                      }}
                    >
                      {rawItems[selectedItemIndex]?.barcode ? "ITEM / LOCATION BARCODE" : "PACKAGE BARCODE"}
                    </div>
                    {shippingLabel.barcode ? (
                      <img
                        src={decodeBase64Image(shippingLabel.barcode)}
                        alt="Barcode"
                        style={{
                          maxHeight: "75px",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "14px",
                          fontWeight: "bold",
                          letterSpacing: "2px",
                          padding: "6px 0",
                          wordBreak: "break-all",
                          textAlign: "center",
                        }}
                      >
                        {rawItems[selectedItemIndex]?.barcode || shippingLabel.packageBarcode}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden container containing ALL item-wise labels for batch printing */}
            <div ref={hiddenPrintRef} style={{ display: "none" }}>
              {rawItems.map((item, idx) => (
                <div
                  key={idx}
                  className="label-container"
                  style={{
                    width: "400px",
                    minHeight: "600px",
                    padding: "16px",
                    background: "white",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    border: "3px solid #000000",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                      borderBottom: "3px solid #000",
                      paddingBottom: "4px",
                      marginBottom: "8px",
                      letterSpacing: "1px",
                    }}
                  >
                    SHIPPING LABEL (ITEM {idx + 1}/{totalItemsCount})
                  </div>

                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "2px" }}>
                      SHIP TO:
                    </div>
                    <div style={{ lineHeight: "1.4", fontSize: "11px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "12px" }}>{shipToData.name}</div>
                      <div>{shipToData.address}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "8px",
                      marginBottom: "6px",
                      backgroundColor: "#f0f7ff",
                    }}
                  >
                    <div style={{ fontSize: "8px", fontWeight: "bold", color: "#1e40af", textTransform: "uppercase" }}>
                      ITEM DETAILS
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#000", marginTop: "2px" }}>
                      {item.itemCode}
                    </div>
                    <div style={{ fontSize: "11px", color: "#333", marginTop: "1px" }}>
                      {item.itemName}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", fontWeight: "bold" }}>
                      <span>Qty: {item.pickedQuantity || item.requiredQuantity || 1} {item.uom || ""}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "2px 8px",
                      border: "2px solid #000",
                      padding: "6px 8px",
                      marginBottom: "6px",
                      fontSize: "10px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>SO NO.</div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.soNumber || "-"}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555" }}>PACKAGE NO.</div>
                      <div style={{ fontWeight: "bold" }}>{shippingLabel.packageNumber || "-"}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      border: "2px solid #000",
                      padding: "6px",
                      marginTop: "auto",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div style={{ fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "2px" }}>
                      BARCODE
                    </div>
                    {shippingLabel.barcode ? (
                      <img
                        src={decodeBase64Image(shippingLabel.barcode)}
                        alt="Barcode"
                        style={{ maxHeight: "75px", maxWidth: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold" }}>
                        {item.barcode || shippingLabel.packageBarcode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Extra Details Bar */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 uppercase font-medium">Label Status:</span>
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLabelStatusColor(shippingLabel.labelStatus)}`}>
                      {shippingLabel.labelStatus || "PRINTED"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-medium">Printed By:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{shippingLabel.printedBy || "SYSTEM"}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-medium">Shipping Method:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{shippingLabel.shippingMethod || "ROAD"}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-medium">Printed Date:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {shippingLabel.printedDate ? formatDate(shippingLabel.printedDate) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingLabelModal;
