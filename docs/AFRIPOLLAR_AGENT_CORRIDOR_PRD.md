# AfriPollar Agent Corridor PRD

## 1. Executive Summary

AfriPollar Agent Corridor is a Pollar-powered cross-border payment product for the Pollar Hackathon: Build on Pollar.

The product lets a user in an African market create a local funding intent through bank transfer, mobile money, or a verified agent, then settle value through Pollar on Stellar using USDC and prepare payout into Latin America, starting with Bolivia.

The core idea is simple:

```text
African sender -> local rail or agent -> Pollar wallet -> Stellar/USDC settlement -> Bolivia payout path
```

The MVP should be a polished, demo-ready product that proves a real corridor flow rather than pretending to be a complete regulated remittance company.

## 2. Hackathon Context

Hackathon:

```text
Pollar Hackathon: Build on Pollar
```

Organizer/platform:

```text
Boundless
```

Sponsor/product:

```text
Pollar
```

Timeline:

```text
Hackathon starts: September 16, 2026, 1:00 PM UTC
Registration closes: September 18, 2026, 1:00 PM UTC
Submission deadline: September 18, 2026, 1:00 PM UTC
Judging: September 19, 2026
Winners announced: September 19, 2026, 4:59 PM UTC
```

In Africa/Lagos time, the submission deadline is:

```text
September 18, 2026, 2:00 PM Africa/Lagos
```

Prize:

```text
500 USDC across 1 track and 3 awards
1st: 250 USDC
2nd: 150 USDC
3rd: 100 USDC
```

Track:

```text
Best Pollar Integration
```

Judging emphasis from the hackathon page:

```text
Working end-to-end payment flow
SDK integration quality
Proof of real usage
Project clarity
```

Important sponsor direction:

```text
Build any app on Pollar, or take on the flagship challenge: build the African leg of a corridor between Africa and Latin America.
Pollar runs the Latin America side, landing in Bolivia on the live BOB ramp.
The builder should create the path for a user in an African country to fund or cash out through local rails and connect it to Pollar.
Sandbox or documented semi-manual flow is acceptable if the path exists and is well designed.
```

## 3. Research Summary

Primary sources reviewed:

- Pollar docs: https://docs.pollar.xyz
- Pollar GitHub: https://github.com/pollar-xyz/pollar
- `@pollar/core`: https://www.npmjs.com/package/@pollar/core
- `@pollar/react`: https://www.npmjs.com/package/@pollar/react
- Hackathon page: https://boundlessfi.xyz/hackathons/pollar-hackathon-build-on-pollar

Key Pollar positioning:

```text
Pollar is onboarding-to-payment infrastructure for consumer apps on Stellar.
It handles social login, wallet onboarding, sponsored fees, trustlines, transaction history, payments UI, ramps, swaps, earn, and agent/x402 style payment flows.
```

Relevant Pollar capabilities:

- Wallet onboarding and activation.
- Authentication through Pollar SDK.
- Stellar wallet creation.
- Sponsored fees.
- Trustline setup.
- USDC payments.
- Payment send/receive UI.
- Transaction history.
- Ramps and Pollar Pay concepts.
- Earn integrations through Blend and DeFindex.
- x402 / agent payments narrative.
- Server-side policy controls.
- Dashboard-managed funding, sponsorship, domains, API keys, and treasury config.

Current npm versions observed:

```text
@pollar/core 0.11.3
@pollar/react 0.11.3
```

Basic installation:

```bash
npm install @pollar/react @pollar/core
```

## 4. Product Name

Recommended name:

```text
AfriPollar Agent Corridor
```

Short name:

```text
AfriPollar
```

One-liner:

```text
AfriPollar lets African users fund transfers through local rails or agents, settle through Pollar on Stellar, and route payouts toward Bolivia.
```

## 5. Problem Statement

Cross-border payment corridors between Africa and Latin America are hard to use and hard to trust.

Users face:

- No direct consumer-friendly payment corridor between many African countries and Bolivia.
- Expensive or slow bank transfers.
- Informal agent networks without clear proof.
- Crypto onboarding complexity.
- Wallet addresses, gas fees, trustlines, reserves, and transaction signing.
- Poor transfer visibility.
- No clean recipient claim experience.

Pollar solves the blockchain abstraction layer. AfriPollar solves the local funding and corridor UX layer.

## 6. Product Thesis

The winning product should not be a generic remittance app.

