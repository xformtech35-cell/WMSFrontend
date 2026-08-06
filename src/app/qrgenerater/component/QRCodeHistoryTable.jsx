// components/QRCodeHistoryTable.jsx
import { Eye, Download, Printer, QrCode, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TablePagination from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";

export default function QRCodeHistoryTable({
  qrHistory = [],
  isLoading = false,
  onView,
  onDownload,
  onPrint,
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  handleDownloadbarcode
}) {
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Generation History</CardTitle>
          <CardDescription>Loading QR codes...</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!qrHistory.length) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <QrCode className="size-12 opacity-30" />
          <p className="text-sm">No QR codes found. Generate your first QR code.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Generation History</CardTitle>
        <CardDescription>
          Recently generated QR codes and their details
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>#</TableHead>
              <TableHead>QR ID</TableHead>
              <TableHead>GRN Number</TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrHistory.map((h, idx) => {
              const location = [
                h.displayWarehouse || h.warehouseId,
                h.displayZone || h.zone,
                h.displayAisle || h.aisle,
                h.displayRack || h.rack,
                h.displayBin || h.binId,
              ]
                .filter(Boolean)
                .join(" → ");

              return (
                <TableRow key={h.id || idx} className="table-row-hover">
                  <TableCell className="text-xs text-muted-foreground">
                    {startItem + idx}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.qrId || "-"}</TableCell>
                  <TableCell className="font-mono text-xs font-medium">
                    {h.grnNumber || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.itemCode || "-"}</TableCell>
                  <TableCell>{h.itemName || "-"}</TableCell>
                  <TableCell className="text-center">
                    {h.quantity} {h.uom}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        h.status === "GENERATED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                      }`}
                    >
                      {h.status || "GENERATED"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs" title={location}>
                    {location || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(h)}
                        title="Preview"
                        className="cursor-pointer"

                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(h)}
                        title="QR"
                        className="cursor-pointer"
                        disabled={!h.qrImage}
                      >
                        <QrCode  className="size-3.5" />
                      </Button>
                       <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadbarcode(h)}
                        title="Barcode"
                        className="cursor-pointer"

                        disabled={!h.barcodeImage}
                      >
                        <ScanBarcode   className="size-3.5" />
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrint(h)}
                        title="Print"
                        disabled={!h.qrImage}
                      >
                        <Printer className="size-3.5" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          onPrev={() => onPageChange(Math.max(1, page - 1))}
          onNext={() => onPageChange(Math.min(totalPages, page + 1))}
          onFirst={() => onPageChange(1)}
          onLast={() => onPageChange(totalPages)}
        />
      </CardContent>
    </Card>
  );
}