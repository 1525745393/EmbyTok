import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './vitest.setup.ts',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/android/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'components/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}'
      ],
      exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  }
});
