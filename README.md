# KAP Frontend

Frontend application for the KAP platform built with React, Vite, and TailwindCSS.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and adjust the backend URL:
```bash
cp .env.example .env
```
Inside `.env`:
```env
VITE_API_URL=https://your-backend-api-url.com/api
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## Deployment on Render (Static Site)

1. **Create New Static Site**:
   - Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Static Site**.
   - Connect this repository: `https://github.com/isyedsanaullah/kap-frontend`.

2. **Build Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Environment Variables**:
   - Add `VITE_API_URL` pointing to your backend API URL (e.g., `https://your-kap-backend.onrender.com/api` or Vercel backend URL).

4. **SPA Routing (Redirects / Rewrites)**:
   - In your Render Static Site settings, navigate to **Redirects/Rewrites**.
   - Add a rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
   - This ensures React Router paths (e.g., `/dashboard`, `/payments`) load properly on page refreshes.
