"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { format as dateFnsFormat, parseISO, isValid } from "date-fns";

export const DATE_FORMAT_OPTIONS = [
  { id: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)", pattern: "yyyy-MM-dd", region: "International" },
  { id: "DD/MM/YYYY", label: "DD/MM/YYYY", pattern: "dd/MM/yyyy", region: "UK, EU, Asia, LatAm" },
  { id: "MM/DD/YYYY", label: "MM/DD/YYYY", pattern: "MM/dd/yyyy", region: "US, Canada" },
  { id: "DD.MM.YYYY", label: "DD.MM.YYYY", pattern: "dd.MM.yyyy", region: "Germany, EU East" },
  { id: "DD-MM-YYYY", label: "DD-MM-YYYY", pattern: "dd-MM-yyyy", region: "India, South America" },
  { id: "YYYY/MM/DD", label: "YYYY/MM/DD", pattern: "yyyy/MM/dd", region: "Japan, China, Korea" },
  { id: "MMM DD, YYYY", label: "MMM DD, YYYY", pattern: "MMM dd, yyyy", region: "Short Month US" },
  { id: "DD MMM YYYY", label: "DD MMM YYYY", pattern: "dd MMM yyyy", region: "Short Month Intl" },
  { id: "MMMM DD, YYYY", label: "MMMM DD, YYYY", pattern: "MMMM dd, yyyy", region: "Full Month US" },
  { id: "DD MMMM YYYY", label: "DD MMMM YYYY", pattern: "dd MMMM yyyy", region: "Full Month Intl" },
  { id: "ddd, MMM DD, YYYY", label: "Day, MMM DD, YYYY", pattern: "EEE, MMM dd, yyyy", region: "Detailed" },
];

const DEFAULT_FORMAT_ID = "YYYY-MM-DD";
const STORAGE_KEY = "wms_date_format";

const DateFormatContext = createContext({
  dateFormat: DEFAULT_FORMAT_ID,
  setDateFormat: () => {},
  formatDate: () => "",
  options: DATE_FORMAT_OPTIONS,
});

export function DateFormatProvider({ children }) {
  const [dateFormat, setDateFormatState] = useState(DEFAULT_FORMAT_ID);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedFormat = localStorage.getItem(STORAGE_KEY);
      if (savedFormat && DATE_FORMAT_OPTIONS.some((opt) => opt.id === savedFormat)) {
        setDateFormatState(savedFormat);
      }
    } catch (e) {
      console.error("Error reading date format from localStorage:", e);
    }
  }, []);

  const setDateFormat = (newFormat) => {
    setDateFormatState(newFormat);
    try {
      localStorage.setItem(STORAGE_KEY, newFormat);
    } catch (e) {
      console.error("Error saving date format to localStorage:", e);
    }
  };

  const formatDate = (dateInput, overrideFormat = null, includeTime = false) => {
    if (!dateInput) return "";

    let dateObj;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === "number") {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === "string") {
      dateObj = parseISO(dateInput);
      if (!isValid(dateObj)) {
        dateObj = new Date(dateInput);
      }
    }

    if (!dateObj || !isValid(dateObj)) {
      return String(dateInput);
    }

    const selectedFormatId = overrideFormat || dateFormat;
    const option = DATE_FORMAT_OPTIONS.find((opt) => opt.id === selectedFormatId) || DATE_FORMAT_OPTIONS[0];

    let pattern = option.pattern;
    if (includeTime) {
      pattern = `${pattern} HH:mm`;
    }

    try {
      return dateFnsFormat(dateObj, pattern);
    } catch (err) {
      console.error("Error formatting date:", err);
      return String(dateInput);
    }
  };

  return (
    <DateFormatContext.Provider
      value={{
        dateFormat,
        setDateFormat,
        formatDate,
        options: DATE_FORMAT_OPTIONS,
        isMounted,
      }}
    >
      {children}
    </DateFormatContext.Provider>
  );
}

export function useDateFormat() {
  const context = useContext(DateFormatContext);
  if (!context) {
    throw new Error("useDateFormat must be used within a DateFormatProvider");
  }
  return context;
}

/**
 * Reusable component to render formatted dates anywhere in the application.
 * Usage: <FormattedDate date={item.createdAt} />
 */
export function FormattedDate({ date, format = null, includeTime = false, fallback = "-" }) {
  const { formatDate } = useDateFormat();
  if (!date) return <span>{fallback}</span>;
  const formatted = formatDate(date, format, includeTime);
  return <span>{formatted}</span>;
}
