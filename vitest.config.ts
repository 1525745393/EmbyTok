import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['components/**', 'src/**', 'utils/**', 'services/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**', '**/dist/**'],
    },
  },
});
