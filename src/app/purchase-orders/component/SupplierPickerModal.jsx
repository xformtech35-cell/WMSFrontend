"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, X, Building2, Check, Mail, Phone, MapPin } from "lucide-react";
import api from "@/lib/api";

export default function SupplierPickerModal({ isOpen, onClose, onSelectSupplier }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen, currentPage]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (currentPage === 0) {
        loadSuppliers();
      } else {
        setCurrentPage(0);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("size", pageSize);
      if (searchTerm.trim()) {
        params.append("searchTerm", searchTerm.trim());
      }
      const response = await api.get(`/suppliers?${params.toString()}`);
      
      let list = [];
      let pages = 1;
      let total = 0;

      if (response?.data?.data) {
        const pData = response.data.data;
        if (pData.content && Array.isArray(pData.content)) {
          list = pData.content;
          pages = pData.totalPages || 1;
          total = pData.totalElements || list.length;
        } else if (Array.isArray(pData)) {
          list = pData;
          total = list.length;
        }
      } else if (response?.data?.content) {
        list = response.data.content;
        pages = response.data.totalPages || 1;
        total = response.data.totalElements || list.length;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
        total = list.length;
      }

      setSuppliers(list);
      setTotalPages(pages);
      setTotalElements(total);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Select Supplier</h2>
              <p className="text-xs text-gray-500">
                Browse and select a supplier from the Supplier Master
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

        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by supplier name, code, email, or phone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Code / ID</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City / Address</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                        <span>Loading suppliers...</span>
                      </div>
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">
                      No suppliers found.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr
                      key={s.id || s.supplierCode}
                      className="hover:bg-indigo-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {s.supplierCode || s.code || `SUP-${s.id}`}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.name || s.supplierName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.email || s.supplierEmail || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{s.phone || s.supplierPhone || "-"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                        {s.address || s.city || s.state || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSupplier(s);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {currentPage + 1} of {totalPages} ({totalElements} suppliers total)
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
