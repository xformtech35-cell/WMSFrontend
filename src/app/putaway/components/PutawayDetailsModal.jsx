import { X, Package } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Label } from "@/components/ui/label";
export default function PutawayDetailsModal({
  open,
  onClose,
  selectedPutaway,
}) {
  if (!open || !selectedPutaway) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Package className="size-5" />
                  Putaway Details
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Task: <strong>{selectedPutaway?.taskNumber}</strong>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-4 space-y-6 max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  GRN Number
                </Label>
                <p className="font-medium">
                  {selectedPutaway.grnNumber || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Task Number
                </Label>
                <p className="font-medium">
                  {selectedPutaway.taskNumber || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Status
                </Label>
                <StatusBadge status={selectedPutaway.status || "PENDING"} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Assigned To
                </Label>
                <p className="font-medium">
                  {selectedPutaway.assignedTo || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Receiving Area
                </Label>
                <p className="font-medium">
                  {selectedPutaway.receivingArea || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Warehouse
                </Label>
                <p className="font-medium">
                  {selectedPutaway.warehouseId || "-"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Total Quantity
                </Label>
                <p className="font-medium">
                  {selectedPutaway.totalQuantity || 0}
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Created At
                </Label>
                <p className="font-medium text-sm">
                  {selectedPutaway.createdAt
                    ? format(
                        new Date(selectedPutaway.createdAt),
                        "dd MMM yyyy HH:mm",
                      )
                    : "-"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Putaway Lines</Label>
              <div className="border rounded-md overflow-hidden mt-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPutaway.lines?.map((line, idx) => {
                        const location = [
                          line.suggestedWarehouse,
                          line.suggestedZone,
                          line.suggestedAisle,
                          line.suggestedRack,
                          line.suggestedBin,
                        ]
                          .filter(Boolean)
                          .join(" → ");

                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {line.itemCode || "-"}
                            </TableCell>
                            <TableCell>{line.itemName || "-"}</TableCell>
                            <TableCell>{location || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}