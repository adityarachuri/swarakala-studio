import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'shared/**/*.ts',
        'src/engine/**/*.ts',
        'src/db/**/*.ts',
        'src/i18n/**/*.ts',
        'src/data/**/*.ts',
        'worker/**/*.ts',
      ],
      exclude: ['**/*.d.ts'],
    },
  },
});
