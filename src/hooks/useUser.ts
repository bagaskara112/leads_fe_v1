import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { User } from '../types';

export function useUser() {
    return useQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const { data } = await api.get('/auth/me');
            return data.data ?? data;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}
