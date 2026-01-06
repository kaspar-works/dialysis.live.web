import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // API URL: Use env variable or default based on mode
  const apiUrl = env.VITE_API_URL || (mode === 'production'
    ? 'https://api.dialysis.live'
    : 'http://localhost:3000');

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api/v1': {
          target: apiUrl,
          changeOrigin: true,
          secure: mode === 'production',
          timeout: 60000,
        },
      },
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'esbuild' : false,
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
