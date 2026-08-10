import { useState } from "react";
import {
  Package,
  CheckCircle2,
  X,
  Warehouse,
  User,
  FileText,
  MapPin,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PutawayFormModal({
  open,
  onClose,
  grns,
  users,
  selectedGrnForPutaway,
  selectedGrn,
  grnItems,
  formData,
  formErrors,
  isSubmitting,
  onGrnSelect,
  onToggleItemSelection,
  onAddSelectedItems,
  onRemoveLine,
  onInputChange,
  onLineChange,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] max-w-[95vw] lg:max-w-7xl xl:max-w-[1200px] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Package className="size-5" />
                  Initiate Putaway
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a GRN and items to create putaway tasks
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

          {/* Form Body */}
          <form
            onSubmit={onSubmit}
            className="h-full overflow-y-auto px-6 py-4 space-y-6 max-h-[calc(90vh-180px)]"
          >
            {/* GRN Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="grnSelect"
                  className="flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" />
                  Select GRN *
                </Label>
                <select
                  id="grnSelect"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={selectedGrnForPutaway}
                  onChange={(e) => onGrnSelect(e.target.value)}
                >
                  <option value="">Select GRN</option>
                  {grns.map((grn) => (
                    <option key={grn.id} value={grn.grnNumber}>
                      {grn.grnNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="warehouseId"
                  className="flex items-center gap-1.5"
                >
                  <Warehouse className="size-3.5" />
                  Warehouse *
                </Label>
                <Input
                  id="warehouseId"
                  name="warehouseId"
                  value={formData.warehouseId}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                  placeholder="Warehouse from rock"
                />
                {formErrors.warehouseId && (
                  <p className="text-xs text-red-500">
                    {formErrors.warehouseId}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="assignedTo"
                  className="flex items-center gap-1.5"
                >
                  <User className="size-3.5" />
                  Assigned To *
                </Label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    formErrors.assignedTo ? "border-red-500" : ""
                  }`}
                  value={formData.assignedTo}
                  onChange={onInputChange}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name || u.username || u.id}>
                      {u.name || u.username || `User ${u.id}`}
                    </option>
                  ))}
                </select>
                {formErrors.assignedTo && (
                  <p className="text-xs text-red-500">
                    {formErrors.assignedTo}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="receivingArea"
                  className="flex items-center gap-1.5"
                >
                  <MapPin className="size-3.5" />
                  Receiving Area *
                </Label>
                <Input
                  id="receivingArea"
                  name="receivingArea"
                  value={formData.receivingArea}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                  placeholder="Rock name/ID"
                />
                {formErrors.receivingArea && (
                  <p className="text-xs text-red-500">
                    {formErrors.receivingArea}
                  </p>
                )}
              </div>
            </div>

            {/* Rock Info Display */}
            {selectedGrnForPutaway && formData.rockId && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <Package className="size-5 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Assigned Rock
                    </Label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 dark:bg-blue-900/30"
                      >
                        {formData.rockId}
                      </Badge>
                      {selectedGrn?.rock && (
                        <>
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {selectedGrn.rock.name}
                          </span>
                          {selectedGrn.rock.rockType && (
                            <span className="text-xs text-blue-500 dark:text-blue-400">
                              ({selectedGrn.rock.rockType})
                            </span>
                          )}
                          {selectedGrn.rock.warehouse && (
                            <span className="text-xs text-blue-500 dark:text-blue-400">
                              • Warehouse: {selectedGrn.rock.warehouse.name}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      This rock is assigned to this GRN. Warehouse and receiving
                      area are auto-filled.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedGrnForPutaway && !formData.rockId && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="size-5 text-yellow-600" />
                  <div>
                    <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      No Rock Assigned
                    </Label>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      This GRN does not have a rock assigned. Please manually
                      enter warehouse and receiving area.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GRN Items Selection */}
            {selectedGrnForPutaway && grnItems.length > 0 && (
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">GRN Items</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onAddSelectedItems}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Selected Items
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedItems = grnItems.map((item) => ({
                                ...item,
                                isSelected: checked,
                              }));
                              // This would need a callback, but we're using the parent's state
                              // We'll handle this differently - need to pass a callback
                              grnItems.forEach((_, index) => {
                                // This is a workaround - we should pass a proper callback
                                onToggleItemSelection(index);
                              });
                            }}
                            checked={grnItems.every((item) => item.isSelected)}
                          />
                        </TableHead>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grnItems.map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                          <TableCell>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={item.isSelected || false}
                              onChange={() => onToggleItemSelection(index)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.itemCode || "-"}
                          </TableCell>
                          <TableCell>{item.itemName || "-"}</TableCell>
                          <TableCell>{item?.location || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Selected: {grnItems.filter((item) => item.isSelected).length}{" "}
                  items
                </div>
              </div>
            )}

            {/* Putaway Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Putaway Lines</Label>
                <Badge variant="secondary" className="text-xs">
                  {formData.lines.length} items
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Items to be put away from this GRN
              </p>

              {formErrors.lines && (
                <p className="text-xs text-red-500 mb-2">{formErrors.lines}</p>
              )}

              {formData.lines.length === 0 ? (
                <div className="border rounded-md p-8 text-center text-muted-foreground">
                  <Package className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs">
                    Select items from the GRN above and click "Add Selected
                    Items"
                  </p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead className="min-w-[100px]">
                            Item Code
                          </TableHead>
                          <TableHead className="min-w-[120px]">
                            Item Name
                          </TableHead>
                          <TableHead className="w-16">UOM</TableHead>
                          <TableHead className="w-24">Quantity</TableHead>
                          <TableHead className="min-w-[100px]">
                            Batch No.
                          </TableHead>
                          <TableHead className="min-w-[120px]">
                            Serial No.
                          </TableHead>
                          <TableHead className="min-w-[100px]">
                            Suggested Bin
                          </TableHead>
                          <TableHead className="min-w-[100px]">
                            Remarks
                          </TableHead>
                          <TableHead className="w-12">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.lines.map((line, index) => (
                          <TableRow key={index} className="hover:bg-muted/30">
                            <TableCell className="text-xs text-muted-foreground text-center">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.itemCode}
                                disabled
                                className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.itemName}
                                disabled
                                className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.uom}
                                disabled
                                className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0 w-16"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={line.quantity}
                                onChange={(e) =>
                                  onLineChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.batchNumber || ""}
                                onChange={(e) =>
                                  onLineChange(
                                    index,
                                    "batchNumber",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs"
                                placeholder="Batch"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.serialNumber || ""}
                                onChange={(e) =>
                                  onLineChange(
                                    index,
                                    "serialNumber",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs"
                                placeholder="e.g. SN001-SN010"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.suggestedBin || ""}
                                onChange={(e) =>
                                  onLineChange(
                                    index,
                                    "suggestedBin",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs"
                                placeholder="e.g. B-05"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.remarks || ""}
                                onChange={(e) =>
                                  onLineChange(index, "remarks", e.target.value)
                                }
                                className="h-8 text-xs"
                                placeholder="Remarks"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => onRemoveLine(index)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 size-3.5" />
                    Initiate Putaway
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
