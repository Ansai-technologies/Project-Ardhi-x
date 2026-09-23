# Review packet — ArdhiX hygiene pass (2026-09-23)

Date: 2026-09-23 | Track: ArdhiX (Project-Ardhi-x) | Branch: `labs/ardhix-hygiene` | Type: hygiene (dead code + docs)

## What was built
Small follow-up to round 1 (PR #12, already merged): round 1's verification
packet cut the dead blockchain/auth files and fixed the leaked `.env.local`,
but three dead files and two dead dependencies were still hanging around, plus
the README still advertised blockchain features that no longer exist in the
codebase. This PR finishes that cleanup — no behavior changes, no Supabase
touch, nothing owner-side.

## Files changed
- **Deleted `lib/database-config.ts`** — legacy SQLite schema/config; Supabase is the live DB layer (`lib/supabase.ts`). Code-search: zero imports (only doc mentions in SETUP_GUIDE.md / PROPERTY_FORM_IMPLEMENTATION.md, which describe history, not code).
- **Deleted `lib/database.ts`** — 0 bytes, zero imports.
- **Deleted `test-duplicates.js`** — root-level script that `require()`s a `.ts` file (broken by construction) and is run by no npm script. Zero references in code.
- **`package.json`** — `name`: `my-v0-project` → `ardhix` (v0 scaffold leftover); removed `prisma` and `@prisma/client` (installed, zero imports, no `prisma/schema.prisma`).
- **`README.md`** — the "Blockchain Integration" section claimed `lib/blockchain.ts`, UI wallet hooks, and on-chain transfer existed. They don't (cut in round 1). Replaced with an honest "On-chain anchoring (future)" section: DB-first today, `blockchain/contracts/ArdhiXRegistry.sol` kept as a scaffold for a future Labs track.

## How to verify
1. `gh pr view` diff (below) — confirm only deletes + package.json/README edits, no app code touched.
2. GitHub code search on the branch: `repo:Ansai-technologies/Project-Ardhi-x database-config` / `@prisma/client` → zero code hits.
3. `npm install` on the branch will regenerate `package-lock.json` without prisma (see note below).
4. NOT verifiable without owner-side action (parked): Supabase key rotation still pending — the round-1 finding stands.

## Risks
- `package-lock.json` still lists prisma packages while `package.json` no longer does. Lockfile is now stale: the next `npm install` regenerates it correctly, but until then a CI run with `--frozen-lockfile` would fail. Recommended: run `npm install` once after merge (any machine, no credentials needed) and commit the refreshed lockfile.
- `.env.local` history rewrite still outstanding (optional hygiene after key rotation — owner-side, parked).

## Decision requested
1. Merge this PR? (Suggest: yes, then one `npm install` to refresh the lockfile.)
2. Confirm the DB-first framing in the README matches the product direction, or flag if on-chain wiring should be re-prioritized as a Labs track this quarter.
