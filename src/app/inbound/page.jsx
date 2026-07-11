'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  X,
  Calendar,
  Truck,
  CheckCircle,
  AlertCircle,
  Eye,
  ClipboardList,
  Download,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Camera,
  FileText,
  User,
  Building,
  Clock,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import { exportWmsWorkbook } from '@/lib/exportExcel';

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    'low': { label: 'Low', color: 'bg-gray-200 text-gray-700 border-gray-300', icon: Flag },
    'normal': { label: 'Normal', color: 'bg-blue-200 text-blue-700 border-blue-300', icon: Flag },
    'medium': { label: 'Medium', color: 'bg-yellow-200 text-yellow-700 border-yellow-300', icon: Flag },
    'high': { label: 'High', color: 'bg-orange-200 text-orange-700 border-orange-300', icon: Flag },
    'urgent': { label: 'Urgent', color: 'bg-red-200 text-red-700 border-red-300', icon: Flag }
  };

  const config = priorityConfig[priority?.toLowerCase()] || priorityConfig.normal;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || 'pending').toLowerCase();
  const statusConfig = {
    'draft': { label: 'Draft', color: 'bg-gray-200 text-gray-700 border-gray-300', icon: FileText },
    'submitted': { label: 'Submitted', color: 'bg-yellow-200 text-yellow-700 border-yellow-300', icon: ClipboardList },
    'approved': { label: 'Approved', color: 'bg-green-200 text-green-700 border-green-300', icon: CheckCircle },
    'pending': { label: 'Pending', color: 'bg-yellow-200 text-yellow-700 border-yellow-300', icon: Clock },
    'in_progress': { label: 'In Progress', color: 'bg-blue-200 text-blue-700 border-blue-300', icon: Truck },
    'partial': { label: 'Partially Received', color: 'bg-blue-200 text-blue-700 border-blue-300', icon: AlertCircle },
    'completed': { label: 'Fully Received', color: 'bg-green-200 text-green-700 border-green-300', icon: CheckCircle },
    'quality_check': { label: 'Quality Check', color: 'bg-purple-200 text-purple-700 border-purple-300', icon: AlertCircle },
    'rejected': { label: 'Rejected', color: 'bg-red-200 text-red-700 border-red-300', icon: AlertCircle }
  };

  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const unwrapPurchaseRequestList = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const normalizePurchaseRequest = (pr) => {
  const items = Array.isArray(pr.items) ? pr.items : [];

  return {
    ...pr,
    priority: String(pr.priority || 'normal').toLowerCase(),
    status: String(pr.status || 'pending').toLowerCase(),
    supplier: pr.supplier || pr.supplierName || 'No supplier selected',
    supplierCode: pr.supplierCode || (pr.supplierId ? `SUP-${pr.supplierId}` : ''),
    totalAmount: Number(pr.totalAmount || 0),
    createdAt: pr.createdAt || pr.createdDate || pr.requestedDate || new Date().toISOString(),
    items: items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const receivedQuantity = Number(item.receivedQuantity || 0);
      const pendingQuantity = item.pendingQuantity ?? Math.max(quantity - receivedQuantity, 0);

      return {
        ...item,
        id: item.id ?? item.itemId ?? item.purchaseRequestItemId,
        itemCode: item.itemCode || '-',
        itemBarcode: item.itemBarcode || '-',
        quantity,
        receivedQuantity,
        pendingQuantity,
        receipts: Array.isArray(item.receipts) ? item.receipts : [],
      };
    }),
  };
};

