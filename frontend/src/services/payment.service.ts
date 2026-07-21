import { api } from './api';
import { Booking } from '@/types';

export interface CreateIntentResponse {
  client_secret: string;
  amount: number;
  currency: string;
}

export async function createPaymentIntent(bookingId: string): Promise<CreateIntentResponse> {
  const { data } = await api.post<CreateIntentResponse>('/payments/create-intent', { booking_id: bookingId });
  return data;
}

export async function confirmPayment(bookingId: string, paymentIntentId: string): Promise<Booking> {
  const { data } = await api.post<{ booking: Booking }>('/payments/confirm', {
    booking_id: bookingId,
    payment_intent_id: paymentIntentId,
  });
  return data.booking;
}
