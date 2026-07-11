"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Send,
  Save,
  Calendar,
  AlertCircle,
  Flag,
  CheckCircle,
  XCircle,
  Building2 // Add this import
} from 'lucide-react';
import api from '@/lib/api';

// API Functions
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
    });

    const result = response.data;
    if (result && result.success === false) {
      throw new Error(result?.message || `API request failed: ${response.status}`);
    }
    return result?.data || result;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'API request failed'
    );
  }
};

// Get all suppliers
const getSuppliersAPI = async () => {
  try {
    return await apiRequest('/suppliers');
  } catch (error) {
    console.warn('Failed to fetch suppliers, using fallback data');
    return [
      { id: 1, name: 'ABC Suppliers', code: 'SUP001', email: 'contact@abc.com', phone: '9876543210', address: '123 Main St, Mumbai', gst: 'GST123456', contactPerson: 'John Doe' },
      { id: 2, name: 'XYZ Distributors', code: 'SUP002', email: 'info@xyz.com', phone: '9876543211', address: '456 Park Ave, Delhi', gst: 'GST789012', contactPerson: 'Jane Smith' },
      { id: 3, name: 'Global Traders', code: 'SUP003', email: 'sales@global.com', phone: '9876543212', address: '789 Trade Center, Bangalore', gst: 'GST345678', contactPerson: 'Mike Johnson' }
    ];
  }
};

const createPurchaseRequestAPI = async (data) => {
  return apiRequest('/purchase-requests', 'POST', data);
};

const submitPurchaseRequestAPI = async (id) => {
  return apiRequest(`/purchase-requests/${id}/submit`, 'POST');
};

