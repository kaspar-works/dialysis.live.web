import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// Get git info at build time
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim().split('\n')[0];
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const commitDate = execSync('git log -1 --format=%ci').toString().trim();
    return { commitHash, commitMessage, branch, commitDate };
  } catch {
    return {
      commitHash: 'unknown',
      commitMessage: 'unknown',
      branch: 'unknown',
      commitDate: 'unknown',
    };
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const gitInfo = getGitInfo();
  const buildTimestamp = new Date().toISOString();

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
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
      __GIT_COMMIT_HASH__: JSON.stringify(gitInfo.commitHash),
      __GIT_COMMIT_MESSAGE__: JSON.stringify(gitInfo.commitMessage),
      __GIT_BRANCH__: JSON.stringify(gitInfo.branch),
      __GIT_COMMIT_DATE__: JSON.stringify(gitInfo.commitDate),
      __BUILD_MODE__: JSON.stringify(mode),
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
