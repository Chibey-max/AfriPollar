# Contract Architecture

AfriPollar's MVP does not require a custom Soroban contract.

The hackathon target is best served by proving:

```text
local African funding intent -> Pollar wallet -> Stellar/USDC settlement -> Bolivia payout readiness
```

Pollar already handles the wallet, trustline, sponsorship, payment, and transaction-history layer. Adding a custom contract before the corridor is proven would increase risk without improving the demo.

## When Contracts Become Useful

Custom Soroban contracts may be added later for:

- Escrowed agent settlement.
- Agent bond/slashing.
- On-chain corridor receipt registry.
- Programmable payout release rules.
- Milestone-based merchant payouts.

## MVP Decision

For the hackathon MVP:

```text
No custom contract is required.
Use Pollar and Stellar payment primitives first.
Keep contracts/ ready for a post-MVP extension.
```

