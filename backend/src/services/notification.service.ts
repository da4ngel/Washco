import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { emailUser, emailTemplate } from './email.service';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  /**
   * When true, also send the notification as a transactional email (best-effort,
   * no-ops if SMTP is unconfigured). Optional `emailHtml` overrides the default
   * body-wrapped template; otherwise `body` is used.
   */
  email?: boolean;
  emailHtml?: string;
}

/**
 * Inserts a notification row. Realtime subscribers on the notifications table
 * pick this up and surface it in the UI. Best-effort: logs but never throws.
 * Optionally also emails the user (see `email`).
 */
export const createNotification = async (input: CreateNotificationInput): Promise<void> => {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    data: input.data ?? {},
  });

  if (error) {
    logger.error(`Failed to create notification for ${input.userId}: ${error.message}`);
  }

  if (input.email) {
    const html = input.emailHtml ?? emailTemplate(input.title, `<p>${input.body}</p>`);
    await emailUser(input.userId, input.title, html);
  }
};