It should be a corridor operating layer:

```text
Pollar handles wallet onboarding, sponsored Stellar operations, USDC settlement, and payment infrastructure.
AfriPollar handles African local funding, agent confirmation, route clarity, recipient claim UX, and corridor proof.
```

The product wins by being:

- Narrow.
- Realistic.
- Sponsor-aligned.
- Demoable.
- Honest about live vs sandbox/manual pieces.
- Polished enough that judges can understand it in under 3 minutes.

## 7. Target Users

### Primary User

An African sender who wants to pay someone in Bolivia or Latin America without understanding crypto.

### Secondary Users

- Local African agents who confirm cash, bank, or mobile-money payments.
- Bolivian recipients waiting for payout.
- Small businesses buying from Latin America.
- Freelancers or teams receiving cross-border payments.
- Hackathon judges evaluating corridor feasibility.

### Personas

#### 1. Nigerian Founder

Needs to pay a Bolivian contractor or supplier. Wants a simple payment flow and clear proof.

#### 2. Ghanaian Marketplace Buyer

Needs to pay a vendor outside Africa using local money. Does not want to manage wallets manually.

#### 3. Local Agent

Receives local bank/mobile money/cash payments and confirms them for corridor settlement.

#### 4. Bolivian Recipient

Needs a clear claim page showing payout status, amount, sender, and proof.

## 8. MVP Definition

The MVP is a working, deployed, demo-ready app that supports:

- Pollar wallet onboarding/login.
- Transfer creation from Africa to Bolivia.
- Local funding method selection.
- Agent/manual funding confirmation.
- Pollar/Stellar settlement proof or settlement-ready simulation.
- Transfer receipt.
- Recipient claim page.
- Admin/agent dashboard.
- Honest sandbox/live labels.
- Clear README and demo script.

The MVP does not need:

- Production KYC.
- Real bank API automation.
- Real mobile money API automation.
- Production compliance.
- Fully automated FX.
- Production-grade treasury operations.

The hackathon explicitly allows sandbox or documented semi-manual flow if the route is well designed.

## 9. Product Differentiators

### 9.1 Agent-Assisted Settlement

Instead of pretending every African rail is fully automated, AfriPollar models how emerging-market payments often work:

```text
Sender pays locally -> verified agent confirms receipt -> Pollar/Stellar settlement proceeds -> recipient payout becomes ready
```

This is realistic, sponsor-aligned, and easier to demo.

### 9.2 Corridor Proof Timeline

The core visual feature is a transfer timeline:

```text
Transfer created
Local funding pending
Local funding confirmed
Pollar wallet active
USDC settlement initiated
Stellar transaction confirmed
Bolivia payout ready
Recipient notified
```

This makes the corridor leg understandable in seconds.

### 9.3 Recipient Claim Page

Most teams will focus only on sender flow. AfriPollar should include:

```text
/claim/:transferId
```

The recipient can see:

- Sender.
- Amount.
- Status.
- Payout path.
- Transaction proof.
- Support/fallback instructions.

### 9.4 Sandbox Honesty

The app should clearly label:

```text
Live Pollar/Stellar
Sandbox local rail
Manual agent confirmation
```

This builds trust with judges.

### 9.5 Optional AI Quote Assistant

If time allows:

```text
"Send 50 USDC equivalent from Lagos to Bolivia"
```

The assistant returns:

- Suggested route.
- Funding method.
- Estimated time.
- Fee estimate.
- Required next step.

This supports Pollar's agent/x402 narrative but should not distract from the core flow.

## 10. Core User Journey

### Sender Flow

1. Sender opens AfriPollar.
2. Sender connects or creates wallet through Pollar.
3. Sender selects origin country.
4. Sender selects destination country.
5. Sender enters recipient details.
6. Sender enters amount.
7. App shows route preview.
8. Sender chooses funding rail.
9. App creates transfer intent.
10. Sender receives local payment instructions.
11. Sender pays locally.
12. Agent confirms local payment.
13. App updates settlement state.
14. App shows receipt and proof.
15. Recipient opens claim page.

### Agent Flow

1. Agent opens dashboard.
2. Agent sees pending transfer intents.
3. Agent verifies local payment reference.
4. Agent marks funding as received.
5. Agent attaches confirmation note/reference.
6. App moves transfer to settlement stage.

### Recipient Flow

