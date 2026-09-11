import axios from 'axios';
import { toast } from 'sonner';
import { API_ROOT } from './config';

// Keep runtime target configurable via env; fallback to same-origin /api when env is not set.
const api = axios.create({
    baseURL: API_ROOT ? API_ROOT : '/xformwms/api',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('wms_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        toast.error(error.message || 'Request configuration error');
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip toast notification if requested explicitly by caller
        if (!error.config?.skipToast) {
            let errorMsg = 'An unexpected error occurred';
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 401) {
                    errorMsg = 'Session expired. Please log in again.';
                    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                        window.location.href = '/login';
                    }
                } else if (status === 403) {
                    errorMsg = 'Access denied. You do not have permission to perform this action.';
                } else if (data) {
                    if (typeof data === 'string') {
                        errorMsg = data;
                    } else if (data.message) {
                        errorMsg = data.message;
                    } else if (data.detail) {
                        errorMsg = data.detail;
                    } else if (data.error) {
                        errorMsg = data.error;
                    } else {
                        errorMsg = `Server error (${status})`;
                    }
                } else {
                    errorMsg = `Server error (${status})`;
                }
            } else if (error.request) {
                errorMsg = 'Network error. Please check your internet connection or backend server.';
            } else if (error.message) {
                errorMsg = error.message;
            }

            toast.error(errorMsg);
        }

        return Promise.reject(error);
    }
);

export default api;
