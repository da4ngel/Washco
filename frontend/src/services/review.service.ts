import { api } from './api';
import { Review } from '@/types';

export async function createReview(payload: {
  booking_id: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const { data } = await api.post<{ review: Review }>('/reviews', payload);
  return data.review;
}

export async function updateReview(id: string, payload: { rating?: number; comment?: string }): Promise<Review> {
  const { data } = await api.put<{ review: Review }>(`/reviews/${id}`, payload);
  return data.review;
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/reviews/${id}`);
}

export async function replyToReview(id: string, tenant_reply: string): Promise<Review> {
  const { data } = await api.put<{ review: Review }>(`/reviews/${id}/reply`, { tenant_reply });
  return data.review;
}
