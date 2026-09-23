# Review packet — ArdhiX verification pass (2026-09-23)

Date: 2026-09-23 | Track: ArdhiX (Project-Ardhi-x) | Branch: `labs/ardhix-verification` | Type: verification (no code changed)

## What was checked
Read-only verification of the ArdhiX MVP (pushed 2026-01-27) before pilot: does
what's here actually work, or is it stubbed/broken? Method: full repo tree (154
files) via the GitHub API, targeted reads of every load-bearing file, and
cross-file greps for broken imports, TODOs, `console.*`, hardcoded hosts,
mocks, and unused dependencies. The `.env.local` was checked for key *names*
and placeholder-vs-live *shape* only — values are never printed.

## Findings

### 🔴 SECRETS — action required
- `.env.local` is **committed** with live-looking Supabase credentials:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  **`SUPABASE_SERVICE_ROLE_KEY`**, `SUPABASE_JWT_SECRET` (all four shaped like
  real keys, not placeholders). The service-role key bypasses all RLS — anyone
  with repo access has full database access. The repo is currently private, so
  the blast radius is limited to collaborators, but this must be rotated before
  pilot. (`.gitignore` lists `.env*`, so the file was force-added at some point.)
- `lib/auth.ts` (dead code, see below) contains hardcoded demo credentials
  (`admin@ardhix.com` / weak password) and a hardcoded JWT secret. Harmless
  while unimported, a trap if anyone revives the import.

### File-by-file status

| File(s) | Status | Notes |
|---|---|---|
| `supabase-setup.sql` | **Works** | Full schema: `profiles`, `properties`, `property_documents`, `property_transfers`, `property_history`; indexes; `updated_at` triggers; **RLS enabled with per-table policies** (users see own properties, admins see all). Solid foundation. |
| `lib/supabase.ts`, `lib/supabase-auth.ts` | **Works** | Client + admin clients; signup creates `profiles` row; login returns session + profile; `verifySession` validates via `supabaseAdmin.auth.getUser`. |
| `middleware.ts` | **Works** | Route protection on all non-public paths, admin gate on `/admin`, clears invalid tokens. |
| `app/api/auth/*` (login, register, logout, me, forgot/reset) | **Works** | Rate limiting + structured logging; tokens in httpOnly cookies, not localStorage. |
| `lib/rate-limiter.ts`, `lib/csrf.ts`, `lib/validations.ts` | **Works** | Present and wired (validations imported by 3 pages). Note: rate limiter and CSRF store are in-memory — fine for pilot, won't survive multi-instance serverless. |
| `blockchain/contracts/ArdhiXRegistry.sol` | **Works (uncompiled)** | Simple, coherent: `registerProperty` / `transferProperty` / `getPropertyOwner` + events. But no hardhat/foundry config, no ABI, no deployment, no address configured anywhere. |
| `lib/blockchain.ts` | **Broken (dead code)** | Imports `ethers` — **not in `package.json`** — and `@/blockchain/abis/ArdhiXRegistry.json`, which doesn't exist. Nothing imports it, so the build doesn't break *today*. |
| `components/property/BlockchainActions.tsx` | **Broken (dead code)** | Imports `@/hooks/useBlockchainProperty`, which doesn't exist; contains TODOs admitting the hook path is wrong. Never rendered by any page. |
| `app/properties/[id]/transfer/page.tsx` | **Stubbed** | Comment: "In a real app, you would: … 4. Create blockchain record if applicable. For now, we'll update the property status." Transfer = status flip only. |
| `lib/google-maps-config.ts` | **Stubbed** | Placeholder API key — maps won't load at runtime. |
| `database-seed.sql` | **Stubbed** | Demo users/properties only (`john.doe@example.com` etc.). Fine for dev, not pilot data. |
| `lib/auth.ts`, `lib/database-config.ts`, `lib/database.ts` | **Dead code** | Legacy in-memory auth (with hardcoded creds) and a legacy SQLite schema; `database.ts` is 0 bytes. Zero imports across the repo. |
| `prisma`, `@prisma/client` (deps) | **Missing / dead** | Installed in `package.json`, zero imports, no `prisma/schema.prisma`. |
| `.env.example` | **Missing** | `IMPLEMENTATION_SUMMARY.md` claims it was created — it wasn't. |
| `NEXT_PUBLIC_ARDHIX_CONTRACT_ADDRESS` | **Missing** | Referenced only by the dead `lib/blockchain.ts`; `.env.local` holds just the 4 Supabase keys. No contract address configured anywhere. |

