import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

/**
 * Inserts a notification row. Realtime subscribers on the notifications table
 * pick this up and surface it in the UI. Best-effort: logs but never throws.
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
};
