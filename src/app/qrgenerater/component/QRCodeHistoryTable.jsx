// components/QRCodeHistoryTable.jsx
import {
  Eye,
  Download,
  Printer,
  QrCode,
  ScanBarcode,
  MapPin,
} from "lucide-react";
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
import { formatDateTime } from "@/lib/utils/common";

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
  handleDownloadbarcode,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!qrHistory.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <QrCode className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-medium">No QR codes found</p>
          <p className="text-sm text-gray-400">
            Generate your first QR code to get started
          </p>
        </div>
      </div>
    );
  }

  // Handle page change - convert between 1-based (TablePagination) and 0-based (API)
  const handlePageChange = (newPage) => {
    // TablePagination passes 1-based page numbers
    // API expects 0-based page numbers
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage - 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                QR ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GRN Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Name
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
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
                <tr
                  key={h.id || idx}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {startItem + idx}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onView(h)}
                      className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                    >
                      {h.qrId || "-"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(h.createdAt) || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-blue-600">
                      {h.grnNumber || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">
                      {h.itemCode || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {h.itemName || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {h.quantity} {h.uom}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        h.status === "GENERATED" || h.status === "COMPLETED"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : h.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : h.status === "CANCELLED"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {h.status || "GENERATED"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span
                        className="text-sm text-gray-600 truncate max-w-[150px]"
                        title={location}
                      >
                        {location || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(h)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownload(h)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download QR"
                        disabled={!h.qrImage}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadbarcode(h)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Download Barcode"
                        disabled={!h.barcodeImage}
                      >
                        <ScanBarcode className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        onPrev={() => handlePageChange(page - 1)}
        onNext={() => handlePageChange(page + 1)}
        onFirst={() => handlePageChange(1)}
        onLast={() => handlePageChange(totalPages)}
      />
    </div>
  );
}
