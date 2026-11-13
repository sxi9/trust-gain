# TrustGain — "Know Your Stranger"

A consent-first, **mutual** peer-to-peer trust-verification app. Two strangers who are
about to do a transaction or business deal each verify themselves through the **same**
flow before money or goods change hands. Each sees the other's result at the **same
moment**. Nobody is secretly checked.

This is an MVP scaffold. Identity, payments, and risk signals run on built-in **mock
providers** so the whole flow works with no accounts; real licensed providers slot in
behind the same interfaces.

## Design principles (enforced in code, not just documented)

1. **Consent is the gate.** No signal is collected until the participant has a granted
   consent receipt for that category. Verification endpoints return `403` otherwise.
2. **Mutual and symmetric.** Both parties complete the identical, disclosed flow. The
   biometric (ID + liveness) step is a separate, unbundled consent.
3. **Simultaneous reveal.** Neither trust card is disclosed until **both** participants
   are complete. One-sided "x-ray the other person" is impossible by construction.
4. **Data minimization.** The app stores only pass/fail results, neutral risk flags, and
   opaque provider reference tokens — **never** raw government IDs, selfies, biometric
   templates, card data, or any location history. Results carry a short expiry and are
   swept on every access.

## What it never does

- No covert webcam, microphone, screen, contacts, or browser-profile capture.
- No live or continuous location tracking. A one-time, disclosed connection check only.
- No one-sided link that verifies a person without their matching consent.
- No storing of raw IDs, biometrics, or card numbers.

## The flow

1. **Create a deal** and send one invite link.
2. **Consent gate** — each side agrees, per category, to exactly what is collected.
3. **Checks** — connection/device signals, email/phone, and (optional) government ID +
   liveness through a licensed provider's hosted capture (images go to the provider,
   never to TrustGain).
4. **Finish** — a side is "complete" only when every consented check passes.
5. **Simultaneous reveal** — both trust cards unlock together; either side can walk away.
6. **Escrow** (money deals) — funds held by a licensed provider until both confirm;
   release/refund by fixed rules, never platform discretion.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Create a deal in one browser, copy the invite link, open it in a second browser (or a
private window) to play the other party, and take both sides through to the reveal.

## Tech

- **Next.js (App Router) + TypeScript + Tailwind.**
- **Storage:** a local JSON file (`data/`, git-ignored) for development. The `src/lib/db.ts`
  interface is the whole data model — swap it for Postgres (e.g. Prisma) in production.
- **Providers:** `src/lib/providers/` defines `RiskProvider`, `IdentityProvider`, and
  `EscrowProvider`. Mocks are shaped like **SEON**, **Stripe Identity**, and **Stripe
  Connect**. Set the relevant env keys (see `.env.example`) and swap the mock for a real
  client in `src/lib/providers/index.ts`.

## Recommended real providers (from research; confirm pricing/terms directly)

| Role | MVP pick | Scale-up |
|---|---|---|
| Identity + liveness | Stripe Identity (raw media never returned to you) | Persona, Sumsub (NFC/AML) |
| Escrow / payments | Stripe Connect (manual payouts) | Escrow.com (high value), Mangopay (EU) |
| Risk signals | SEON (VPN/device/email/phone, explainable) | + Fingerprint |

## Before any real launch

This is not legal advice. A production launch needs counsel and, at minimum:

- A GDPR Art. 35 **DPIA**; explicit, unbundled consent for ID/biometrics; **DPAs** with
  every provider.
- US biometric-law handling (Illinois **BIPA** and similar): written notice + release
  before capture, published retention/destruction schedule.
- Keep face matching strictly **1:1** (verify, not identify) to stay out of the EU AI
  Act's high-risk category.
- **Do not take custody of funds.** Let the licensed escrow/PSP be the regulated party, or
  you trip FinCEN MSB registration and state money-transmitter licensing. Keep holds
  short; release by fixed rules; never adjudicate disputes yourself.
- Age-gate to 18+. All-party consent for any recorded video call.
