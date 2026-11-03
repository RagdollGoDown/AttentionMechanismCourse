import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Tutor model comparison (npm run compare): real API calls, so never part of `npm test`.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('..', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['eval/**/*.eval.ts'],
    env: loadEnv('', fileURLToPath(new URL('..', import.meta.url)), ''),
    testTimeout: 60 * 60_000,
  },
});
