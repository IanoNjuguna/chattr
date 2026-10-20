# AGENTS.md

> **Before you touch anything: every change goes issue → branch → pull request.**
> No exceptions except production being down, and "it is only docs" is not one. `main` is what gets submitted, so it only receives reviewed merges. The gate is `forge test` and `npm run verify`; if it is red, the branch does not merge. `.github/workflows/pr-guard.yml` and `verify.yml` enforce the parts a check can enforce, and `feature-process` owns the rule.

## How work arrives

**Every change goes issue → branch → pull request.** No exceptions except production being down.

1. **The issue exists before the code does.** Problem, scope and non-goals, testable acceptance criteria, risk and rollback, and the check that proves it. If those cannot be written, the work is not understood yet
2. **The branch is named for it**, cut from current `main`: `feat/12-split-payout`. Never work on `main`
3. **`forge test` and `npm run verify` are green before the PR exists.** Not after, and not "to see if CI passes"
4. **The PR carries the reasoning**: `Closes #12`, what changed in the room's terms, how it was verified, the decisions and the options rejected, risk and rollback, and a screenshot for anything visual. `.github/pull_request_template.md` is the shape
5. **Squash merge**, then confirm `verify` went green on `main`

`pr-guard` fails a pull request with no issue link or a branch name without its issue number. A P0 uses the `p0-hotfix` label and files the issue within 24 hours.

The full procedure, including the exception and the failure modes it exists to prevent, is the `feature-process` skill. That skill owns the rule; this section is the summary and must not grow into a second copy of it.

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
- No issue templates. `gh issue create` with the five fields in `feature-process` is the shape; the PR template is `.github/pull_request_template.md`
- Branch protection on `main` is a manual step in the GitHub UI. Until it is on, `verify` and `pr-guard` still run and still fail, they just do not block the merge button
