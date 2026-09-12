"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  MapPin,
} from "lucide-react";
import apiRequest from "@/components/apiRequest";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
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
    headOfDepartment: "",
    location: "",
    isActive: true,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadDepartments();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDepartments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
      });
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const response = await apiRequest(`/departments?${params.toString()}`);
      if (response && response.content) {
        setDepartments(response.content);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        setDepartments(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      setErrorMessage("Failed to load departments.");
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
      headOfDepartment: "",
      location: "",
      isActive: true,
    });
    setIsEditing(false);
    setEditingId(null);
    setErrorMessage("");
  };

  const handleEditClick = (dept) => {
    setIsEditing(true);
    setEditingId(dept.id);
    setFormData({
      code: dept.code || "",
      name: dept.name || "",
      description: dept.description || "",
      headOfDepartment: dept.headOfDepartment || "",
      location: dept.location || "",
      isActive: dept.isActive ?? true,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrorMessage("Department code is required.");
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage("Department name is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        headOfDepartment: formData.headOfDepartment.trim(),
        location: formData.location.trim(),
        isActive: formData.isActive,
      };

      if (isEditing && editingId) {
        await apiRequest(`/departments/${editingId}`, "PUT", payload);
        setSuccessMessage("Department updated successfully.");
      } else {
        await apiRequest("/departments", "POST", payload);
        setSuccessMessage("Department created successfully.");
      }

      resetForm();
      loadDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save department."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Department Master"
        description="Manage organizational departments and operational units."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadDepartments()}
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
            <Building2 className="w-4 h-4 text-blue-600" />
            {isEditing ? "Edit Department" : "Create New Department"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-xs font-medium text-gray-700">
                Department Code *
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. WHS, PROD, LOG"
                disabled={isEditing}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                Department Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Warehouse Operations"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="headOfDepartment" className="text-xs font-medium text-gray-700">
                Head of Department
              </Label>
              <Input
                id="headOfDepartment"
                name="headOfDepartment"
                value={formData.headOfDepartment}
                onChange={handleInputChange}
                placeholder="e.g. Suresh Patil"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-xs font-medium text-gray-700">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Building A, Floor 1"
                className="mt-1"
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
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving..." : isEditing ? "Update Department" : "Create Department"}
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
                  placeholder="Search Department by code, name, or HOD..."
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
                    <th className="px-4 py-3">HOD</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        Loading Departments...
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        No department records found.
                      </td>
                    </tr>
                  ) : (
                    departments?.map((dept) => (
                      <tr key={dept.id || dept.code} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{dept.code}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{dept.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {dept.headOfDepartment ? (
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                              {dept.headOfDepartment}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {dept.location ? (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {dept.location}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              dept.isActive ?? dept.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {dept.isActive ?? dept.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditClick(dept)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Department"
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
