import { create } from 'zustand';
import { Tenant, Service, TimeSlot } from '@/types';

interface BookingState {
  selectedTenant: Tenant | null;
  selectedService: Service | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  userNotes: string;

  setTenant: (tenant: Tenant | null) => void;
  setService: (service: Service | null) => void;
  setDate: (date: string | null) => void;
  setSlot: (slot: TimeSlot | null) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

/** Holds the in-progress booking across the multi-step BookingPage flow. */
export const useBookingStore = create<BookingState>((set) => ({
  selectedTenant: null,
  selectedService: null,
  selectedDate: null,
  selectedSlot: null,
  userNotes: '',

  setTenant: (tenant) => set({ selectedTenant: tenant }),
  // Changing the service invalidates the chosen slot (durations differ).
  setService: (service) => set({ selectedService: service, selectedSlot: null }),
  setDate: (date) => set({ selectedDate: date, selectedSlot: null }),
  setSlot: (slot) => set({ selectedSlot: slot }),
  setNotes: (notes) => set({ userNotes: notes }),
  reset: () =>
    set({
      selectedTenant: null,
      selectedService: null,
      selectedDate: null,
      selectedSlot: null,
      userNotes: '',
    }),
}));
