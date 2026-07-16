// ComparisonPopup.jsx - Create this as a new component file
import React from 'react';
import {
  X,
  Trophy,
  Award,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  Truck,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  DollarSign,
  Percent,
} from 'lucide-react';

export default function ComparisonPopup({ data, onClose, onConvertToPO }) {
  if (!data || data.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Comparison Results</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">No quotations available to compare.</p>
              <p className="text-sm text-gray-400 mt-2">Please add quotations first.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort by rank
  const sortedData = [...data].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  const bestQuotation = sortedData[0];

  // Calculate min and max for comparison
  const minPrice = Math.min(...data.map(q => q.grandTotal || 0));
  const maxPrice = Math.max(...data.map(q => q.grandTotal || 0));
  const avgPrice = data.reduce((sum, q) => sum + (q.grandTotal || 0), 0) / data.length;

  // Get all unique item names across all quotations
  const allItemNames = new Set();
  data.forEach(quotation => {
    quotation.items?.forEach(item => {
      if (item.itemName) allItemNames.add(item.itemName);
    });
  });

  // Find common items
  const commonItems = [];
  allItemNames.forEach(itemName => {
    const hasInAll = data.every(quotation => 
      quotation.items?.some(item => item.itemName === itemName)
    );
    if (hasInAll) {
      const itemData = data.map(quotation => {
        const item = quotation.items?.find(i => i.itemName === itemName);
        return {
          supplierName: quotation.supplierName,
          price: item?.unitPrice || 0,
          quantity: item?.quantity || 0,
          total: item?.totalAmount || 0,
        };
      });
      commonItems.push({
        name: itemName,
        data: itemData,
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Quotation Comparison
              </h2>
              <p className="text-sm text-gray-500">
                {data.length} quotations compared · Best quote: {bestQuotation?.supplierName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">Best Quote</span>
                </div>
                <p className="text-lg font-bold text-green-900">{bestQuotation?.supplierName}</p>
                <p className="text-sm text-green-700">₹{bestQuotation?.grandTotal?.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Average Price</span>
                </div>
                <p className="text-lg font-bold text-blue-900">₹{avgPrice.toFixed(2)}</p>
                <p className="text-sm text-blue-700">Across all suppliers</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Price Range</span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  ₹{minPrice.toFixed(2)} - ₹{maxPrice.toFixed(2)}
                </p>
                <p className="text-sm text-purple-700">
                  Savings: ₹{(maxPrice - minPrice).toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-700 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Suppliers</span>
                </div>
                <p className="text-lg font-bold text-orange-900">{data.length}</p>
                <p className="text-sm text-orange-700">Quotations received</p>
              </div>
            </div>

            {/* Quotation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {sortedData.map((quotation, index) => {
                const isBest = quotation.rank === 1;
                const isSecond = quotation.rank === 2;
                const isLast = quotation.rank === data.length;
                
                let borderColor = 'border-gray-200';
                let bgColor = 'bg-white';
                let rankIcon = null;
                
                if (isBest) {
                  borderColor = 'border-green-500 border-2';
                  bgColor = 'bg-green-50';
                  rankIcon = <Trophy className="w-5 h-5 text-yellow-500" />;
                } else if (isSecond) {
                  borderColor = 'border-blue-400 border-2';
                  bgColor = 'bg-blue-50';
                  rankIcon = <Award className="w-5 h-5 text-blue-500" />;
                } else if (isLast) {
                  borderColor = 'border-red-300 border';
                  bgColor = 'bg-red-50';
                }

                return (
                  <div
                    key={quotation.id || index}
                    className={`${bgColor} border ${borderColor} rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
                  >
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${isBest ? 'border-green-200' : 'border-gray-200'} flex justify-between items-center`}>
                      <div className="flex items-center gap-2">
                        {rankIcon}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {quotation.supplierName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {quotation.quotationNumber} · Rank #{quotation.rank}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{quotation.grandTotal?.toFixed(2) || '0.00'}
                        </p>
                        {isBest && (
                          <span className="text-xs text-green-600 font-medium">Best Price</span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">Quoted: {new Date(quotation.quotationDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Truck className="w-3 h-3" />
                          <span className="text-xs">Delivery: {new Date(quotation.deliveryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <CreditCard className="w-3 h-3" />
                          <span className="text-xs">Valid: {new Date(quotation.validTill).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Building2 className="w-3 h-3" />
                          <span className="text-xs">{quotation.supplierCode}</span>
                        </div>
                      </div>

                      {/* Items */}
                      {quotation.items && quotation.items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Items:</p>
                          <div className="space-y-1">
                            {quotation.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm border-b border-gray-100 last:border-0 py-1">
                                <span className="text-gray-600">{item.itemName}</span>
                                <div className="flex gap-3">
                                  <span className="text-gray-500">×{item.quantity}</span>
                                  <span className="font-medium text-gray-900">
                                    ₹{item.unitPrice?.toFixed(2) || '0.00'}/unit
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GST and Totals */}
                      <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-200 pt-2 mt-2">
                        <div>
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            ₹{quotation.subTotal?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">GST:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            ₹{quotation.gstTotal?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Discount:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            ₹{quotation.discountAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => onConvertToPO(quotation.id)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isBest
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {isBest ? 'Select Best Quote' : 'Convert to PO'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Common Items Comparison */}
            {commonItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Common Items Comparison</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        {data.map((q, idx) => (
                          <th key={idx} className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                            {q.supplierName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {commonItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                          {item.data.map((supplierData, sIdx) => {
                            const prices = item.data.map(d => d.price);
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            const isMin = supplierData.price === minPrice && minPrice > 0;
                            const isMax = supplierData.price === maxPrice && maxPrice > 0 && minPrice !== maxPrice;
                            
                            return (
                              <td key={sIdx} className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {isMin && <TrendingDown className="w-3 h-3 text-green-500" />}
                                  {isMax && <TrendingUp className="w-3 h-3 text-red-500" />}
                                  <span className={`font-medium ${isMin ? 'text-green-600' : isMax ? 'text-red-600' : 'text-gray-700'}`}>
                                    ₹{supplierData.price.toFixed(2)}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {bestQuotation && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-green-900">Recommendation</h5>
                    <p className="text-sm text-green-800">
                      <strong>{bestQuotation.supplierName}</strong> offers the best quotation at 
                      ₹{bestQuotation.grandTotal?.toFixed(2)} with a rank of #{bestQuotation.rank}.
                      {data.length > 1 && ` This is ${((1 - bestQuotation.grandTotal / maxPrice) * 100).toFixed(1)}% lower than the highest quote.`}
                    </p>
                    <button
                      onClick={() => onConvertToPO(bestQuotation.id)}
                      className="mt-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Create PO from Best Quote
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}