import { api } from './api';
import { Booking, Service, Payout, Tenant, TenantPhoto, OperatingHour, Paginated, BookingStatus } from '@/types';

// ---------- Tenant dashboard ----------
export interface DashboardData {
  tenant: Tenant;
  stats: {
    bookings_today: number;
    earnings_today: number;
    pending_payout: number;
    total_bookings: number;
    rating: number;
    total_reviews: number;
  };
  next_booking: Booking | null;
  recent_bookings: Booking[];
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/tenants/dashboard');
  return data;
}

export type MyTenant = Tenant & {
  photos: TenantPhoto[];
  services: Service[];
  operating_hours: OperatingHour[];
};

export async function getMyTenant(): Promise<MyTenant> {
  const { data } = await api.get<MyTenant>('/tenants/me');
  return data;
}

export async function updateMyTenant(patch: Partial<Tenant>): Promise<Tenant> {
  const { data } = await api.put<{ tenant: Tenant }>('/tenants/profile', patch);
  return data.tenant;
}

export async function updateHours(hours: Omit<OperatingHour, 'id' | 'tenant_id'>[]): Promise<OperatingHour[]> {
  const { data } = await api.put<{ operating_hours: OperatingHour[] }>('/tenants/hours', { hours });
  return data.operating_hours;
}

// ---------- Bookings (tenant view) ----------
export async function getTenantBookings(params: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}): Promise<Paginated<Booking>> {
  const { data } = await api.get<Paginated<Booking>>('/bookings/tenant/all', { params });
  return data;
}

export async function transitionBooking(id: string, action: 'confirm' | 'start' | 'complete'): Promise<Booking> {
  const { data } = await api.put<{ booking: Booking }>(`/bookings/${id}/${action}`);
  return data.booking;
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  const { data } = await api.post<{ booking: Booking }>(`/bookings/${id}/cancel`, { reason });
  return data.booking;
}

export async function uploadBookingPhotos(
  id: string,
  photos: { before_photo_url?: string; after_photo_url?: string }
): Promise<Booking> {
  const { data } = await api.post<{ booking: Booking }>(`/bookings/${id}/photos`, photos);
  return data.booking;
}

// ---------- Services ----------
export async function createService(payload: Partial<Service>): Promise<Service> {
  const { data } = await api.post<{ service: Service }>('/services', payload);
  return data.service;
}

export async function updateService(id: string, payload: Partial<Service>): Promise<Service> {
  const { data } = await api.put<{ service: Service }>(`/services/${id}`, payload);
  return data.service;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

export async function reorderService(id: string, sort_order: number): Promise<void> {
  await api.put(`/services/${id}/reorder`, { sort_order });
}

// ---------- Slots ----------
export async function generateSlots(days: number, capacity: number, regenerate = false): Promise<number> {
  const { data } = await api.post<{ generated: number }>('/slots/generate', { days, capacity, regenerate });
  return data.generated;
}

export async function blockSlot(id: string): Promise<void> {
  await api.put(`/slots/${id}/block`);
}

export async function unblockSlot(id: string): Promise<void> {
  await api.put(`/slots/${id}/unblock`);
}

// ---------- Payouts ----------
export interface PayoutSummary {
  pending_amount: number;
  gross_earnings: number;
  total_commission: number;
  commission_rate: number;
  completed_count: number;
  history: Payout[];
}

export async function getPayouts(): Promise<PayoutSummary> {
  const { data } = await api.get<PayoutSummary>('/tenants/payouts');
  return data;
}
