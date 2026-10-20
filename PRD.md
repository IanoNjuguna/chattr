# chattr, Product Requirements Document

Status: draft for build
Owner: Ian
Date: October 2026
Target: Arc Microgrants submission (Arc Studio build, Arc mainnet deploy)

## 1. One sentence

A hackathon team keeps its shared USDC in one room on Arc, and nothing leaves without the room's approval rule.

## 2. Problem

A team that has money together (dues collected, a prize, sponsor credit) manages it in a spreadsheet plus one person's wallet. Three things break:

- Nobody can see the balance without asking that person
- Spending is a DM, so there is no record anyone else can check
- Payouts to teammates are manual transfers with no shared proof

Existing tools are either a personal wallet (single signer, no shared visibility) or a multisig console (correct but unusable for a team of four who just want to pay a vendor and split the rest).

## 3. Why this shape

- The money primitive is the product; the room is just where it is visible
- Every action moves real USDC, which is what the grant is scored on
- No oracle, no market, no order book, so the demo cannot fail for external reasons

## 4. Users and roles

| Role | Description | Can do |
| --- | --- | --- |
| Captain | Creates the room | Everything a member can, plus sets threshold and members at creation |
| Member | Added at room creation (max 8) | Top up, request, approve, execute once approved |
| Payee | External address, no account | Receives funds, appears in the receipt |
| Protocol | Fee treasury address fixed at deploy | Receives the 0.5% fee |

## 5. Scope, v1

In:

- Single-room model. One registry contract, rooms stored as structs, one address for integrators
- Room creation with up to 8 members and an m-of-n approval threshold
- Deposit, anyone may top up a room
- Spend request with payee, amount, memo and optional unlock time
- Approvals, one vote per member, no double counting
- Execution when approvals reach threshold and the unlock time has passed
- Split payout to members by fixed percentages, in one execution
- 0.5% fee on executed payouts, receipt shows it
- Activity feed where every deposit, request, approval and payout is a message with a tx hash link

Out, deliberately:

- Free-form chat. The feed is activity, not conversation. Messaging is post-grant
- TypeScript SDK, MCP server, agent skill, REST API. Submission narrative only, not v1 code
- Cross-chain funding via CCTP or Gateway
- Member removal, room archival, multiple rooms per user, notifications
- Any token other than USDC

## 6. Core flows

1. Captain creates room: name, members, threshold. Room gets an id and shows a zero balance.
2. Any member tops up. Feed gets a deposit message. Header balance updates.
3. A member requests a payout: payee address, amount, memo, optional unlock time. Feed shows a pending card.
4. Other members approve. Card shows "2 of 3" progress.
5. Anyone executes once the threshold is met and the unlock time has passed. Contract pays fee then payee, emits a receipt, feed shows the executed card with amount, payee and explorer link.
6. Split payout: one execution pays the room's configured shares to each member wallet.
7. Timed payout: a request with unlockAt set cannot execute before that timestamp, which covers bounty-after-deadline and vesting-style payouts.
8. Attestation: after a payout executes, the captain marks it delivered or not, with a note saying what arrived. It moves no money, fires once, and the receipt in the feed now carries the outcome. This is what makes the trail evidence rather than a list of transfers.

### 6.1 Walkthrough, three teammates and one payee

0. Landing, no wallet connected. Room preview with sample activity and a Create a room button. No connect wall on first paint
1. Captain connects, creates the room: name, two member addresses, threshold 2 of 3. One signature. Room opens at 0.00 USDC with three avatars and a 2 of 3 badge
2. Invite is the room link. Teammates open it, connect, and are recognised by their address. No signup, no email
3. Top up: any member, one signature, a deposit card lands in the feed, header balance moves (transaction 1)
4. Request: member enters payee, amount, memo. A grey pending card appears reading 0 of 2 approvals
5. Approve: each member signs once on that card. Card reads 1 of 2, then 2 of 2, and Execute enables
6. Execute: anyone signs once. Contract takes the 0.5% fee, pays the payee, card flips to Executed with amount, fee, payee and explorer link
7. Split: shares set once at 50/30/20. Captain enters 0.9 USDC and executes. One signature, three transfers, one card with three lines
8. Timed: a request with unlockAt set collects approvals immediately, Execute stays disabled with a countdown, then fires

Rules that hold everywhere: one signature per state change, one card per action, balance always in the header, approvals always on the card, payee never needs an account.

Design risk sits in steps 0 and 1. An empty room on a first visit is where this reads as a product or as a form.

## 7. Contract interface

```solidity
createRoom(string name, address[] members, uint8 threshold) returns (uint256 roomId)
deposit(uint256 roomId, uint256 amount)
request(uint256 roomId, address to, uint256 amount, string memo, uint64 unlockAt) returns (uint256 requestId)
approve(uint256 roomId, uint256 requestId)
execute(uint256 roomId, uint256 requestId)
attest(uint256 roomId, uint256 requestId, bool delivered, string note)
setShares(uint256 roomId, address[] members, uint16[] bps)   // sums to 10000
payShares(uint256 roomId, uint256 amount)                    // split payout
```

Events: `RoomCreated`, `Deposited`, `Requested`, `Approved`, `Executed`, `FeeTaken`, `Attested`, `SharesPaid`.

`attest` is what makes the trail evidence rather than history. It moves no money, is callable once per executed request, and only by the captain. `delivered` is the outcome, `note` says what arrived. The receipt in the feed shows it, and the room export carries it.

State that must exist: room (name, members, threshold, balances, shares), request (roomId, to, amount, memo, unlockAt, approval count, status).

