// app/sales-order/components/SalesOrderForm.jsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Send,
  Save,
  AlertCircle,
  Flag,
  XCircle,
  Package,
  Search,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { createPortal } from "react-dom";
import { PUT } from "@/components/apiRequest";

// API Functions
const apiRequest = async (endpoint, method = "GET", data = null) => {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
    });

    const result = response.data;
    if (result && result.success === false) {
      throw new Error(
        result?.message || `API request failed: ${response.status}`,
      );
    }
    return result?.data || result;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "API request failed",
    );
  }
};

// Get all customers with pagination and search
const getCustomersAPI = async (page = 0, size = 20, search = "") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (search) params.append("search", search);

    const response = await api.get(`/users?${params.toString()}`);
    const data =
      response.data?.data?.content ||
      response.data?.content ||
      response.data ||
      [];
    const totalElements =
      response.data?.totalElements || response.data?.total || data.length;

    return { data, totalElements };
  } catch (error) {
    console.warn("Failed to fetch customers, using fallback data");
    return { data: [], totalElements: 0 };
  }
};

// Get all warehouses
const getWarehousesAPI = async (page = 0, size = 20, search = "") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (search) params.append("search", search);

    const response = await api.get(`/warehouses?${params.toString()}`);
    const data =
      response.data?.data?.content ||
      response.data?.content ||
      response.data ||
      [];
    const totalElements =
      response.data?.totalElements || response.data?.total || data.length;

    return { data, totalElements };
  } catch (error) {
    console.warn("Failed to fetch warehouses, using fallback data");
    return { data: [], totalElements: 0 };
  }
};

// Get all items with pagination and search
const getItemsAPI = async (page = 0, size = 20, search = "") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (search) params.append("search", search);

    const response = await api.get(`/items?${params.toString()}`);
    const data =
      response.data?.data?.content ||
      response.data?.content ||
      response.data ||
      [];
    const totalElements =
      response.data?.totalElements || response.data?.total || data.length;

    return { data, totalElements };
  } catch (error) {
    console.warn("Failed to fetch items, using fallback data");
    return { data: [], totalElements: 0 };
  }
};

// Get all users/assignees with pagination and search
const getAssigneesAPI = async (page = 0, size = 20, search = "") => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append("page", page);
    if (size) params.append("size", size);
    if (search) params.append("search", search);

    const response = await api.get(`/users?${params.toString()}`);
    const data =
      response.data?.data?.content ||
      response.data?.content ||
      response.data ||
      [];
    const totalElements =
      response.data?.totalElements || response.data?.total || data.length;

    return { data, totalElements };
  } catch (error) {
    console.warn("Failed to fetch assignees, using fallback data");
    return { data: [], totalElements: 0 };
  }
};

const hanldeConfirmAndProcess = async (id, onSuccess) => {
  console.log("CONFIRM BUTTON CLICKED", id);

  try {
    const result = await PUT(
      `outbound/sales-order/${id}/status?status=APPROVED`,
      {},
    ).then(async () => {
      await PUT(`outbound/sales-order/${id}/status?status=PROCESSING`, {});
    });
    if (onSuccess) {
      onSuccess(`Sales Order Approved successfully!`);
    }
    console.log("CONFIRM API RESULT:", result);
  } catch (error) {
    console.error("CONFIRM API ERROR:", error);
  }
};

const createSalesOrderAPI = async (data) => {
  return apiRequest("/outbound/sales-order", "POST", data);
};

const updateSalesOrderAPI = async (id, data) => {
  return apiRequest(`/outbound/sales-order/${id}`, "PUT", data);
};

const createPickListAPI = async (data) => {
  return apiRequest("/outbound/pick-list", "POST", data);
};

