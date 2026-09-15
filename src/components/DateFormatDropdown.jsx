"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDateFormat, DATE_FORMAT_OPTIONS } from "@/context/DateFormatContext";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DateFormatDropdown({ className }) {
  const { dateFormat, setDateFormat, formatDate, isMounted } = useDateFormat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const today = new Date();

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
    DATE_FORMAT_OPTIONS.find((opt) => opt.id === dateFormat) || DATE_FORMAT_OPTIONS[0];

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-xs hover:bg-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Select Date Format"
        aria-expanded={isOpen}
      >
        <Calendar className="size-3.5 text-primary shrink-0" />
        <span className="font-medium text-foreground hidden sm:inline">
          {isMounted ? selectedOption.id : "Date Format"}
        </span>
        <span className="font-medium text-foreground sm:hidden">
          {isMounted ? selectedOption.id.split(" ")[0] : "Date"}
        </span>
        <ChevronDown className={cn("size-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 sm:w-72 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-xs font-semibold text-foreground">Date Display Format</p>
            <p className="text-[11px] text-muted-foreground">
              Applied across all pages & sidebars
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {DATE_FORMAT_OPTIONS.map((option) => {
              const isSelected = dateFormat === option.id;
              const sampleFormatted = formatDate(today, option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setDateFormat(option.id);
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{option.id}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {option.region}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      Preview: {sampleFormatted}
                    </p>
                  </div>
                  {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
