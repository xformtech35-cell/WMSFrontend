// components/inbound/UnloadingModal.jsx
"use client";
import React, { useState } from 'react';
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
} from 'lucide-react';
import api from '@/lib/api';

const UnloadingModal = ({
  isOpen,
  onClose,
  inbound,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    boxesUnloadedQuantity: '',
    unloadedBy: '',
    remarks: '',
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && inbound) {
      setFormData({
        boxesUnloadedQuantity: '',
        unloadedBy: '',
        remarks: `Unloading for ${inbound.inboundNumber}`,
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen, inbound]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.boxesUnloadedQuantity || parseInt(formData.boxesUnloadedQuantity) <= 0) {
        throw new Error('Please enter a valid number of boxes unloaded');
      }
      if (!formData.unloadedBy) {
        throw new Error('Unloaded by is required');
      }

      const unloadingData = {
        boxesUnloadedQuantity: parseInt(formData.boxesUnloadedQuantity),
        unloadedBy: formData.unloadedBy,
        remarks: formData.remarks || null,
      };

      const response = await api.post(`/inbound/${inbound.id}/unloading`, unloadingData);
      
      if (response.data.success) {
        setSuccess(true);
        onSuccess?.(response.data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to record unloading');
      }
    } catch (err) {
      console.error('Unloading error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to record unloading');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0   transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
          {/* Decorative gradient header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-t-2xl"></div>

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pt-7 border-b border-gray-100">
            <div className="flex items-center gap-4">
              
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Record Unloading
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
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3 animate-slide-down">
              <div className="p-1.5 bg-green-500 rounded-full">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Unloading Recorded Successfully!</p>
                <p className="text-xs text-green-600">Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
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
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-6">
            {/* Inbound Summary */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Inbound Number</p>
                  <p className="text-sm font-semibold text-gray-900">{inbound?.inboundNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PO Number</p>
                  <p className="text-sm font-semibold text-gray-900">{inbound?.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="text-sm font-semibold text-gray-900">{inbound?.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Stage</p>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {inbound?.stage?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                Items to Unload
              </h4>
              <div className="space-y-2">
                {inbound?.lines?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.itemName}</span>
                    <span className="font-medium text-gray-800">
                      {item.orderedQuantity} {item.uom}
                    </span>
                  </div>
                ))}
                {inbound?.lines?.length > 3 && (
                  <p className="text-xs text-gray-400">+ {inbound.lines.length - 3} more items</p>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Boxes Unloaded */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Boxes Unloaded
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="boxesUnloadedQuantity"
                    value={formData.boxesUnloadedQuantity}
                    onChange={handleChange}
                    placeholder="Number of boxes"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Enter the total number of boxes unloaded</p>
              </div>

              {/* Unloaded By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unloaded By
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="unloadedBy"
                    value={formData.unloadedBy}
                    onChange={handleChange}
                    placeholder="Name of person who unloaded"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Unloading Start/End Time - Optional */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unloading Start Time
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="unloadingStartTime"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unloading End Time
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="unloadingEndTime"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>
            </div> */}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remarks
                <span className="text-gray-400 text-xs ml-2">(optional)</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all resize-none"
                placeholder="Add any additional notes about the unloading process..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Recording...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Completed!
                  </>
                ) : (
                  <>
                    <Box className="w-4 h-4" />
                    Record Unloading
                  </>
                )}
              </button>
            </div>
          </form>
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

export default UnloadingModal;