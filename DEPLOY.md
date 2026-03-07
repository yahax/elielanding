# ELIE Sales OS — Deployment Guide

## Prerequisites
- Node.js 18+ on the server
- Supabase project (free tier works)
- Hostinger Node.js hosting (or Vercel)

## Step 1: Supabase Setup

1. Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor
2. Run `supabase/schema.sql` — creates all tables, constraints, RLS policies
3. Run `supabase/seed.sql` — inserts all 49 perfumes + inventory rows (stock=10)
4. Copy your credentials:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Environment Variables

Create `.env.local` (or set in Hostinger panel):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_OFFER_MODE=ramadan
DASHBOARD_PASSWORD=your-secure-password
APPS_SCRIPT_URL=https://script.google.com/... (optional)
```

## Step 3: Build & Run

```bash
npm install
npm run build
npm start
```

The app runs on port 3000 by default (`PORT=3000`).

## Step 4: Hostinger Deployment

1. Upload the project via Git or File Manager
2. In Hostinger panel → Node.js → Set:
   - Entry point: `node_modules/.bin/next start`
   - Node version: 18+
3. Add all env variables in the Hostinger panel
4. Restart the application

## Step 5: Verify

1. Open `https://elie.ma` → landing page should load
2. Open `https://elie.ma/os/login` → enter password
3. Check `/os/inventory` → should show 49 perfumes with stock=10
4. Submit a test order from landing page
5. Check `/os/orders` → order should appear

## Switching Offer Mode

Change `NEXT_PUBLIC_OFFER_MODE`:
- `ramadan` → 5 perfumes + 1 gift + free delivery = 199 MAD
- `standard` → 5 perfumes + free delivery = 199 MAD (no gift)

Rebuild after changing: `npm run build && npm start`

## Google Sheets Integration (Optional)

Set `APPS_SCRIPT_URL` to your Google Apps Script web app URL.
Orders will be forwarded to Sheets as a fire-and-forget backup.
