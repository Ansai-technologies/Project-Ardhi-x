# ArdhiX: Blockchain-powered Land Registry

## Features
- Secure Auth (Supabase)
- Property registration, transfer, verification
- Document and map integration
- Blockchain-backed on-chain property proof (Ethereum compatible)
- Wallet connect, register, transfer on-chain
- Responsive, error-free, consistent UI

## On-chain anchoring (future)

ArdhiX runs DB-first today: Supabase + RLS + auth is the working registry core
(see `supabase-setup.sql`). The Solidity registry scaffold
(`blockchain/contracts/ArdhiXRegistry.sol`) is kept as the anchor for a future
on-chain Labs track — it is NOT wired into the app (no deploy tooling, no ABI,
no contract address configured).

## Setup
1. Deploy Solidity contract (`ArdhiXRegistry.sol`) to Ethereum-compatible testnet, copy address to `.env.local` as `NEXT_PUBLIC_ARDHIX_CONTRACT_ADDRESS`
2. Run `pnpm install`
3. Set up Supabase and update env vars
4. Run `pnpm dev` and access at `localhost:3000`

## Tech
- Next.js, Tailwind, Shadcn/ui
- Supabase (Auth, DB, Storage)
- ethers.js (Web3)
- Solidity (Smart Contract)