1. Recipient opens claim link.
2. Recipient sees transfer summary.
3. Recipient sees payout status.
4. Recipient sees local payout instructions.
5. Recipient sees Stellar/Pollar proof.

## 11. Supported Corridors

MVP corridor:

```text
Nigeria -> Bolivia
```

Secondary demo corridors:

```text
Ghana -> Bolivia
Kenya -> Bolivia
```

Destination should remain Bolivia for hackathon clarity, because Pollar's challenge names Bolivia and the BOB ramp.

## 12. Supported Funding Rails

MVP funding rails:

```text
Bank transfer
Mobile money
P2P agent
```

Each rail can be sandboxed/manual:

- Bank transfer: show account details/reference code.
- Mobile money: show phone/account and reference code.
- Agent: show agent name, city, and instructions.

## 13. Product Requirements

### 13.1 Wallet Onboarding

Requirements:

- Integrate Pollar Provider.
- Allow user to authenticate/connect.
- Show wallet status.
- Show wallet address.
- Show balance/history if available.
- Use Pollar prebuilt UI where possible.

Acceptance criteria:

- User can initiate a Pollar wallet/login flow.
- UI displays connected/ready state.
- App can show wallet address or session state.

### 13.2 Transfer Creation

Fields:

```text
Sender country
Recipient country
Recipient name
Recipient phone/email
Amount
Funding method
Purpose/note
```

Acceptance criteria:

- User can create a transfer.
- Transfer receives unique ID.
- Transfer starts in `awaiting_local_funding`.
- Transfer can be opened from dashboard/history.

### 13.3 Route Preview

Must show:

```text
Source amount
Estimated USDC amount
Destination payout currency: BOB
Funding method
Estimated fee
Estimated settlement time
Pollar wallet state
Network: Stellar
Mode: Sandbox or Live
```

Acceptance criteria:

- User understands route before creating transfer.
- Route includes local rail and Pollar/Stellar step.

### 13.4 Local Funding Instructions

Must show:

```text
Payment intent ID
Funding rail
Payment instructions
Reference code
Expiry timer
Upload/reference input
```

Acceptance criteria:

- User receives a clear next step.
- Agent/admin can match payment using reference.

### 13.5 Agent Dashboard

Agent/admin can:

- View pending transfers.
- View funding reference.
- Mark funding received.
- Attach note.
- Advance status.
- View receipt link.

Acceptance criteria:

- Agent can move transfer from `awaiting_local_funding` to `local_funding_confirmed`.
- UI shows confirmation time and agent ID/name.

### 13.6 Settlement Step

For MVP, settlement can be:

1. Live Pollar/Stellar send if keys and funding are ready.
2. Sandbox/manual settlement with proof-ready state if live settlement is blocked.

Must show:

```text
Pollar wallet address
Settlement asset: USDC
Network: Stellar
Transaction hash if available
Explorer link if available
```

Acceptance criteria:

- Demo can show a completed settlement path.
- App clearly labels live vs sandbox mode.

### 13.7 Receipt

Receipt must include:

- Transfer ID.
- Route ID.
- Sender country.
- Recipient country.
- Amount.
- Asset.
- Funding method.
- Agent confirmation.
- Wallet address.
- Transaction hash/link if available.
- Status timeline.
- Timestamp.

Acceptance criteria:

- Receipt can be shared.
- Receipt explains what happened without needing a verbal walkthrough.

### 13.8 Recipient Claim Page

URL:

```text
/claim/:transferId
```

Must show:

- Amount.
- Sender.
- Recipient.
- Status.
- Local payout status.
- Payout instructions.
- Proof/transaction link.

Acceptance criteria:

- Claim page works without logging in.
- Claim page is polished and mobile-friendly.

## 14. Data Model

### Transfer

