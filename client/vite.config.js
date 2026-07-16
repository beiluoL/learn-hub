import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 静态站点：base 设为 './'，使构建产物使用相对路径
export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
});
