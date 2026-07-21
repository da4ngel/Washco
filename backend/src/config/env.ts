import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env first, then fall back to the repo-root .env.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

/**
 * Reads a required environment variable. In development we allow missing
 * values (returning an empty string) so the server can still boot with
 * placeholder credentials; in production a missing value throws.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return '';
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  // Comma-separated list of allowed origins. Defaults cover the Vite dev
  // server (5173) and the `vite preview` server (4173) for local development.
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  // Stripe and SMTP are optional: the app runs in placeholder mode without them
  // (guarded at call sites via isConfigured), so a missing value must not crash
  // the server on boot — even in production.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',

  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'WashCo <no-reply@washco.lk>',

  jwtSecret: process.env.JWT_SECRET ?? '',
} as const;

export const isProduction = env.nodeEnv === 'production';
export const isConfigured = {
  supabase: Boolean(env.supabaseUrl && env.supabaseServiceRoleKey),
  stripe: Boolean(env.stripeSecretKey),
  email: Boolean(env.smtpHost && env.smtpUser),
};
