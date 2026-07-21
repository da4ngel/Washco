import './types'; // register Express Request augmentation
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { env } from './config/env';
import { logger, morganStream } from './config/logger';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import { paymentWebhookHandler } from './controllers/payment.controller';

const app = express();

// Trust the first proxy (needed for correct client IPs behind a reverse proxy / rate limiting).
app.set('trust proxy', 1);

// --- Security headers ---
app.use(helmet());

// --- CORS ---
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);

// --- Stripe webhook needs the RAW body — mount BEFORE the JSON parser ---
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentWebhookHandler);

// --- Body parsing (all other routes) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- HTTP request logging ---
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', { stream: morganStream }));

// --- Rate limiting ---
app.use('/api/auth/', authLimiter);
app.use('/api/', generalLimiter);

// --- Routes ---
app.use('/api', apiRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(`WashCo API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown
const shutdown = (signal: string): void => {
  logger.info(`${signal} received — shutting down.`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
