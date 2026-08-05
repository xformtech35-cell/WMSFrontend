import api from "@/lib/api";
import { toast } from "sonner";

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
      // CRUD success toast
    if (method === "POST") {
      toast.success("Created successfully.");
    } else if (method === "PUT" || method === "PATCH") {
      toast.success("Updated successfully.");
    } else if (method === "DELETE") {
      toast.success("Deleted successfully.");
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

export const CREATE = async (api, data) => {
  return apiRequest(api, "POST", data);
};

export const update = async (api, data) => {
  return apiRequest(api, "PUT", data);
};
export const GET = async (api, data) => {
  return apiRequest(api, "GET", data);
};
export const DELETE = async (api, data) => {
  return apiRequest(api, "DELETE", data);
};