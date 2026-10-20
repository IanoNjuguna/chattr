---
name: feature-process
description: Use when making ANY change to this repo, feature, fix, refactor, docs or skill, and when shipping one. Every change goes issue first, then a branch named for it, then a pull request that carries the tradeoffs.
type: prompt
whenToUse: Before writing the first line of code for any change, before creating a branch, before committing, before opening or merging a pull request, or when asked to ship or finish work.
---

# Feature process

Every change to this repository follows one path. There is one exception, and it is production being down.

```
issue  →  branch  →  work  →  npm run verify  →  pull request  →  squash merge
```

`main` is what gets submitted to the microgrant, so it stays reviewable. Nothing reaches it except through a pull request. "It is only docs" is not an exception: docs are changes, and a docs branch costs one command.

## 1. The issue comes first

`gh issue create`, before any code. If these five fields cannot be written, the work is not understood yet, and that is the point of the step:

- **Problem.** What is wrong or missing today, for whom
- **Scope and non-goals.** What this touches, and what it deliberately does not
- **Acceptance criteria.** Testable statements, not adjectives. "Execute before unlockAt reverts" is a criterion, "payouts feel safer" is not
- **Risk and rollback.** What breaks if this is wrong, and how it is undone. Name anything on chain, anything touching money, and any storage layout change
- **Evidence of the gate.** Which test or command proves it, or which one gets written

Note the number, because the branch and the PR both carry it.

## 2. Branch from current main, named for the issue

```bash
git switch main && git pull
git switch -c feat/12-split-payout
```

The number after the slash is the issue. The prefix is the kind of change: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `skill`. The name must match `^[a-z]+/[0-9]+-`, which `pr-guard` enforces. Never work on `main`.

## 3. Commits that stand alone

One logical change per commit, each one builds. Message is `type: what changed`, with a one-line why, referencing the issue where it helps.

```
feat: hold payouts until unlockAt

execute() ignored the timestamp, so a milestone payout could fire early (#12).
```

If the shape of the work changes mid-branch, change the issue in the same session. A branch that does something other than its issue is worse than no issue.

## 4. The gate, before the PR exists

```bash
forge test && npx tsc --noEmit && npm run build
```

Green, or the PR is not opened. Do not open a PR to see what CI says; run it locally first. If a test fails because a local dependency is missing, fix the dependency, do not report the gate as failed.

## 5. The pull request carries the reasoning

`.github/pull_request_template.md` is the shape. What it asks for:

- `Closes #12` — a real number. `pr-guard` rejects a PR without one
- **What changed**, in the room's terms, not file by file
- **How it was verified**, the actual command and the actual result
- **Decisions and tradeoffs**: what else was possible, why it was rejected, what this costs. A tradeoff left out of the PR is a decision nobody reviewed
- **Risk and rollback**, carried from the issue and updated if it moved
- A screenshot for anything visual. A UI claim without a picture is unverified

## 6. Merge is the submission state

Squash merge. Then confirm `main` is green: `verify` runs on every push to `main`.

## The one exception

Production being down outranks the process. Label the PR `p0-hotfix`, say what is broken and what the fix does, and file the issue within 24 hours, linked retroactively. `pr-guard` passes with that label and fails without it. Anything else is not a P0.

## What CI enforces, and what it cannot

`pr-guard` fails a pull request when:

- the body has no `Closes #<n>` / `Fixes #<n>` / `Refs #<n>`
- the branch name carries no issue number and the PR is not `p0-hotfix`

`verify` runs `forge test` and the app build when the files exist.

Neither checks whether the tradeoffs section is good, because a regex that can be satisfied by a heading teaches everyone to satisfy the heading. That part is review, and it is why the section exists.
