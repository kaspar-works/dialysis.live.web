# Web Frontend — dialysis.live.web

## Tech Stack
- React 19 + React Router 7
- Vite 6 + TypeScript
- Zustand for state management
- Recharts for charts, Stripe for payments
- Inline styles (no CSS framework)

## Commands
```bash
npm run dev          # Vite dev server (port 5173), proxies /api/v1 → localhost:3000
npm run build        # Production build
npm run build:dev    # Dev build
npm run preview      # Preview production build
npm start            # Serve dist/ on port 4173 (or $PORT)
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run test:run     # Run tests once
npm run test:coverage
```

## Project Structure
**No `src/` directory** — files live at project root (intentional).

```
dialysis.live.web/
├── App.tsx              # Main routing (React Router v7)
├── index.html           # Entry point
├── index.tsx            # React render
├── store.ts             # Zustand store (auth, subscriptions, UI state)
├── constants.tsx        # Color schemes, alert categories, app constants
├── types.ts             # TypeScript interfaces
├── vite.config.ts       # Build config with git info injection
├── components/          # Reusable UI (Layout, Modals, ProtectedRoute, etc.)
├── pages/               # Page components (50+ files)
│   ├── Auth: Login, Register, ForgotPassword
│   ├── Dashboard, Features, Landing
│   ├── FluidLog, Medications, LabReports, Exercise
│   └── Admin (large complex admin panel)
├── services/            # API client layer (29 files)
│   ├── api.ts           # Base API client
│   ├── auth.ts, dialysis.ts, fluid.ts, weight.ts, etc.
│   └── export.ts, errorReporter.ts
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── config/              # Configuration
└── tests/
```

## Key Conventions

### Build Metadata
Vite injects at build time: `__BUILD_TIMESTAMP__`, `__GIT_COMMIT_HASH__`, `__GIT_BRANCH__`, `__GIT_COMMIT_DATE__`, `__BUILD_MODE__`

### API Proxy
- Dev: `/api/v1` proxied to `localhost:3000`
- Production: proxied to `https://api.dialysis.live`
- Env vars: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

### State Management
- Zustand store in `store.ts` for auth, subscription, and UI state
- Services layer abstracts all API calls

### Routing
- React Router v7 with `ProtectedRoute` and `PublicRoute` wrappers
- `PageGuard` for subscription-gated features

### Important Files
- `App.tsx` — routing structure
- `store.ts` — Zustand state
- `constants.tsx` — app constants and colors
- `services/api.ts` — base HTTP client
- `vite.config.ts` — build config, proxy, git info
