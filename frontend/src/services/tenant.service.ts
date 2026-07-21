import { api } from './api';
import { Tenant, Service, TimeSlot, Review, Paginated } from '@/types';

export interface TenantSearchParams {
  q?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  min_rating?: number;
  max_price?: number;
  available_today?: boolean;
  sort?: 'rating' | 'distance' | 'newest';
  page?: number;
  limit?: number;
}

export type TenantSearchResult = Tenant & {
  photos?: { url: string; is_primary: boolean }[];
  starting_price?: number | null;
  distance_km?: number;
};

export async function searchTenants(params: TenantSearchParams): Promise<Paginated<TenantSearchResult>> {
  const { data } = await api.get<Paginated<TenantSearchResult>>('/tenants', { params });
  return data;
}

export type TenantDetail = Tenant & {
  photos: { id: string; url: string; caption: string | null; is_primary: boolean; sort_order: number }[];
  services: Service[];
  operating_hours: { day_of_week: string; open_time: string; close_time: string; is_closed: boolean }[];
  recent_reviews: Review[];
};

export async function getTenant(idOrSlug: string): Promise<TenantDetail> {
  const { data } = await api.get<TenantDetail>(`/tenants/${idOrSlug}`);
  return data;
}

export async function getTenantAvailability(
  idOrSlug: string,
  from: string,
  to?: string
): Promise<TimeSlot[]> {
  const { data } = await api.get<{ data: TimeSlot[] }>(`/tenants/${idOrSlug}/availability`, {
    params: { from, to },
  });
  return data.data;
}

export interface ReviewsResponse {
  data: Review[];
  breakdown: Record<number, number>;
  average: number;
  total: number;
  page: number;
  totalPages: number;
}

export async function getTenantReviews(idOrSlug: string, page = 1): Promise<ReviewsResponse> {
  const { data } = await api.get<ReviewsResponse>(`/tenants/${idOrSlug}/reviews`, { params: { page } });
  return data;
}
