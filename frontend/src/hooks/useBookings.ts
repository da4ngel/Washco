import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBooking, getBooking, CreateBookingPayload } from '@/services/booking.service';

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBooking(id as string),
    enabled: Boolean(id),
  });
}