// Function to get full card background color based on status
const getCardColors = (status) => {
  const normalizedStatus = String(status || 'pending').toLowerCase();
  
  const colorMap = {
    'fully received': {
      bg: 'bg-green-300',
      border: 'border-green-500',
      hover: 'hover:bg-green-400',
      shadow: 'shadow-green-300',
      text: 'text-gray-800'
    },
    'completed': {
      bg: 'bg-green-300',
      border: 'border-green-500',
      hover: 'hover:bg-green-400',
      shadow: 'shadow-green-300',
      text: 'text-gray-800'
    },
    'submitted': {
      bg: 'bg-yellow-300',
      border: 'border-yellow-500',
      hover: 'hover:bg-yellow-400',
      shadow: 'shadow-yellow-300',
      text: 'text-gray-800'
    },
    'partial': {
      bg: 'bg-blue-300',
      border: 'border-blue-500',
      hover: 'hover:bg-blue-400',
      shadow: 'shadow-blue-300',
      text: 'text-gray-800'
    },
    'rejected': {
      bg: 'bg-red-300',
      border: 'border-red-500',
      hover: 'hover:bg-red-400',
      shadow: 'shadow-red-300',
      text: 'text-gray-800'
    },
    'approved': {
      bg: 'bg-green-200',
      border: 'border-green-400',
      hover: 'hover:bg-green-300',
      shadow: 'shadow-green-200',
      text: 'text-gray-700'
    },
    'draft': {
      bg: 'bg-gray-200',
      border: 'border-gray-400',
      hover: 'hover:bg-gray-300',
      shadow: 'shadow-gray-200',
      text: 'text-gray-700'
    },
    'pending': {
      bg: 'bg-yellow-200',
      border: 'border-yellow-400',
      hover: 'hover:bg-yellow-300',
      shadow: 'shadow-yellow-200',
      text: 'text-gray-700'
    },
    'in_progress': {
      bg: 'bg-blue-200',
      border: 'border-blue-400',
      hover: 'hover:bg-blue-300',
      shadow: 'shadow-blue-200',
      text: 'text-gray-700'
    },
    'quality_check': {
      bg: 'bg-purple-200',
      border: 'border-purple-400',
      hover: 'hover:bg-purple-300',
      shadow: 'shadow-purple-200',
      text: 'text-gray-700'
    },
  };
  
  return colorMap[normalizedStatus] || {
    bg: 'bg-white',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50',
    shadow: 'shadow-gray-100',
    text: 'text-gray-900'
  };
};

const getDefaultReceiveQuantity = (item) => item?.pendingQuantity || item?.quantity || 0;