### Docs vs reality (IMPLEMENTATION_SUMMARY.md claims)
- "No `console.log` statements in codebase" — **false**: 11 files contain `console.*` calls (pages + `lib/logger.ts` + `test-duplicates.js`).
- "All TypeScript errors resolved" — **misleading**: `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`; `tsc --noEmit` still flags the blockchain files.
- "`.env.example` — environment variable template" — **false**, file doesn't exist.
- `package.json` is still named **`my-v0-project`** — v0 scaffold never renamed.

## Recommended next build step (single, blocking)
**Rotate the leaked Supabase keys and remove `.env.local` from the repo.**
Concretely: in the Supabase dashboard, rotate the service-role key and JWT
secret; delete `.env.local` from the repo tip; add `.env.example` with
placeholders (the template in this packet's repo `reviews/` dir). Rotation
kills the risk even if history keeps the old values; a history rewrite is
optional hygiene afterward. Nothing else should ship until this is done —
the service-role key is the keys to the whole database.

## Risks / open edges
- **Leaked service-role key** (above) — highest priority.
- **"Blockchain-powered" is currently aspirational.** Zero on-chain wiring:
  no ABI, no deploy tooling, no configured address, transfer flow is a DB
  status flip. The land-registry core (Supabase + RLS + auth + UI) is real;
  the blockchain half is a scaffold.
- **The build passes by ignoring errors.** Broken files survive only because
  nothing imports them — fragile; the first real import of `lib/blockchain.ts`
  fails the build (`ethers` missing).
- **In-memory rate limiting** won't work across Vercel's multi-instance
  serverless — acceptable for pilot, must move to Redis/Upstash before scale.
- **Dead code with credentials** (`lib/auth.ts`) is a footgun; delete it.

## How to verify
1. **Secrets:** Supabase dashboard → Project Settings → API → rotate
   service-role key + JWT secret; confirm the new keys differ from what's in
   git (compare first 8 chars only — never paste full keys into chat).
2. **Build honesty:** `npm install && npx tsc --noEmit` on `main` — expect
   errors in `lib/blockchain.ts` and `components/property/BlockchainActions.tsx`
   (proof errors are currently hidden); `npm run build` passes only because of
   `ignoreBuildErrors`.
3. **Schema:** paste `supabase-setup.sql` into a fresh Supabase SQL editor —
   6 tables + RLS policies created, no errors.
4. **Auth flow:** sign up → row appears in `profiles`; log in → httpOnly
   `auth-token` cookie set; visit `/admin` as non-admin → redirected.

## Decision requested
1. **Rotate the Supabase keys?** Recommended: yes — service-role + JWT secret
   in the Supabase dashboard, then I remove `.env.local` from the repo tip and
   add `.env.example`. History rewrite optional after rotation.
2. **Blockchain: wire it or cut it?** Either (a) make it real — compile the
   contract, commit the ABI, add `ethers`, implement `useBlockchainProperty`,
   connect the transfer flow, deploy to a testnet; or (b) delete the dead
   blockchain files and run ArdhiX as a DB-first registry, with on-chain
   anchoring as a later Labs track. My recommendation: (a) only if a testnet
   deploy is staffed this quarter; otherwise (b) — an honest DB-first pilot
   beats a fake blockchain one.
