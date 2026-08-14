// components/inbound/QualityInspectionModal.jsx
"use client";
import React, { useState, useRef } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Send,
  Clock,
  User,
  Package,
  Box,
  Loader,
  Truck,
  UserCheck,
  FileText,
  Calendar,
  Clipboard,
  CheckSquare,
  Edit,
  Save,
  Shield,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Search,
  XCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";

const QualityInspectionModal = ({ isOpen, onClose, inbound, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRefs = useRef({});
  const [users, setUsers] = useState([]);
  const fetchMasterData = async () => {
    try {
      const [usersRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: [] })),
      ]);

      setUsers(
        usersRes.data?.data?.content ||
          usersRes.data?.content ||
          usersRes.data ||
          [],
      );
    } catch (error) {
      console.error("Error fetching master data:", error);
      setUsers([]);
    }
  };
  React.useEffect(() => {
    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);
  // Form state
  const [formData, setFormData] = useState({
    inspectedBy: "", // Default to current user
    overallRemarks: "",
    items: [],
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && inbound) {
      const items =
        inbound.lines?.map((line) => ({
          lineId: line.id,
          itemCode: line.itemCode,
          itemName: line.itemName,
          receivedQuantity: line.receivedQuantity || 0,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          qualityStatus: "PENDING",
          reason: "",
          remarks: "",
          images: [], // Store uploaded images
        })) || [];

      setFormData({
        inspectedBy: "",
        overallRemarks: `Quality inspection for ${inbound.inboundNumber}`,
        items: items,
      });
      setError("");
      setSuccess(false);
    }
  }, [isOpen, inbound]);

  // const handleItemChange = (index, field, value) => {
  //   const updatedItems = [...formData.items];
  //   const item = updatedItems[index];

  //   if (field === "acceptedQuantity" || field === "rejectedQuantity") {
  //     const newValue = parseInt(value) || 0;
  //     item[field] = newValue;

  //     // Auto-calculate quality status based on quantities
  //     const totalIssues = item.rejectedQuantity;
  //     if (
  //       totalIssues === 0 &&
  //       item.acceptedQuantity === item.receivedQuantity
  //     ) {
  //       item.qualityStatus = "ACCEPTED";
  //     } else if (
  //       item.acceptedQuantity === 0 &&
  //       totalIssues === item.receivedQuantity
  //     ) {
  //       item.qualityStatus = "REJECTED";
  //     } else if (item.acceptedQuantity > 0 && totalIssues > 0) {
  //       item.qualityStatus = "PARTIAL";
  //     } else {
  //       item.qualityStatus = "PENDING";
  //     }
  //   } else {
  //     item[field] = value;
  //   }

  //   setFormData((prev) => ({
  //     ...prev,
  //     items: updatedItems,
  //   }));
  // };
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    if (field === "acceptedQuantity" || field === "rejectedQuantity") {
      let newValue = parseInt(value, 10);

      // Empty input should be treated as 0
      if (isNaN(newValue)) {
        newValue = 0;
      }

      // Don't allow negative values
      newValue = Math.max(0, newValue);

      // Don't allow value greater than received quantity
      newValue = Math.min(newValue, item.receivedQuantity);

      if (field === "acceptedQuantity") {
        item.acceptedQuantity = newValue;

        // Automatically calculate rejected quantity
        item.rejectedQuantity = item.receivedQuantity - newValue;
      } else {
        item.rejectedQuantity = newValue;

        // Automatically calculate accepted quantity
        item.acceptedQuantity = item.receivedQuantity - newValue;
      }

      // Automatically determine quality status
      if (
        item.acceptedQuantity === item.receivedQuantity &&
        item.rejectedQuantity === 0
      ) {
        item.qualityStatus = "ACCEPTED";
      } else if (
        item.acceptedQuantity === 0 &&
        item.rejectedQuantity === item.receivedQuantity
      ) {
        item.qualityStatus = "REJECTED";
      } else if (item.acceptedQuantity > 0 && item.rejectedQuantity > 0) {
        item.qualityStatus = "PARTIAL";
      } else {
        item.qualityStatus = "PENDING";
      }
    } else {
      item[field] = value;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBulkAccept = (index) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    item.acceptedQuantity = item.receivedQuantity;
    item.rejectedQuantity = 0;
    item.qualityStatus = "ACCEPTED";
    item.reason = "";
    item.remarks = "All items accepted";
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleBulkReject = (index) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    item.acceptedQuantity = 0;
    item.rejectedQuantity = item.receivedQuantity;
    item.qualityStatus = "REJECTED";
    item.reason = "All items rejected";
    item.remarks = "All items rejected";
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleImageUpload = (index, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    // Add new images to the item's images array
    item.images = [...(item.images || []), ...files];

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    // Reset the input value to allow re-uploading the same file
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = "";
    }
  };

  const handleRemoveImage = (itemIndex, imageIndex) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[itemIndex];
    item.images = item.images.filter((_, idx) => idx !== imageIndex);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const getImagePreview = (file) => {
    return URL.createObjectURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate - check if any items are inspected
      const itemsToInspect = formData.items.filter(
        (item) => item.acceptedQuantity > 0 || item.rejectedQuantity > 0,
      );

      if (itemsToInspect.length === 0) {
        throw new Error("Please inspect at least one item");
      }

      // Validate quantities
      for (const item of itemsToInspect) {
        const totalInspected = item.acceptedQuantity + item.rejectedQuantity;
        if (totalInspected > item.receivedQuantity) {
          throw new Error(
            `Total inspected quantity for ${item.itemName} cannot exceed received quantity (${item.receivedQuantity})`,
          );
        }
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData();

      // Add inspection data as JSON
      const inspectionData = {
        inspectedBy: Number(formData.inspectedBy),
        overallRemarks: formData.overallRemarks || null,
        items: itemsToInspect.map((item) => ({
          lineId: item.lineId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          receivedQuantity: item.receivedQuantity,
          acceptedQuantity: item.acceptedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          qualityStatus: item.qualityStatus,
          reason: item.reason || null,
          remarks: item.remarks || null,
        })),
      };

      formDataToSend.append("inspectionData", JSON.stringify(inspectionData));

      // Add images for each item
      formData.items.forEach((item, index) => {
        if (item.images && item.images.length > 0) {
          // Check if any quantity was inspected for this item
          const hasInspection =
            item.acceptedQuantity > 0 || item.rejectedQuantity > 0;
          if (hasInspection) {
            item.images.forEach((imageFile, imgIndex) => {
              // Use the format: images_item_1, images_item_1 (for multiple images per item)
              const fieldName = `images_item_${index + 1}`;
              formDataToSend.append(fieldName, imageFile);
            });
          }
        }
      });

      const response = await api.post(
        `/inbound/${inbound.id}/quality-inspection`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setSuccess(true);
        onSuccess?.(response.data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(
          response.data.message || "Failed to record quality inspection",
        );
      }
    } catch (err) {
      console.error("Quality inspection error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to record quality inspection",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getQualityStatusColor = (status) => {
    const colors = {
      PENDING: "bg-gray-100 text-gray-700",
      ACCEPTED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PARTIAL: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || colors.PENDING;
  };

  const getQualityStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      ACCEPTED: <ThumbsUp className="w-4 h-4" />,
      REJECTED: <ThumbsDown className="w-4 h-4" />,
      PARTIAL: <AlertTriangle className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0  backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col animate-scale-up">
          {/* Decorative gradient header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-t-2xl"></div>

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pt-7 border-b border-gray-100 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Quality Inspection
                </h3>
                <p className="text-sm text-gray-500">
                  {inbound?.inboundNumber} • {inbound?.poNumber}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3 animate-slide-down flex-shrink-0">
              <div className="p-1.5 bg-green-500 rounded-full">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Quality Inspection Completed!
                </p>
                <p className="text-xs text-green-600">Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down flex-shrink-0">
              <div className="p-1 bg-red-500 rounded-full mt-0.5">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Inbound Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Inbound Number</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inbound?.inboundNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PO Number</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inbound?.poNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inbound?.supplierName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stage</p>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      INSPECTION
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Items to Inspect ({formData.items.length})
                  </h4>
                  <span className="text-xs text-gray-500">
                    Click ✓ or ✗ to bulk accept/reject
                  </span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">
                          Item
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">
                          UOM
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">
                          Received
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">
                          Accepted
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">
                          Rejected
                        </th>
                        {/* <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Defective</th> */}
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">
                          Status
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">
                          Reason
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">
                          Images
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {item.itemName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {item.itemCode}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm text-gray-600">
                            {item.uom}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm font-medium text-gray-700">
                            {item.receivedQuantity}
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={item.acceptedQuantity || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "acceptedQuantity",
                                  e.target.value,
                                )
                              }
                              min="0"
                              max={item.receivedQuantity}
                              className="w-16 px-2 py-1 text-right text-sm border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={item.rejectedQuantity || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "rejectedQuantity",
                                  e.target.value,
                                )
                              }
                              min="0"
                              max={item.receivedQuantity}
                              className="w-16 px-2 py-1 text-right text-sm border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                              placeholder="0"
                            />
                          </td>
                          {/* <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={item.defectiveQuantity || ''}
                              onChange={(e) => handleItemChange(index, 'defectiveQuantity', e.target.value)}
                              min="0"
                              max={item.receivedQuantity}
                              className="w-16 px-2 py-1 text-right text-sm border-2 border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 transition-all"
                              placeholder="0"
                            />
                          </td> */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {getQualityStatusIcon(item.qualityStatus)}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getQualityStatusColor(item.qualityStatus)}`}
                              >
                                {item.qualityStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={item.reason || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "reason",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all"
                              placeholder="Reason..."
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col items-center gap-1">
                              {/* Image Upload */}
                              <div className="flex items-center gap-1">
                                <input
                                  ref={(el) =>
                                    (fileInputRefs.current[index] = el)
                                  }
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleImageUpload(index, e)}
                                  className="hidden"
                                  id={`image-upload-${index}`}
                                />
                                <label
                                  htmlFor={`image-upload-${index}`}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Upload images"
                                >
                                  <Upload className="w-4 h-4" />
                                </label>
                              </div>
                              {/* Image Previews */}
                              {item.images && item.images.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 max-w-[120px]">
                                  {item.images.map((image, imgIndex) => (
                                    <div
                                      key={imgIndex}
                                      className="relative group"
                                    >
                                      <img
                                        src={getImagePreview(image)}
                                        alt={`Item ${index + 1} - Image ${imgIndex + 1}`}
                                        className="w-8 h-8 object-cover rounded border border-gray-200"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveImage(index, imgIndex)
                                        }
                                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.images && item.images.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  {item.images.length} image
                                  {item.images.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleBulkAccept(index)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Accept All"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBulkReject(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject All"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inspected By & Overall Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Inspected By
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />

                    <select
                      name="inspectedBy"
                      value={formData.inspectedBy}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all appearance-none"
                    >
                      <option value="">Select </option>

                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name ||
                            user.fullName ||
                            user.username ||
                            user.userName ||
                            `User ${user.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Overall Remarks
                    <span className="text-gray-400 text-xs ml-2">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    name="overallRemarks"
                    value={formData.overallRemarks}
                    onChange={handleChange}
                    rows="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                    placeholder="Overall inspection notes..."
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || success}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Inspecting...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Completed!
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Complete Inspection
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QualityInspectionModal;
