// components/inbound/GoodsReceivingModal.jsx
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
  Clipboard,
  CheckSquare,
  Edit,
  Save,
} from 'lucide-react';
import api from '@/lib/api';

const GoodsReceivingModal = ({
  isOpen,
  onClose,
  inbound,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    receivedBy: 1, // Default to current user
    remarks: '',
    items: [],
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && inbound) {
      const items = inbound.lines?.map((line) => ({
        lineId: line.id,
        itemCode: line.itemCode,
        itemName: line.itemName,
        uom: line.uom,
        requiredQuantity: line.orderedQuantity,
        receivedQuantity: line.receivedQuantity || 0,
        pendingQuantity: line.pendingQuantity || line.orderedQuantity,
        totalQuantity: line.orderedQuantity,
        remarks: '',
      })) || [];
      
      setFormData({
        receivedBy: 1,
        remarks: `Receiving goods for ${inbound.inboundNumber}`,
        items: items,
      });
      setError('');
      setSuccess(false);
      setActiveItemIndex(null);
    }
  }, [isOpen, inbound]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    if (field === 'receivedQuantity') {
      const received = parseInt(value) || 0;
      const pending = item.requiredQuantity - received;
      item.receivedQuantity = received;
      item.pendingQuantity = Math.max(0, pending);
    } else {
      item[field] = value;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

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
      // Validate - check if any items are being received
      const itemsToReceive = formData.items.filter(item => item.receivedQuantity > 0);
      if (itemsToReceive.length === 0) {
        throw new Error('Please enter received quantity for at least one item');
      }

      // Validate received quantities
      for (const item of itemsToReceive) {
        if (item.receivedQuantity > item.requiredQuantity) {
          throw new Error(`Received quantity for ${item.itemName} cannot exceed required quantity`);
        }
      }

      const receivingData = {
        receivedBy: formData.receivedBy,
        remarks: formData.remarks || null,
        items: itemsToReceive.map(item => ({
          lineId: item.lineId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          uom: item.uom,
          requiredQuantity: item.requiredQuantity,
          receivedQuantity: item.receivedQuantity,
          pendingQuantity: item.pendingQuantity,
          totalQuantity: item.totalQuantity,
          remarks: item.remarks || null,
        })),
      };

      const response = await api.post(`/inbound/${inbound.id}/receive`, receivingData);
      
      if (response.data.success) {
        setSuccess(true);
        onSuccess?.(response.data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to record receiving');
      }
    } catch (err) {
      console.error('Receiving error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to record receiving');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Calculate totals
  const totalRequired = formData.items.reduce((sum, item) => sum + item.requiredQuantity, 0);
  const totalReceived = formData.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  const totalPending = formData.items.reduce((sum, item) => sum + item.pendingQuantity, 0);
  const hasPartial = formData.items.some(item => item.receivedQuantity > 0 && item.receivedQuantity < item.requiredQuantity);
  const hasFull = formData.items.every(item => item.receivedQuantity >= item.requiredQuantity);

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
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-up">
          {/* Decorative gradient header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-2xl"></div>

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pt-7 border-b border-gray-100 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-200">
                <Clipboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Goods Receiving
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
                <p className="text-sm font-semibold text-green-800">Goods Received Successfully!</p>
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    <p className="text-xs text-gray-500">Stage</p>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      RECEIVING
                    </span>
                  </div>
                </div>
              </div>

              {/* Receiving Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-gray-500">Total Required</p>
                  <p className="text-xl font-bold text-blue-700">{totalRequired}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-gray-500">Total Received</p>
                  <p className="text-xl font-bold text-green-700">{totalReceived}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-xs text-gray-500">Total Pending</p>
                  <p className="text-xl font-bold text-orange-700">{totalPending}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Items to Receive ({formData.items.length})
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    {hasFull && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">All Received</span>
                    )}
                    {hasPartial && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Partial Receiving</span>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">UOM</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Required</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Received</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Pending</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{item.itemName}</p>
                              <p className="text-xs text-gray-400">{item.itemCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center text-sm text-gray-600">
                            {item.uom}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-medium text-gray-700">
                            {item.requiredQuantity}
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              value={item.receivedQuantity || ''}
                              onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                              min="0"
                              max={item.requiredQuantity}
                              className="w-20 px-2 py-1 text-right text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-medium text-orange-600">
                            {item.pendingQuantity}
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={item.remarks || ''}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              className="w-full px-2 py-1 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
                              placeholder="Notes..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Received By & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Received By
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="receivedBy"
                      value={formData.receivedBy}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks
                    <span className="text-gray-400 text-xs ml-2">(optional)</span>
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all resize-none"
                    placeholder="Add receiving notes..."
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
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Receiving...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Completed!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Receive Goods
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

export default GoodsReceivingModal;