## 8. Rules and edge cases

- One approval per member per request; a second approval from the same address reverts
- Request status is pending, executed or cancelled. Execute is not idempotent-safe, so status must be checked
- unlockAt of 0 means immediate
- Fee is fixed at deploy, capped at 1%, never mutable by a room
- Amount must be greater than zero; payee must not be the zero address
- Members are fixed at creation in v1, no add or remove
- All amounts are USDC base units. Decimals must be established from the deployed token, not assumed

## 9. Fee model

0.5% of every executed payout, taken by the contract at execution and sent to the treasury address supplied in the constructor. No subscriptions, no seats, no invoices. The fee appears as its own line in the receipt so the room sees what it paid.

## 10. UI

One page, two regions.

- Header: room name, pot balance, "2 of 3" threshold badge, fee note
- Feed: reverse-chronological activity cards. Deposit, request, approval, executed payout. Executed cards carry amount, payee, fee and an explorer link
- Member strip: each member with their approval state on the open request, Approve button when the connected wallet is a member
- Composer: Top up, or Request (payee, amount, memo, optional unlock time)

Empty state must look designed when no wallet is connected: room preview with sample activity, not an error.

## 11. Acceptance criteria

The build is done when all four exist on Arc mainnet, each with a hash:

1. Room created with 3 members and threshold 2, then a 5 USDC deposit
2. Member A requests 1 USDC to an external payee, member B approves, execute pays payee and 0.5% fee
3. Split payout of 0.9 USDC at 50/30/20 to the three member wallets in one execution
4. A request with unlockAt ten minutes out is approved immediately and executed only after unlock

And: the app builds, the preview renders with no wallet connected, and every executed payout shows an explorer link in the feed.

Fifth proof point, same session: the captain attests payout 2 as delivered with a note, and the receipt in the feed shows the outcome next to the tx hash. No funds move in that transaction.

## 12. Submission artifacts

- Arc Studio project URL: https://studio.arc.io/app/ced098e6-0af6-4a13-9c12-dcb4065d2e70
- Live app link
- Contract address plus one example tx hash on explorer.arc.io
- Public repo
- Video walkthrough showing the build in Arc Studio and the mainnet transaction
- Short description of what it does and how Arc Studio was used
- Public builder profile

## 13. Open questions

Resolved, verified against `https://rpc.mainnet.arc.io` on 2026-10-20:
- USDC is the native gas asset (18 decimals) and there is an ERC-20 view at `0x3600000000000000000000000000000000000000` with 6 decimals. `decimals()` returns 6, `symbol()` returns USDC, `eth_chainId` returns 0x13b2 (5042)
- Therefore contract math uses the ERC-20 interface at 6 decimals, and any display of a native balance divides by 1e12

Open:
- The CLI has no push command, so the public repo comes from the Studio web workspace or a manual push of pulled code
- Multi-wallet demo: three distinct addresses must appear on chain, so the demo needs three funded wallets, not one key cycling funds
- Does the Studio preview support switching injected wallets, or does the demo need separate browser profiles

## 14. Positioning

Category: business payment rails with an attestation layer. Never escrow, never agent payments, never a protocol. Those are three pitches with three buyers, and two of them lose.

One sentence, the only one used in copy: a shared USDC account for a team, money goes in, out only with the room's rule, and every payment carries a receipt saying who did the work and whether it landed.

Who it helps: two to five people who share a small pot of USDC and answer to someone outside the group, a funder, a client, a community. The job is to pay an outsider without trusting any single member, and to prove later what each payment was for. The filter that matters: if nobody outside the room will ever ask for the record, a personal wallet is fine and this product is overkill.

Why attestation is the product: custody is commodity. Safe v1.4.1 is deployed on Arc mainnet (verified: 23,579 bytes at the singleton, 3,054 at the proxy factory), so a 2-of-3 shared safe costs nothing and takes two minutes. Escrow products already exist on Arc. What none of them answer is what the money bought. A safe gives a queue and a balance, not an attestation tied to a deliverable.

Evidence behind the lane choice, from Colosseum's corpus of 8,286 projects and 180 prize winners (2.17% win rate):
- Escrow and conditional payouts as a primary category: 106 projects, 0 winners
- Agent payments and marketplaces: 155 projects, 4 winners, all infrastructure, none a product that does a job
- Agent wallets and spend limits: 150 projects, 1 winner
- Stablecoin business rails: 348 projects, 7 winners
- Developer infrastructure: 381 projects, 13 winners

Sustainability, in order of what actually binds:
1. Switching cost from history. A safe shows balances. A room accumulates approved payments with outcomes attached, and that history is what a team loses by leaving
2. A reachable buyer. Arc grant recipients and teams already hold USDC on Arc, the one distribution channel available here. Distribution is what a pure dev-tool play never solved
3. Portability. One EVM contract, so the same product runs on other chains. Survival does not depend on Arc volume

Revenue now is 0.5% of outflow, which is $2.50 on a $500 pot and therefore a demo, not a business. The path is bigger treasuries, where 0.5% of a $50k payout run is $250, then a per-room subscription once the approval history is something a team depends on.

The test that decides whether any of this is real: three Arc teams route their actual payouts through a room for a month. If the receipts replace their spreadsheet, it is a product. If they drift back to a wallet and a group chat, it is a demo, and no amount of SDK fixes that.

## 15. Non-goals for scoring

Do not spend time on: naming debates, a landing page, dark mode toggles, animations, an SDK, or protocol positioning. The grant is scored on USDC moving on mainnet, Arc Studio used across the build, a working product, and where it could go next.
