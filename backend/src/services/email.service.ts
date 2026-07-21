import nodemailer, { Transporter } from 'nodemailer';
import { env, isConfigured } from '../config/env';
import { logger } from '../config/logger';
import { supabaseAdmin } from '../config/supabase';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

/** Lazily builds (once) the Nodemailer transport from SMTP env vars. */
function getTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // implicit TLS on 465; STARTTLS otherwise
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

/**
 * Sends a transactional email. When SMTP is not configured (placeholder mode)
 * this no-ops with a log line — mirroring how Stripe is guarded. Best-effort:
 * it never throws, so a mail failure can't break the request that triggered it.
 */
export const sendEmail = async ({ to, subject, html }: SendEmailInput): Promise<void> => {
  if (!isConfigured.email) {
    logger.info(`[email] SMTP not configured — skipping "${subject}" to ${to}`);
    return;
  }
  try {
    await getTransport().sendMail({ from: env.emailFrom, to, subject, html });
    logger.info(`[email] sent "${subject}" to ${to}`);
  } catch (err) {
    logger.error(`[email] failed to send "${subject}" to ${to}: ${(err as Error).message}`);
  }
};

/**
 * Resolves a user's email from Supabase Auth (profiles has no email column) and
 * sends to it. No-ops quietly if the user or their email can't be found.
 */
export const emailUser = async (userId: string, subject: string, html: string): Promise<void> => {
  if (!isConfigured.email) return; // avoid an admin lookup we won't use
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  const to = data?.user?.email;
  if (error || !to) {
    logger.warn(`[email] no address for user ${userId}; skipping "${subject}"`);
    return;
  }
  await sendEmail({ to, subject, html });
};

/** Wraps body content in a minimal branded HTML shell. */
export const emailTemplate = (heading: string, bodyHtml: string): string => `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
    <div style="background: #0F2167; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">WashCo</h1>
    </div>
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
      <h2 style="margin: 0 0 12px; font-size: 18px;">${heading}</h2>
      ${bodyHtml}
      <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
        You're receiving this because you have a WashCo account.
      </p>
    </div>
  </div>
`;