export default function PurchaseRequestPage() {
  // ✅ Move router inside the component
  const router = useRouter();
  
  // Form State
  const [prData, setPrData] = useState({
    prNumber: `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    requestedDate: new Date().toISOString().split('T')[0],
    requiredDate: '',
    priority: 'normal',
    status: 'draft',
    notes: ''
  });

  const [items, setItems] = useState([
    {
      id: 1,
      itemCode: '',
      itemName: '',
      itemBarcode: '',
      batchNo: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      total: 0,
      remarks: ''
    }
  ]);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedPRId, setSavedPRId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      const supplierList = await getSuppliersAPI();
      setSuppliers(supplierList || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setErrorMessage('Failed to load suppliers. Using default list.');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPrData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = parseFloat(updatedItem.quantity) || 0;
          const price = parseFloat(updatedItem.unitPrice) || 0;
          updatedItem.total = qty * price;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const addItem = () => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    setItems([...items, {
      id: newId,
      itemCode: '',
      itemName: '',
      itemBarcode: '',
      batchNo: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      total: 0,
      remarks: ''
    }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      setErrorMessage('At least one item is required');
    }
  };

  // Use useMemo for better performance
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [items]);

  const prepareRequestData = () => {
    // Validate required fields
    if (!prData.requiredDate) {
      throw new Error('Please select a required date');
    }
    
    if (items.length === 0) {
      throw new Error('Please add at least one item');
    }
    
    for (let item of items) {
      if (!item.itemName || item.itemName.trim() === '') {
        throw new Error('Please enter item name for all items');
      }
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
    }
    
    return {
      requestedDate: prData.requestedDate,
      requiredDate: prData.requiredDate,
      priority: prData.priority.toUpperCase(),
      notes: prData.notes || null,
      supplierId: selectedSupplier ? parseInt(selectedSupplier) : null,
      items: items.map(item => ({
        itemCode: item.itemCode || null,
        itemName: item.itemName,
        itemBarcode: item.itemBarcode || null,
        batchNo: item.batchNo || null,
        quantity: parseInt(item.quantity),
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
        remarks: item.remarks || null
      }))
    };
  };

  const resetForm = () => {
    setPrData({
      prNumber: `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      requestedDate: new Date().toISOString().split('T')[0],
      requiredDate: '',
      priority: 'normal',
      status: 'draft',
      notes: ''
    });
    
    setItems([{
      id: 1,
      itemCode: '',
      itemName: '',
      itemBarcode: '',
      batchNo: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      total: 0,
      remarks: ''
    }]);
    
    setSelectedSupplier('');
    setSavedPRId(null);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorMessage('');
    
    try {
      const requestData = prepareRequestData();
      console.log('Saving draft:', requestData);
      
      const created = await createPurchaseRequestAPI(requestData);
      console.log('Draft saved:', created);
      
      setSavedPRId(created.id);
      setPrData(prev => ({ ...prev, prNumber: created.prNumber }));
      
      setSuccessMessage(`Draft saved successfully! PR Number: ${created.prNumber}`);
      setShowSuccess(true);
    } catch (error) {
      console.error('Save draft error:', error);
      setErrorMessage(error.message || 'Error saving draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    
    try {
      let purchaseRequestId = savedPRId;
      
      // If not saved as draft yet, create it first
      if (!purchaseRequestId) {
        const requestData = prepareRequestData();
        console.log('Creating purchase request:', requestData);
        
        const created = await createPurchaseRequestAPI(requestData);
        console.log('Purchase request created:', created);
        purchaseRequestId = created.id;
        setSavedPRId(purchaseRequestId);
      }
      
      // Submit the purchase request
      const submitted = await submitPurchaseRequestAPI(purchaseRequestId);
      console.log('Purchase request submitted:', submitted);
      
      setSuccessMessage(`Purchase Request ${submitted.prNumber} submitted successfully with ${prData.priority.toUpperCase()} priority!`);
      setShowSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage(error.message || 'Error submitting purchase request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-700 border-gray-200',
      'normal': 'bg-blue-100 text-blue-700 border-blue-200',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'high': 'bg-orange-100 text-orange-700 border-orange-200',
      'urgent': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityDeliveryTime = (priority) => {
    switch(priority) {
      case 'urgent': return 'Expected delivery within 24-48 hours';
      case 'high': return 'Expected delivery within 3-5 days';
      case 'medium': return 'Expected delivery within 5-7 days';
      case 'normal': return 'Expected delivery within 7-10 days';
      case 'low': return 'Expected delivery within 10-14 days';
      default: return '';
    }
  };

  // Format currency in INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Modal - Centered with transparent overlay */}
        {showSuccess && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowSuccess(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform animate-scale-up pointer-events-auto border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
                  <p className="text-sm text-gray-600 mb-6">{successMessage}</p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Purchase Request</h1>
                <p className="text-blue-100 text-sm mt-1">WMS Warehouse Management System</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/master/suppliers')}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Building2 className="w-4 h-4" />
                  Suppliers
                </button>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-blue-100 text-xs">Request Number</div>
                  <div className="text-white font-semibold text-lg">{prData.prNumber}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Supplier
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoadingSuppliers}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => router.push('/master/suppliers')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Building2 className="w-4 h-4" />
                      Manage
                    </button>
                  </div>
                  {isLoadingSuppliers && (
                    <p className="text-xs text-gray-500 mt-1">Loading suppliers...</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="requestedDate"
                      value={prData.requestedDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="requiredDate"
                      value={prData.requiredDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level *
                  </label>
                  <div className="relative">
                    <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      name="priority"
                      value={prData.priority}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="low">Low - Standard Processing</option>
                      <option value="normal">Normal - Regular Priority</option>
                      <option value="medium">Medium - Moderate Priority</option>
                      <option value="high">High - Urgent Requirement</option>
                      <option value="urgent">Urgent - Critical/Immediate</option>
                    </select>
                  </div>
                  {prData.priority === 'urgent' && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Urgent requests will be processed immediately
                    </p>
                  )}
                  {prData.priority === 'high' && (
                    <p className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      High priority requests will be expedited
                    </p>
                  )}
                </div>
              </div>
              
              {prData.priority && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
                  <span className="text-sm text-gray-600">Selected Priority:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(prData.priority)}`}>
                    <Flag className="w-3 h-3" />
                    {prData.priority.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getPriorityDeliveryTime(prData.priority)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Request Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name *</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty *</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (₹)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₹)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(item.id, 'itemCode', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Code"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Item name"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.itemBarcode}
                          onChange={(e) => handleItemChange(item.id, 'itemBarcode', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Barcode"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.batchNo}
                          onChange={(e) => handleItemChange(item.id, 'batchNo', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Batch No"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="1"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="pcs">Pcs</option>
                          <option value="kg">Kg</option>
                          <option value="liters">Liters</option>
                          <option value="boxes">Boxes</option>
                          <option value="packs">Packs</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {formatINR(item.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Remarks"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Summary & Additional Info</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={prData.notes}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional information or special requirements..."
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Request Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(prData.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {prData.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-medium">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-semibold">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">{formatINR(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {savingDraft ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                prData.priority === 'urgent' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : prData.priority === 'high'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : `Submit Request ${prData.priority !== 'normal' ? `(${prData.priority.toUpperCase()} Priority)` : ''}`}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}