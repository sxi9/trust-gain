/**
 * TrustGain data layer.
 *
 * DATA MINIMIZATION IS THE DESIGN. The types below are the entire data model,
 * and they are deliberately narrow:
 *   - We store verification RESULTS (pass/fail + neutral flags) and provider
 *     reference ids, never raw government IDs, ID/card numbers, selfie images,
 *     biometric templates, or any location history.
 *   - Raw documents and biometrics live only with the licensed provider.
 *   - Results carry an expiry and are swept on every access (short retention).
 *
 * Storage here is a JSON file for local development only. In production this
 * interface should be backed by Postgres (e.g. via Prisma) with encryption at
 * rest and strict access controls.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

export type Role = "creator" | "invitee";
export type ParticipantStatus = "invited" | "active" | "complete" | "declined";
export type ConsentCategory = "connection" | "contact" | "identity" | "payment";
export type VerificationKind = "connection" | "contact" | "identity" | "payment";
export type VerificationStatus = "pending" | "pass" | "fail";
export type CautionLevel = "low" | "medium" | "high";
export type DealStatus = "open" | "both_verified" | "revealed" | "completed" | "cancelled";
export type EscrowStatus = "none" | "held" | "released" | "refunded";

export interface Deal {
  id: string;
  inviteToken: string;
  title: string;
  description: string;
  roughValue: number;
  currency: string;
  requiresPayment: boolean;
  status: DealStatus;
  escrowStatus: EscrowStatus;
  createdAt: string;
}

export interface Participant {
  id: string;
  dealId: string;
  role: Role;
  displayName: string | null;
  statedCountry: string | null;
  token: string;
  status: ParticipantStatus;
  createdAt: string;
}

export interface ConsentReceipt {
  id: string;
  participantId: string;
  category: ConsentCategory;
  granted: boolean;
  policyVersion: string;
  disclosureHash: string; // hash of the exact disclosure text the user saw
  createdAt: string;
}

export interface VerificationResult {
  id: string;
  participantId: string;
  kind: VerificationKind;
  status: VerificationStatus;
  providerRef: string | null; // opaque id from the licensed provider
  summary: Record<string, unknown>; // neutral flags only; safe to show counterparty
  cautionLevel: CautionLevel;
  createdAt: string;
  expiresAt: string; // short retention
}

interface Store {
  deals: Deal[];
  participants: Participant[];
  consents: ConsentReceipt[];
  results: VerificationResult[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const RETENTION_HOURS = 72;

function emptyStore(): Store {
  return { deals: [], participants: [], consents: [], results: [] };
}

function load(): Store {
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
    return {
      deals: parsed.deals ?? [],
      participants: parsed.participants ?? [],
      consents: parsed.consents ?? [],
      results: parsed.results ?? [],
    };
  } catch {
    return emptyStore();
  }
}

function save(store: Store): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

export function newToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function expiryIso(): string {
  return new Date(Date.now() + RETENTION_HOURS * 3600 * 1000).toISOString();
}

// Retention enforcement: drop expired results whenever the store is opened.
function sweepExpired(store: Store): Store {
  const now = Date.now();
  const kept = store.results.filter((r) => new Date(r.expiresAt).getTime() > now);
  if (kept.length !== store.results.length) {
    store.results = kept;
    save(store);
  }
  return store;
}

export function db() {
  const store = sweepExpired(load());
  return {
    createDeal(d: Omit<Deal, "id" | "inviteToken" | "status" | "escrowStatus" | "createdAt">): Deal {
      const deal: Deal = {
        id: newId("deal"),
        inviteToken: newToken(),
        status: "open",
        escrowStatus: "none",
        createdAt: nowIso(),
        ...d,
      };
      store.deals.push(deal);
      save(store);
      return deal;
    },
    getDeal(dealId: string): Deal | undefined {
      return store.deals.find((x) => x.id === dealId);
    },
    updateDeal(dealId: string, patch: Partial<Deal>): void {
      const d = store.deals.find((x) => x.id === dealId);
      if (d) Object.assign(d, patch);
      save(store);
    },

    createParticipant(p: Omit<Participant, "id" | "token" | "createdAt">): Participant {
      const participant: Participant = { id: newId("part"), token: newToken(), createdAt: nowIso(), ...p };
      store.participants.push(participant);
      save(store);
      return participant;
    },
    getParticipant(participantId: string): Participant | undefined {
      return store.participants.find((x) => x.id === participantId);
    },
    getParticipantByToken(tok: string): Participant | undefined {
      return store.participants.find((x) => x.token === tok);
    },
    participantsForDeal(dealId: string): Participant[] {
      return store.participants.filter((x) => x.dealId === dealId);
    },
    updateParticipant(participantId: string, patch: Partial<Participant>): void {
      const p = store.participants.find((x) => x.id === participantId);
      if (p) Object.assign(p, patch);
      save(store);
    },

    recordConsent(c: Omit<ConsentReceipt, "id" | "createdAt">): ConsentReceipt {
      store.consents = store.consents.filter(
        (x) => !(x.participantId === c.participantId && x.category === c.category),
      );
      const receipt: ConsentReceipt = { id: newId("cons"), createdAt: nowIso(), ...c };
      store.consents.push(receipt);
      save(store);
      return receipt;
    },
    consentsForParticipant(participantId: string): ConsentReceipt[] {
      return store.consents.filter((x) => x.participantId === participantId);
    },
    hasConsent(participantId: string, category: ConsentCategory): boolean {
      return store.consents.some(
        (x) => x.participantId === participantId && x.category === category && x.granted,
      );
    },

    saveResult(r: Omit<VerificationResult, "id" | "createdAt">): VerificationResult {
      store.results = store.results.filter(
        (x) => !(x.participantId === r.participantId && x.kind === r.kind),
      );
      const result: VerificationResult = { id: newId("res"), createdAt: nowIso(), ...r };
      store.results.push(result);
      save(store);
      return result;
    },
    resultsForParticipant(participantId: string): VerificationResult[] {
      return store.results.filter((x) => x.participantId === participantId);
    },
  };
}