// Searchable Select Component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label,
  required = false,
  disabled = false,
  loading = false,
  onSearch,
  onLoadMore,
  hasMore = false,
  totalOptions = 0,
  displayKey = "username", // New prop to customize which field to display
  subDisplayKey = "customerCode", // New prop for subtitle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  // Update position when opening
  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const handleScroll = () => {
      updateDropdownPosition();
    };

    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Click outside
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

  const handleSearch = (e) => {
    const term = e.target.value;

    setSearchTerm(term);

    if (onSearch) {
      onSearch(term);
    }
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectedOption = options.find(
    (opt) =>
      opt.customerCode === value ||
      opt.warehouseId === value ||
      opt.itemCode === value ||
      opt.id === value ||
      opt.username === value ||
      opt.name === value,
  );

  const displayValue = selectedOption
    ? selectedOption.fullName ||
      selectedOption.name ||
      selectedOption.username ||
      selectedOption.itemCode ||
      selectedOption.warehouseId ||
      value
    : value;

  const dropdown =
    isOpen && !disabled ? (
      <div
        ref={dropdownRef}
        className="fixed z-[99999] bg-white border border-gray-300 rounded-lg shadow-xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        {/* Search */}
        <div className="p-2 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Options */}
        <div className="max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-sm">Loading...</p>
            </div>
          ) : options.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No options found
            </div>
          ) : (
            options.map((option) => {
              const displayLabel = option[displayKey] || option.username || option.name || option.fullName;

              const displaySub = option[subDisplayKey] || option.customerCode || option.location || option.itemCode || "";

              return (
                <div
                  key={option.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelect(option)}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {displayLabel}
                  </div>

                  {displaySub && (
                    <div className="text-xs text-gray-500">{displaySub}</div>
                  )}
                </div>
              );
            })
          )}

          {hasMore && !loading && (
            <div className="p-2 text-center border-t border-gray-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  if (onLoadMore) {
                    onLoadMore();
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Load more...
              </button>
            </div>
          )}

          {totalOptions > 0 && !loading && (
            <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-200">
              Showing {options.length} of {totalOptions}
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="relative" ref={triggerRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && "*"}
          </label>
        )}

        <div
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex items-center justify-between ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
            }
          }}
        >
          <span className="truncate text-gray-700">
            {displayValue || placeholder}
          </span>

          <span className="text-gray-400">▼</span>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
};

