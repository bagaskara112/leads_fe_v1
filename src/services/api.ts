import axios, { AxiosError } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/** Extract a displayable error message from any caught error */
export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan'): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as Record<string, unknown> | undefined;
        const raw = data?.message ?? data?.error ?? fallback;
        return typeof raw === 'string' ? raw : JSON.stringify(raw);
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

/** Unwrap API response — handles both `data[]` and `{ data: [] }` formats */
export function unwrapArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data) {
        const nested = (data as Record<string, unknown>).data;
        if (Array.isArray(nested)) return nested as T[];
    }
    return [];
}

/**
 * Get user role from JWT token stored in localStorage.
 * Decodes the JWT payload (base64) without verification.
 * Returns 'user' as default if token is missing/invalid.
 */
export function getUserRole(): 'admin' | 'user' {
    try {
        const token = localStorage.getItem('token');
        if (!token) return 'user';
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'admin' ? 'admin' : 'user';
    } catch {
        return 'user';
    }
}

export default api;
