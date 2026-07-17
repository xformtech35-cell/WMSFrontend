// components/purchase-orders/InboundCreationModal.jsx
import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle,
  Send,
  Clock,
  Package,
  Truck,
  Building2,
  Calendar,
  FileText,
  User,
  Phone,
  Hash,
  Loader,
  ArrowRight,
  Warehouse,
  Box,
  CheckSquare,
} from 'lucide-react';
import api from '@/lib/api';

const InboundCreationModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    inboundDate: new Date().toISOString().split('T')[0],
    expectedArrivalDate: '',
    invoiceNumber: '',
    deliveryChallan: '',
    trackingNumber: '',
    trackingName: '',
    remarks: '',
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && purchaseOrder) {
      // Pre-fill with PO data
      setFormData({
        inboundDate: new Date().toISOString().split('T')[0],
        expectedArrivalDate: '',
        invoiceNumber: `INV-${purchaseOrder.poNumber || ''}`,
        deliveryChallan: `DC-${purchaseOrder.poNumber || ''}`,
        trackingNumber: '',
        trackingName: '',
        remarks: `Inbound from PO ${purchaseOrder.poNumber}`,
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen, purchaseOrder]);

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
      if (!formData.inboundDate) {
        throw new Error('Inbound date is required');
      }

      const inboundData = {
        purchaseOrderId: purchaseOrder.id,
        inboundDate: formData.inboundDate,
        expectedArrivalDate: formData.expectedArrivalDate || null,
        poNumber: purchaseOrder.poNumber,
        invoiceNumber: formData.invoiceNumber || null,
        deliveryChallan: formData.deliveryChallan || null,
        supplierName: purchaseOrder.supplierName,
        trackingNumber: formData.trackingNumber || null,
        trackingName: formData.trackingName || null,
        remarks: formData.remarks || null,
      };

      const response = await api.post('/inbound', inboundData);
      
      if (response.data.success) {
        setSuccess(true);
        onSuccess?.(response.data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to create inbound');
      }
    } catch (err) {
      console.error('Inbound creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create inbound');
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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-2xl"></div>

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pt-7 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-200">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Create Inbound
                </h3>
                <p className="text-sm text-gray-500">
                  For PO #{purchaseOrder?.poNumber}
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
                <p className="text-sm font-semibold text-green-800">Inbound Created Successfully!</p>
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
            {/* PO Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">PO Number</p>
                  <p className="text-sm font-semibold text-gray-900">{purchaseOrder?.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="text-sm font-semibold text-gray-900">{purchaseOrder?.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-sm font-semibold text-gray-900">{purchaseOrder?.lines?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Grand Total</p>
                  <p className="text-sm font-semibold text-gray-900">₹{purchaseOrder?.grandTotal?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inbound Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inbound Date
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="inboundDate"
                    value={formData.inboundDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Expected Arrival Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Arrival
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="expectedArrivalDate"
                    value={formData.expectedArrivalDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Invoice Number
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    placeholder="INV-2026-001"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              {/* Delivery Challan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Challan
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="deliveryChallan"
                    value={formData.deliveryChallan}
                    onChange={handleChange}
                    placeholder="DC-2026-001"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              {/* Tracking Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Number
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={handleChange}
                    placeholder="TRK-123456"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              {/* Tracking Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Owner
                  <span className="text-gray-400 text-xs ml-2">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="trackingName"
                    value={formData.trackingName}
                    onChange={handleChange}
                    placeholder="Logistics Company"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
            </div>

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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                placeholder="Add any additional notes about this inbound..."
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
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Created!
                  </>
                ) : (
                  <>
                    <Warehouse className="w-4 h-4" />
                    Create Inbound
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

export default InboundCreationModal;