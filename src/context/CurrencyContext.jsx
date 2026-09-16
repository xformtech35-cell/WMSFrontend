"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", region: "United States / Global" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", region: "European Union" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", region: "United Kingdom" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", region: "India" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", region: "Japan" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU", region: "Australia" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA", region: "Canada" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH", region: "Switzerland" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN", region: "China" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", locale: "ar-AE", region: "United Arab Emirates" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal", locale: "ar-SA", region: "Saudi Arabia" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR", region: "Brazil" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", locale: "es-MX", region: "Mexico" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG", region: "Singapore" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR", region: "South Korea" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA", region: "South Africa" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR", region: "Turkey" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", locale: "ru-RU", region: "Russia" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ", region: "New Zealand" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", locale: "zh-HK", region: "Hong Kong" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY", region: "Malaysia" },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH", region: "Thailand" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID", region: "Indonesia" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", locale: "pl-PL", region: "Poland" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE", region: "Sweden" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO", region: "Norway" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK", region: "Denmark" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", locale: "ar-EG", region: "Egypt" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG", region: "Nigeria" },
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", locale: "ur-PK", region: "Pakistan" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", locale: "bn-BD", region: "Bangladesh" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", locale: "vi-VN", region: "Vietnam" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "en-PH", region: "Philippines" },
];

const DEFAULT_CURRENCY_CODE = "USD";
const STORAGE_KEY_CODE = "wms_currency_code";
const STORAGE_KEY_DISPLAY = "wms_currency_display";

const CurrencyContext = createContext({
  currencyCode: DEFAULT_CURRENCY_CODE,
  currencyDisplay: "symbol",
  setCurrencyCode: () => {},
  setCurrencyDisplay: () => {},
  formatCurrency: () => "",
  options: CURRENCY_OPTIONS,
  isMounted: false,
});

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCodeState] = useState(DEFAULT_CURRENCY_CODE);
  const [currencyDisplay, setCurrencyDisplayState] = useState("symbol");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCode = localStorage.getItem(STORAGE_KEY_CODE);
      if (savedCode && CURRENCY_OPTIONS.some((opt) => opt.code === savedCode)) {
        setCurrencyCodeState(savedCode);
      }
      const savedDisplay = localStorage.getItem(STORAGE_KEY_DISPLAY);
      if (savedDisplay && ["symbol", "code", "narrowSymbol"].includes(savedDisplay)) {
        setCurrencyDisplayState(savedDisplay);
      }
    } catch (e) {
      console.error("Error reading currency settings from localStorage:", e);
    }
  }, []);

  const setCurrencyCode = (newCode) => {
    setCurrencyCodeState(newCode);
    try {
      localStorage.setItem(STORAGE_KEY_CODE, newCode);
    } catch (e) {
      console.error("Error saving currency code to localStorage:", e);
    }
  };

  const setCurrencyDisplay = (newDisplay) => {
    setCurrencyDisplayState(newDisplay);
    try {
      localStorage.setItem(STORAGE_KEY_DISPLAY, newDisplay);
    } catch (e) {
      console.error("Error saving currency display to localStorage:", e);
    }
  };

  const formatCurrency = (amount, overrideCode = null, customOptions = {}) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return "N/A";
    }

    const numAmount = Number(amount);
    const selectedCode = overrideCode || currencyCode;
    const option =
      CURRENCY_OPTIONS.find((opt) => opt.code === selectedCode) || CURRENCY_OPTIONS[0];

    const displayMode = customOptions.currencyDisplay || currencyDisplay || "symbol";

    try {
      const formatter = new Intl.NumberFormat(option.locale || "en-US", {
        style: "currency",
        currency: option.code,
        currencyDisplay: displayMode,
        minimumFractionDigits: customOptions.minimumFractionDigits ?? (option.code === "JPY" || option.code === "KRW" || option.code === "VND" ? 0 : 2),
        maximumFractionDigits: customOptions.maximumFractionDigits ?? (option.code === "JPY" || option.code === "KRW" || option.code === "VND" ? 0 : 2),
      });
      return formatter.format(numAmount);
    } catch (err) {
      console.error("Error formatting currency with Intl:", err);
      return `${option.symbol || "$"}${numAmount.toFixed(2)}`;
    }
  };

  const selectedOption =
    CURRENCY_OPTIONS.find((opt) => opt.code === currencyCode) || CURRENCY_OPTIONS[0];

  const currencySymbol = selectedOption.symbol || "$";

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        currencySymbol,
        currencyDisplay,
        selectedOption,
        setCurrencyCode,
        setCurrencyDisplay,
        formatCurrency,
        options: CURRENCY_OPTIONS,
        isMounted,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

export function FormattedCurrency({ value, currency, display, className = "" }) {
  const { formatCurrency, isMounted } = useCurrency();
  if (!isMounted) {
    return <span className={className}>{typeof value === "number" ? `$${value.toFixed(2)}` : value}</span>;
  }
  return <span className={className}>{formatCurrency(value, currency, { currencyDisplay: display })}</span>;
}
