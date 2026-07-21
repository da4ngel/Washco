import { api } from './api';
import { supabase } from '@/lib/supabase';
import { RegisterForm, TenantRegisterForm } from '@/schemas/auth.schema';

/** Registers a customer via the backend, then signs them in client-side. */
export async function registerCustomer(form: RegisterForm): Promise<void> {
  await api.post('/auth/register', {
    full_name: form.full_name,
    email: form.email,
    password: form.password,
    phone: form.phone,
  });
  const { error } = await supabase.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  });
  if (error) throw error;
}

/** Registers a tenant owner + business. Returns without auto-login (pending approval). */
export async function registerTenant(form: TenantRegisterForm): Promise<void> {
  await api.post('/auth/register/tenant', {
    full_name: form.full_name,
    email: form.email,
    password: form.password,
    phone: form.phone,
    business_name: form.business_name,
    description: form.description || undefined,
    address: form.address,
    city: form.city,
    district: form.district || undefined,
    business_phone: form.business_phone,
    business_email: form.business_email || undefined,
  });
}

/** Sends a password reset email. */
export async function sendPasswordReset(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}
