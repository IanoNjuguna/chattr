# chattr

A shared USDC account for a team. Money goes in, out only with the room's rule, and every payment carries a receipt saying who did the work and whether it landed.

Two to five people, one pot, a threshold of approvals, and a trail a funder can read. Built on Arc, where USDC is the gas token, so a team never has to buy anything else to use it.

**Status: deployed to Arc testnet, not mainnet.** Contracts and the room app are on `main` with 24 passing tests, and the registry lives at `0x248bd5d0…c8e205` on Arc testnet. No room exists yet, since creating one needs three funded wallets. Mainnet comes after the rehearsal.

## What it does

- A room has members, an m-of-n threshold, and a USDC balance
- Anyone can top the room up
- A member requests a payout: payee, amount, memo, optional unlock time
- Members approve; at the threshold and past the unlock time, anyone can execute
- Execution pays a 0.5% platform fee to the treasury, then pays the payee, and posts a receipt
- The captain marks the receipt delivered or not, with a note. That attestation is what turns a transfer history into evidence

## What it deliberately does not do

Not a chat app. Not escrow-as-a-product. Not agent payments. No SDK, no MCP server, no REST API in v1. The feed is activity, not conversation, and the contract is plumbing behind one screen.

If nobody outside the room will ever ask what the money was for, a personal wallet is the right tool and this is overkill.

## How it works

One registry contract, rooms as structs, one address for everything.

```
createRoom(name, members[], threshold)      // max 8 members, caller becomes captain
deposit(roomId, amount)                     // anyone, pulls USDC via transferFrom
request(roomId, to, amount, memo, unlockAt) // members only, unlockAt 0 = immediate
approve(roomId, requestId)                  // one vote per member, a second reverts
execute(roomId, requestId)                  // needs threshold + unlock time
attest(roomId, requestId, delivered, note)  // captain, once, moves no money
setShares(roomId, members[], bps[])         // must sum to 10000
payShares(roomId, amount)                   // split payout in one call
```

Events: `RoomCreated`, `Deposited`, `Requested`, `Approved`, `Executed`, `FeeTaken`, `Attested`, `SharesPaid`.

The fee is taken out of the requested amount, so the payee receives `amount - fee`. It is fixed at deploy and capped at 1%.

### Money on Arc

USDC is Arc's native asset and pays gas. There are two interfaces over the same balance:

- Native: 18 decimals, queried as an account balance
- ERC-20 view at `0x3600000000000000000000000000000000000000`: 6 decimals, `symbol()` returns `USDC`

Every room amount is 6-decimal USDC moved through the ERC-20 interface. `msg.value` appears nowhere in the contract, because the native side would arrive at 18 decimals. Verified against both `https://rpc.mainnet.arc.io` (chain 5042) and `https://rpc.testnet.arc.io` (chain 5042002).

## Quick start

