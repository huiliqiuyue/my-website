import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/my-website/' : '/',
  plugins: [react(), tailwindcss(), cloudflare()],
}));