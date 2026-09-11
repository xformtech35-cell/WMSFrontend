import api from "@/lib/api";
import { toast } from "sonner";

/**
 * Common API Request utility function used across components.
 * Automatically delegates to central axios instance (`api`) which handles
 * authentication tokens, global error handling, and top-right error toasts.
 */
export const apiRequest = async (endpoint, method = "GET", data = null, customConfig = {}) => {
  const { showSuccessToast = false, successMessage, ...config } = customConfig || {};

  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
      ...config,
    });

    const result = response.data;
    if (result && result.success === false) {
      throw new Error(
        result?.message || `API request failed with status ${response.status}`
      );
    }

    if (showSuccessToast) {
      const upperMethod = String(method).toUpperCase();
      let defaultMsg = "Operation completed successfully.";
      if (upperMethod === "POST") defaultMsg = "Created successfully.";
      else if (upperMethod === "PUT" || upperMethod === "PATCH") defaultMsg = "Updated successfully.";
      else if (upperMethod === "DELETE") defaultMsg = "Deleted successfully.";

      toast.success(successMessage || defaultMsg);
    }

    return result?.data !== undefined ? result.data : result;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

export const CREATE = async (endpoint, data, config) => {
  return apiRequest(endpoint, "POST", data, config);
};

export const update = async (endpoint, data, config) => {
  return apiRequest(endpoint, "PUT", data, config);
};

export const GET = async (endpoint, config) => {
  return apiRequest(endpoint, "GET", null, config);
};

export const POST = async (endpoint, data, config) => {
  return apiRequest(endpoint, "POST", data, config);
};

export const PUT = async (endpoint, data, config) => {
  return apiRequest(endpoint, "PUT", data, config);
};

export const PATCH = async (endpoint, data, config) => {
  return apiRequest(endpoint, "PATCH", data, config);
};

export const DELETE = async (endpoint, config) => {
  return apiRequest(endpoint, "DELETE", null, config);
};

export default apiRequest;