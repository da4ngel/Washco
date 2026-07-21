import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoogleAuthButton, AuthDivider } from '@/components/auth/GoogleAuthButton';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, LoginForm } from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/services/api';
import { sendPhoneOtp, verifyPhoneOtp } from '@/services/auth.service';
import { destinationFor } from '@/lib/auth-routing';
import { Profile } from '@/types';

const E164 = /^\+[1-9]\d{6,14}$/;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  const goToDestination = (profile: Profile) => {
    const redirect = params.get('redirect');
    navigate(redirect || destinationFor(profile), { replace: true });
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back to WashCo"
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <GoogleAuthButton />
      <AuthDivider />

      <Tabs value={method} onValueChange={(v) => setMethod(v as 'email' | 'phone')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <EmailLoginForm login={login} onSuccess={goToDestination} />
        </TabsContent>

        <TabsContent value="phone">
          <PhoneLoginForm onSuccess={goToDestination} />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}

/** Email + password sign-in. */
function EmailLoginForm({
  login,
  onSuccess,
}: {
  login: (email: string, password: string) => Promise<Profile>;
  onSuccess: (profile: Profile) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setSubmitting(true);
    try {
      const profile = await login(values.email, values.password);
      toast.success(`Welcome back, ${profile.full_name.split(' ')[0]}!`);
      onSuccess(profile);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
      </Field>
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Log in
      </Button>
    </form>
  );
}

/** Phone OTP sign-in: request a code, then verify it. */
function PhoneLoginForm({ onSuccess }: { onSuccess: (profile: Profile) => void }) {
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async () => {
    if (!E164.test(phone)) {
      toast.error('Enter your number in international format, e.g. +94771234567');
      return;
    }
    setBusy(true);
    try {
      await sendPhoneOtp(phone);
      toast.success('We sent you a code by SMS.');
      setStep('code');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not send the code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneOtp(phone, code);
      await refreshProfile();
      const profile = useAuthStore.getState().profile;
      if (!profile) throw new Error('Could not load your profile.');
      toast.success(`Welcome back, ${profile.full_name.split(' ')[0]}!`);
      onSuccess(profile);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'phone') {
    return (
      <div className="space-y-4">
        <Field label="Phone number" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+94771234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value.trim())}
          />
        </Field>
        <Button type="button" className="w-full" onClick={requestCode} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Send code
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label={`Enter the code sent to ${phone}`} htmlFor="otp">
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </Field>
      <Button type="button" className="w-full" onClick={verify} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify & log in
      </Button>
      <button
        type="button"
        className="w-full text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setStep('phone')}
        disabled={busy}
      >
        Use a different number
      </button>
    </div>
  );
}
