---
name: feature-process
description: Use when shipping any change in this repo, from a contract edit to a doc tweak. Two lanes: docs go straight to main, anything touching contracts or money goes issue, branch, verify, PR.
type: prompt
whenToUse: Before writing code for a change, before creating a branch, before committing, and before opening or merging a pull request in chattr.
---

# Feature process

One builder, one deadline, one public repo that gets submitted. The process is sized to that, not copied from a team repo.

```
docs/copy/README  →  commit to main directly
contracts/src/test →  issue → branch → work → verify → PR → squash merge
```

## Lane 1: docs

`PRD.md`, `README.md`, `.agents/skills/`, copy in comments. Commit straight to `main`, one logical change per commit, message says what and why in one line.

```
docs(prd): record verified Arc USDC interface
```

## Lane 2: anything that moves money

`contracts/`, `src/`, `test/`. `main` is what gets submitted, so it must always build.

1. **Issue first**, `gh issue create`. Five fields: problem, scope and non-goals, testable acceptance criteria, risk and rollback, which check covers it. If you cannot write the acceptance criteria as testable statements, the work is not understood.
2. **Branch from current main**, named for the issue: `git switch -c feat/12-split-payout`. Never work on `main`.
3. **Small commits that stand alone.** Each one builds. Message is `type: what changed` with a one-line why, and references the issue.
4. **Gate before the PR exists**, not after:
   ```bash
   forge test && npx tsc --noEmit && npm run build
   ```
   Red gate, no PR. Do not open a PR to see what CI says, there is no CI.
5. **The PR carries the reasoning**, because the repo history is part of the submission:
   - `Closes #12`
   - What changed, in the room's terms: "a payout now waits for its unlock time" beats a file list
   - How it was verified, the actual command and the actual result
   - Decisions and tradeoffs, including the options rejected
   - Risk and rollback. If it touches a deployed contract, say what happens to funds already in it
   - A screenshot for anything visual. A UI claim without a picture is unverified
6. **Squash merge**, then confirm `main` still passes the gate.

## What is not negotiable

- No deploy, no mainnet transfer, no contract edit that changes storage layout without an explicit go from the owner
- No "I will write the issue after". If the issue cannot be written, the work is not ready
- A test for every rule in PRD section 8. A rule without a test is a promise, not a behaviour

## When the shape of the work changes

Change the issue in the same session. A branch that does something other than its issue is worse than no issue.
