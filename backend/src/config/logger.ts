import winston from 'winston';
import { env, isProduction } from './env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} ${level}: ${stack ?? message}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'washco-api' },
  transports: [new winston.transports.Console()],
});

// Morgan writes HTTP logs through Winston so we keep a single log stream.
export const morganStream = {
  write: (message: string): void => {
    logger.http?.(message.trim()) ?? logger.info(message.trim());
  },
};

if (!env.supabaseUrl) {
  logger.warn('SUPABASE_URL is not set — running with placeholder credentials. Live data calls will fail until configured.');
}
