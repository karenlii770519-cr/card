
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/card/', // 這裡必須對應你的 GitHub Repo 名稱
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
});
