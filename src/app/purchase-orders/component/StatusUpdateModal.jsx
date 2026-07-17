// components/purchase-orders/StatusUpdateModal.jsx
import React, { useEffect, useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle,
  Send,
  Clock,
  XCircle,
  Edit,
  FileText,
  ChevronDown,
  Package,
  Truck,
  CheckSquare,
  Building2,
  ShoppingBag,
  DollarSign,
  ThumbsUp,
  CheckCircle2,
} from 'lucide-react';

const StatusUpdateModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onStatusUpdate,
  allStatuses,
  loading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  useEffect(()=>{
setSelectedStatus('')
  },[isOpen])
  // All statuses with labels, colors, and icons
//   const allStatuses = [
//   { 
//     value: 'PENDING', 
//     label: 'PENDING', 
//     color: 'bg-amber-100 text-amber-700 border-amber-200',
//     icon: <Clock className="w-4 h-4" />,
//     bgColor: 'hover:bg-amber-50'
//   },
//   { 
//     value: 'APPROVED', 
//     label: 'APPROVED', 
//     color: 'bg-blue-100 text-blue-700 border-blue-200',
//     icon: <ThumbsUp className="w-4 h-4" />,
//     bgColor: 'hover:bg-blue-50'
//   },
//   { 
//     value: 'SEND', 
//     label: 'SEND', 
//     color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
//     icon: <Send className="w-4 h-4" />,
//     bgColor: 'hover:bg-cyan-50'
//   },
//   { 
//     value: 'ACCEPTED', 
//     label: 'ACCEPTED', 
//     color: 'bg-green-100 text-green-700 border-green-200',
//     icon: <CheckCircle2 className="w-4 h-4" />,
//     bgColor: 'hover:bg-green-50'
//   },
//   { 
//     value: 'REJECTED', 
//     label: 'Rejected', 
//     color: 'bg-red-100 text-red-700 border-red-200',
//     icon: <XCircle className="w-4 h-4" />,
//     bgColor: 'hover:bg-red-50'
//   },
// ];

  const getStatusColor = (statusValue) => {
    const status = allStatuses.find(s => s.value === statusValue);
    return status?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (statusValue) => {
    const status = allStatuses.find(s => s.value === statusValue);
    return status?.label || statusValue?.replace(/_/g, ' ') || 'N/A';
  };

  const getStatusIcon = (statusValue) => {
    const status = allStatuses.find(s => s.value === statusValue);
    return status?.icon || <FileText className="w-4 h-4" />;
  };

  const getStatusBg = (statusValue) => {
    const status = allStatuses.find(s => s.value === statusValue);
    return status?.bgColor || 'hover:bg-gray-50';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    if (selectedStatus === 'REJECTED' && !rejectionReason.trim()) {
      setError('Rejection reason is required for REJECTED status');
      return;
    }

    const statusData = {
      status: selectedStatus,
      action: selectedStatus,
      remarks: remarks.trim() || undefined,
      rejectionReason: selectedStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
    };

    try {
      await onStatusUpdate(purchaseOrder.id, statusData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0   transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-up">
          {/* Decorative gradient header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 pt-7">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Update Status
                </h3>
                <p className="text-sm text-gray-500">
                  PO #{purchaseOrder?.poNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-6">
            {/* Current Status Card */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Current Status</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(purchaseOrder?.status)}
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor(purchaseOrder?.status)}`}>
                    {getStatusLabel(purchaseOrder?.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
                <div className="p-1 bg-red-500 rounded-full mt-0.5">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Status Selection - Custom Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select New Status
                <span className="text-red-500 ml-1">*</span>
              </label>
              
              {/* Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all flex items-center justify-between hover:border-blue-300"
                >
                  <div className="flex items-center gap-3">
                    {selectedStatus ? (
                      <>
                        <div className="p-1.5 rounded-lg bg-gray-50">
                          {getStatusIcon(selectedStatus)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(selectedStatus)}`}>
                          {getStatusLabel(selectedStatus)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 font-medium">Choose a status...</span>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Click outside handler */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-80 overflow-auto">
                      <div className="p-2">
                        {/* Search/Filter header */}
                        <div className="px-3 py-2 mb-1">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Available Statuses
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          {allStatuses.map((status) => (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() => {
                                setSelectedStatus(status.value);
                                setIsDropdownOpen(false);
                                if (status.value !== 'REJECTED') {
                                  setRejectionReason('');
                                }
                              }}
                              className={`w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center gap-3 group
                                ${selectedStatus === status.value 
                                  ? 'bg-blue-50 ring-2 ring-blue-200' 
                                  : `${status.bgColor}`
                                }`}
                            >
                              <div className={`p-1.5 rounded-lg ${selectedStatus === status.value ? 'bg-blue-100' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                                {status.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                    {status.label}
                                  </span>
                                  {selectedStatus === status.value && (
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Status code: {status.value}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className="w-4 h-4 text-gray-300 rotate-[-90deg]" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Selected status hint */}
              {selectedStatus && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-500">
                    You can change to any status
                  </span>
                </div>
              )}
            </div>

            {/* Rejection Reason - Only for REJECTED */}
            {selectedStatus === 'REJECTED' && (
              <div className="animate-slide-down">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all resize-none"
                    placeholder="Please provide a detailed reason for rejection..."
                    required
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    <XCircle className="w-4 h-4 inline mr-1 text-red-400" />
                    Required for rejection
                  </div>
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remarks
                <span className="text-gray-400 text-xs ml-2">(optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows="2"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                placeholder="Add any additional notes or comments..."
              />
            </div>

            {/* PO Information Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Supplier</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {purchaseOrder?.supplierName || 'N/A'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Items</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {purchaseOrder?.lines?.length || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Grand Total</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{purchaseOrder?.grandTotal?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Update Status
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

export default StatusUpdateModal;