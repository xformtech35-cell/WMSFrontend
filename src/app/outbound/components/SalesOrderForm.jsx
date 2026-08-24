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
const hanldeConfirm = async (id, onSuccess) => {
  console.log("CONFIRM BUTTON CLICKED", id);

  try {
    const result = await PUT(
      `outbound/sales-order/${id}/status?status=PENDING`,
      {},
    );
    if (onSuccess) {
      onSuccess(`Sales Order updated successfully!`);
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
      uom: "Nos",
      orderedQuantity: 1,
      batchNumber: "",
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
        const formattedItems = initialData.items.map((item, index) => ({
          id: index + 1,
          itemCode: item.itemCode || "",
          itemName: item.itemName || "",
          uom: item.uom || "Nos",
          orderedQuantity: item.orderedQuantity || 1,
          batchNumber: item.batchNumber || "",
        }));
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
            uom: selectedItem.uom || "Nos",
          };
        }
        return item;
      });
      setItems(updatedItems);
    }
  };

  const addItem = () => {
    const newId = Math.max(...items.map((i) => i.id), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        itemCode: "",
        itemName: "",
        uom: "Nos",
        orderedQuantity: 1,
        batchNumber: "",
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
        batchNumber: item.batchNumber || "",
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
          {mode === "edit" ? "Edit Sales Order" : "Create New Sales Order"}
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Code *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                            handleItemChange(
                              item.id,
                              "orderedQuantity",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="1"
                          required
                        />
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
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Batch #"
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
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-medium">{totalQuantity}</span>
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
                Confirm
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                soData.priority === "URGENT"
                  ? "bg-red-600 hover:bg-red-700"
                  : soData.priority === "HIGH"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              <Send className="w-4 h-4" />
              {submitting
                ? "Saving..."
                : mode === "edit"
                  ? "Update Order"
                  : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
