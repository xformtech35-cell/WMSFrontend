"use client";

import React, { useState, useEffect, useRef } from "react";
import apiRequest from "@/components/apiRequest";
import { Search, ChevronDown, Check } from "lucide-react";

/**
 * Reusable Searchable UOM Select Component
 * - Queries GET /uoms dynamically
 * - Supports inline search by code or name
 * - Preserves standard form payload change events: onChange({ target: { name, value } })
 * - Displays fallback options if API is loading or offline
 */
export default function UomSelect({
  id,
  name = "uom",
  value = "",
  onChange,
  placeholder = "Select Unit...",
  disabled = false,
  className = "",
  containerClassName = "",
  fallbackOptions = [],
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Load UOMs from backend API
  useEffect(() => {
    fetchUoms();
  }, []);

  const fetchUoms = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/uoms?page=0&size=100");
      let list = [];
      if (response && response.content) {
        list = response.content;
      } else if (Array.isArray(response)) {
        list = response;
      }
      setUoms(list);
    } catch (error) {
      console.warn("Failed to fetch UOMs for UomSelect:", error);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Positioning logic
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const dropdownHeight = dropdownRef.current ? dropdownRef.current.offsetHeight : 240;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + 4;
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = rect.top - dropdownHeight - 4;
    }
    if (top < 8) top = 8;

    setDropdownPosition({
      top,
      left: Math.max(8, rect.left),
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, uoms, loading]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Combine fetched UOMs with fallback options
  const normalizedFallbacks = fallbackOptions.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // Available options
  const combinedOptions = [];
  const addedValues = new Set();

  // 1. Add API UOMs
  uoms.forEach((u) => {
    const val = u.code || u.name;
    if (val && !addedValues.has(val.toLowerCase())) {
      addedValues.add(val.toLowerCase());
      combinedOptions.push({
        value: val,
        label: u.name ? `${u.name} (${u.code})` : u.code,
        code: u.code,
        name: u.name,
      });
    }
  });

  // 2. Add fallback options
  normalizedFallbacks.forEach((f) => {
    if (f.value && !addedValues.has(f.value.toLowerCase())) {
      addedValues.add(f.value.toLowerCase());
      combinedOptions.push({
        value: f.value,
        label: f.label || f.value,
      });
    }
  });

  // 3. Add current value if missing
  if (value && !addedValues.has(value.toString().toLowerCase())) {
    combinedOptions.unshift({
      value: value,
      label: value,
    });
  }

  // Filter options by search term
  const filteredOptions = combinedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.value?.toString().toLowerCase().includes(term) ||
      opt.label?.toString().toLowerCase().includes(term) ||
      (opt.code && opt.code.toLowerCase().includes(term)) ||
      (opt.name && opt.name.toLowerCase().includes(term))
    );
  });

  const handleSelectOption = (selectedValue) => {
    setIsOpen(false);
    setSearchTerm("");
    if (onChange) {
      onChange({
        target: {
          id: id || name,
          name: name,
          value: selectedValue,
        },
      });
    }
  };

  const selectedOption = combinedOptions.find(
    (opt) => opt.value?.toString().toLowerCase() === value?.toString().toLowerCase()
  );

  const displayLabel = selectedOption ? selectedOption.label : value || placeholder;

  return (
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      <div
        ref={triggerRef}
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md flex items-center justify-between bg-background text-sm cursor-pointer transition-colors ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            : isOpen
            ? "border-primary ring-2 ring-primary/20 text-foreground"
            : "border-input hover:border-accent text-foreground"
        } ${className}`}
      >
        <span className={value ? "text-foreground font-medium truncate" : "text-muted-foreground"}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="fixed z-[99999] bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search unit by code or name..."
              className="w-full px-2 py-1 text-sm bg-transparent border-none focus:outline-none text-gray-900"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto">
            {loading && combinedOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500">
                Loading units...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500">
                No matching units found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected =
                  opt.value?.toString().toLowerCase() === value?.toString().toLowerCase();
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