```ts
type Transfer = {
  id: string;
  routeId: string;
  senderName?: string;
  senderCountry: "NG" | "GH" | "KE";
  recipientName: string;
  recipientCountry: "BO";
  recipientContact: string;
  sourceAmount: number;
  sourceCurrency: "NGN" | "GHS" | "KES";
  settlementAmount: number;
  settlementAsset: "USDC";
  payoutCurrency: "BOB";
  fundingMethod: "bank_transfer" | "mobile_money" | "agent";
  mode: "sandbox" | "live";
  status:
    | "created"
    | "awaiting_local_funding"
    | "local_funding_confirmed"
    | "wallet_ready"
    | "settlement_pending"
    | "settled_on_stellar"
    | "payout_ready"
    | "completed"
    | "failed";
  pollarWalletAddress?: string;
  stellarTxHash?: string;
  stellarExplorerUrl?: string;
  agentId?: string;
  localPaymentReference?: string;
  confirmationNote?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Agent

```ts
type Agent = {
  id: string;
  name: string;
  country: "NG" | "GH" | "KE";
  city: string;
  rail: "bank_transfer" | "mobile_money" | "cash";
  rating: number;
  available: boolean;
};
```

### Route

```ts
type Route = {
  id: string;
  fromCountry: "NG" | "GH" | "KE";
  toCountry: "BO";
  sourceCurrency: "NGN" | "GHS" | "KES";
  settlementAsset: "USDC";
  payoutCurrency: "BOB";
  estimatedFee: number;
  estimatedTimeMinutes: number;
  mode: "sandbox" | "live";
};
```

### FundingInstruction

```ts
type FundingInstruction = {
  id: string;
  transferId: string;
  method: "bank_transfer" | "mobile_money" | "agent";
  displayName: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  phoneNumber?: string;
  agentName?: string;
  referenceCode: string;
  expiresAt: string;
};
```

## 15. Recommended Tech Stack

Fastest reliable stack:

```text
Next.js
TypeScript
Tailwind CSS
@pollar/react
@pollar/core
localStorage for MVP persistence
Vercel deployment
```

Optional upgrade:

```text
Supabase for persistence
```

Recommendation:

Start with localStorage to ship quickly. Add Supabase only if the main demo flow is already complete.

## 16. Pollar Integration Plan

Install:

```bash
npm install @pollar/react @pollar/core
```

Use:

```tsx
import { PollarProvider, WalletButton, usePollar } from "@pollar/react";
import "@pollar/react/styles.css";
```

Core integration areas:

- Wrap app in `PollarProvider`.
- Configure publishable key.
- Use `WalletButton` for fastest authentication UX.
- Use `usePollar()` for session/wallet state.
- Add send/receive/history/balance modal entry points if available.
- Show Pollar wallet address and status in transfer flow.

Potential Pollar UI:

```text
WalletButton
SendModal
ReceiveModal
TxHistoryModal
WalletBalanceModal
RampWidget
```

Environment variables:

```text
NEXT_PUBLIC_POLLAR_API_KEY=
```

## 17. Page Structure

Recommended routes:

```text
/                       Landing/dashboard
/transfer/new           Create transfer
/transfer/:id           Transfer status and receipt
/claim/:id              Recipient claim page
/agent                  Agent/admin dashboard
/settings               Wallet/app settings
```

## 18. UI / UX Direction

The design should feel:

- Financial.
- Trustworthy.
- Fast.
- Cross-border.
- Mobile-first.
- Polished enough for a live demo.

Visual elements:

- Corridor line from Africa to Bolivia.
- Country chips.
- Currency chips.
- Timeline.
- Receipt card.
- Agent confirmation card.
- Wallet status badge.
- Sandbox/live badge.

Avoid:

- Generic crypto dashboard clutter.
- Overly technical wallet-first UI.
- Fake production claims.
- Too many countries or features.

## 19. Demo Flow

Target demo length:

```text
2-3 minutes
```

Script:

1. Open AfriPollar.
2. Explain: "We built the African leg of the Pollar corridor."
3. Connect wallet through Pollar.
4. Start transfer.
5. Choose Nigeria -> Bolivia.
6. Enter recipient and amount.
7. Show route preview.
8. Select local bank transfer or agent.
9. Create transfer intent.
10. Show funding instructions.
11. Switch to agent dashboard.
12. Confirm local funding.
13. Show timeline advancing.
14. Show Pollar/Stellar settlement proof or sandbox settlement state.
15. Open receipt.
16. Open recipient claim page.
17. End with architecture: "Pollar handles wallet and Stellar complexity; AfriPollar handles local funding and corridor UX."

## 20. Submission Copy

Project title:

```text
AfriPollar Agent Corridor
```

Short description:

```text
AfriPollar builds the African leg of Pollar's Africa-to-Latin-America corridor. It lets users create a local funding intent through bank transfer, mobile money, or a verified agent, then routes settlement through Pollar on Stellar using USDC and prepares payout into Bolivia.
```

Long description:

```text
AfriPollar Agent Corridor is a Pollar-powered payment corridor for African users who need to pay recipients in Bolivia or Latin America. The product combines local African funding rails, verified agent confirmation, Pollar wallet onboarding, Stellar/USDC settlement, transfer receipts, and recipient claim pages.

