# Contributing to chattr

chattr is a hackathon team's shared USDC pot on Arc. The spec is [`PRD.md`](./PRD.md) and the agent conventions are [`AGENTS.md`](./AGENTS.md). This file is the human workflow.

---

## Every change goes issue → branch → pull request

No exceptions except production being down. That includes docs, copy and skills.

1. **Issue first.** `gh issue create` with problem, scope and non-goals, testable acceptance criteria, risk and rollback, and the check that proves it.
2. **Branch named for it**, cut from current `main`: `feat/12-split-payout`, `fix/19-double-approve`, `docs/4-usdc-decimals`. The number is the issue.
3. **Small commits** that stand alone, each one building.
4. **Verify locally before the PR exists**: `forge test && npx tsc --noEmit && npm run build`.
5. **PR carries the reasoning**: `Closes #12`, what changed in the room's terms, how it was verified, the decisions and rejected options, risk and rollback, and a screenshot for anything visual.
6. **Squash merge**, then confirm `main` is green.

`pr-guard` fails a pull request with no issue link or a branch name without its issue number. `verify` runs the contracts and app gates when those files exist.

---

## Verify before committing

```bash
npm run verify     # typecheck + build
forge test         # contract tests
```

Contract rules that must have a test each: double approve reverts, execute before `unlockAt` reverts, fee is 0.5%, shares sum to 10000 bps, zero payee reverts, a request that already executed cannot execute twice.

---

## Arc facts you will need

- USDC is the **native** asset on Arc (18 decimals) with an **ERC-20 view at `0x3600000000000000000000000000000000000000`, 6 decimals**. `decimals()` returns 6, `symbol()` returns USDC
- Contracts move room money through the ERC-20 interface only. `msg.value` arrives at 18 decimals and every room amount is 6
- Mainnet chain id 5042, RPC `https://rpc.mainnet.arc.io`, explorer `explorer.arc.io`, CCTP domain 26
- Deploys and mainnet transfers need an explicit go. Amounts stay small, 1 to 5 USDC

---

## Code of conduct for the code

- Semantic class names, no raw hex in components
- Tabular numerals on every monetary value
- USDC always formatted to two decimals for display, full precision when constructing a write
- Calm, direct copy. No exclamation marks, no gamification
- Minimum 44px touch targets
- Keys stay in the user's wallet. Nothing here signs server-side, and no seed phrase is ever requested, stored or logged
