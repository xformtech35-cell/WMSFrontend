"use client";

import { useState, useEffect, useRef } from "react";
import {
  Barcode,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  Download,
  Printer,
  Eye,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function getBarcodeData(value) {
  const response = await api.get("/qr-codes/scan", {
    params: {
      qrCode: value,
      scannedBy: "admin", // Replace with actual user if needed
    },
  });
  return response.data;
}

export default function BarcodeScanPage() {
  // State for barcode scanning
  const [isScanning, setIsScanning] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [previewQr, setPreviewQr] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const inputRef = useRef(null);

  // Focus input when scanning starts
  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) {
      toast.error("Please enter or scan a barcode value");
      return;
    }

    await scanBarcode(scanInput.trim());
  };

  const scanBarcode = async (value) => {
    try {
      setIsLoadingScan(true);
      setScanError(null);
      setScanResult(null);

      const response = await getBarcodeData(value);

      if (response) {
        let parsedData = response;
        if (typeof response === "string") {
          try {
            parsedData = JSON.parse(response);
          } catch (e) {
            parsedData = { value: response };
          }
        }

        setScanResult(parsedData);

        // Add to history
        const historyEntry = {
          id: Date.now(),
          barcode: value,
          data: parsedData,
          scannedAt: new Date().toISOString(),
        };
        setScanHistory((prev) => [historyEntry, ...prev]);

        toast.success("Barcode scanned successfully!");

        // If the scanned data contains QR code info, show it in preview
        if (parsedData.qrId || parsedData.grnNumber) {
          const qrData = {
            id: parsedData.id || Date.now(),
            qrId: parsedData.qrId,
            qrCode: parsedData.qrCode,
            qrImage: parsedData.qrImage,
            barcode: parsedData.barcode || value,
            barcodeImage: parsedData.barcodeImage,
            grnNumber: parsedData.grnNumber,
            itemCode: parsedData.itemCode,
            itemName: parsedData.itemName,
            batchNumber: parsedData.batchNumber,
            quantity: parsedData.quantity,
            uom: parsedData.uom,
            warehouseId: parsedData.warehouseId,
            zone: parsedData.zone,
            aisle: parsedData.aisle,
            rack: parsedData.rack,
            shelf: parsedData.shelf,
            binId: parsedData.binId,
            palletNumber: parsedData.palletNumber,
            labelType: parsedData.labelType,
            labelLevel: parsedData.labelLevel,
            qrType: parsedData.qrType,
            status: parsedData.status || "GENERATED",
            generatedAt: parsedData.createdAt || parsedData.generatedAt,
            generatedBy: parsedData.generatedBy || "admin",
            displayWarehouse: parsedData.warehouseId,
            displayZone: parsedData.zone,
            displayAisle: parsedData.aisle,
            displayRack: parsedData.rack,
            displayBin: parsedData.binId,
          };
          setPreviewQr(qrData);
          setPreviewDialogOpen(true);
        }

        setScanInput("");
      } else {
        setScanError("No data found for this barcode");
        toast.error("No data found for this barcode");
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
      setScanError(error.response?.data?.message || "Failed to scan barcode");
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to scan barcode. Please try again.",
      );
    } finally {
      setIsLoadingScan(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const toggleScanner = () => {
    setIsScanning(!isScanning);
    setScanResult(null);
    setScanError(null);
    setScanInput("");
    if (!isScanning && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  };

  const clearScanResult = () => {
    setScanResult(null);
    setScanError(null);
    setScanInput("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearHistory = () => {
    if (scanHistory.length === 0) return;
    if (confirm("Are you sure you want to clear scan history?")) {
      setScanHistory([]);
      toast.success("Scan history cleared");
    }
  };

  const downloadImage = (base64Data, filename) => {
    if (!base64Data) {
      toast.error("No image available to download");
      return;
    }

    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded successfully");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDownloadQR = (qrData) => {
    if (qrData.qrImage) {
      downloadImage(
        qrData.qrImage,
        `qr_${qrData.qrId || qrData.grnNumber || "code"}.png`,
      );
    } else {
      toast.error("No QR image available to download");
    }
  };

  const handleDownloadBarcode = (qrData) => {
    if (qrData.barcodeImage) {
      downloadImage(
        qrData.barcodeImage,
        `barcode_${qrData.barcode || qrData.grnNumber || "code"}.png`,
      );
    } else {
      toast.error("No barcode image available to download");
    }
  };

  const handlePrint = (qrData) => {
    if (qrData.qrImage) {
      const printWindow = window.open("", "_blank", "width=600,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print QR Code</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:Arial;">
              <img src="data:image/png;base64,${qrData.qrImage}" style="max-width:300px;height:auto;" />
              <p style="margin-top:20px;font-size:14px;color:#666;">
                <strong>${qrData.grnNumber}</strong> - ${qrData.itemCode}
              </p>
              <p style="font-size:12px;color:#999;">
                ${qrData.quantity} ${qrData.uom} • ${qrData.warehouseId}
              </p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
      toast.success("Print dialog opened");
    } else {
      toast.error("No QR image available to print");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Barcode Scanner</h1>
              <p className="text-blue-100 text-sm mt-1">
                Scan barcodes to retrieve item information
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleScanner}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium ${
                  isScanning
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Camera className="w-4 h-4" />
                {isScanning ? "Stop Scanning" : "Start Scanner"}
              </button>
              {scanHistory.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Input Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Barcode className="size-5" />
            Scan Barcode
          </CardTitle>
          <CardDescription>
            Enter a barcode value manually or use the scanner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder={
                    isScanning
                      ? "Scanning... Point camera at barcode"
                      : "Enter barcode value or scan"
                  }
                  className="pl-9 h-11 text-base"
                  disabled={isLoadingScan}
                  autoFocus={isScanning}
                />
                {isScanning && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoadingScan || !scanInput.trim()}
                className="sm:w-auto"
              >
                {isLoadingScan ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 size-4" />
                    Scan
                  </>
                )}
              </Button>
              {scanResult && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearScanResult}
                >
                  <X className="mr-2 size-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Scan Result Display */}
            {scanResult && (
              <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-700 dark:text-green-300">
                      Scan Successful
                    </h4>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(scanResult)
                        .filter(
                          ([key, value]) =>
                            value !== null &&
                            value !== undefined &&
                            value !== "" &&
                            !key.includes("Image") &&
                            !key.includes("image"),
                        )
                        .slice(0, 10)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="font-medium text-foreground">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                    {scanResult.qrImage && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setPreviewQr(scanResult);
                            setPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-1.5 size-3.5" />
                          View QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const qrData = {
                              qrImage: scanResult.qrImage,
                              barcodeImage: scanResult.barcodeImage,
                              barcode: scanResult.barcode,
                              grnNumber: scanResult.grnNumber,
                              itemCode: scanResult.itemCode,
                            };
                            handleDownloadQR(qrData);
                          }}
                        >
                          <Download className="mr-1.5 size-3.5" />
                          Download QR
                        </Button>
                        {scanResult.barcodeImage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const qrData = {
                                barcodeImage: scanResult.barcodeImage,
                                barcode: scanResult.barcode,
                                grnNumber: scanResult.grnNumber,
                              };
                              handleDownloadBarcode(qrData);
                            }}
                          >
                            <Barcode className="mr-1.5 size-3.5" />
                            Download Barcode
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {scanError && (
              <div className="mt-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-700 dark:text-red-300">
                      Scan Failed
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {scanError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isScanning && !scanResult && !scanError && (
              <div className="mt-4 p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                <Camera className="size-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Scanner is active. Point your camera at a barcode or type the
                  value manually.
                </p>
                <div className="mt-2 flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    Auto-focus enabled
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Ready to scan
                  </Badge>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Scan History</CardTitle>
            <CardDescription>
              Recently scanned barcodes ({scanHistory.length} scans)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Barcode className="size-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium">
                        {item.barcode}
                      </span>
                    </div>
                    {item.data?.itemCode && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.data.itemCode}
                        {item.data.itemName && ` - ${item.data.itemName}`}
                        {item.data.grnNumber &&
                          ` | GRN: ${item.data.grnNumber}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(item.scannedAt).toLocaleString()}
                    </p>
                  </div>
                  {item.data?.qrImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewQr(item.data);
                        setPreviewDialogOpen(true);
                      }}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {scanHistory.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing 10 most recent scans out of {scanHistory.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-4" />
              QR Code Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {previewQr && (
              <>
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed">
                  {previewQr.qrImage ? (
                    <img
                      src={`data:image/png;base64,${previewQr.qrImage}`}
                      alt="QR Code"
                      className="max-w-[200px] h-auto"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <QrCode className="size-16" />
                      <p className="text-sm">QR Code Preview</p>
                    </div>
                  )}
                </div>
                <div className="w-full space-y-1 text-sm">
                  <p>
                    <strong>QR ID:</strong> {previewQr.qrId || "-"}
                  </p>
                  <p>
                    <strong>GRN:</strong> {previewQr.grnNumber}
                  </p>
                  <p>
                    <strong>Item:</strong> {previewQr.itemCode} -{" "}
                    {previewQr.itemName}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {previewQr.quantity}{" "}
                    {previewQr.uom}
                  </p>
                  <p>
                    <strong>Status:</strong> {previewQr.status || "GENERATED"}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {[
                      previewQr.displayWarehouse,
                      previewQr.displayZone,
                      previewQr.displayAisle,
                      previewQr.displayRack,
                      previewQr.displayBin,
                    ]
                      .filter(Boolean)
                      .join(" → ")}
                  </p>
                </div>
                <div className="flex gap-2 w-full flex-wrap">
                  <Button
                    className="flex-1"
                    onClick={() => handleDownloadQR(previewQr)}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download QR
                  </Button>
                  {previewQr.barcodeImage && (
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => handleDownloadBarcode(previewQr)}
                    >
                      <Barcode className="mr-1.5 size-3.5" />
                      Download Barcode
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePrint(previewQr)}
                  >
                    <Printer className="mr-1.5 size-3.5" />
                    Print
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
