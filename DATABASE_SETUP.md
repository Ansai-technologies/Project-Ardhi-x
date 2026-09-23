# Database Setup for ArdhiX Land Registry System

## Database: Supabase (PostgreSQL)

ArdhiX is DB-first on Supabase — this is the live database, not one option
among many. Schema and RLS live in `supabase-setup.sql`; the client lives in
`lib/supabase.ts`.

### Why Supabase?
- **PostgreSQL with strong ACID compliance**, spatial data support via PostGIS
- **Built-in auth, real-time, and storage APIs**
- **Free tier**: 500MB database, 2GB bandwidth
- **Easy deployment and scaling**

## Setup Instructions

1. **Install dependencies:**
```bash
pnpm install @supabase/supabase-js
```

2. **Sign up at supabase.com and create a project**

3. **Run `supabase-setup.sql`** in the Supabase SQL editor (tables + RLS policies)

4. **Copy `.env.example` to `.env.local`** and fill in from Project Settings → API:
```env
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_JWT_SECRET=<redacted>
```

## Database Schema

The schema includes:
- Users table (authentication)
- Properties table (land properties)
- Documents table (property documents)
- Locations table (counties, wards)
- Transactions table (property transfers)
- Audit logs (all changes)

## Notes

- There is no Prisma in this repo (removed in the hygiene pass). Do not run
  `npx prisma init` or install `@prisma/client` — the Supabase client is the
  data layer.
- The Solidity registry scaffold (`blockchain/contracts/ArdhiXRegistry.sol`)
  is a future on-chain Labs track, not the database.
