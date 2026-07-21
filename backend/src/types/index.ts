import { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'tenant' | 'admin';
export type TenantStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string | null;
  status: TenantStatus;
  commission_rate: number;
  cancellation_policy: string;
  rating: number;
  total_reviews: number;
  total_bookings: number;
  is_featured: boolean;
  featured_until: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TenantPhoto {
  id: string;
  tenant_id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OperatingHour {
  id: string;
  tenant_id: string;
  day_of_week: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface TimeSlot {
  id: string;
  tenant_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_blocked: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_ref: string;
  user_id: string;
  tenant_id: string;
  service_id: string;
  slot_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  service_price: number;
  platform_fee: number;
  tenant_payout: number;
  before_photo_url: string | null;
  after_photo_url: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  user_notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined relations (populated by getBookingWithRelations / list queries)
  tenant?: Tenant;
  service?: Service;
  slot?: TimeSlot;
  user?: Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  tenant_id: string;
  rating: number;
  comment: string | null;
  tenant_reply: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Payout {
  id: string;
  tenant_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: string;
  payment_reference: string | null;
  booking_count: number;
  created_at: string;
  processed_at: string | null;
}

export interface WashPass {
  id: string;
  user_id: string;
  plan_name: string;
  total_washes: number;
  used_washes: number;
  amount_paid: number;
  valid_from: string;
  valid_until: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  created_at: string;
}

/** The authenticated user attached to req by the authenticate middleware. */
export interface AuthUser extends User {
  profile: Profile;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
