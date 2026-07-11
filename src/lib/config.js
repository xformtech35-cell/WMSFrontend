// Centralized config for API URL handling
const RAW = process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/$/, '') || '';

/**
 * API root includes the /api path. If NEXT_PUBLIC_API_URL already contains
 * /api, it's used as-is. Otherwise, '/api' is appended.
 */
export const API_ROOT = RAW ? (RAW.endsWith('/api') ? RAW : `${RAW}/api`) : '';

/**
 * Backend base URL without the /api path.
 */
export const BACKEND_BASE = RAW ? (RAW.endsWith('/api') ? RAW.replace(/\/api$/, '') : RAW) : '';

/**
 * Build a full URL for an endpoint. If the endpoint is already absolute,
 * it is returned unchanged. Otherwise it will be resolved against API_ROOT
 * (if set) or fallback to a same-origin `/api` path.
 */
export function buildApiUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  if (API_ROOT) return `${API_ROOT}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return endpoint.startsWith('/') ? `/xformwms/api${endpoint}` : `/xformwms/api/${endpoint}`;
}

export default {
  RAW,
  API_ROOT,
  BACKEND_BASE,
  buildApiUrl,
};
