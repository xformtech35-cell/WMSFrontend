// app/sales-order/components/SalesOrderForm.jsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
  Send,
  Save,
  Calendar,
  AlertCircle,
  Flag,
  XCircle,
  Building2,
  User,
  Building,
  Warehouse,
  FileText,
  MapPin,
  Truck,
  Package,
  Search,
  ChevronDown,
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

    const response = await api.get(`/customers?${params.toString()}`);
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
    return {
      data: [
        {
          id: 1,
          customerCode: "CUST-001",
          customerName: "Acme Corporation",
          companyName: "Acme Corp",
        },
        {
          id: 2,
          customerCode: "CUST-002",
          customerName: "Global Traders",
          companyName: "Global Traders Ltd",
        },
        {
          id: 3,
          customerCode: "CUST-003",
          customerName: "Tech Solutions",
          companyName: "Tech Solutions Pvt Ltd",
        },
        {
          id: 4,
          customerCode: "CUST-004",
          customerName: "MediTech Solutions",
          companyName: "MediTech Solutions Pvt Ltd",
        },
        {
          id: 5,
          customerCode: "CUST-005",
          customerName: "Quick Logistics",
          companyName: "Quick Logistics Inc",
        },
      ],
      totalElements: 5,
    };
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
    return {
      data: [
        { id: 1, warehouseId: "WH-001", name: "Mumbai WH", location: "Mumbai" },
        { id: 2, warehouseId: "WH-002", name: "Pune WH", location: "Pune" },
        { id: 3, warehouseId: "WH-003", name: "Delhi WH", location: "Delhi" },
        {
          id: 4,
          warehouseId: "WH-004",
          name: "Bangalore WH",
          location: "Bangalore",
        },
        {
          id: 5,
          warehouseId: "WH-005",
          name: "Chennai WH",
          location: "Chennai",
        },
      ],
      totalElements: 5,
    };
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
    return {
      data: [
        {
          id: 1,
          itemCode: "ITEM001",
          itemName: "Product A",
          uom: "Nos",
          unitPrice: 100,
        },
        {
          id: 2,
          itemCode: "ITEM002",
          itemName: "Product B",
          uom: "Kg",
          unitPrice: 50,
        },
        {
          id: 3,
          itemCode: "ITEM003",
          itemName: "Product C",
          uom: "Liters",
          unitPrice: 75,
        },
        {
          id: 4,
          itemCode: "ITEM004",
          itemName: "Product D",
          uom: "Boxes",
          unitPrice: 200,
        },
        {
          id: 5,
          itemCode: "ITEM005",
          itemName: "Product E",
          uom: "Pcs",
          unitPrice: 30,
        },
        {
          id: 6,
          itemCode: "ITEM006",
          itemName: "Product F",
          uom: "Kg",
          unitPrice: 80,
        },
        {
          id: 7,
          itemCode: "ITEM007",
          itemName: "Product G",
          uom: "Liters",
          unitPrice: 120,
        },
        {
          id: 8,
          itemCode: "ITEM008",
          itemName: "Product H",
          uom: "Rolls",
          unitPrice: 45,
        },
      ],
      totalElements: 8,
    };
  }
};

// Update sales order item
const updateSalesOrderItemAPI = async (itemId, data) => {
  return apiRequest(`/outbound/sales-order-item/${itemId}`, "PUT", data);
};

