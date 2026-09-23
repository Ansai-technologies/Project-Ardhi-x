# ArdhiX: Supabase-backed Land Registry

## Features
- Secure Auth (Supabase)
- Property registration, transfer, verification
- Document and map integration
- Responsive, consistent UI

## On-chain anchoring (future)

ArdhiX runs DB-first today: Supabase + RLS + auth is the working registry core
(see `supabase-setup.sql`). The Solidity registry scaffold
(`blockchain/contracts/ArdhiXRegistry.sol`) is kept as the anchor for a future
on-chain Labs track — it is NOT wired into the app (no deploy tooling, no ABI,
no contract address configured).

## Setup
1. Run `pnpm install`
2. Set up Supabase and update env vars (copy `.env.example` to `.env.local`; schema in `supabase-setup.sql`)
3. Run `pnpm dev` and access at `localhost:3000`

## Tech
- Next.js, Tailwind, Shadcn/ui
- Supabase (Auth, DB, Storage)
- Solidity registry scaffold (future on-chain track — not wired in)

## Package manager
pnpm is canonical for this repo (`pnpm-lock.yaml` is the only lockfile).
