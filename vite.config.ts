import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true, // 添加这个配置，如果端口被占用则直接报错而不是切换端口
  },
  publicDir: 'public',
  // 添加优化配置
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  },
  css: {
    postcss: './postcss.config.js'
  }
});