const hanldeConfirm = async (id, onSuccess) => {
  console.log("CONFIRM BUTTON CLICKED", id);

  try {
    const result = await PUT(
      `outbound/sales-order/${id}/status?status=APPROVED`,
      {},
    );
    if (onSuccess) {
      onSuccess(`Sales Order Approved successfully!`);
    }
    console.log("CONFIRM API RESULT:", result);
  } catch (error) {
    console.error("CONFIRM API ERROR:", error);
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
      opt.id === value,
  );

  const displayValue = selectedOption
    ? selectedOption.customerName ||
      selectedOption.name ||
      selectedOption.itemName ||
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
              const displayLabel =
                option.customerName ||
                option.name ||
                option.itemName ||
                option.itemCode ||
                option.warehouseId ||
                option.id;

              const displaySub =
                option.customerCode || option.location || option.itemCode || "";

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

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedSOId, setSavedSOId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);

  const PAGE_SIZE = 10;

  // Load data on mount
  useEffect(() => {
    loadCustomers();
    loadWarehouses();
    loadItems();
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

  const loadInitialData = () => {
    try {
      setIsLoading(true);

      setSoData({
        soNumber:
          initialData.soNumber ||
          `SO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        customerCode: initialData.customerCode || "",
        customerName: initialData.customerName || "",
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

      if (initialData.items && initialData.items.length > 0) {
        const formattedItems = initialData.items.map((item, index) => {
          // Get all reservations for this item
          const itemReservations =
            item.reservations ||
            initialData.reservations?.filter(
              (r) => r.itemCode === item.itemCode,
            ) ||
            [];

          // If there's only one reservation, select it automatically
          let selectedReservationId = null;
          let sourceLocation = item.sourceLocation || null;

          if (itemReservations.length === 1) {
            selectedReservationId = itemReservations[0].id;
            // Build location from the single reservation
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
            // If multiple, check if there's a reservation with status that matches
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

          // Set default reservedQuantity to orderedQuantity if not set
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

  const handleCustomerChange = (customer) => {
    if (customer) {
      setSoData((prev) => ({
        ...prev,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
      }));
      setSelectedCustomer(customer);
    }
  };

  const handleWarehouseChange = (warehouse) => {
    if (warehouse) {
      setSoData((prev) => ({
        ...prev,
        warehouseId: warehouse.warehouseId || warehouse.name,
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

    // Build location from reservation
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

  // Handle Reserve/Update item
  const handleReserveItem = async (item) => {
    if (!item.id) {
      setErrorMessage("Item ID is required to update");
      return;
    }

    if (!item.itemCode) {
      setErrorMessage("Please select an item first");
      return;
    }

    if (item.orderedQuantity <= 0) {
      setErrorMessage("Ordered quantity must be greater than 0");
      return;
    }

    if (item.reservedQuantity < 0) {
      setErrorMessage("Reserved quantity cannot be negative");
      return;
    }

    if (item.reservedQuantity > item.orderedQuantity) {
      setErrorMessage("Reserved quantity cannot exceed ordered quantity");
      return;
    }

    try {
      setUpdatingItem(item.id);
      setErrorMessage("");

      // Find the selected reservation
      const selectedReservation = item.reservations.find(
        (r) => r.id === item.selectedReservationId,
      );

      // Build sourceLocation from selected reservation
      let sourceLocation = item.sourceLocation;
      if (selectedReservation) {
        const parts = [
          selectedReservation.warehouseId,
          selectedReservation.zoneId,
          selectedReservation.aisleId,
          selectedReservation.rackId,
          selectedReservation.levelId,
          selectedReservation.binId,
        ].filter(Boolean);
        sourceLocation = parts.join("/");
      }

      // Prepare the update data
      const updateData = {
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        orderedQuantity: item.orderedQuantity,
        reservedQuantity: item.reservedQuantity || 0,
        pickedQuantity: item.pickedQuantity || 0,
        shippedQuantity: item.shippedQuantity || 0,
        batchNumber: item.batchNumber || "",
        sourceLocation: sourceLocation || null,
        createdBy: "system_user",
      };

      // Call the API to update the item
      const result = await updateSalesOrderItemAPI(item.id, updateData);

      console.log("Item updated successfully:", result);

      // Update the local state with the response
      if (result) {
        const updatedItems = items.map((i) => {
          if (i.id === item.id) {
            return {
              ...i,
              ...result,
              sourceLocation: sourceLocation,
            };
          }
          return i;
        });
        setItems(updatedItems);
      }

      if (onSuccess) {
        const locationInfo = sourceLocation || "N/A";
        const reservationInfo = selectedReservation
          ? ` (${selectedReservation.reservationNumber})`
          : "";
        onSuccess(
          `Item ${item.itemCode} updated - Reserved: ${item.reservedQuantity}/${item.orderedQuantity} at ${locationInfo}${reservationInfo}`,
        );
      }
    } catch (error) {
      console.error("Error updating item:", error);
      setErrorMessage(
        error.message || "Failed to update item. Please try again.",
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  // Handle Reserve all items
  const handleReserveAllItems = async () => {
    let hasError = false;
    let successCount = 0;

    for (const item of items) {
      if (!item.itemCode) continue; // Skip empty items

      try {
        await handleReserveItem(item);
        successCount++;
      } catch (error) {
        console.error(`Failed to update item ${item.id}:`, error);
        hasError = true;
      }
    }

    if (successCount > 0 && onSuccess) {
      onSuccess(`${successCount} item(s) updated successfully!`);
    }

    if (hasError) {
      setErrorMessage(
        "Some items failed to update. Please check the console for details.",
      );
    }
  };

  // Auto-fill reserved quantity when ordered quantity changes
  const handleQuantityChange = (id, field, value) => {
    const numValue = parseFloat(value) || 0;

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: numValue };
        // If ordered quantity changes, update reserved quantity to match if it's 0 or default
        if (field === "orderedQuantity") {
          // Only auto-fill if reserved quantity is 0 or not set
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

  const addItem = () => {
    const newId = Math.max(...items.map((i) => i.id), 0) + 1;
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
      },
    ]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      setErrorMessage("At least one item is required");
    }
  };

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.orderedQuantity || 0), 0);
  }, [items]);

  const totalReservedQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0);
  }, [items]);

  const totalItemsCount = useMemo(() => {
    return items.length;
  }, [items]);

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
          {mode === "edit" ? "Sales Order Details" : "Create Sales Order"}
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
                    label="Customer"
                    required={true}
                    options={customers}
                    value={soData.customerCode}
                    onChange={handleCustomerChange}
                    placeholder="Select Customer"
                    loading={isLoadingCustomers}
                    onSearch={handleCustomerSearch}
                    onLoadMore={handleCustomerLoadMore}
                    hasMore={hasMoreCustomers}
                    totalOptions={customerTotal}
                    disabled={mode === "edit"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-700">
                      {soData.customerName || "Select customer"}
                    </span>
                  </div>
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={soData.deliveryDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Method *
                  </label>
                  <select
                    name="shippingMethod"
                    value={soData.shippingMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="ROAD">Road</option>
                    <option value="RAIL">Rail</option>
                    <option value="AIR">Air</option>
                    <option value="SEA">Sea</option>
                    <option value="COURIER">Courier</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="deliveryAddress"
                  value={soData.deliveryAddress}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter complete delivery address"
                  required
                />
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
                Order Items
              </h2>
              {/* <div className="flex gap-2">
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={handleReserveAllItems}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Reserve All
                  </button>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div> */}
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
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '180px' }}>
                      Location
                    </th> */}
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: "80px" }}
                    >
                      Actions
                    </th>
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
                            re
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
                      {/* <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.sourceLocation || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "sourceLocation",
                              e.target.value,
                            )
                          }
                          className="w-full min-w-[120px] px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[34px]"
                          placeholder="Auto-filled"
                          readOnly
                        />
                      </td> */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {mode === "edit" && item.id && (
                            <button
                              type="button"
                              onClick={() => handleReserveItem(item)}
                              disabled={
                                updatingItem === item.id ||
                                !item.selectedReservationId ||
                                item.reservedQuantity > item.orderedQuantity
                              }
                              className={`text-green-600 hover:text-green-800 transition-colors p-1 ${
                                updatingItem === item.id ||
                                !item.selectedReservationId ||
                                item.reservedQuantity > item.orderedQuantity
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              title={
                                !item.selectedReservationId
                                  ? "Select a reservation first"
                                  : item.reservedQuantity > item.orderedQuantity
                                    ? "Reserved quantity cannot exceed ordered quantity"
                                    : "Reserve/Update item"
                              }
                            >
                              {updatingItem === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              <h2 className="text-lg font-semibold text-gray-800">
                Summary & Additional Info
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={soData.remarks}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional information or special requirements..."
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Priority:</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(soData.priority)}`}
                      >
                        <Flag className="w-3 h-3" />
                        {soData.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{totalItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Ordered:</span>
                      <span className="font-medium">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Reserved:</span>
                      <span className="font-medium text-blue-600">
                        {totalReservedQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">
                        {soData.customerName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Warehouse:</span>
                      <span className="font-medium">
                        {soData.warehouseId || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Method:</span>
                      <span className="font-medium">
                        {soData.shippingMethod || "N/A"}
                      </span>
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
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {mode === "edit" && (
              <button
                type="button"
                onClick={() => hanldeConfirm(soData.soNumber, onSuccess)}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700
                  text-white`}
              >
                <Send className="w-4 h-4" />
                Approve
              </button>
            )}
            {mode === "edit" && (
              <button
                type="button"
                onClick={() =>
                  hanldeConfirmAndProcess(soData.soNumber, onSuccess)
                }
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700
                  text-white`}
              >
                <Send className="w-4 h-4" />
                Approve and Process
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
