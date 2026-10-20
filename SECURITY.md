# Security

## Reporting

Email the maintainer through the GitHub profile at [@IanoNjuguna](https://github.com/IanoNjuguna), or use GitHub's private vulnerability reporting on this repository if it is enabled.

Do not open a public issue for a live vulnerability, and do not post exploit details in a PR.

Please include: the affected file or contract, what an attacker gains, the smallest reproduction you can produce, and whether funds are at risk. A proof of concept against a local `forge test` is the most useful form.

## What is in scope

- `contracts/ChattrRooms.sol`: anything that lets someone move a room's USDC without the room's threshold, approve twice, execute outside an unlock window, drain a room through a request from another room, or take the fee the wrong way
- `src/`: anything that misrepresents a payment, shows a balance or receipt that is not on chain, or signs something the user did not see

## What is not in scope

- Deployments on Arc testnet, which hold valueless test USDC
- Findings that require a malicious member to do what their role allows, such as a member voting yes on a payout they agreed to
- Dependency vulnerabilities in `node_modules`. Report those upstream
- The public RPC endpoint. Report that to Circle

## Expectations

- Acknowledgement within a few days. This is a solo project, not a company with a rota
- No bug bounty. There is no treasury for one, and pretending otherwise would waste your time
- Fixes ship before disclosure where funds are at risk. We will credit you unless you prefer otherwise
- Nothing in this contract has been audited by a third party. Treat that as a known limitation, not a claim of safety
