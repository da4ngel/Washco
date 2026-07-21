import { api } from './api';
import { Booking } from '@/types';

export interface CreateBookingPayload {
  tenant_id: string;
  service_id: string;
  slot_id: string;
  user_notes?: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const { data } = await api.post<{ booking: Booking }>('/bookings', payload);
  return data.booking;
}

export async function getBooking(id: string): Promise<Booking> {
  const { data } = await api.get<{ booking: Booking }>(`/bookings/${id}`);
  return data.booking;
}