// Quality Check Modal - Updated with transparent background
const QualityCheckModal = ({ isOpen, onClose, item, onConfirm }) => {
  const [qualityStatus, setQualityStatus] = useState('good');
  const [remarks, setRemarks] = useState('');
  const [receivedQuantity, setReceivedQuantity] = useState(() => getDefaultReceiveQuantity(item));
  const [defectiveQuantity, setDefectiveQuantity] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (item) {
      const defaultReceive = item.pendingQuantity || item.quantity || 0;
      setReceivedQuantity(defaultReceive);
      setDefectiveQuantity(0);
      setQualityStatus('good');
      setRemarks('');
      setImages([]);
    }
  }, [item]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const handleSubmit = () => {
    const maxReceive = item.pendingQuantity || item.quantity || 0;
    if (receivedQuantity > maxReceive) {
      toast.error(`Cannot receive more than ${maxReceive} units`);
      return;
    }

    onConfirm({
      itemId: item.id,
      qualityStatus,
      remarks,
      receivedQuantity: Number(receivedQuantity),
      defectiveQuantity: Number(defectiveQuantity),
      images
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Quality Check</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Item Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Item Code:</span>
                <span className="ml-2 font-medium">{item?.itemCode}</span>
              </div>
              <div>
                <span className="text-gray-600">Item Barcode:</span>
                <span className="ml-2 font-medium">{item?.itemBarcode || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">Item Name:</span>
                <span className="ml-2 font-medium">{item?.itemName}</span>
              </div>
              <div>
                <span className="text-gray-600">Ordered Quantity:</span>
                <span className="ml-2 font-medium">{item?.quantity} {item?.unit}</span>
              </div>
              <div>
                <span className="text-gray-600">Already Received:</span>
                <span className="ml-2 font-medium text-green-600">{item?.receivedQuantity || 0} {item?.unit}</span>
              </div>
              <div>
                <span className="text-gray-600">Pending Quantity:</span>
                <span className="ml-2 font-medium text-orange-600">{item?.pendingQuantity || item?.quantity || 0} {item?.unit}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Status
            </label>
            <select
              value={qualityStatus}
              onChange={(e) => {
                setQualityStatus(e.target.value);
                if (e.target.value === 'good') {
                  setReceivedQuantity(item?.pendingQuantity || item?.quantity || 0);
                  setDefectiveQuantity(0);
                } else if (e.target.value === 'rejected') {
                  setReceivedQuantity(0);
                  setDefectiveQuantity(0);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="good">Good - Accept All</option>
              <option value="partial">Partial - Accept with Defects</option>
              <option value="rejected">Rejected - Return All</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Received Quantity (Good Items)
            </label>
            <input
              type="number"
              value={receivedQuantity}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                const maxPending = item?.pendingQuantity || item?.quantity || 0;
                if (val <= maxPending) {
                  setReceivedQuantity(val);
                } else {
                  toast.error(`Cannot exceed pending quantity (${maxPending})`);
                }
              }}
              min={0}
              max={item?.pendingQuantity || item?.quantity || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max: {item?.pendingQuantity || item?.quantity || 0} {item?.unit}
            </p>
          </div>

          {qualityStatus === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Defective Quantity
              </label>
              <input
                type="number"
                value={defectiveQuantity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const maxPending = item?.pendingQuantity || item?.quantity || 0;
                  if (val + receivedQuantity <= maxPending) {
                    setDefectiveQuantity(val);
                  } else {
                    toast.error(`Total (received + defective) cannot exceed ${maxPending}`);
                  }
                }}
                min={0}
                max={item?.pendingQuantity || item?.quantity || 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: {(item?.pendingQuantity || item?.quantity || 0) - receivedQuantity} {item?.unit}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks / Notes
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quality check remarks..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {images.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {images.length} file(s) selected
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={receivedQuantity === 0 && qualityStatus !== 'rejected'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

// Receipt History Modal
const ReceiptHistoryModal = ({ isOpen, onClose, receipts }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Receipt History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {receipts && receipts.length > 0 ? (
            <div className="space-y-4">
              {receipts.map((receipt, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-800">Receipt #{index + 1}</p>
                      <p className="text-sm text-gray-600">
                        Date: {format(new Date(receipt.receivedDate), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                    <StatusBadge status={receipt.qualityStatus} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Received Quantity:</span>
                      <span className="ml-2 font-medium">{receipt.receivedQuantity}</span>
                    </div>
                    {receipt.defectiveQuantity > 0 && (
                      <div>
                        <span className="text-gray-600">Defective Quantity:</span>
                        <span className="ml-2 font-medium text-red-600">{receipt.defectiveQuantity}</span>
                      </div>
                    )}
                    {receipt.remarks && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Remarks:</span>
                        <span className="ml-2">{receipt.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No receipt records found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InboundPage() {
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [expandedPR, setExpandedPR] = useState(null);

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  const fetchPurchaseRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/purchase-requests', {
        params: { size: 100, sortBy: 'createdAt', sortDir: 'desc' },
      });
      let data = unwrapPurchaseRequestList(response.data).map(normalizePurchaseRequest);
      
      data = data.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPurchaseRequests(data);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Failed to load purchase requests');
      const demoData = [
        {
          id: 1,
          prNumber: 'PR-2026-0023',
          requestedDate: '2026-06-20',
          requiredDate: '2026-06-26',
          createdAt: '2026-06-20T10:00:00Z',
          status: 'submitted',
          priority: 'high',
          supplier: 'No supplier selected',
          supplierCode: '',
          totalAmount: 1000000,
          items: [
            { id: 1, itemCode: 'ITEM001', itemBarcode: '8901234567890', itemName: 'Macbook', quantity: 10, unit: 'pcs', unitPrice: 100000, total: 1000000, receivedQuantity: 0, pendingQuantity: 10, receipts: [] }
          ]
        },
        {
          id: 2,
          prNumber: 'PR-2026-0022',
          requestedDate: '2026-06-19',
          requiredDate: '2026-06-27',
          createdAt: '2026-06-19T14:30:00Z',
          status: 'submitted',
          priority: 'medium',
          supplier: 'No supplier selected',
          supplierCode: '',
          totalAmount: 1344,
          items: [
            { id: 2, itemCode: 'ITEM002', itemBarcode: '8901234567891', itemName: 'ww', quantity: 3, unit: 'pcs', unitPrice: 448, total: 1344, receivedQuantity: 0, pendingQuantity: 3, receipts: [] }
          ]
        },
        {
          id: 3,
          prNumber: 'PR-2026-0021',
          requestedDate: '2026-06-18',
          requiredDate: '2026-06-20',
          createdAt: '2026-06-18T09:15:00Z',
          status: 'submitted',
          priority: 'urgent',
          supplier: 'No supplier selected',
          supplierCode: '',
          totalAmount: 202500,
          items: [
            { id: 3, itemCode: 'ITEM003', itemBarcode: '8901234567892', itemName: 'Water Bottle', quantity: 500, unit: 'pcs', unitPrice: 150, total: 75000, receivedQuantity: 0, pendingQuantity: 500, receipts: [] },
            { id: 4, itemCode: 'ITEM004', itemBarcode: '8901234567893', itemName: 'Dell Laptop', quantity: 5, unit: 'pcs', unitPrice: 25500, total: 127500, receivedQuantity: 0, pendingQuantity: 5, receipts: [] }
          ]
        },
        {
          id: 4,
          prNumber: 'PR-2026-0020',
          requestedDate: '2026-06-17',
          requiredDate: '2026-06-29',
          createdAt: '2026-06-17T16:45:00Z',
          status: 'completed',
          priority: 'medium',
          supplier: 'No supplier selected',
          supplierCode: '',
          totalAmount: 100000,
          items: [
            { id: 5, itemCode: 'ITEM005', itemBarcode: '8901234567894', itemName: 'Redmi mobile', quantity: 10, unit: 'pcs', unitPrice: 10000, total: 100000, receivedQuantity: 10, pendingQuantity: 0, receipts: [{ receivedDate: '2026-06-18', receivedQuantity: 10, qualityStatus: 'good' }] }
          ]
        },
        {
          id: 5,
          prNumber: 'PR-2026-0019',
          requestedDate: '2026-06-16',
          requiredDate: '2026-06-25',
          createdAt: '2026-06-16T11:30:00Z',
          status: 'partial',
          priority: 'high',
          supplier: 'No supplier selected',
          supplierCode: '',
          totalAmount: 0,
          items: [
            { id: 6, itemCode: 'ITEM006', itemBarcode: '8901234567895', itemName: 'Test Item', quantity: 10, unit: 'pcs', unitPrice: 0, total: 0, receivedQuantity: 5, pendingQuantity: 5, receipts: [{ receivedDate: '2026-06-18', receivedQuantity: 5, qualityStatus: 'good' }] }
          ]
        }
      ];
      
      let sortedDemo = demoData.map(normalizePurchaseRequest);
      sortedDemo = sortedDemo.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPurchaseRequests(sortedDemo);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiveItem = (item, pr) => {
    const itemId = item.id ?? item.itemId ?? item.purchaseRequestItemId;
    if (!itemId) {
      toast.error('Cannot receive this item because its item id is missing');
      return;
    }

    setSelectedItem({
      ...item,
      id: itemId,
      prNumber: pr.prNumber,
      supplier: pr.supplier,
      quantity: item.quantity || 0,
      receivedQuantity: item.receivedQuantity || 0,
      pendingQuantity: item.pendingQuantity || item.quantity || 0
    });
    setShowQualityModal(true);
  };

  const handleQualityConfirm = async (data) => {
    try {
      if (!data.itemId) {
        toast.error('Cannot receive this item because its item id is missing');
        return;
      }

      if (data.receivedQuantity <= 0) {
        toast.error('Received quantity must be greater than 0');
        return;
      }

      const requestData = {
        receivedQuantity: Number(data.receivedQuantity),
        defectiveQuantity: Number(data.defectiveQuantity || 0),
        qualityStatus: data.qualityStatus.toUpperCase().trim(),
        remarks: data.remarks || '',
        images: (data.images || []).map((image) => image.name).filter(Boolean)
      };

      const response = await api.post(
        `/purchase-requests/items/${data.itemId}/receive`,
        requestData
      );

      if (response.data.success) {
        const updatedItem = response.data.data;
        
        setPurchaseRequests(prevPRs =>
          prevPRs.map(pr => ({
            ...pr,
            items: pr.items.map(item =>
              item.id === updatedItem.id ? updatedItem : item
            )
          }))
        );

        setShowQualityModal(false);
        setSelectedItem(null);
        toast.success('✅ Items received successfully');
        fetchPurchaseRequests();
      } else {
        toast.error(response.data?.message || 'Failed to receive items');
      }
    } catch (error) {
      console.error('❌ Error receiving items:', error);
      const errorPayload = error.response?.data;
      let errorMessage = 'Failed to receive items';
      
      if (errorPayload) {
        errorMessage = errorPayload.message || 
                       errorPayload.error || 
                       errorPayload.detail ||
                       (Array.isArray(errorPayload.errors) ? errorPayload.errors.join(', ') : null) ||
                       'Failed to receive items';
      }
      
      toast.error(errorMessage);
    }
  };

  const viewReceiptHistory = (item) => {
    setSelectedReceipts(item.receipts || []);
    setShowHistoryModal(true);
  };

  const exportInboundData = async () => {
    const exportData = purchaseRequests.map(pr => ({
      prNumber: pr.prNumber,
      supplier: pr.supplier,
      priority: pr.priority || 'normal',
      status: pr.status,
      totalItems: pr.items.length,
      totalQuantity: pr.items.reduce((sum, item) => sum + item.quantity, 0),
      receivedQuantity: pr.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
      pendingQuantity: pr.items.reduce((sum, item) => sum + (item.pendingQuantity || 0), 0),
      requiredDate: pr.requiredDate
    }));

    await exportWmsWorkbook({
      fileName: `inbound_summary_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      sheetName: 'Inbound Summary',
      title: 'Inbound Summary Report',
      columns: [
        { header: 'PR Number', key: 'prNumber', width: 16 },
        { header: 'Supplier', key: 'supplier', width: 24 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Total Items', key: 'totalItems', width: 12, align: 'right' },
        { header: 'Total Quantity', key: 'totalQuantity', width: 14, align: 'right' },
        { header: 'Received Quantity', key: 'receivedQuantity', width: 16, align: 'right' },
        { header: 'Pending Quantity', key: 'pendingQuantity', width: 14, align: 'right' },
        { header: 'Required Date', key: 'requiredDate', width: 14, align: 'center' }
      ],
      rows: exportData
    });
    toast.success('Inbound data exported successfully');
  };

  const filteredPRs = useMemo(() => {
    const requests = Array.isArray(purchaseRequests) ? purchaseRequests : [];
    let list = [...requests];

    if (statusFilter !== 'ALL') {
      list = list.filter(pr => pr.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      list = list.filter(pr => (pr.priority || 'normal').toLowerCase() === priorityFilter.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(pr =>
        String(pr.prNumber ?? '').toLowerCase().includes(q) ||
        String(pr.supplier ?? '').toLowerCase().includes(q) ||
        (pr.items || []).some(item => String(item.itemName ?? '').toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.requestedDate || 0);
      const dateB = new Date(b.createdAt || b.requestedDate || 0);
      return dateB - dateA;
    });
  }, [purchaseRequests, statusFilter, priorityFilter, search]);

  const stats = useMemo(() => {
    const requests = Array.isArray(purchaseRequests) ? purchaseRequests : [];

    const totalPRs = requests.length;
    const totalItems = requests.reduce((sum, pr) => sum + (pr.items?.length || 0), 0);
    const totalReceived = requests.reduce((sum, pr) =>
      sum + (pr.items || []).reduce((s, item) => s + (item.receivedQuantity || 0), 0), 0);
    const totalOrdered = requests.reduce((sum, pr) =>
      sum + (pr.items || []).reduce((s, item) => s + (item.quantity || 0), 0), 0);
    const completionRate = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

    const urgentCount = requests.filter(pr => (pr.priority || 'normal').toLowerCase() === 'urgent').length;
    const highCount = requests.filter(pr => (pr.priority || 'normal').toLowerCase() === 'high').length;

    return {
      totalPRs,
      totalItems,
      totalReceived,
      totalOrdered,
      completionRate: completionRate.toFixed(1),
      urgentCount,
      highCount
    };
  }, [purchaseRequests]);

  const toggleExpandPR = (prId) => {
    setExpandedPR(expandedPR === prId ? null : prId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Inbound Management</h1>
                <p className="text-green-100 text-sm mt-1">Receive and quality check purchase orders</p>
              </div>
              <button
                onClick={exportInboundData}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors text-white"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard title="Total Purchase Requests" value={stats.totalPRs} icon={ClipboardList} color="bg-blue-600" />
          <StatCard title="Total Items" value={stats.totalItems} icon={Package} color="bg-purple-600" />
          <StatCard title="Items Received" value={`${stats.totalReceived}/${stats.totalOrdered}`} icon={CheckCircle} color="bg-green-600" />
          <StatCard title="Completion Rate" value={`${stats.completionRate}%`} icon={Truck} color="bg-orange-600" />
          <StatCard title="Urgent/High Priority" value={`${stats.urgentCount + stats.highCount}`} icon={Flag} color="bg-red-600" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by PR number, supplier, or item name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="partial">Partially Received</option>
                <option value="completed">Fully Received</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredPRs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Purchase Requests Found</h3>
            <p className="text-gray-500">No purchase requests match your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPRs.map(pr => {
              // Get the card colors based on status
              const colors = getCardColors(pr.status);
              
              return (
                <div 
                  key={pr.id} 
                  className={`rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-300 ${colors.bg} ${colors.border} ${colors.shadow}`}
                >
                  <div className={`p-6 cursor-pointer transition-colors ${colors.hover}`} onClick={() => toggleExpandPR(pr.id)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className={`text-lg font-semibold ${colors.text}`}>{pr.prNumber}</h3>
                          <PriorityBadge priority={pr.priority || 'normal'} />
                          <StatusBadge status={pr.status} />
                          
                          {/* Status indicator badge */}
                          {pr.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white border border-green-600">
                              <CheckCircle className="w-3 h-3" />
                              All Items Received
                            </span>
                          )}
                          {pr.status === 'submitted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white border border-yellow-600">
                              <Clock className="w-3 h-3" />
                              Pending Approval
                            </span>
                          )}
                          {pr.status === 'partial' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500 text-white border border-blue-600">
                              <AlertCircle className="w-3 h-3" />
                              Partially Received
                            </span>
                          )}
                          {pr.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white border border-red-600">
                              <AlertCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className={`flex items-center gap-2 ${colors.text}`}>
                            <Building className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Supplier:</span>
                            <span className={`font-medium ${colors.text}`}>{pr.supplier}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${colors.text}`}>
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Required Date:</span>
                            <span className={`font-medium ${colors.text}`}>{format(new Date(pr.requiredDate), 'dd MMM yyyy')}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${colors.text}`}>
                            <Package className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Total Amount:</span>
                            <span className={`font-medium ${colors.text}`}>₹{pr.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${colors.text}`}>
                            <ClipboardList className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Items:</span>
                            <span className={`font-medium ${colors.text} truncate max-w-[300px]`} title={pr.items?.map(item => item.itemName).join(', ') || 'No items'}>
                              {pr.items && pr.items.length > 0 
                                ? pr.items.map(item => item.itemName).join(', ')
                                : 'No items'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-600 ml-4">
                        {expandedPR === pr.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {expandedPR === pr.id && (
                    <div className="border-t-2 border-gray-300 bg-white/60">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100/80">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Item Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Item Barcode</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Item Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ordered Qty</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Received Qty</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Pending Qty</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Unit</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {pr.items.map(item => {
                              const isFullyReceived = item.pendingQuantity === 0;
                              return (
                                <tr 
                                  key={item.id} 
                                  className={`hover:bg-gray-100 transition-colors ${
                                    isFullyReceived ? 'bg-green-100' : ''
                                  }`}
                                >
                                  <td className="px-4 py-3 text-sm font-mono">{item.itemCode}</td>
                                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{item.itemBarcode || '-'}</td>
                                  <td className="px-4 py-3 text-sm font-medium">{item.itemName}</td>
                                  <td className="px-4 py-3 text-sm">{item.quantity} {item.unit}</td>
                                  <td className="px-4 py-3 text-sm text-green-700 font-medium">
                                    {item.receivedQuantity || 0} {item.unit}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium ${
                                    isFullyReceived ? 'text-green-700' : 'text-orange-700'
                                  }`}>
                                    {item.pendingQuantity ?? item.quantity} {item.unit}
                                  </td>
                                  <td className="px-4 py-3 text-sm">{item.unit}</td>
                                  <td className="px-4 py-3">
                                    {isFullyReceived ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-300 text-green-800 border border-green-400">
                                        <CheckCircle className="w-3 h-3" />
                                        Received
                                      </span>
                                    ) : item.receivedQuantity > 0 ? (
                                      <StatusBadge status="partial" />
                                    ) : (
                                      <StatusBadge status="pending" />
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      {!isFullyReceived && pr.status !== 'rejected' && (
                                        <button
                                          onClick={() => handleReceiveItem(item, pr)}
                                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                        >
                                          <Truck className="w-3 h-3" />
                                          Receive
                                        </button>
                                      )}
                                      {item.receipts && item.receipts.length > 0 && (
                                        <button
                                          onClick={() => viewReceiptHistory(item)}
                                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" />
                                          History
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quality Check Modal */}
      <QualityCheckModal
        key={selectedItem?.id || 'no-selected-item'}
        isOpen={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        item={selectedItem}
        onConfirm={handleQualityConfirm}
      />

      {/* Receipt History Modal */}
      <ReceiptHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        receipts={selectedReceipts}
      />
    </div>
  );
}