import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Business-logic units run without a live Supabase/Stripe connection.
    globals: false,
  },
});
