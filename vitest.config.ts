import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@oss-preflight/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@oss-preflight/collectors': fileURLToPath(new URL('./packages/collectors/src/index.ts', import.meta.url)),
      '@oss-preflight/scaffold': fileURLToPath(new URL('./packages/scaffold/src/index.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'apps/web/__tests__/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.config.{js,ts}',
        '**/fixtures/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
      ],
    },
  },
});

// Made with Bob
