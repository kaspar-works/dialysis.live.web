# Dialysis.Live - Web Application

A comprehensive health tracking platform for dialysis patients to monitor their vitals, fluid intake, medications, lab results, and dialysis sessions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Domain Configuration](#domain-configuration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DigitalOcean App Platform                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │   UI – Prod     │              │   UI – Dev      │           │
│  │ dialysis.live   │              │ dev.dialysis.live│          │
│  │ Branch: main    │              │ Branch: develop │           │
│  └────────┬────────┘              └────────┬────────┘           │
│           │                                │                     │
│  ┌────────▼────────┐              ┌────────▼────────┐           │
│  │   API – Prod    │              │   API – Dev     │           │
│  │api.dialysis.live│              │api-dev.dialysis.live│       │
│  │ Branch: main    │              │ Branch: develop │           │
│  └────────┬────────┘              └────────┬────────┘           │
│           │                                │                     │
└───────────┼────────────────────────────────┼─────────────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐      ┌───────────────────────┐
│   MongoDB Atlas       │      │   MongoDB Atlas       │
│   dialysis_prod       │      │   dialysis_dev        │
└───────────────────────┘      └───────────────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐      ┌───────────────────────┐
│   Stripe Live Mode    │      │   Stripe Test Mode    │
└───────────────────────┘      └───────────────────────┘
```

### Domain Structure

| Environment | Service | Domain                        | Branch    |
|-------------|---------|-------------------------------|-----------|
| Production  | UI      | https://dialysis.live         | `main`    |
| Production  | API     | https://api.dialysis.live     | `main`    |
| Development | UI      | https://dev.dialysis.live     | `develop` |
| Development | API     | https://api-dev.dialysis.live | `develop` |

---

## Tech Stack

### Frontend (This Repository)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Charts**: Recharts
- **State Management**: React Context + Custom Hooks

### Backend (Separate Repository)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Session-based
- **Payments**: Stripe

### Infrastructure
- **Hosting**: DigitalOcean App Platform
- **Database**: MongoDB Atlas
- **Domain/DNS**: Cloudflare (recommended)

---

## Environment Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Access to:
  - DigitalOcean account
  - MongoDB Atlas account
  - Stripe account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/dialysis.live.web.git
   cd dialysis.live.web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:5173
   ```

### Available Scripts

| Command              | Description                      |
|----------------------|----------------------------------|
| `npm run dev`        | Start development server         |
| `npm run build`      | Build for production             |
| `npm run preview`    | Preview production build locally |
| `npm run lint`       | Run ESLint                       |

---

## Environment Variables

### Frontend Environment Variables

Create `.env.local` for local development:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# Environment
VITE_ENV=development

# Stripe (use test keys for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx

# Feature Flags (optional)
VITE_ENABLE_AI_FEATURES=true
```

### Environment-Specific Configuration

#### Development (dev.dialysis.live)
```env
VITE_API_URL=https://api-dev.dialysis.live/api/v1
VITE_ENV=development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
```

#### Production (dialysis.live)
```env
VITE_API_URL=https://api.dialysis.live/api/v1
VITE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
```

---

## Deployment

### Git Branching Strategy

```
main (production)
  │
  └── develop (development)
        │
        ├── feature/feature-name
        ├── fix/bug-fix-name
        └── hotfix/urgent-fix
```

### Deployment Workflow

1. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   # ... make changes ...
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   # Create PR to develop
   ```

2. **Deploy to Development**
   - Merge PR to `develop` branch
   - DigitalOcean automatically deploys to dev.dialysis.live

3. **Deploy to Production**
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   # DigitalOcean automatically deploys to dialysis.live
   ```

---

## DigitalOcean App Platform Setup

### UI - Development (`dialysis-ui-dev`)

1. **Create New App** in DigitalOcean App Platform

2. **Source Configuration**
   | Setting          | Value                        |
   |------------------|------------------------------|
   | Repository       | `your-org/dialysis.live.web` |
   | Branch           | `develop`                    |
   | Source Directory | `/`                          |
   | Auto-deploy      | Enabled                      |

3. **Build Configuration**
   | Setting          | Value           |
   |------------------|-----------------|
   | Build Command    | `npm run build` |
   | Output Directory | `dist`          |

4. **Environment Variables**
   ```
   VITE_API_URL=https://api-dev.dialysis.live/api/v1
   VITE_ENV=development
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

5. **Domain**: Add custom domain `dev.dialysis.live`

---

### UI - Production (`dialysis-ui-prod`)

1. **Create New App** in DigitalOcean App Platform

2. **Source Configuration**
   | Setting          | Value                        |
   |------------------|------------------------------|
   | Repository       | `your-org/dialysis.live.web` |
   | Branch           | `main`                       |
   | Source Directory | `/`                          |
   | Auto-deploy      | Enabled                      |

3. **Build Configuration**
   | Setting          | Value           |
   |------------------|-----------------|
   | Build Command    | `npm run build` |
   | Output Directory | `dist`          |

4. **Environment Variables**
   ```
   VITE_API_URL=https://api.dialysis.live/api/v1
   VITE_ENV=production
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   ```

5. **Domains**:
   - Add custom domain: `dialysis.live`
   - Add custom domain: `www.dialysis.live` (redirect to apex)

---

### API - Development (`dialysis-api-dev`)

1. **Create New App** in DigitalOcean App Platform

2. **Source Configuration**
   | Setting          | Value                        |
   |------------------|------------------------------|
   | Repository       | `your-org/dialysis.live.api` |
   | Branch           | `develop`                    |
   | Source Directory | `/`                          |
   | Auto-deploy      | Enabled                      |

3. **Environment Variables**
   ```
   NODE_ENV=development
   PORT=8080

   # MongoDB
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dialysis_dev

   # JWT
   JWT_SECRET=your-dev-jwt-secret
   JWT_EXPIRES_IN=7d

   # Stripe (Test Mode)
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

   # CORS
   CORS_ORIGIN=https://dev.dialysis.live

   # OpenAI (for AI features)
   OPENAI_API_KEY=sk-xxxxx
   ```

4. **Domain**: Add custom domain `api-dev.dialysis.live`

---

### API - Production (`dialysis-api-prod`)

1. **Create New App** in DigitalOcean App Platform

2. **Source Configuration**
   | Setting          | Value                        |
   |------------------|------------------------------|
   | Repository       | `your-org/dialysis.live.api` |
   | Branch           | `main`                       |
   | Source Directory | `/`                          |
   | Auto-deploy      | Enabled                      |

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=8080

   # MongoDB
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dialysis_prod

   # JWT
   JWT_SECRET=your-prod-jwt-secret-very-secure
   JWT_EXPIRES_IN=7d

   # Stripe (Live Mode)
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

   # CORS
   CORS_ORIGIN=https://dialysis.live

   # OpenAI (for AI features)
   OPENAI_API_KEY=sk-xxxxx
   ```

4. **Domain**: Add custom domain `api.dialysis.live`

---

## Domain Configuration

### DNS Records (Cloudflare or your DNS provider)

| Type  | Name    | Content                              | Proxy |
|-------|---------|--------------------------------------|-------|
| CNAME | @       | `your-prod-ui.ondigitalocean.app`    | Yes   |
| CNAME | www     | `dialysis.live`                      | Yes   |
| CNAME | dev     | `your-dev-ui.ondigitalocean.app`     | Yes   |
| CNAME | api     | `your-prod-api.ondigitalocean.app`   | Yes   |
| CNAME | api-dev | `your-dev-api.ondigitalocean.app`    | Yes   |

### SSL Certificates

DigitalOcean App Platform automatically provisions and renews SSL certificates via Let's Encrypt when you add custom domains.

---

## MongoDB Atlas Setup

### Create Clusters

#### Development Cluster
| Setting      | Value                      |
|--------------|----------------------------|
| Cluster name | `dialysis-dev`             |
| Database     | `dialysis_dev`             |
| Tier         | M0 (Free) or M2            |

#### Production Cluster
| Setting      | Value                      |
|--------------|----------------------------|
| Cluster name | `dialysis-prod`            |
| Database     | `dialysis_prod`            |
| Tier         | M10+ (recommended)         |

### Network Access

Add to IP whitelist:
- `0.0.0.0/0` (all IPs) for DigitalOcean's dynamic IPs
- Or configure VPC peering for enhanced security

### Database Users

| Username             | Database       | Role        |
|----------------------|----------------|-------------|
| `dialysis_dev_user`  | `dialysis_dev` | `readWrite` |
| `dialysis_prod_user` | `dialysis_prod`| `readWrite` |

---

## Stripe Configuration

### Test Mode (Development)

**Used by**: `dev.dialysis.live` and `api-dev.dialysis.live`

1. **Get Test API Keys**
   - Dashboard: https://dashboard.stripe.com/test/apikeys
   - Publishable Key: `pk_test_xxxxx`
   - Secret Key: `sk_test_xxxxx`

2. **Webhook Configuration**
   - Endpoint: `https://api-dev.dialysis.live/api/v1/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Test Cards**
   | Card Number          | Result              |
   |----------------------|---------------------|
   | `4242 4242 4242 4242`| Success             |
   | `4000 0000 0000 0002`| Decline             |
   | `4000 0025 0000 3155`| 3D Secure required  |

### Live Mode (Production)

**Used by**: `dialysis.live` and `api.dialysis.live`

1. **Get Live API Keys**
   - Dashboard: https://dashboard.stripe.com/apikeys
   - Publishable Key: `pk_live_xxxxx`
   - Secret Key: `sk_live_xxxxx`

2. **Webhook Configuration**
   - Endpoint: `https://api.dialysis.live/api/v1/webhooks/stripe`
   - Same events as test mode

---

## Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use DigitalOcean's encrypted environment variables
- Rotate API keys periodically
- Use different keys for each environment

### CORS Configuration (API)

```javascript
// Development origins
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://dev.dialysis.live'
];

// Production origins
const prodOrigins = [
  'https://dialysis.live',
  'https://www.dialysis.live'
];
```

---

## Troubleshooting

### Build Failures

1. **Check Node.js version**
   ```bash
   node --version  # Should be 18+
   ```

2. **Clear cache and reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### API Connection Issues

1. **Verify API URL** - Check `VITE_API_URL` in environment variables
2. **Check CORS** - Verify origin is allowed in API CORS config
3. **SSL Issues** - Ensure SSL certificates are valid

### Deployment Issues

1. **Check DigitalOcean Logs**
   - App Platform > Your App > Runtime Logs
   - App Platform > Your App > Build Logs

2. **Verify Environment Variables**
   - App Platform > Your App > Settings > Environment Variables

---

## Quick Reference

### URLs Summary

| Environment | UI                        | API                             |
|-------------|---------------------------|---------------------------------|
| Local       | http://localhost:5173     | http://localhost:3000           |
| Development | https://dev.dialysis.live | https://api-dev.dialysis.live   |
| Production  | https://dialysis.live     | https://api.dialysis.live       |

### Stripe Dashboard

| Environment | Dashboard URL                               |
|-------------|---------------------------------------------|
| Test Mode   | https://dashboard.stripe.com/test           |
| Live Mode   | https://dashboard.stripe.com                |

### MongoDB Atlas

| Environment | Database       |
|-------------|----------------|
| Development | `dialysis_dev` |
| Production  | `dialysis_prod`|

---

## License

Proprietary - All rights reserved.