Prerequisites: [bun](https://bun.sh) and, for the contract suite, [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
bun install
bun run dev          # http://localhost:5173
```

The app targets Arc testnet by default, with no wallet connected it renders a sample room so the screen is readable before you sign anything.

## How to test

Three levels, cheapest first. Each of these was run on this repo, results shown.

### 1. App checks

```bash
bun install --frozen-lockfile     # 643 packages, ~97s
bunx tsc --noEmit                 # exit 0
bun run build                     # exit 0, built in 3m12s, dist 3.7 MB
```

`bun run build` warns twice, both about dependencies rather than this code: Rollup cannot interpret `/*#__PURE__*/` annotations buried in the walletconnect and ox trees, and the main chunk is 1.36 MB (445 kB gzipped) because the wallet stack is large. Neither is an error. Code-splitting the connect flow would shrink it and is not done yet.

### 2. Contract tests

`lib/` and `contracts/out/` are gitignored, so the Solidity dependencies have to be reconstructed before the first run:

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
git clone --depth 1 https://github.com/foundry-rs/forge-std lib/forge-std
forge test -vv
```

OpenZeppelin comes from `node_modules`, which `foundry.toml` lists as a lib directory, so `bun install` has to run first. The suite is 24 tests against a mock 6-decimal USDC and covers: create, deposit, request, approve to threshold, execute paying payee plus the 50 bps fee, double approval reverting, execution before `unlockAt` reverting, attestation before execution reverting, attesting twice reverting, a non-captain attesting reverting, shares not summing to 10000 reverting, `payShares` paying every member, zero payee, zero amount, amount above balance, and cross-room request IDs reverting on approve, execute and attest.

CI runs exactly this on every pull request, plus the app checks, so the fastest honest test is to open a PR and read the checks.

### 3. A real run on Arc testnet

This is the level that finds wallet and UI bugs, because nothing else signs anything.

1. Fund three separate addresses at [faucet.circle.com](https://faucet.circle.com), selecting Arc Testnet. 20 test USDC per address, once every two hours. Three distinct signers matter: one key cycling funds proves nothing
2. Deploy through Arc Studio, whose default deploy target is Arc testnet, or with `forge create` and the treasury address you want the 0.5% to reach
3. Put the deployed address in `src/config.ts`, then run the five flows: deposit, request plus approvals plus execute, split payout, a timed payout, and an attestation

Testnet does not count for the Arc microgrant, which requires at least one Arc mainnet transaction that moves USDC. It is rehearsal and demo material.

## Deploying

Deploys are gated. There is no CI deploy step, no script that runs on merge, and `main` is protected. A deploy is a deliberate act with an explicit go, and mainnet amounts stay small, 1 to 5 USDC.

Constructor arguments: the USDC address (`0x3600…0000`), the treasury address, and the fee in basis points (50).

Verify any deployment yourself, don't take a report's word for it:

```bash
bun run scripts/verify-deploy.ts
```

It prints the chain id, bytecode size, `feeBps`, `treasury`, `usdc`, `roomCount` and the deploy receipt, then proves the cross-room `WrongRoom()` guard (`0xfa32c191`) is present in the runtime bytecode.

### Deployments

| Network | Contract | Tx | State |
| --- | --- | --- | --- |
| Arc Testnet | `0x248bd5d09b394d7d6041188ef3bbc2920ac8e205` | `0x389255810c5928ea060bd605078ffd5f6ae0a8d2eb1b33ad30dd4b2be9b73572` | current, includes the cross-room guard |
| Arc Testnet | `0xe94fc65ee82484ca85769ec65c767de30146f40f` | `0xc0ab19ff3aeba333be5343509fc1423dae2a14a2730ba45de3e692767754027b` | **superseded**: deployed before the guard was applied, do not use |

Both testnet deployments use the platform deployer as the fee treasury, `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42`. A mainnet deployment needs a treasury you control.

## Where this code comes from

The contracts and app are authored inside an Arc Studio sandbox and pulled here with `arc-studio pull`. The repo layout mirrors that sandbox exactly (`contracts/`, `src/`, `foundry.toml`), so a pull lands cleanly instead of colliding. Do not reorganise it.

Pulled artifacts exclude build output and vendored dependencies. CI reconstructs both.

## Repo layout

```
contracts/         ChattrRooms.sol, the one registry contract
contracts/test/    24 Foundry tests against a mock 6-decimal USDC
src/               the room screen: header, feed, member strip, composer
  components/      one component per region, under 80 lines each
  hooks/           contract reads and writes
  lib/             abi, constants, money formatting, types, sample data
.agents/skills/    project skills the agent working here should load
.github/           pr-guard and verify workflows, PR template, CODEOWNERS
PRD.md             spec of record
AGENTS.md          conventions for anyone, human or agent, editing this repo
```

## Community

Issues and pull requests on this repository are the whole community right now. There is no chat server, no Discord, no token, and nothing to buy.

- Be decent. `CODE_OF_CONDUCT.md` is Contributor Covenant 2.1
- Ask before building something large. Open an issue first, that is the process
- Report security issues privately, per `SECURITY.md`. Do not open a public issue for a live vulnerability

## Contributing

Read `CONTRIBUTING.md`. The short version: every change goes issue, branch, pull request. `pr-guard` fails a PR with no issue link or a branch without its issue number, and `verify` must be green before merge.

## License

AGPL-3.0. See `LICENSE`.

This means you can use, modify and self-host chattr freely, and if you run a modified version as a network service you must offer its source to the people using it. That is deliberate: the product's whole claim is that a team can check the record, so the code behind it should be checkable too.
