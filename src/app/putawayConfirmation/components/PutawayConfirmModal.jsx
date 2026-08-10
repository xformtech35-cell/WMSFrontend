import { useState, useEffect } from "react";
import { 
  X, 
  ClipboardCheck, 
  User, 
  FileText, 
  AlertCircle, 
  Barcode, 
  Hash,
  Check,
  Package,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PutawayConfirmModal({
  open,
  onClose,
  selectedTask,
  onConfirm,
  users,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    confirmedBy: "",
    confirmedQuantity: "",
    binId: "",
    binBarcode: "",
    isVerified: true,
    verifiedBy: "",
    remarks: "",
    lines: [],
  });
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (open && selectedTask) {
      // Initialize line data from selected task
      const initialLines = (selectedTask.lines || []).map((line) => ({
        lineId: line.id || line.lineId,
        itemCode: line.itemCode || "",
        confirmedQuantity: line.quantity || line.confirmedQuantity || 0,
        actualBin: line?.actualBin || "",
        actualBinBarcode: line?.binBarcode || "",
        remarks: "",
      }));

      setFormData({
        confirmedBy: "",
        confirmedQuantity: selectedTask.totalQuantity || 0,
        binId: "",
        binBarcode: "",
        isVerified: true,
        verifiedBy: "",
        remarks: "",
        lines: initialLines,
      });
      setErrors({});
    }
  }, [open, selectedTask]);

  if (!open || !selectedTask) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.lines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      lines: updatedLines,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.confirmedBy || formData.confirmedBy.trim() === "") {
      newErrors.confirmedBy = "Confirmed by is required";
    }
    if (!formData.confirmedQuantity || formData.confirmedQuantity <= 0) {
      newErrors.confirmedQuantity = "Confirmed quantity is required";
    }
    // if (!formData.binId || formData.binId.trim() === "") {
    //   newErrors.binId = "Bin ID is required";
    // }
    // if (!formData.binBarcode || formData.binBarcode.trim() === "") {
    //   newErrors.binBarcode = "Bin barcode is required";
    // }
    
    // Validate lines
    // formData.lines.forEach((line, index) => {
    //   if (!line.confirmedQuantity || line.confirmedQuantity <= 0) {
    //     if (!newErrors[`line_${index}`]) {
    //       newErrors[`line_${index}`] = `Line ${index + 1}: Quantity is required`;
    //     }
    //   }
    // });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(formData);
      setFormData({
        confirmedBy: "",
        confirmedQuantity: "",
        binId: "",
        binBarcode: "",
        isVerified: true,
        verifiedBy: "",
        remarks: "",
        lines: [],
      });
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      confirmedBy: "",
      confirmedQuantity: "",
      binId: "",
      binBarcode: "",
      isVerified: true,
      verifiedBy: "",
      remarks: "",
      lines: [],
    });
    setErrors({});
    onClose();
  };

  const totalQuantity = formData.lines.reduce(
    (sum, line) => sum + (Number(line.confirmedQuantity) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <ClipboardCheck className="size-5 text-purple-600" />
                  Confirm Putaway
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Task: <strong>{selectedTask?.taskNumber}</strong>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="h-full overflow-y-auto px-6 py-4 space-y-4 max-h-[calc(90vh-180px)]">
            {/* Task Info */}
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    GRN Number
                  </Label>
                  <p className="font-medium text-sm">
                    {selectedTask.grnNumber || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Current Stage
                  </Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedTask.stage || "PENDING"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Assigned To
                  </Label>
                  <p className="font-medium text-sm">
                    {selectedTask.assignedTo || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Total Items
                  </Label>
                  <p className="font-medium text-sm">
                    {selectedTask.lines?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="confirmedBy" className="flex items-center gap-1.5">
                  <User className="size-3.5" />
                  Confirmed By *
                </Label>
                <select
                  id="confirmedBy"
                  name="confirmedBy"
                  className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    errors.confirmedBy ? "border-red-500" : ""
                  }`}
                  value={formData.confirmedBy}
                  onChange={handleInputChange}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name || u.username || u.id}>
                      {u.name || u.username || `User ${u.id}`}
                    </option>
                  ))}
                </select>
                {errors.confirmedBy && (
                  <p className="text-xs text-red-500">{errors.confirmedBy}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmedQuantity" className="flex items-center gap-1.5">
                  <Package className="size-3.5" />
                  Confirmed Quantity *
                </Label>
                <Input
                  id="confirmedQuantity"
                  name="confirmedQuantity"
                  type="number"
                  value={formData.confirmedQuantity}
                  onChange={handleInputChange}
                  placeholder="Enter total confirmed quantity"
                  className={errors.confirmedQuantity ? "border-red-500" : ""}
                />
                {errors.confirmedQuantity && (
                  <p className="text-xs text-red-500">{errors.confirmedQuantity}</p>
                )}
              </div>

            

              <div className="space-y-1.5 flex items-end">
                <div className="flex items-center gap-2 h-10">
                  <input
                    id="isVerified"
                    name="isVerified"
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Label htmlFor="isVerified" className="cursor-pointer">
                    Is Verified
                  </Label>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="remarks" className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Remarks
              </Label>
              <Input
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter remarks (optional)"
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Line Items Confirmation</Label>
                <Badge variant="secondary" className="text-xs">
                  Total: {totalQuantity}
                </Badge>
              </div>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Line ID</TableHead>
                        <TableHead>Item Code</TableHead>
                        <TableHead className="min-w-[120px]">
                          Confirmed Quantity *
                        </TableHead>
                        <TableHead className="min-w-[100px]">
                          Actual Bin
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Actual Bin Barcode
                        </TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.lines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs text-muted-foreground text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.lineId}
                              disabled
                              className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0 w-20"
                            />
                          </TableCell>
                           <TableCell>
                            <Input
                              value={line.itemCode}
                              disabled
                              className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-0 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              
                              step="1"
                              value={line.confirmedQuantity}
                              onChange={(e) =>
                                handleLineChange(
                                  index,
                                  "confirmedQuantity",
                                  e.target.value
                                )
                              }
                              className={`h-8 text-xs w-24 ${
                                errors[`line_${index}`] ? "border-red-500" : ""
                              }`}
                              placeholder="Qty"
                            />
                            {errors[`line_${index}`] && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors[`line_${index}`]}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.actualBin}
                              onChange={(e) =>
                                handleLineChange(
                                  index,
                                  "actualBin",
                                  e.target.value
                                )
                              }
                              disabled
                              className="h-8 text-xs"
                              placeholder={formData.binId || "Bin"}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.actualBinBarcode}
                              onChange={(e) =>
                                handleLineChange(
                                  index,
                                  "actualBinBarcode",
                                  e.target.value
                                )
                              }
                              disabled
                              className="h-8 text-xs"
                              placeholder={formData.binBarcode || "Barcode"}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.remarks}
                              onChange={(e) =>
                                handleLineChange(index, "remarks", e.target.value)
                              }
                              className="h-8 text-xs"
                              placeholder="Remarks"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  This action will finalize the putaway confirmation. Please verify 
                  all quantities and bin locations before confirming. This cannot be undone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                {isSubmitting ? (
                  <>
                    <div className="mr-1.5 size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    Confirm Putaway
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