"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// API function
const fetchWarehouse = async (warehouseId) => {
  const { data } = await api.post("/warehouses/filter", {
    warehouseId,
  });

  return data.data.content[0];
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getCode = (item, fallback) => {
  if (!item) return fallback;

  return (
    item.warehouseId ||
    item.zoneId ||
    item.aisleId ||
    item.rackId ||
    item.levelId ||
    item.barcode ||
    item.binId ||
    fallback
  );
};

const getDisplayName = (item, fallback) => {
  if (!item) return fallback;

  return item.name || item.description || fallback;
};

// Shows: 1 2 3 ... last when there are more than 4 records.
const getItemsForMapping = (items = []) => {
  // ✅ FIX: Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length <= 4) {
    return safeItems.map((item, index) => ({
      item,
      index,
    }));
  }

  return [
    ...safeItems.slice(0, 3).map((item, index) => ({
      item,
      index,
    })),
    {
      ellipsis: true,
      index: 3,
    },
    {
      item: safeItems[safeItems.length - 1],
      index: safeItems.length - 1,
    },
  ];
};

const getTotalBins = (zone) => {
  if (!zone) return 0;

  const aisles = Array.isArray(zone?.aisles) ? zone.aisles : [];

  return aisles.reduce(
    (zoneTotal, aisle) =>
      zoneTotal +
      (Array.isArray(aisle?.racks) ? aisle.racks : []).reduce(
        (aisleTotal, rack) =>
          aisleTotal +
          (Array.isArray(rack?.levels) ? rack.levels : []).reduce(
            (levelTotal, level) =>
              levelTotal + (Array.isArray(level?.bins) ? level.bins.length : 0),
            0,
          ),
        0,
      ),
    0,
  );
};

const getRackBins = (rack) => {
  if (!rack) return [];

  const levels = Array.isArray(rack?.levels) ? rack.levels : [];

  return levels.reduce(
    (bins, level) => [
      ...bins,
      ...(Array.isArray(level?.bins) ? level.bins : []),
    ],
    [],
  );
};

const getStatusDotClass = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-500";
    case "OCCUPIED":
      return "bg-blue-500";
    case "RESERVED":
      return "bg-amber-500";
    case "FULL":
      return "bg-red-500";
    case "MAINTENANCE":
      return "bg-gray-500";
    default:
      return "bg-gray-300";
  }
};

// -----------------------------------------------------------------------------
// BIN
// -----------------------------------------------------------------------------

