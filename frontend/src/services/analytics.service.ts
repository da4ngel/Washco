import { api } from './api';

export interface TenantAnalytics {
  totals: {
    total_bookings: number;
    completed: number;
    cancelled: number;
    completion_rate: number;
    cancellation_rate: number;
    repeat_rate: number;
  };
  revenue_series: { date: string; amount: number }[];
  top_service: { name: string; count: number } | null;
  busiest_days: { day: string; count: number }[];
  rating: number;
  total_reviews: number;
}

export async function getTenantAnalytics(): Promise<TenantAnalytics> {
  const { data } = await api.get<TenantAnalytics>('/tenants/analytics');
  return data;
}