// Reservation Select Component
const ReservationSelect = ({
  reservations,
  selectedReservationId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Get location string from reservation
  const getLocationString = (reservation) => {
    const parts = [
      reservation.warehouseId,
      reservation.zoneId,
      reservation.aisleId,
      reservation.rackId,
      reservation.levelId,
      reservation.binId,
    ].filter(Boolean);
    return parts.join(" / ");
  };

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();

    const handleScroll = () => updateDropdownPosition();
    const handleResize = () => updateDropdownPosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Click outside
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedReservation = reservations?.find(
    (r) => r.id === selectedReservationId,
  );

  // Display selected reservation info below the dropdown
  const renderSelectedInfo = () => {
    if (!selectedReservation) return null;

    const location = getLocationString(selectedReservation);

    return (
      <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
        <div className="flex items-center gap-1 text-blue-700 font-medium">
          <Package className="w-3 h-3" />
          <span>{selectedReservation.reservationNumber}</span>
        </div>
        <div className="text-gray-600 mt-0.5">
          Status:{" "}
          <span className="font-medium">{selectedReservation.status}</span> |
          Qty:{" "}
          <span className="font-medium">
            {selectedReservation.requiredQuantity}
          </span>{" "}
          | Available:{" "}
          <span className="font-medium">
            {selectedReservation.availableQuantity}
          </span>
        </div>
        <div className="text-gray-500 mt-0.5 truncate">
          Location: {location || "N/A"}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-2 py-1.5 border border-gray-300 rounded flex items-center justify-between cursor-pointer bg-white min-h-[34px] ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400"
        }`}
      >
        <span className="text-sm truncate text-gray-700">
          {selectedReservation
            ? `Selected: ${selectedReservation.reservationNumber}`
            : "Select Reservation"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Show selected reservation info below */}
      {renderSelectedInfo()}

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="fixed z-[99999] bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {reservations && reservations.length > 0 ? (
            reservations.map((reservation) => {
              const location = getLocationString(reservation);
              const isSelected = reservation.id === selectedReservationId;

              return (
                <div
                  key={reservation.id}
                  onClick={() => {
                    onSelect(reservation);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {reservation.reservationNumber}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        Status: {reservation.status} | Qty:{" "}
                        {reservation.requiredQuantity} | Available:{" "}
                        {reservation.availableQuantity}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        Location: {location || "N/A"}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-2 text-blue-600 flex-shrink-0">
                        <Save className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No reservations available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function SalesOrderForm({
  mode = "create",
  initialData = null,
  onClose,
  onSuccess,
}) {
  // Form State
  const [soData, setSoData] = useState({
    soNumber: `SO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    customerCode: "",
    customerName: "",
    warehouseId: "",
    deliveryDate: "",
    priority: "NORMAL",
    deliveryAddress: "",
    shippingMethod: "ROAD",
    remarks: "",
    status: "DRAFT",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      itemCode: "",
      itemName: "",
      uom: "Pcs",
      orderedQuantity: 1,
      reservedQuantity: 0,
      pickedQuantity: 0,
      shippedQuantity: 0,
      batchNumber: "",
      sourceLocation: null,
      reservations: [],
      selectedReservationId: null,
    },
  ]);

  // Pick List specific state
  const [pickListData, setPickListData] = useState({
    assignedTo: "",
    assignedToName: "",
    priority: "HIGH",
  });

  // Customer state with pagination
  const [customers, setCustomers] = useState([]);
  const [customerPage, setCustomerPage] = useState(0);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(false);

  // Warehouse state with pagination
  const [warehouses, setWarehouses] = useState([]);
  const [warehousePage, setWarehousePage] = useState(0);
  const [warehouseTotal, setWarehouseTotal] = useState(0);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [hasMoreWarehouses, setHasMoreWarehouses] = useState(false);

  // Items state with pagination
  const [itemsList, setItemsList] = useState([]);
  const [itemsPage, setItemsPage] = useState(0);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsSearch, setItemsSearch] = useState("");
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(false);

  // Assignees state with pagination
  const [assignees, setAssignees] = useState([]);
  const [assigneePage, setAssigneePage] = useState(0);
  const [assigneeTotal, setAssigneeTotal] = useState(0);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [hasMoreAssignees, setHasMoreAssignees] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedSOId, setSavedSOId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const PAGE_SIZE = 10;

  // Load data on mount
  useEffect(() => {
    loadCustomers();
    loadWarehouses();
    loadItems();
    loadAssignees();
  }, []);

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      loadInitialData();
    }
  }, [mode, initialData]);

  // Load more customers when page changes
  useEffect(() => {
    if (customerPage > 0) {
      loadCustomers(customerPage, customerSearch);
    }
  }, [customerPage]);

  // Load more warehouses when page changes
  useEffect(() => {
    if (warehousePage > 0) {
      loadWarehouses(warehousePage, warehouseSearch);
    }
  }, [warehousePage]);

  // Load more items when page changes
  useEffect(() => {
    if (itemsPage > 0) {
      loadItems(itemsPage, itemsSearch);
    }
  }, [itemsPage]);

  // Load more assignees when page changes
  useEffect(() => {
    if (assigneePage > 0) {
      loadAssignees(assigneePage, assigneeSearch);
    }
  }, [assigneePage]);

  const loadCustomers = async (page = 0, search = "") => {
    try {
      setIsLoadingCustomers(true);
      const response = await getCustomersAPI(page, PAGE_SIZE, search);

      if (page === 0) {
        setCustomers(response.data || []);
      } else {
        setCustomers((prev) => [...prev, ...(response.data || [])]);
      }

      setCustomerTotal(response.totalElements || 0);
      setHasMoreCustomers(response.data?.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading customers:", error);
      setErrorMessage("Failed to load customers.");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const loadWarehouses = async (page = 0, search = "") => {
    try {
      setIsLoadingWarehouses(true);
      const response = await getWarehousesAPI(page, PAGE_SIZE, search);

      if (page === 0) {
        setWarehouses(response.data || []);
      } else {
        setWarehouses((prev) => [...prev, ...(response.data || [])]);
      }

      setWarehouseTotal(response.totalElements || 0);
      setHasMoreWarehouses(response.data?.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      setErrorMessage("Failed to load warehouses.");
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const loadItems = async (page = 0, search = "") => {
    try {
      setIsLoadingItems(true);
      const response = await getItemsAPI(page, PAGE_SIZE, search);

      if (page === 0) {
        setItemsList(response.data || []);
      } else {
        setItemsList((prev) => [...prev, ...(response.data || [])]);
      }

      setItemsTotal(response.totalElements || 0);
      setHasMoreItems(response.data?.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading items:", error);
      setErrorMessage("Failed to load items.");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const loadAssignees = async (page = 0, search = "") => {
    try {
      setIsLoadingAssignees(true);
      const response = await getAssigneesAPI(page, PAGE_SIZE, search);

      if (page === 0) {
        setAssignees(response.data || []);
      } else {
        setAssignees((prev) => [...prev, ...(response.data || [])]);
      }

      setAssigneeTotal(response.totalElements || 0);
      setHasMoreAssignees(response.data?.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading assignees:", error);
      setErrorMessage("Failed to load assignees.");
    } finally {
      setIsLoadingAssignees(false);
    }
  };

  const handleCustomerSearch = (search) => {
    setCustomerSearch(search);
    setCustomerPage(0);
    loadCustomers(0, search);
  };

  const handleCustomerLoadMore = () => {
    if (hasMoreCustomers && !isLoadingCustomers) {
      setCustomerPage((prev) => prev + 1);
    }
  };

  const handleWarehouseSearch = (search) => {
    setWarehouseSearch(search);
    setWarehousePage(0);
    loadWarehouses(0, search);
  };

  const handleWarehouseLoadMore = () => {
    if (hasMoreWarehouses && !isLoadingWarehouses) {
      setWarehousePage((prev) => prev + 1);
    }
  };

  const handleItemsSearch = (search) => {
    setItemsSearch(search);
    setItemsPage(0);
    loadItems(0, search);
  };

  const handleItemsLoadMore = () => {
    if (hasMoreItems && !isLoadingItems) {
      setItemsPage((prev) => prev + 1);
    }
  };

  const handleAssigneeSearch = (search) => {
    setAssigneeSearch(search);
    setAssigneePage(0);
    loadAssignees(0, search);
  };

  const handleAssigneeLoadMore = () => {
    if (hasMoreAssignees && !isLoadingAssignees) {
      setAssigneePage((prev) => prev + 1);
    }
  };

  const loadInitialData = () => {
    try {
      setIsLoading(true);

      setSoData({
        soNumber:
          initialData.soNumber ||
          `SO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        warehouseId: initialData.warehouseId || "",
        deliveryDate: initialData.deliveryDate
          ? initialData.deliveryDate.split("T")[0]
          : "",
        priority: initialData.priority || "NORMAL",
        deliveryAddress: initialData.deliveryAddress || "",
        shippingMethod: initialData.shippingMethod || "ROAD",
        remarks: initialData.remarks || "",
        status: initialData.status || "DRAFT",
      });

      if (initialData.soNumber) {
        setSavedSOId(initialData.soNumber);
      }

      // Set selected customer for display
      if (initialData.customerCode) {
        const customer = customers.find(
          (c) => c.customerCode === initialData.customerCode,
        );
        if (customer) {
          setSelectedCustomer(customer);
        }
      }

      // Set assigned to if exists in initialData
      if (initialData.assignedTo) {
        const assignee = assignees.find(
          (a) => a.id === initialData.assignedTo || a.username === initialData.assignedTo
        );
        if (assignee) {
          setPickListData((prev) => ({
            ...prev,
            assignedTo: assignee.username,
            assignedToName: assignee.username,
          }));
        } else {
          setPickListData((prev) => ({
            ...prev,
            assignedTo: initialData.assignedTo,
            assignedToName: initialData.assignedTo,
          }));
        }
      }

      if (initialData.items && initialData.items.length > 0) {
        const formattedItems = initialData.items.map((item, index) => {
          const itemReservations =
            item.reservations ||
            initialData.reservations?.filter(
              (r) => r.itemCode === item.itemCode,
            ) ||
            [];

          let selectedReservationId = null;
          let sourceLocation = item.sourceLocation || null;

          if (itemReservations.length === 1) {
            selectedReservationId = itemReservations[0].id;
            const res = itemReservations[0];
            const parts = [
              res.warehouseId,
              res.zoneId,
              res.aisleId,
              res.rackId,
              res.levelId,
              res.binId,
            ].filter(Boolean);
            sourceLocation = parts.join("/");
          } else if (itemReservations.length > 1) {
            const pendingReservation = itemReservations.find(
              (r) => r.status === "PENDING",
            );
            if (pendingReservation) {
              selectedReservationId = pendingReservation.id;
              const parts = [
                pendingReservation.warehouseId,
                pendingReservation.zoneId,
                pendingReservation.aisleId,
                pendingReservation.rackId,
                pendingReservation.levelId,
                pendingReservation.binId,
              ].filter(Boolean);
              sourceLocation = parts.join("/");
            }
          }

          const orderedQty = item.orderedQuantity || 1;
          const reservedQty =
            item.reservedQuantity !== undefined
              ? item.reservedQuantity
              : orderedQty;

          return {
            id: item.id || index + 1,
            itemCode: item.itemCode || "",
            itemName: item.itemName || "",
            uom: item.uom || "Pcs",
            orderedQuantity: orderedQty,
            reservedQuantity: reservedQty,
            pickedQuantity: item.pickedQuantity || 0,
            shippedQuantity: item.shippedQuantity || 0,
            batchNumber: item.batchNumber || "",
            sourceLocation: sourceLocation,
            reservations: itemReservations,
            selectedReservationId: selectedReservationId,
          };
        });
        setItems(formattedItems);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      setErrorMessage("Failed to load sales order data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSoData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePickListInputChange = (e) => {
    const { name, value } = e.target;
    setPickListData((prev) => ({ ...prev, [name]: value }));
  };

 

  const handleWarehouseChange = (warehouse) => {
    if (warehouse) {
      setSoData((prev) => ({
        ...prev,
        warehouseId: warehouse.warehouseId || warehouse.name,
      }));
    }
  };

  const handleAssigneeChange = (assignee) => {
    if (assignee) {
      setPickListData((prev) => ({
        ...prev,
        assignedTo: assignee.username,
        assignedToName: assignee.username,
      }));
    }
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const handleSelectItem = (id, selectedItem) => {
    if (selectedItem) {
      const updatedItems = items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            itemCode: selectedItem.itemCode,
            itemName: selectedItem.itemName,
            uom: selectedItem.uom || "Pcs",
          };
        }
        return item;
      });
      setItems(updatedItems);
    }
  };

  // Handle reservation selection
  const handleReservationSelect = (itemId, reservation) => {
    if (!reservation) return;

    const parts = [
      reservation.warehouseId,
      reservation.zoneId,
      reservation.aisleId,
      reservation.rackId,
      reservation.levelId,
      reservation.binId,
    ].filter(Boolean);
    const sourceLocation = parts.join("/");

    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          selectedReservationId: reservation.id,
          sourceLocation: sourceLocation,
        };
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Auto-fill reserved quantity when ordered quantity changes
  const handleQuantityChange = (id, field, value) => {
    const numValue = parseFloat(value) || 0;

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: numValue };
        if (field === "orderedQuantity") {
          if (item.reservedQuantity === 0 || !item.reservedQuantity) {
            updatedItem.reservedQuantity = numValue;
          }
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Add item to pick list
  const addPickListItem = () => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        itemCode: "",
        itemName: "",
        uom: "Pcs",
        orderedQuantity: 1,
        reservedQuantity: 0,
        pickedQuantity: 0,
        shippedQuantity: 0,
        batchNumber: "",
        sourceLocation: null,
        reservations: [],
        selectedReservationId: null,
      }
    ]);
  };

  // Remove item from pick list
  const removePickListItem = (id) => {
    if (items.length <= 1) {
      setErrorMessage("At least one item is required.");
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const prepareRequestData = () => {
    if (!soData.customerCode) {
      throw new Error("Please select a customer");
    }
    if (!soData.warehouseId) {
      throw new Error("Please select a warehouse");
    }
    if (!soData.deliveryDate) {
      throw new Error("Please select a delivery date");
    }
    if (!soData.deliveryAddress) {
      throw new Error("Please enter delivery address");
    }
    if (items.length === 0) {
      throw new Error("Please add at least one item");
    }
    for (let item of items) {
      if (!item.itemCode || item.itemCode.trim() === "") {
        throw new Error("Please select an item for all rows");
      }
      if (item.orderedQuantity <= 0) {
        throw new Error("Ordered quantity must be greater than 0");
      }
      if (item.reservedQuantity < 0) {
        throw new Error("Reserved quantity cannot be negative");
      }
      if (item.reservedQuantity > item.orderedQuantity) {
        throw new Error(
          `Reserved quantity (${item.reservedQuantity}) cannot exceed ordered quantity (${item.orderedQuantity}) for item ${item.itemCode}`,
        );
      }
    }

    return {
      soNumber: soData.soNumber,
      customerCode: soData.customerCode,
      customerName: soData.customerName,
      warehouseId: soData.warehouseId,
      deliveryDate: `${soData.deliveryDate}T00:00:00`,
      priority: soData.priority,
      deliveryAddress: soData.deliveryAddress,
      shippingMethod: soData.shippingMethod,
      remarks: soData.remarks || null,
      createdBy: "system_user",
      items: items.map((item) => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        orderedQuantity: parseInt(item.orderedQuantity),
        reservedQuantity: parseInt(item.reservedQuantity) || 0,
        pickedQuantity: parseInt(item.pickedQuantity) || 0,
        shippedQuantity: parseInt(item.shippedQuantity) || 0,
        batchNumber: item.batchNumber || "",
        sourceLocation: item.sourceLocation || null,
      })),
    };
  };

  // Prepare pick list data
  const preparePickListData = () => {
    if (!soData.soNumber) {
      throw new Error("SO Number is required");
    }
    if (!soData.warehouseId) {
      throw new Error("Please select a warehouse");
    }
    if (!pickListData.assignedTo) {
      throw new Error("Please select an assignee");
    }
    if (items.length === 0) {
      throw new Error("Please add at least one item");
    }

    const pickListItems = items.map((item) => {
      if (!item.itemCode || item.itemCode.trim() === "") {
        throw new Error("Please select an item for all rows");
      }
      if (item.orderedQuantity <= 0) {
        throw new Error("Ordered quantity must be greater than 0");
      }
      return {
        itemCode: item.itemCode,
        itemName: item.itemName || "",
        uom: item.uom || "Pcs",
        requiredQuantity: parseInt(item.reservedQuantity) || parseInt(item.orderedQuantity),
        sourceLocation: item.sourceLocation || "",
        batchNumber: item.batchNumber || "",
        priority: pickListData.priority || "HIGH",
      };
    });

    return {
      soNumber: soData.soNumber,
      warehouseId: soData.warehouseId,
      priority: pickListData.priority || "HIGH",
      assignedTo: pickListData.assignedTo,
      createdBy: "system_user",
      items: pickListItems,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const requestData = prepareRequestData();

      let result;
      if (mode === "edit" && savedSOId) {
        result = await updateSalesOrderAPI(savedSOId, requestData);
        if (onSuccess) {
          onSuccess(`Sales Order updated successfully!`);
        }
      } else {
        result = await createSalesOrderAPI(requestData);
        setSavedSOId(result.id);
        if (onSuccess) {
          onSuccess(
            `Sales Order created successfully! SO Number: ${result.soNumber}`,
          );
        }
      }

      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(
        error.message || "Error saving sales order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle pick list creation
  const handleCreatePickList = async () => {
    setSubmitting(true);
    setErrorMessage("");

    try {
      const pickListData = preparePickListData();
      console.log("Creating Pick List with data:", pickListData);

      const result = await createPickListAPI(pickListData);
      console.log("Pick List created:", result);

      if (onSuccess) {
        onSuccess(`Pick List created successfully!`);
      }
      onClose();
    } catch (error) {
      console.error("Pick List creation error:", error);
      setErrorMessage(
        error.message || "Error creating pick list. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-700 border-gray-200",
      NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
      MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
      HIGH: "bg-orange-100 text-orange-700 border-orange-200",
      URGENT: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[priority] || colors.NORMAL;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales order...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
        <h2 className="text-xl font-semibold text-gray-800">
          {mode === "edit" ? "Create Pick Task" : "Create Sales Order"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Basic Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mode === "edit" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SO Number
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="font-medium text-blue-600">
                        {soData.soNumber}
                      </span>
                    </div>
                  </div>
                )}

              

                <div>
                  <SearchableSelect
                    label="Warehouse"
                    required={true}
                    options={warehouses}
                    value={soData.warehouseId}
                    onChange={handleWarehouseChange}
                    placeholder="Select Warehouse"
                    loading={isLoadingWarehouses}
                    onSearch={handleWarehouseSearch}
                    onLoadMore={handleWarehouseLoadMore}
                    hasMore={hasMoreWarehouses}
                    totalOptions={warehouseTotal}
                    displayKey="name"
                    subDisplayKey="warehouseId"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level *
                  </label>
                  <select
                    name="priority"
                    value={soData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="LOW">Low - Standard Processing</option>
                    <option value="NORMAL">Normal - Regular Priority</option>
                    <option value="MEDIUM">Medium - Moderate Priority</option>
                    <option value="HIGH">High - Urgent Requirement</option>
                    <option value="URGENT">Urgent - Critical/Immediate</option>
                  </select>
                </div>

                {/* Pick List specific fields for edit mode */}
                {mode === "edit" && (
                  <>
                    <div>
                      <SearchableSelect
                        label="Assigned To"
                        required={true}
                        options={assignees}
                        value={pickListData.assignedTo}
                        onChange={handleAssigneeChange}
                        placeholder="Select Assignee"
                        loading={isLoadingAssignees}
                        onSearch={handleAssigneeSearch}
                        onLoadMore={handleAssigneeLoadMore}
                        hasMore={hasMoreAssignees}
                        totalOptions={assigneeTotal}
                        displayKey="username"
                        subDisplayKey="email"
                      />
                      {pickListData.assignedToName && (
                        <div className="mt-1 text-xs text-gray-500">
                          Selected: {pickListData.assignedToName}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pick List Priority *
                      </label>
                      <select
                        name="priority"
                        value={pickListData.priority}
                        onChange={handlePickListInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {soData.priority && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
                  <span className="text-sm text-gray-600">
                    Selected Priority:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(soData.priority)}`}
                  >
                    <Flag className="w-3 h-3" />
                    {soData.priority}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {mode === "edit" ? "Pick List Items" : "Order Items"}
              </h2>
              <div className="flex gap-2">
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={addPickListItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "150px" }}
                    >
                      Item Code *
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "180px" }}
                    >
                      Item Name
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "70px" }}
                    >
                      UOM
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "100px" }}
                    >
                      Ordered Qty
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "100px" }}
                    >
                      Reserved Qty
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "100px" }}
                    >
                      Batch #
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "250px" }}
                    >
                      Select Reservation
                    </th>
                    {mode === "edit" && (
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ minWidth: "60px" }}
                      >
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <SearchableSelect
                          options={itemsList}
                          value={item.itemCode}
                          onChange={(selected) =>
                            handleSelectItem(item.id, selected)
                          }
                          placeholder="Select Item"
                          loading={isLoadingItems}
                          onSearch={handleItemsSearch}
                          onLoadMore={handleItemsLoadMore}
                          hasMore={hasMoreItems}
                          totalOptions={itemsTotal}
                          disabled={mode === "edit" && item.id}
                          displayKey="itemCode"
                          subDisplayKey="itemName"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "itemName",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[34px]"
                          placeholder="Item name"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.uom}
                          onChange={(e) =>
                            handleItemChange(item.id, "uom", e.target.value)
                          }
                          readOnly
                          disabled
                          className="w-[80px] max-w-[80px] px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[34px]"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Kg">Kg</option>
                          <option value="Liters">Liters</option>
                          <option value="Boxes">Boxes</option>
                          <option value="Packs">Packs</option>
                          <option value="Rolls">Rolls</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.orderedQuantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              "orderedQuantity",
                              e.target.value,
                            )
                          }
                          className="w-full max-w-[80px] px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[34px]"
                          min="1"
                          readOnly
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <input
                            type="number"
                            value={item.reservedQuantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "reservedQuantity",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`w-full max-w-[80px] px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[34px] ${
                              item.reservedQuantity > item.orderedQuantity
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                            min="0"
                            max={item.orderedQuantity}
                          />
                          {item.reservedQuantity > item.orderedQuantity && (
                            <span className="text-xs text-red-500 block mt-0.5">
                              Exceeds ordered qty
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "batchNumber",
                              e.target.value,
                            )
                          }
                          className="w-full min-w-[80px] px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[34px]"
                          placeholder="Batch #"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.reservations && item.reservations.length > 0 ? (
                          <ReservationSelect
                            reservations={item.reservations}
                            selectedReservationId={item.selectedReservationId}
                            onSelect={(reservation) =>
                              handleReservationSelect(item.id, reservation)
                            }
                            disabled={mode !== "edit"}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            No reservations
                          </span>
                        )}
                      </td>
                      {mode === "edit" && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removePickListItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {mode === "edit" ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    hanldeConfirmAndProcess(soData.soNumber, onSuccess)
                  }
                  className="px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4" />
                  Approve and Process
                </button>
                <button
                  type="button"
                  onClick={handleCreatePickList}
                  disabled={submitting}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white`}
                >
                  <Package className="w-4 h-4" />
                  {submitting ? "Creating..." : "Create Pick List"}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white`}
              >
                <Save className="w-4 h-4" />
                {submitting ? "Saving..." : "Save Sales Order"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}