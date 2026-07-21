import { api } from './api';
import { Booking, Profile, Tenant, Paginated } from '@/types';

export interface AdminDashboard {
  stats: {
    total_users: number;
    active_tenants: number;
    pending_tenants: number;
    bookings_today: number;
    mrr: number;
  };
  revenue_series: { date: string; amount: number }[];
  recent_bookings: (Booking & { service?: { name: string }; tenant?: { business_name: string } })[];
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get<AdminDashboard>('/admin/dashboard');
  return data;
}

export type AdminTenant = Tenant & { owner?: { full_name: string; phone: string | null } };

export async function getAdminTenants(params: { status?: string; page?: number }): Promise<Paginated<AdminTenant>> {
  const { data } = await api.get<Paginated<AdminTenant>>('/admin/tenants', { params });
  return data;
}

export async function approveTenant(id: string): Promise<Tenant> {
  const { data } = await api.put<{ tenant: Tenant }>(`/admin/tenants/${id}/approve`);
  return data.tenant;
}
export async function rejectTenant(id: string, reason?: string): Promise<Tenant> {
  const { data } = await api.put<{ tenant: Tenant }>(`/admin/tenants/${id}/reject`, { reason });
  return data.tenant;
}
export async function suspendTenant(id: string): Promise<Tenant> {
  const { data } = await api.put<{ tenant: Tenant }>(`/admin/tenants/${id}/suspend`);
  return data.tenant;
}
export async function reinstateTenant(id: string): Promise<Tenant> {
  const { data } = await api.put<{ tenant: Tenant }>(`/admin/tenants/${id}/reinstate`);
  return data.tenant;
}
export async function toggleFeatured(id: string): Promise<Tenant> {
  const { data } = await api.put<{ tenant: Tenant }>(`/admin/tenants/${id}/featured`);
  return data.tenant;
}

export async function getAdminBookings(params: { status?: string; page?: number }): Promise<Paginated<Booking>> {
  const { data } = await api.get<Paginated<Booking>>('/admin/bookings', { params });
  return data;
}

export async function getAdminUsers(params: { role?: string; page?: number }): Promise<Paginated<Profile>> {
  const { data } = await api.get<Paginated<Profile>>('/admin/users', { params });
  return data;
}

export async function toggleBanUser(id: string): Promise<Profile> {
  const { data } = await api.put<{ profile: Profile }>(`/admin/users/${id}/ban`);
  return data.profile;
}

export interface RevenueReport {
  period: string;
  total_commission: number;
  total_gmv: number;
  total_bookings: number;
  series: { bucket: string; commission: number; gmv: number; count: number }[];
}

export async function getRevenue(period: 'day' | 'week' | 'month'): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/admin/revenue', { params: { period } });
  return data;
}

export async function calculatePayouts(): Promise<number> {
  const { data } = await api.post<{ created: number }>('/admin/payouts/calculate');
  return data.created;
}
export async function processPayouts(): Promise<void> {
  await api.post('/admin/payouts/process', {});
}
