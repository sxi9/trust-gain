import { cookies } from "next/headers";
import { db, type Participant } from "./db";

export function cookieName(dealId: string): string {
  return `tg_${dealId}`;
}

/** Resolve the current participant for a deal from the per-deal session cookie. */
export function currentParticipant(dealId: string): Participant | undefined {
  const tok = cookies().get(cookieName(dealId))?.value;
  if (!tok) return undefined;
  const p = db().getParticipantByToken(tok);
  if (!p || p.dealId !== dealId) return undefined;
  return p;
}
