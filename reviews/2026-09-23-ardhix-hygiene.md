# Review packet — ArdhiX hygiene pass (2026-09-23)

Date: 2026-09-23 | Track: ArdhiX (Project-Ardhi-x) | Branch: `labs/ardhix-hygiene` | Type: hygiene (dead code + docs)

## What was built
Small follow-up to round 1 (PR #12, already merged): round 1's verification
packet cut the dead blockchain/auth files and fixed the leaked `.env.local`,
but three dead files and two dead dependencies were still hanging around, plus
the README still advertised blockchain features that no longer exist in the
codebase. This PR finishes that cleanup — no behavior changes, no Supabase
touch, nothing owner-side. A pre-review pass (2026-09-23) flagged that the
README cleanup was half-done and the lockfiles stale; this branch now
addresses every flagged item.

## Files changed
- **Deleted `lib/database-config.ts`** — legacy SQLite schema/config; Supabase is the live DB layer (`lib/supabase.ts`). Code-search: zero imports (only doc mentions, now fixed below).
- **Deleted `lib/database.ts`** — 0 bytes, zero imports.
- **Deleted `test-duplicates.js`** — root-level script that `require()`s a `.ts` file (broken by construction) and is run by no npm script. Zero references in code.
- **`package.json`** — `name`: `my-v0-project` → `ardhix` (v0 scaffold leftover); removed `prisma` and `@prisma/client` (installed, zero imports, no `prisma/schema.prisma`).
- **`README.md`** — finished the honesty job the first pass started: title now
  "Supabase-backed Land Registry" (was "Blockchain-powered"); the two
  blockchain feature claims moved out of Features into the "On-chain
  anchoring (future)" section; Setup step 1 no longer says "deploy Solidity
  contract … copy address to `.env.local`"; the `ethers.js (Web3)` Tech line
  is gone (zero ethers imports anywhere, not in `package.json`). The whole
  README now agrees with DB-first reality. A "Package manager" note declares
  pnpm canonical.
- **`pnpm-lock.yaml`** — surgically cleaned: all 16 prisma-related blocks
  removed (2 importer deps, 8 `packages:` entries, 6 `snapshots:` entries);
  zero "prisma" occurrences remain; YAML re-validated; every remaining
  importer dep still resolves to a `packages:` entry. Consistent with
  `package.json`, which lists no prisma.
- **Deleted `package-lock.json`** — pnpm is the canonical package manager
  (README is the front door and says `pnpm install`); one lockfile, no drift.
- **`SETUP_GUIDE.md`** — the 3 stale `lib/database-config.ts` references now
  point at Supabase reality (`supabase-setup.sql` + `lib/supabase.ts`), the
  SQLite/PostgreSQL-switch language is gone, and the `.env.local.example`
  typo now reads `.env.example` (the actual file).
- **`DATABASE_SETUP.md`** — the Prisma-ORM walkthrough (`npm install prisma
  @prisma/client`, `npx prisma init`) replaced with the actual stack:
  Supabase project → run `supabase-setup.sql` → copy `.env.example`.
  Explicit note: do not re-add Prisma.
- **Repo description** — "blockchain-powered" dropped; now "Supabase-backed".

## How to verify
1. `gh pr view` diff (below) — confirm deletes + package.json/README/lockfile/doc edits, no app code touched.
2. GitHub code search on the branch: `repo:Ansai-technologies/Project-Ardhi-x database-config` / `@prisma/client` / `ethers` → zero code hits.
3. Lockfile: `pnpm-lock.yaml` contains zero "prisma" occurrences; `package-lock.json` no longer exists; `pnpm install --frozen-lockfile` should pass on the founder's machine (no credentials needed) — **please run one fresh `pnpm install` to verify** and confirm the tree is clean.
4. README honesty: read Features + Setup + Tech together — no blockchain claim survives outside the labeled "future" section.
5. NOT verifiable without owner-side action (see Risks): Supabase key rotation.

## Risks
- **URGENT (owner-side, not fixed by this PR): Supabase key rotation.** Round 1
  removed `.env.local` from the tree, but commit `0db21836` ("Add .env.local
  file with Supabase configuration", Aug 4 2025) still sits in **public git
  history** with the original keys, and rotation is still pending. This repo
  is PUBLIC — anyone can `git show` that commit today. Rotation (Supabase
  dashboard → new keys → update `.env.local`/deploy env) is the fix; a
  history rewrite is optional hygiene *after* rotation. Do not delay this
  behind the PR — it is the founder's highest-priority outstanding item on
  this repo, and merging neither helps nor harms it.
- Lockfile surgery was done without running pnpm (no local npm/pnpm on the
  build machine): the edit is mechanical block removal, YAML re-validated,
  and every remaining dependency still resolves — but the founder's fresh
  `pnpm install` (step 3 above) is the real proof. If it regenerates a
  diff, commit the regenerated lockfile.

## Decision requested
1. Re-review and merge this PR? (Suggest: yes — all pre-review CHANGES items are addressed.)
2. Run the fresh `pnpm install` verification (step 3) before or right after merge.
3. **Rotate the Supabase keys now** (owner-side, dashboard) — urgent, independent of this PR.
4. Confirm the DB-first framing in the README matches the product direction, or flag if on-chain wiring should be re-prioritized as a Labs track this quarter.
