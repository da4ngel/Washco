import axios, { AxiosError, AxiosInstance } from 'axios';
import { supabase } from '@/lib/supabase';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/** Shared Axios instance for the WashCo Express API. */
export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the current Supabase access token to every request.
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export interface ApiError {
  error: string;
  details?: unknown;
}

/** Normalises an Axios error into a human-readable message. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiError>;
    return axiosErr.response?.data?.error ?? axiosErr.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
