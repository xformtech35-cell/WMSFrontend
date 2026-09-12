"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, X, Package, Check } from "lucide-react";
import apiRequest from "@/components/apiRequest";

export default function ItemPickerModal({ isOpen, onClose, onSelectItem, selectedItemCodes = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, currentPage]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (currentPage === 0) {
        loadItems();
      } else {
        setCurrentPage(0);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        sort: "id,desc",
      });
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const response = await apiRequest(`/items?${params.toString()}`);
      if (response && response.content) {
        setItems(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setItems(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading items for picker:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Convert selected codes/IDs to lowercase Set for quick comparison
  const selectedSet = new Set(
    selectedItemCodes.map((c) => String(c).trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Select Item from Master</h2>
              <p className="text-xs text-gray-500">
                Browse and select items to add to the purchase order lines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU Code, Name, HSN Code..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Items List Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Item Code</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">HSN Code</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Tax %</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        <span>Fetching item master...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      No items match your search.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const itemCode = String(item.skuCode || item.itemCode || item.code || "").trim();
                    const itemId = String(item.id || "").trim();
                    const isSelected = selectedSet.has(itemCode.toLowerCase()) || (itemId && selectedSet.has(itemId.toLowerCase()));
                    const price = item.purchasePrice || item.unitPrice || item.price || 0;
                    const gst = item.gstRate || item.taxRate || 18.0;

                    return (
                      <tr
                        key={item.id || item.skuCode || item.itemCode}
                        className={`transition-colors ${isSelected ? "bg-emerald-50/60" : "hover:bg-blue-50/40"}`}
                      >
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {itemCode}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {item.name || item.itemName}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.hsnCode || "-"}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {item.uom || item.unit || "PCS"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ₹{Number(price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{gst}%</td>
                        <td className="px-4 py-3 text-center">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 rounded-lg cursor-not-allowed">
                              <Check className="w-3.5 h-3.5" /> Selected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectItem(item);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Select
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {currentPage + 1} of {totalPages} ({totalElements} items total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
