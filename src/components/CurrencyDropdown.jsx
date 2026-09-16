"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCurrency, CURRENCY_OPTIONS } from "@/context/CurrencyContext";
import { DollarSign, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CurrencyDropdown({ className }) {
  const { currencyCode, setCurrencyCode, formatCurrency, isMounted } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const sampleAmount = 1234.56;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    CURRENCY_OPTIONS.find((opt) => opt.code === currencyCode) || CURRENCY_OPTIONS[0];

  const filteredOptions = CURRENCY_OPTIONS.filter((opt) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.code.toLowerCase().includes(q) ||
      opt.name.toLowerCase().includes(q) ||
      opt.region.toLowerCase().includes(q) ||
      opt.symbol.toLowerCase().includes(q)
    );
  });

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-xs hover:bg-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Select Currency Format"
        aria-expanded={isOpen}
      >
        <DollarSign className="size-3.5 text-primary shrink-0" />
        <span className="font-medium text-foreground hidden sm:inline">
          {isMounted ? `${selectedOption.code} (${selectedOption.symbol})` : "Currency"}
        </span>
        <span className="font-medium text-foreground sm:hidden">
          {isMounted ? selectedOption.code : "Curr"}
        </span>
        <ChevronDown
          className={cn(
            "size-3 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 sm:w-80 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-2 border-b border-border/60 space-y-2">
            <div>
              <p className="text-xs font-semibold text-foreground">Worldwide Currency</p>
              <p className="text-[11px] text-muted-foreground">
                Applied across financial reports & prices
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency, region, code..."
                className="w-full rounded-lg border border-input bg-background pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching currencies found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = currencyCode === option.code;
                const preview = formatCurrency(sampleAmount, option.code);

                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      setCurrencyCode(option.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground">{option.code}</span>
                        <span className="font-medium text-primary text-[11px]">
                          ({option.symbol})
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {option.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        Preview: {preview} ({option.region})
                      </p>
                    </div>
                    {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
