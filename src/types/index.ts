export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    fullname: string;
    username: string;
    email: string;
    password: string;
    role: string;
}

export interface AuthResponse {
    data: {
        access_token: string;
        refresh_token: string;
        email: string;
        fullname: string;
        role: string;
        user_id: string;
    };
    message: string;
    status: string;
}

export interface User {
    id: string;
    user_id?: string;
    fullname: string;
    full_name?: string;
    email: string;
    username?: string;
    role: 'admin' | 'user';
    created_at?: string;
}

export interface GooglePlaceResult {
    business_status?: string;
    formatted_address?: string;
    geometry?: {
        location?: { lat: number; lng: number };
    };
    name?: string;
    opening_hours?: { open_now?: boolean };
    place_id?: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
}

export interface RawResponse {
    id: string;
    parent_id?: string | null;
    user_id?: string;
    prompt: string;
    response?: {
        results?: GooglePlaceResult[];
        status?: string;
        next_page_token?: string;
        html_attributions?: unknown[];
    };
    created_at?: string;
    updated_at?: string;
    created_by?: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
}

export interface SearchHistory {
    uuid: string;
    prompt: string;
    total_results?: number;
    created_at: string;
}

export interface CleanLead {
    id: string;
    uuid?: string;
    response_id?: string;
    place_id?: string;
    place_name?: string;
    name?: string;
    format_address?: { formatted_address?: string };
    address?: string;
    rating?: string;
    user_rating_total?: number;
    total_reviews?: number;
    formatted_phone_number?: { formatted_phone_number?: string | null };
    phone?: string;
    website?: string;
    categorical?: string;
    types?: string;
    industry_type?: string;
    business_status?: string;
    geometry?: {
        location?: { lat: number; lng: number };
    };
    latitude?: number;
    longitude?: number;
    is_wa_active?: string;
    is_propose?: string;
    description?: string;
    user_id?: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    deleted_at?: string;
    deleted_by?: string;
    other_data?: {
        wa_link?: string | null;
        phone_normalized?: string | null;
        url?: string | null;
        website?: string | null;
    };
}

export interface UpdateLeadPayload {
    is_wa_active?: string;
    is_propose?: string;
    description?: string;
}

export interface StatsData {
    total_leads: number;
    total_searches: number;
    total_users: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}