The MVP demonstrates a complete corridor flow: a sender connects through Pollar, creates a Nigeria-to-Bolivia transfer, receives local funding instructions, an agent confirms payment, settlement status advances through Pollar/Stellar, and the recipient receives a claim page with payout status and proof.

Because direct African local-rail APIs are not always available, the MVP uses an honest sandbox/manual agent model for the African leg while keeping the Pollar/Stellar settlement layer explicit and verifiable.
```

## 21. README Outline

The project README should include:

```text
# AfriPollar Agent Corridor

## What it does
## Why it matters
## How it uses Pollar
## Live vs sandbox components
## User flow
## Tech stack
## Setup
## Environment variables
## Demo steps
## Known limitations
## Future roadmap
```

## 22. Build Plan

### Phase 1: Scaffold

- Create app.
- Add Tailwind.
- Add basic layout.
- Add route structure.
- Add Pollar packages.
- Add env handling.

### Phase 2: Pollar Integration

- Add `PollarProvider`.
- Add wallet connect.
- Add wallet state display.
- Add balance/history UI if available.
- Add receive/send modals if available.

### Phase 3: Corridor Flow

- Build create transfer form.
- Build route preview.
- Build funding instructions.
- Persist transfer.

### Phase 4: Agent Dashboard

- List pending transfers.
- Confirm local funding.
- Add agent notes.
- Advance transfer state.

### Phase 5: Receipt and Claim

- Build transfer detail page.
- Build timeline.
- Build receipt card.
- Build recipient claim page.

### Phase 6: Polish

- Improve mobile layout.
- Add empty/loading/error states.
- Add demo seed data.
- Add README.
- Deploy.
- Record demo.

## 23. Priority Matrix

### Must Have

- Pollar integration.
- Transfer creation.
- Route preview.
- Local funding intent.
- Agent confirmation.
- Receipt/timeline.
- Recipient claim page.
- Deployment.
- README.

### Should Have

- Balance modal.
- Transaction history.
- Explorer link.
- Sandbox/live mode badge.
- Demo data reset.

### Nice To Have

- AI quote assistant.
- PDF receipt.
- Supabase persistence.
- Multiple agents.
- Analytics dashboard.

## 24. Risks and Mitigations

### Risk: Pollar API key access is delayed

Mitigation:

- Build UI and app state first.
- Add Pollar integration behind env flag.
- Use demo mode if key is missing.

### Risk: Live Stellar payment is hard to complete

Mitigation:

- Use Pollar prebuilt components.
- Show wallet and settlement-ready path.
- Clearly document sandbox vs live.

### Risk: Scope expands too much

Mitigation:

- Keep destination fixed to Bolivia.
- Support only 2-3 African countries.
- Use only 3 funding rails.
- Keep agent confirmation simple.

### Risk: Judges see it as fake

Mitigation:

- Be honest about sandbox/manual rails.
- Show real Pollar/Stellar integration where possible.
- Show clear proof artifacts.

## 25. Acceptance Criteria

The project is ready to submit when:

- Deployed link works.
- User can connect Pollar wallet or see clear demo mode.
- User can create transfer.
- User can view funding instructions.
- Agent can confirm funding.
- Transfer timeline updates.
- Receipt page works.
- Claim page works.
- README explains setup and architecture.
- Demo script can be completed in under 3 minutes.

## 26. Future Roadmap

After hackathon:

- Add real mobile money provider integration.
- Add Nigerian bank transfer verification.
- Add agent identity and limits.
- Add Supabase/Postgres persistence.
- Add Pollar ramp integration when available.
- Add live BOB payout testing with Pollar team.
- Add KYC-gated deferred wallet activation.
- Add production monitoring and compliance logs.
- Add more countries.
- Add merchant payout API.
- Add x402 agent payment flow.

## 27. Final Positioning

AfriPollar is not just another remittance interface. It is a corridor operating layer for markets where local payment rails are fragmented.

Pollar handles wallet onboarding, Stellar settlement, and payment infrastructure.

AfriPollar handles local funding, agent confirmation, transfer clarity, and recipient experience.

That combination directly answers the hackathon's flagship challenge and gives the project a strong chance to stand out.

