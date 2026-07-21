import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  searchTenants,
  getTenant,
  getTenantReviews,
  TenantSearchParams,
} from '@/services/tenant.service';

export function useTenantSearch(params: TenantSearchParams) {
  return useQuery({
    queryKey: ['tenants', 'search', params],
    queryFn: () => searchTenants(params),
    placeholderData: keepPreviousData,
  });
}

export function useTenant(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['tenant', idOrSlug],
    queryFn: () => getTenant(idOrSlug as string),
    enabled: Boolean(idOrSlug),
  });
}

export function useTenantReviews(idOrSlug: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['tenant', idOrSlug, 'reviews', page],
    queryFn: () => getTenantReviews(idOrSlug as string, page),
    enabled: Boolean(idOrSlug),
    placeholderData: keepPreviousData,
  });
}
