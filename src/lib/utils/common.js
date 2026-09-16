import { format as dateFnsFormat, parseISO, isValid } from "date-fns";

const DATE_FORMAT_PATTERNS = {
  "YYYY-MM-DD": "yyyy-MM-dd",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
  "DD.MM.YYYY": "dd.MM.yyyy",
  "DD-MM-YYYY": "dd-MM-yyyy",
  "YYYY/MM/DD": "yyyy/MM/dd",
  "MMM DD, YYYY": "MMM dd, yyyy",
  "DD MMM YYYY": "dd MMM yyyy",
  "MMMM DD, YYYY": "MMMM dd, yyyy",
  "DD MMMM YYYY": "dd MMMM yyyy",
  "ddd, MMM DD, YYYY": "EEE, MMM dd, yyyy",
};

export const formatDate = (dateInput, overrideFormat = null, includeTime = false) => {
  if (!dateInput) return "N/A";

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

  let selectedFormatId = overrideFormat;
  if (!selectedFormatId && typeof window !== "undefined") {
    try {
      selectedFormatId = localStorage.getItem("wms_date_format");
    } catch (e) {
      // ignore
    }
  }

  if (!selectedFormatId || !DATE_FORMAT_PATTERNS[selectedFormatId]) {
    selectedFormatId = "YYYY-MM-DD";
  }

  let pattern = DATE_FORMAT_PATTERNS[selectedFormatId] || "yyyy-MM-dd";
  if (includeTime) {
    pattern = `${pattern} HH:mm`;
  }

  try {
    return dateFnsFormat(dateObj, pattern);
  } catch (err) {
    return String(dateInput);
  }
};

export const formatDateTime = (dateString) => {
  return formatDate(dateString, null, true);
};

export const formatCurrency = (amount, overrideCurrency = null, customOptions = {}) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "N/A";
  }

  const numAmount = Number(amount);
  let currencyCode = overrideCurrency;
  let currencyDisplay = customOptions.currencyDisplay || "symbol";

  if (!currencyCode && typeof window !== "undefined") {
    try {
      currencyCode = localStorage.getItem("wms_currency_code");
      const savedDisplay = localStorage.getItem("wms_currency_display");
      if (savedDisplay) currencyDisplay = savedDisplay;
    } catch (e) {
      // ignore
    }
  }

  if (!currencyCode) {
    currencyCode = "USD";
  }

  try {
    const formatter = new Intl.NumberFormat(customOptions.locale || "en-US", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: currencyDisplay,
      minimumFractionDigits: customOptions.minimumFractionDigits ?? (["JPY", "KRW", "VND"].includes(currencyCode) ? 0 : 2),
      maximumFractionDigits: customOptions.maximumFractionDigits ?? (["JPY", "KRW", "VND"].includes(currencyCode) ? 0 : 2),
    });
    return formatter.format(numAmount);
  } catch (err) {
    return `${currencyCode} ${numAmount.toFixed(2)}`;
  }
};