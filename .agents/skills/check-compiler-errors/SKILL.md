---
name: check-compiler-errors
description: Use when compile, type-check or build output is failing in chattr. Runs the real gates and reports failures by file.
type: prompt
whenToUse: When forge build, forge test, tsc, or the Vite build fails, or before claiming a change is done.
---

# Check compiler errors

## Trigger

Solidity compile failures, Foundry test failures, TypeScript errors, or a Vite build that will not produce output.

## The gates, in this order

```bash
forge build            # contracts compile
forge test -vv         # contract tests, verbose on failure
npx tsc --noEmit       # app types
npm run build          # app builds
```

`npm run verify` chains the typecheck and build. Run it before reporting done.

## Workflow

1. Run the narrowest gate that reproduces the failure first, not the whole chain.
2. Summarise errors grouped by file and by kind: compile, type, test assertion.
3. Fix the highest-confidence issue first, one cause at a time. A stack of speculative fixes hides which one worked.
4. Re-run until clean, or stop and report the blocker with the exact failing command and its output.

## Solidity-specific failure modes in this repo

- Decimal confusion. Every room amount is 6-decimal USDC through the ERC-20 interface at `0x3600…0000`. A test that reverts on amounts or an assertion off by 1e12 means native 18-decimal and the ERC-20 view got mixed
- Approval counting. A double approve must revert; a test that passes it means the per-member flag is missing
- Unlock time. `unlockAt` of 0 means immediate. A test that reverts on an immediate request is checking the wrong branch

## Output

- Status of each gate, as run
- Errors grouped by file and kind
- Fixes applied, and anything still blocked with the command that proves it
