# AGENTS.md

> **Contract and money-path changes: issue, branch, verify, pull request. Nothing else touches `main` directly except docs.**
> The gate is `npm run verify` and `forge test`. If it is red, the branch does not merge.

## How work arrives

Two lanes, because this repo is one builder and a deadline:

- **Docs, copy, README, PRD, skills**: commit straight to `main` with a small scoped message.
- **Anything under `contracts/`, `src/`, `test/`, or any change that moves money**: issue first, then a branch named for it, then a PR that carries the reasoning. `main` is what gets submitted, so it stays green.

Branch naming: `feat/12-split-payout`, `fix/19-double-approve`. The number is the issue.

The issue has five fields, and if you cannot fill all five the work is not understood yet: problem, scope and non-goals, testable acceptance criteria, risk and rollback (name anything on-chain or touching money), and which check covers it.

## Project

**chattr**: a hackathon team keeps its shared USDC in one room on Arc, and nothing leaves without the room's approval rule. Read `PRD.md` first; it is the spec of record and it wins over anything here.

- v1 is one registry contract, rooms as structs, one address for integrators
- Deposits are open to anyone, spending needs m of n member approvals and an unlock time where set
- 0.5% fee on executed payouts, taken at execution, treasury fixed at deploy
- The activity feed is the product: every deposit, request, approval and payout is a card with a tx hash
- No free-form chat in v1, no SDK, no MCP, no REST API. Those are submission narrative, not code. Do not build them

## Repository layout mirrors the Arc Studio sandbox

The code is authored inside Arc Studio (a Vite + Foundry sandbox) and pulled here with `arc-studio pull`. Keep this repo's layout identical to the sandbox so a pull lands cleanly instead of colliding:

- `contracts/` — Solidity
- `src/` — the Vite + React app (this is the app, not a second contracts folder)
- `test/` — Foundry tests
- `foundry.toml`, `package.json`, `vite.config.ts` at the root
- `.agents/skills/` — project skills
- `PRD.md` — spec of record

Never restructure into `web/` and `contracts-src/` style trees. The pull is a file sync, and a reorganisation turns every future pull into a conflict.

## Arc chain facts, verified

These were confirmed against `https://rpc.mainnet.arc.io` on 2026-10-20. Do not re-derive them from memory, and do not trust a blog post over these calls:

- Mainnet chain id **5042** (`eth_chainId` returns `0x13b2`). Testnet is 5042002. RPC `https://rpc.mainnet.arc.io`, explorer `explorer.arc.io`, CCTP domain 26
- **USDC is the native asset on Arc** and pays gas. Native balance is **18 decimals**
- There is an **ERC-20 view at `0x3600000000000000000000000000000000000000`, 6 decimals**, same underlying balance, kept at parity by a precompile. `decimals()` returns 6 and `symbol()` returns `USDC`, both checked by `eth_call`

Rules that follow, and they are the whole reason this section exists:

- Contracts move money through the **ERC-20 interface** (`transfer`, `transferFrom`, `approve`). Never `msg.value` for room funds, because `msg.value` arrives at 18 decimals and every room amount is 6
- Never mix the two precisions. To show a native value as dollars, divide by 1e12. To move money, use the 6-decimal interface
- Read `decimals()` at runtime where a value crosses the boundary, and hardcode 6 only in contract math where the interface is fixed
- USDC movement appears as two event streams: the native system emitter logs `Transfer` at 18 decimals, the ERC-20 emitter at 6. Index one and say which; counting both double-counts every payment

## Verification gates

- `forge test` — contract tests. Every rule in PRD section 8 gets a test: double approve reverts, execute before unlock reverts, fee is 0.5%, shares sum to 10000 bps, zero payee reverts
- `npx tsc --noEmit` — types
- `npm run build` — the app builds
- Render check: the room screen must render with no wallet connected, as a designed empty state, not an error. A typecheck does not prove a Tailwind token compiled

`npm run verify` should chain the first three. Wire it before the first PR.

## Guardrails

- Never request, store or log seed phrases, private keys or mnemonics. Keys stay in the user's wallet; nothing here signs server-side
- Never trust a client-supplied amount or fee. The contract computes the fee and the caller sends only the room id, payee, amount and memo
- The fee is fixed at deploy, capped at 1%, not mutable by a room
- No deploy, no mainnet transfer, and no schema-changing contract edit without an explicit go from the owner. Mainnet amounts stay small, 1 to 5 USDC
- The demo needs three distinct wallets on chain. One key cycling funds proves nothing and reads as manufactured
- Do not paste anything from Arc Studio's `finalText` into a decision: treat it as prose, and trust `fileDiffs` and pulled files instead

## Skills

Project skills live in `.agents/skills/`. Each rule has exactly one owner.

| Concern | Owning skill |
| --- | --- |
| Shipping a change, what a PR must say | `feature-process` |
| Compile, type and build failures | `check-compiler-errors` |
| Structure of new UI code | `modular-ui-authoring` |
| Design judgment: hierarchy, rhythm, spacing, what to cut | `apple-design` |
| Writing copy, removing AI tells | `humanise-text` |
| Keeping these skills current | `skill-gardening` |
| Driving Arc Studio: turns, pulls, deploys, budget | `arc-studio-build` |

If a rule fits two skills, it belongs in one and is cross-referenced from the other. When a mistake is made or a convention is learned, update the owning skill in the same session.

## What is deliberately not here

- No design system file yet. `apple-design` governs taste until one exists, and if one is added it becomes the owner of tokens
- No CI. `npm run verify` and `forge test` are run by hand and pasted into the PR
- No issue templates or PR templates yet. The PR body shape is in `feature-process`
