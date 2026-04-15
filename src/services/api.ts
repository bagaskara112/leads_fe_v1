import axios, { AxiosError } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

/**
 * Map of raw backend messages → user-friendly Indonesian messages.
 * Keys are checked with `includes` (case-insensitive) against the raw error.
 */
const ERROR_MAP: Array<[pattern: string, friendly: string]> = [
    ['invalid credentials', 'Email atau password salah'],
    ['invalid email or password', 'Email atau password salah'],
    ['wrong password', 'Password salah, silakan coba lagi'],
    ['user not found', 'Akun tidak ditemukan, periksa email Anda'],
    ['email not found', 'Email tidak terdaftar'],
    ['not found', 'Data tidak ditemukan'],
    ['unauthorized', 'Sesi telah berakhir, silakan login kembali'],
    ['forbidden', 'Anda tidak memiliki akses'],
    ['object of type response is not json serializable', 'Terjadi kesalahan server, silakan coba lagi'],
    ['internal server error', 'Terjadi kesalahan server, silakan coba lagi'],
    ['network error', 'Koneksi gagal, periksa internet Anda'],
    ['timeout', 'Koneksi timeout, silakan coba lagi'],
];

function toFriendlyMessage(raw: string, fallback: string): string {
    const lower = raw.toLowerCase();
    for (const [pattern, friendly] of ERROR_MAP) {
        if (lower.includes(pattern)) return friendly;
    }
    // If the message looks like a technical / non-user-friendly string, use fallback
    if (lower.includes('type') && lower.includes('serializable')) return fallback;
    return raw;
}

export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan'): string {
    if (error instanceof AxiosError) {
        // Network / timeout errors (no response from server)
        if (!error.response) {
            if (error.code === 'ERR_NETWORK') return 'Koneksi gagal, periksa internet Anda';
            if (error.code === 'ECONNABORTED') return 'Koneksi timeout, silakan coba lagi';
            return fallback;
        }

        const status = error.response.status;
        const data = error.response.data as Record<string, unknown> | undefined;
        const raw = data?.message ?? data?.error ?? data?.detail;

        // If we got a string message from the API, map it
        if (typeof raw === 'string' && raw.trim()) {
            return toFriendlyMessage(raw, fallback);
        }

        // Fallback by HTTP status code
        if (status === 401) return 'Email atau password salah';
        if (status === 403) return 'Anda tidak memiliki akses';
        if (status === 404) return 'Data tidak ditemukan';
        if (status === 422) return 'Data yang dikirim tidak valid';
        if (status >= 500) return 'Terjadi kesalahan server, silakan coba lagi';

        return fallback;
    }
    if (error instanceof Error) return toFriendlyMessage(error.message, fallback);
    return fallback;
}

export function unwrapArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data) {
        const nested = (data as Record<string, unknown>).data;
        if (Array.isArray(nested)) return nested as T[];
    }
    return [];
}

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