const MappingBin = ({ bin, onSelect }) => {
  if (!bin) return null;

  const binCode = bin?.barcode || bin?.binId || "-";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();

        onSelect({
          id: binCode,
          name: binCode,
          type: "bin",
          data: bin,
          status: bin?.status,
          children: [],
        });
      }}
      className="
        relative
        flex
        min-h-[25px]
        items-center
        justify-center
        rounded-[3px]
        border
        border-[#cfe4d2]
        bg-[#fbfdfb]
        px-1.5
        py-1
        text-[11px]
        leading-none
        text-slate-700
        transition
        hover:border-[#79b982]
        hover:bg-[#f2faf3]
      "
      title={
        bin?.stockSummary?.availableSlots > 0
          ? `available slots ${bin.stockSummary.availableSlots}`
          : `${binCode} No available slots`
      }
    >
      <span className="truncate">{binCode}</span>

      {bin?.stockSummary?.availableSlots > 0 && (
        <span
          className={cn(
            `absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${bin?.stockSummary?.availableSlots > 0 ? "bg-emerald-500" : "bg-gray-300"}`,
          )}
        />
      )}
    </button>
  );
};

// -----------------------------------------------------------------------------
// RACK
// -----------------------------------------------------------------------------

const MappingRack = ({ rack, rackIndex, onSelect }) => {
  if (!rack) return null;

  const bins = getRackBins(rack);
  const rackCode = getCode(rack, `R${String(rackIndex + 1).padStart(2, "0")}`);

  const handleRackSelect = () => {
    onSelect({
      id: rackCode,
      name: getDisplayName(rack, rackCode),
      type: "rack",
      data: rack,
      stockSummary: rack?.stockSummary,
      children: [],
    });
  };

  return (
    <div
      className="
        min-w-[73px]
        overflow-hidden
        rounded-[4px]
        border
        border-[#cfe4d2]
        bg-white
        cursor-pointer
      "
      onClick={handleRackSelect}
    >
      {/* Rack Header */}
      <div
        className="
          flex
          h-[27px]
          items-center
          justify-center
          border-b
          border-[#dcecdf]
          bg-[#fbfdfb]
          px-1.5
        "
      >
        <span
          className="
            truncate
            text-[12px]
            font-medium
            text-[#16863b]
          "
        >
          {rackCode}
        </span>
      </div>

      {/* Bins */}
      <div className="grid grid-cols-2 gap-[3px] p-[4px]">
        {bins.length > 0 ? (
          bins.map((bin, index) => (
            <MappingBin
              key={bin?.barcode || bin?.binId || `${rackCode}-B${index + 1}`}
              bin={bin}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div
            className="
              col-span-2
              py-3
              text-center
              text-[9px]
              text-slate-400
            "
          >
            No bins
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// AISLE
// -----------------------------------------------------------------------------

const MappingAisle = ({ aisle, aisleIndex, onSelect }) => {
  if (!aisle) return null;

  const racks = Array.isArray(aisle?.racks) ? aisle.racks : [];
  const rackEntries = getItemsForMapping(racks);

  const aisleCode = getCode(
    aisle,
    `A${String(aisleIndex + 1).padStart(2, "0")}`,
  );

  const handleAisleSelect = () => {
    onSelect({
      id: aisleCode,
      name: getDisplayName(aisle, aisleCode),
      type: "aisle",
      data: aisle,
      stockSummary: aisle?.stockSummary,
      children: [],
    });
  };

  return (
    <div className="min-w-[150px] flex-1">
      {/* Aisle Header */}
      <button
        type="button"
        onClick={handleAisleSelect}
        className="
          mb-2
          flex
          h-[27px]
          w-full
          items-center
          justify-center
          rounded-[4px]
          border
          border-[#f5a623]
          bg-white
          px-2
          text-[12px]
          font-medium
          text-[#f08a00]
          transition
          hover:bg-[#fffaf0]
        "
        title={getDisplayName(aisle, aisleCode)}
      >
        <span className="truncate">{aisleCode}</span>
      </button>

      {/* Racks */}
      <div className="flex gap-[6px] overflow-hidden">
        {rackEntries.map((entry) => {
          if (entry.ellipsis) {
            return (
              <div
                key={`ellipsis-${aisleCode}`}
                className="
                  flex
                  min-w-[28px]
                  items-center
                  justify-center
                  self-center
                  text-[16px]
                  text-slate-500
                "
              >
                ...
              </div>
            );
          }

          return (
            <MappingRack
              key={getCode(
                entry.item,
                `R${String(entry.index + 1).padStart(2, "0")}`,
              )}
              rack={entry.item}
              rackIndex={entry.index}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// ZONE
// -----------------------------------------------------------------------------

const MappingZone = ({ zone, zoneIndex, onSelect }) => {
  if (!zone) return null;

  const aisles = Array.isArray(zone?.aisles) ? zone.aisles : [];
  const aisleEntries = getItemsForMapping(aisles);

  const zoneCode = getCode(zone, `Z${String(zoneIndex + 1).padStart(2, "0")}`);
  const totalBins = getTotalBins(zone);

  const handleZoneSelect = () => {
    onSelect({
      id: zoneCode,
      name: getDisplayName(zone, zoneCode),
      type: "zone",
      data: zone,
      stockSummary: zone?.stockSummary,
      children: [],
    });
  };

  return (
    <section
      className="
        rounded-[10px]
        border
        border-[#5bb86b]
        bg-white
        p-3
      "
    >
      {/* Zone Header */}
      <div
        className="
          mb-3
          flex
          items-center
          gap-2
          px-1
        "
      >
        {/* Zone Code */}
        <button
          type="button"
          onClick={handleZoneSelect}
          className="
            rounded-[4px]
            bg-[#54a957]
            px-3
            py-1
            text-[13px]
            font-semibold
            text-white
            transition
            hover:bg-[#469a4a]
          "
        >
          {zoneCode}
        </button>

        {/* Zone Name */}
        <button
          type="button"
          onClick={handleZoneSelect}
          className="
            truncate
            text-[13px]
            font-semibold
            text-[#16863b]
            hover:underline
          "
        >
          {getDisplayName(zone, "Zone")}
        </button>

        {/* Zone Summary */}
        <span
          className="
            ml-auto
            hidden
            text-[10px]
            text-slate-500
            sm:block
          "
        >
          {aisles.length} aisles
          {" · "}
          {totalBins} bins
        </span>
      </div>

      {/* Aisles */}
      <div
        className="
          flex
          gap-[10px]
          overflow-x-auto
          pb-1
        "
      >
        {aisleEntries.map((entry) => {
          if (entry.ellipsis) {
            return (
              <div
                key={`zone-ellipsis-${zoneCode}`}
                className="
                  flex
                  min-w-[30px]
                  items-center
                  justify-center
                  self-center
                  text-[18px]
                  text-slate-500
                "
              >
                ...
              </div>
            );
          }

          return (
            <MappingAisle
              key={getCode(entry.item, `A${entry.index + 1}`)}
              aisle={entry.item}
              aisleIndex={entry.index}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// MAIN WAREHOUSE
// -----------------------------------------------------------------------------

const MainWarehouseMapping = ({ warehouse, onSelect }) => {
  if (!warehouse) return null;

  const zones = Array.isArray(warehouse?.zones) ? warehouse.zones : [];
  const zoneEntries = getItemsForMapping(zones);

  const warehouseCode = getCode(warehouse, "WH01");

  const handleWarehouseSelect = () => {
    onSelect({
      id: warehouseCode,
      name: getDisplayName(warehouse, warehouseCode),
      type: "warehouse",
      data: warehouse,
      stockSummary: warehouse?.stockSummary,
      children: [],
    });
  };

  return (
    <section
      className="
        overflow-hidden
        rounded-[10px]
        border
        border-[#ff3030]
        bg-white
      "
    >
      {/* Warehouse Header */}
      <div
        className="
          flex
          min-h-[48px]
          items-center
          gap-3
          border-b
          border-[#ff3030]
          px-2
        "
      >
        {/* Warehouse Code */}
        <button
          type="button"
          onClick={handleWarehouseSelect}
          className="
            rounded-[4px]
            bg-[#ef2525]
            px-3.5
            py-1.5
            text-[13px]
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-[#d91d1d]
          "
        >
          {warehouseCode}
        </button>

        {/* Warehouse Name */}
        <button
          type="button"
          onClick={handleWarehouseSelect}
          className="
            truncate
            text-[14px]
            font-semibold
            text-[#ed2525]
            hover:underline
          "
        >
          {getDisplayName(warehouse, "Main Warehouse")}
        </button>

        {/* Zone Count */}
        <span
          className="
            ml-auto
            mr-2
            hidden
            text-[10px]
            text-slate-500
            md:block
          "
        >
          {zones.length} zones
        </span>
      </div>

      {/* Zones */}
      <div
        className="
          space-y-3
          p-3
        "
      >
        {zoneEntries.map((entry) => {
          if (entry.ellipsis) {
            return (
              <div
                key={`warehouse-ellipsis-${warehouseCode}`}
                className="
                  flex
                  h-8
                  items-center
                  justify-center
                  text-[18px]
                  text-slate-500
                "
              >
                ...
              </div>
            );
          }

          return (
            <MappingZone
              key={getCode(entry.item, `Z${entry.index + 1}`)}
              zone={entry.item}
              zoneIndex={entry.index}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// SELECTED NODE POPUP
// -----------------------------------------------------------------------------

const formatLabel = (key) =>
  String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object") {
    if (Array.isArray(value)) return `${value.length} items`;
    return JSON.stringify(value);
  }
  return String(value);
};

const getCurrentObjectDetails = (node) => {
  if (!node?.data) return {};

  const data = { ...node.data };

  // Do not show children of the clicked object.
  switch (node.type) {
    case "warehouse":
      delete data.zones;
      break;
    case "zone":
      delete data.aisles;
      break;
    case "aisle":
      delete data.racks;
      break;
    case "rack":
      delete data.levels;
      delete data.compartments;
      break;
    case "level":
      delete data.bins;
      break;
    case "bin":
      // ✅ KEEP items for bin - don't delete them
      // Only delete nested children, but keep items
      break;
    default:
      break;
  }

  // Hide empty barcode metadata.
  ["barcodeData", "barcodeImage", "barcodeFormat"].forEach((key) => {
    if (data[key] == null) delete data[key];
  });

  return data;
};

// -----------------------------------------------------------------------------
// SELECTED NODE POPUP - Shows full item details below Level Name
// -----------------------------------------------------------------------------

const SelectedNode = ({ node, onClose }) => {
  if (!node) return null;

  const details = getCurrentObjectDetails(node);

  const typeStyles = {
    warehouse: {
      badge: "bg-[#ef2525]",
      border: "border-[#ff3030]",
      title: "text-[#ef2525]",
    },
    zone: {
      badge: "bg-[#54a957]",
      border: "border-[#5bb86b]",
      title: "text-[#16863b]",
    },
    aisle: {
      badge: "bg-[#f08a00]",
      border: "border-[#f5a623]",
      title: "text-[#f08a00]",
    },
    rack: {
      badge: "bg-[#16863b]",
      border: "border-[#cfe4d2]",
      title: "text-[#16863b]",
    },
    level: {
      badge: "bg-[#16863b]",
      border: "border-[#cfe4d2]",
      title: "text-[#16863b]",
    },
    bin: {
      badge: "bg-slate-600",
      border: "border-slate-300",
      title: "text-slate-700",
    },
  };

  const style = typeStyles[node.type] || typeStyles.bin;

  // Helper to render items with full details
  const renderItems = (items) => {
    if (!items) return <p className="text-xs text-slate-500">No items</p>;

    // If items is a string, try to parse it
    let itemsArray = items;
    if (typeof items === "string") {
      try {
        itemsArray = JSON.parse(items);
      } catch (e) {
        return <p className="text-xs text-slate-500">Invalid items data</p>;
      }
    }

    // Ensure it's an array
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      return <p className="text-xs text-slate-500">No items</p>;
    }

    return (
      <div className="space-y-3">
        <div className="text-[10px] text-slate-500">
          {itemsArray.length} item{itemsArray.length > 1 ? "s" : ""} in this bin
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {itemsArray.map((item, idx) => {
            // Ensure item is an object
            if (typeof item !== "object" || item === null) {
              return null;
            }

            return (
              <div
                key={idx}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <p className="col-span-2 font-semibold text-blue-600 text-sm mb-1">
                    #{idx + 1} {item.itemName || "Unnamed Item"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Code:</span>{" "}
                    {item.itemCode || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Name:</span>{" "}
                    {item.itemName || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">
                      Quantity:
                    </span>{" "}
                    {item.quantity || 0}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">
                      Available:
                    </span>{" "}
                    {item.availableQuantity || 0}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">
                      Reserved:
                    </span>{" "}
                    {item.reservedQuantity || 0}
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">UOM:</span>{" "}
                    {item.uom || "-"}
                  </p>
                  {item.batchNumber && (
                    <p className="col-span-2">
                      <span className="font-medium text-slate-500">Batch:</span>{" "}
                      {item.batchNumber}
                    </p>
                  )}
                  {item.unitPrice !== null && item.unitPrice !== undefined && (
                    <p>
                      <span className="font-medium text-slate-500">
                        Unit Price:
                      </span>{" "}
                      ₹{item.unitPrice}
                    </p>
                  )}
                  {item.totalValue !== null &&
                    item.totalValue !== undefined && (
                      <p>
                        <span className="font-medium text-slate-500">
                          Total Value:
                        </span>{" "}
                        ₹{item.totalValue}
                      </p>
                    )}
                  {item.expiryDate && (
                    <p className="col-span-2">
                      <span className="font-medium text-slate-500">
                        Expiry:
                      </span>{" "}
                      {item.expiryDate}
                    </p>
                  )}
                  {item.mfgDate && (
                    <p className="col-span-2">
                      <span className="font-medium text-slate-500">MFG:</span>{" "}
                      {item.mfgDate}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to format value for display
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === "object") {
      // Don't stringify items array here - it will be handled separately
      if (value.items) return `${value.items?.length || 0} items`;
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Get items from the original node data (not details)
  const originalItems =
    node.data?.stockSummary?.items || node.data?.items || [];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full max-w-3xl overflow-hidden rounded-xl border bg-white shadow-2xl",
          style.border,
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white",
                style.badge,
              )}
            >
              {node.type}
            </span>

            <div className="min-w-0">
              <div
                className={cn("truncate text-[15px] font-bold", style.title)}
              >
                {node.name || node.id}
              </div>

              {node.id && node.name !== node.id && (
                <div className="mt-0.5 text-[10px] text-slate-400">
                  ID: {node.id}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="max-h-[72vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(details).map(([key, value]) => {
              if (value === null || value === undefined || value === "") {
                return null;
              }

              // Skip empty arrays
              if (Array.isArray(value) && value.length === 0) {
                return null;
              }

              // Skip the items field from the grid (we'll render it separately)
              if (key === "items") {
                return null;
              }

              // Determine if this field should span full width
              const isFullWidth =
                key === "stockSummary" ||
                key === "fullLocation" ||
                key === "address" ||
                key === "remarks" ||
                key === "description";

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2",
                    isFullWidth ? "sm:col-span-2 lg:col-span-3" : "",
                  )}
                >
                  <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    {formatLabel(key)}
                  </div>

                  {key === "stockSummary" &&
                  typeof value === "object" &&
                  !Array.isArray(value) ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {Object.entries(value)
                        .filter(
                          ([, stockValue]) =>
                            stockValue !== null &&
                            stockValue !== undefined &&
                            stockValue !== "",
                        )
                        .map(([stockKey, stockValue]) => (
                          <div
                            key={stockKey}
                            className="rounded-md border border-slate-100 bg-white px-2 py-1.5"
                          >
                            <div className="text-[8px] text-slate-400">
                              {formatLabel(stockKey)}
                            </div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-700">
                              {formatDisplayValue(stockValue)}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="break-words text-[11px] font-medium text-slate-700">
                      {formatDisplayValue(value)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ✅ ITEMS SECTION - Displayed below all other fields */}
          {(() => {
            // Get items from original node data
            let items = originalItems;

            // If items is a string, try to parse it
            if (typeof items === "string") {
              try {
                items = JSON.parse(items);
              } catch (e) {
                return null;
              }
            }

            // Check if it's a valid array with items
            if (!Array.isArray(items) || items.length === 0) {
              return null;
            }

            return (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Items in Bin ({items.length})
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3 lg:grid-cols-4">
                        <p className="col-span-2 font-semibold text-blue-600 text-sm mb-1 sm:col-span-3 lg:col-span-4">
                          #{idx + 1} {item.itemName || "Unnamed Item"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500">
                            Code:
                          </span>{" "}
                          {item.itemCode || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500">
                            Name:
                          </span>{" "}
                          {item.itemName || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500">
                            Quantity:
                          </span>{" "}
                          {item.quantity || 0}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500">
                            Available:
                          </span>{" "}
                          {item.availableQuantity || 0}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500">
                            Reserved:
                          </span>{" "}
                          {item.reservedQuantity || 0}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500">
                            UOM:
                          </span>{" "}
                          {item.uom || "-"}
                        </p>
                        {item.batchNumber && (
                          <p className="col-span-2">
                            <span className="font-medium text-slate-500">
                              Batch:
                            </span>{" "}
                            {item.batchNumber}
                          </p>
                        )}
                        {item.unitPrice !== null &&
                          item.unitPrice !== undefined && (
                            <p>
                              <span className="font-medium text-slate-500">
                                Unit Price:
                              </span>{" "}
                              ₹{item.unitPrice}
                            </p>
                          )}
                        {item.totalValue !== null &&
                          item.totalValue !== undefined && (
                            <p>
                              <span className="font-medium text-slate-500">
                                Total Value:
                              </span>{" "}
                              ₹{item.totalValue}
                            </p>
                          )}
                        {item.expiryDate && (
                          <p className="col-span-2">
                            <span className="font-medium text-slate-500">
                              Expiry:
                            </span>{" "}
                            {item.expiryDate}
                          </p>
                        )}
                        {item.mfgDate && (
                          <p className="col-span-2">
                            <span className="font-medium text-slate-500">
                              MFG:
                            </span>{" "}
                            {item.mfgDate}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-800 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export const WarehouseHierarchy = ({
  warehouseId: initialWarehouseId,
  onNodeSelect,
}) => {
  const [warehouse, setWarehouse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    initialWarehouseId || null,
  );

  // Sync whenever parent changes warehouseId
  useEffect(() => {
    if (initialWarehouseId) {
      setSelectedWarehouseId(initialWarehouseId);
      setSelectedNode(null);
    }
  }, [initialWarehouseId]);

  // ---------------------------------------------------------------------------
  // Select Node
  // ---------------------------------------------------------------------------

  const handleSelect = (node) => {
    setSelectedNode(node);

    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  // ---------------------------------------------------------------------------
  // Load Warehouse
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadWarehouse = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchWarehouse(selectedWarehouseId);
        setWarehouse(data);
      } catch (err) {
        setError("Failed to load warehouse hierarchy");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedWarehouseId) {
      loadWarehouse();
    }
  }, [selectedWarehouseId]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Card
        className="
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <Card
        className="
          rounded-xl
          border
          border-red-200
          bg-white
          shadow-sm
        "
      >
        <CardContent
          className="
            flex
            flex-col
            items-center
            justify-center
            py-12
          "
        >
          <div className="text-center text-red-500">
            <p className="text-lg font-semibold">Failed to Load</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <Card
      className="
        w-full
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* Title */}
      <CardHeader
        className="
          border-b
          border-slate-200
          px-4
          py-3
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <CardTitle
              className="
                text-lg
                font-semibold
                text-slate-800
              "
            >
              Warehouse Hierarchy (Mapping)
            </CardTitle>

            <CardDescription
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              Warehouse → Zone → Aisle → Rack → Level → Bin
            </CardDescription>
          </div>

          {/* Legend */}
          <div
            className="
              hidden
              items-center
              gap-2
              text-[10px]
              text-slate-500
              sm:flex
            "
          >
            <span
              className="
                inline-block
                h-2
                w-2
                rounded-full
                bg-[#ef2525]
              "
            />
            Warehouse
            <span
              className="
                ml-2
                inline-block
                h-2
                w-2
                rounded-full
                bg-[#54a957]
              "
            />
            Zone
            <span
              className="
                ml-2
                inline-block
                h-2
                w-2
                rounded-full
                bg-[#f5a623]
              "
            />
            Aisle
          </div>
        </div>
      </CardHeader>

      {/* Mapping */}
      <CardContent
        className="
          p-2.5
          sm:p-3
        "
      >
        <div
          className="
            max-h-[700px]
            overflow-auto
            pr-1
          "
        >
          {warehouse ? (
            <MainWarehouseMapping
              warehouse={warehouse}
              onSelect={handleSelect}
            />
          ) : (
            <div
              className="
                py-12
                text-center
                text-sm
                text-slate-500
              "
            >
              No warehouse found.
            </div>
          )}
        </div>

        {/* Selected Node */}
        <SelectedNode
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      </CardContent>
    </Card>
  );
};

export default WarehouseHierarchy;
