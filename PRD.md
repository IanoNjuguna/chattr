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

## 7. Contract interface

```solidity
createRoom(string name, address[] members, uint8 threshold) returns (uint256 roomId)
deposit(uint256 roomId, uint256 amount)
request(uint256 roomId, address to, uint256 amount, string memo, uint64 unlockAt) returns (uint256 requestId)
approve(uint256 roomId, uint256 requestId)
execute(uint256 roomId, uint256 requestId)
setShares(uint256 roomId, address[] members, uint16[] bps)   // sums to 10000
payShares(uint256 roomId, uint256 amount)                    // split payout
```

Events: `RoomCreated`, `Deposited`, `Requested`, `Approved`, `Executed`, `FeeTaken`, `SharesPaid`.

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

## 12. Submission artifacts

- Arc Studio project URL: https://studio.arc.io/app/ced098e6-0af6-4a13-9c12-dcb4065d2e70
- Live app link
- Contract address plus one example tx hash on explorer.arc.io
- Public repo
- Video walkthrough showing the build in Arc Studio and the mainnet transaction
- Short description of what it does and how Arc Studio was used
- Public builder profile

## 13. Open questions

- Is USDC on Arc an ERC-20 at a fixed address, or the native gas token with an ERC-20 view? Decimals must be confirmed on chain before any transfer math is written
- The CLI has no push command, so the public repo comes from the Studio web workspace or a manual push of pulled code
- Multi-wallet demo: three distinct addresses must appear on chain, so the demo needs three funded wallets, not one key cycling funds
- Does the Studio preview support switching injected wallets, or does the demo need separate browser profiles

## 14. Non-goals for scoring

Do not spend time on: naming debates, a landing page, dark mode toggles, animations, an SDK, or protocol positioning. The grant is scored on USDC moving on mainnet, Arc Studio used across the build, a working product, and where it could go next.
