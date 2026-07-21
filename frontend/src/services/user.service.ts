import { api } from './api';
import { Booking, Notification, Profile, WashPass, Paginated } from '@/types';

export async function getMyBookings(params: {
  scope?: 'upcoming' | 'past' | 'all';
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Booking>> {
  const { data } = await api.get<Paginated<Booking>>('/users/bookings', { params });
  return data;
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const { data } = await api.put<{ profile: Profile }>('/users/profile', patch);
  return data.profile;
}

export interface NotificationsResponse extends Paginated<Notification> {
  unread: number;
}

export async function getNotifications(page = 1): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/users/notifications', { params: { page, limit: 20 } });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/users/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/users/notifications/read-all');
}

export async function getWashPasses(): Promise<WashPass[]> {
  const { data } = await api.get<{ data: WashPass[] }>('/users/wash-passes');
  return data.data;
}
