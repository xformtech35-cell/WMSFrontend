"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Edit,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiRequest from "@/components/apiRequest";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadBrands();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrands();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
      });
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const response = await apiRequest(`/brands?${params.toString()}`);
      if (response && response.content) {
        setBrands(response.content);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setBrands(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error("Error loading brands:", error);
      setErrorMessage("Failed to load brands.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      active: true,
    });
    setIsEditing(false);
    setEditingId(null);
    setErrorMessage("");
  };

  const handleEditClick = (brand) => {
    setIsEditing(true);
    setEditingId(brand.id);
    setFormData({
      code: brand.code || "",
      name: brand.name || "",
      description: brand.description || "",
      active: brand.active ?? true,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrorMessage("Brand code is required.");
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage("Brand name is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.active,
      };

      if (isEditing && editingId) {
        await apiRequest(`/brands/${editingId}`, "PUT", payload);
        setSuccessMessage("Brand updated successfully.");
      } else {
        await apiRequest("/brands", "POST", payload);
        setSuccessMessage("Brand created successfully.");
      }

      resetForm();
      loadBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save brand."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brand Master"
        description="Manage product brands for Item Master classification."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadBrands()}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
          </Button>
        }
      />

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-1 glass-card p-5 rounded-2xl border border-gray-200 bg-white">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            {isEditing ? "Edit Brand" : "Create New Brand"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-xs font-medium text-gray-700">
                Code *
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. SAMS, APPL, SONY"
                disabled={isEditing}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Samsung, Apple"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-xs font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor="active" className="text-sm text-gray-700 cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving..." : isEditing ? "Update Brand" : "Create Brand"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Table Column */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Brand by code or name..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        Loading Brands...
                      </td>
                    </tr>
                  ) : brands.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No Brand records found.
                      </td>
                    </tr>
                  ) : (
                    brands.map((brand) => (
                      <tr key={brand.id || brand.code} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{brand.code}</td>
                        <td className="px-4 py-3 text-gray-800">{brand.name}</td>
                        <td className="px-4 py-3 text-gray-500">{brand.description || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              brand.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {brand.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditClick(brand)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Brand"
                          >
                            <Edit className="w-4 h-4" />
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
            <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 mt-4">
              <span>
                Page {currentPage + 1} of {totalPages} ({totalElements} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
