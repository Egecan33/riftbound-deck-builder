import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // Slow CI runners (Intel macOS) need more than the 5 s default for the whole-deck rating tests.
    testTimeout: 30000,
    // Bans count from their effective date; pin "today" so results do not change with the calendar.
    env: { FORGE_TODAY: '2026-11-13' },
    include: ['tests/engine/**/*.test.ts', 'tests/server/**/*.test.ts', 'tests/ingest/**/*.test.ts'],
  },
});
