import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 静态站点：base 设为 './'，使构建产物使用相对路径，
// 可部署到 GitHub Pages 的任意子路径（如 https://user.github.io/repo/）而无需额外配置。
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
});
