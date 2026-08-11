import { useEffect, useRef, useState } from "react";
import {
  X,
  Play,
  Check,
  User,
  FileText,
  AlertCircle,
  Barcode,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function PutawayExecuteModal({
  open,
  onClose,
  selectedTask,
  onExecute,
  users,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    stage: "PICKED",
    scannedBy: "",
    operatorName: "",
    binBarcode: "",
    putawayLineId: "",
    remarks: "",
  });
  const [errors, setErrors] = useState({});
  const [availableLines, setAvailableLines] = useState([]);
  // Get available lines for PLACED stage
  const binBarcodeRef = useRef(null);
  useEffect(() => {
    if (formData.stage === "PLACED" && open) {
      setTimeout(() => {
        binBarcodeRef.current?.focus();
      }, 100);
    }
  }, [formData.stage, open]);
  useEffect(() => {
    if (selectedTask?.lines) {
      // Filter lines that are not yet placed (you can adjust this logic based on your API)
      setAvailableLines(selectedTask?.lines);
    }
  }, [selectedTask]);
  if (!open || !selectedTask) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.stage) {
      newErrors.stage = "Stage is required";
    }
    if (!formData.scannedBy || formData.scannedBy.trim() === "") {
      newErrors.scannedBy = "Scanned by is required";
    }
    if (!formData.operatorName || formData.operatorName.trim() === "") {
      newErrors.operatorName = "Operator name is required";
    }

    // Validate PLACED specific fields
    if (formData.stage === "PLACED") {
      if (!formData.binBarcode || formData.binBarcode.trim() === "") {
        newErrors.binBarcode = "Bin barcode is required for PLACED stage";
      }
      if (!formData.putawayLineId) {
        newErrors.putawayLineId = "Putaway line is required for PLACED stage";
      }
    }

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
      await onExecute(formData);
      setFormData({
        stage: "PICKED",
        scannedBy: "",
        operatorName: "",
        binBarcode: "",
        putawayLineId: "",
        remarks: "",
      });
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      stage: "PICKED",
      scannedBy: "",
      operatorName: "",
      binBarcode: "",
      putawayLineId: "",
      remarks: "",
    });
    setErrors({});
    onClose();
  };

  const stageOptions = [
    { value: "PICKED", label: "Picked" },
    { value: "PLACED", label: "Placed" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const isPlacedStage = formData.stage === "PLACED";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Play className="size-5 text-blue-600" />
                  Execute Putaway
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
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Task Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="grid grid-cols-2 gap-3">
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

            {/* Stage Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="stage" className="flex items-center gap-1.5">
                Stage *
              </Label>
              <select
                id="stage"
                name="stage"
                className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  errors.stage ? "border-red-500" : ""
                }`}
                value={formData.stage}
                onChange={handleInputChange}
              >
                {stageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.stage && (
                <p className="text-xs text-red-500">{errors.stage}</p>
              )}
            </div>

            {/* PLACED Specific Fields */}
            {isPlacedStage && (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="binBarcode"
                    className="flex items-center gap-1.5"
                  >
                    <Barcode className="size-3.5" />
                    Bin Barcode *
                  </Label>
                  {/* <Input
                    id="binBarcode"
                    name="binBarcode"
                    value={formData.binBarcode}
                    onChange={handleInputChange}
                    placeholder="Enter bin barcode"
                    className={errors.binBarcode ? "border-red-500" : ""}
                  /> */}
                  <Input
                    ref={binBarcodeRef}
                    id="binBarcode"
                    name="binBarcode"
                    value={formData.binBarcode}
                    onChange={handleInputChange}
                    placeholder="Scan or enter bin barcode"
                    className={errors.binBarcode ? "border-red-500" : ""}
                  />
                  {errors.binBarcode && (
                    <p className="text-xs text-red-500">{errors.binBarcode}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="putawayLineId"
                    className="flex items-center gap-1.5"
                  >
                    <Hash className="size-3.5" />
                    Putaway Line ID *
                  </Label>
                  <select
                    id="putawayLineId"
                    name="putawayLineId"
                    className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      errors.putawayLineId ? "border-red-500" : ""
                    }`}
                    value={formData.putawayLineId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select putaway line</option>
                    {availableLines
                      .filter((line) => line.status !== "PLACED")
                      .map((line) => (
                        <option key={line.id} value={line.id}>
                          {line.itemCode} - {line.itemName} (ID: {line.id})
                        </option>
                      ))}
                  </select>
                  {errors.putawayLineId && (
                    <p className="text-xs text-red-500">
                      {errors.putawayLineId}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Scanned By */}
            <div className="space-y-1.5">
              <Label htmlFor="scannedBy" className="flex items-center gap-1.5">
                <User className="size-3.5" />
                Scanned By *
              </Label>
              <select
                id="scannedBy"
                name="scannedBy"
                className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  errors.scannedBy ? "border-red-500" : ""
                }`}
                value={formData.scannedBy}
                onChange={handleInputChange}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name || u.username || u.id}>
                    {u.name || u.username || `User ${u.id}`}
                  </option>
                ))}
              </select>
              {errors.scannedBy && (
                <p className="text-xs text-red-500">{errors.scannedBy}</p>
              )}
            </div>

            {/* Operator Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="operatorName"
                className="flex items-center gap-1.5"
              >
                <User className="size-3.5" />
                Operator Name *
              </Label>
              <Input
                id="operatorName"
                name="operatorName"
                value={formData.operatorName}
                onChange={handleInputChange}
                placeholder="Enter operator name"
                className={errors.operatorName ? "border-red-500" : ""}
              />
              {errors.operatorName && (
                <p className="text-xs text-red-500">{errors.operatorName}</p>
              )}
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

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {isPlacedStage
                    ? "This action will mark the item as placed in the specified bin location. Please verify the bin barcode before confirming."
                    : "This action will update the putaway task status. Please ensure all items have been processed before marking as completed."}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-1.5 size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    Execute
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
