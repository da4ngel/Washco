import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Building2, UserRound } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { tenantRegisterSchema, TenantRegisterForm } from '@/schemas/auth.schema';
import { registerTenant } from '@/services/auth.service';
import { getApiErrorMessage } from '@/services/api';

export function TenantRegisterPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TenantRegisterForm>({
    resolver: zodResolver(tenantRegisterSchema),
    defaultValues: { city: 'Colombo' },
  });

  const onSubmit = async (values: TenantRegisterForm) => {
    setSubmitting(true);
    try {
      await registerTenant(values);
      toast.success('Business registered! Our team will review it shortly.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not register your business.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="List your car wash"
      subtitle="Reach more customers and manage bookings in one place"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <UserRound className="h-4 w-4" /> Owner details
          </div>
          <div className="space-y-4">
            <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
              <Input id="full_name" placeholder="Nimal Perera" {...register('full_name')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" type="tel" placeholder="+94 77 123 4567" {...register('phone')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" htmlFor="password" error={errors.password?.message}>
                <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              </Field>
              <Field label="Confirm password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
                <Input id="confirm_password" type="password" autoComplete="new-password" {...register('confirm_password')} />
              </Field>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Building2 className="h-4 w-4" /> Business details
          </div>
          <div className="space-y-4">
            <Field label="Business name" htmlFor="business_name" error={errors.business_name?.message}>
              <Input id="business_name" placeholder="Speedy Wash Colombo 3" {...register('business_name')} />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description?.message}>
              <Textarea id="description" rows={3} placeholder="Tell customers what makes your wash great…" {...register('description')} />
            </Field>
            <Field label="Address" htmlFor="address" error={errors.address?.message}>
              <Input id="address" placeholder="45 Duplication Road, Colombo 3" {...register('address')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city" error={errors.city?.message}>
                <Input id="city" {...register('city')} />
              </Field>
              <Field label="District" htmlFor="district" error={errors.district?.message}>
                <Input id="district" placeholder="Colombo 3" {...register('district')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business phone" htmlFor="business_phone" error={errors.business_phone?.message}>
                <Input id="business_phone" type="tel" placeholder="+94 11 234 5601" {...register('business_phone')} />
              </Field>
              <Field label="Business email" htmlFor="business_email" error={errors.business_email?.message}>
                <Input id="business_email" type="email" placeholder="hello@yourwash.lk" {...register('business_email')} />
              </Field>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Register business
        </Button>
      </form>
    </AuthLayout>
  );
}
