/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly GEMINI_API_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Build-time constants injected by Vite
declare const __BUILD_TIMESTAMP__: string;
declare const __GIT_COMMIT_HASH__: string;
declare const __GIT_COMMIT_MESSAGE__: string;
declare const __GIT_BRANCH__: string;
declare const __GIT_COMMIT_DATE__: string;
declare const __BUILD_MODE__: string;
