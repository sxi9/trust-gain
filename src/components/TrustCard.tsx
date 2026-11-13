"use client";

type Tone = "neutral" | "caution";
type Caution = "low" | "medium" | "high";

interface Flag {
  label: string;
  value: string;
  tone: Tone;
  note: string;
}
interface Result {
  kind: string;
  status: "pending" | "pass" | "fail";
  cautionLevel: Caution;
  summary: any;
}
export interface CardData {
  displayName: string | null;
  status: string;
  role: string;
  caution: Caution;
  results: Result[];
}

function CautionPill({ level }: { level: Caution }) {
  const map: Record<Caution, [string, string]> = {
    low: ["Low caution", "text-good border-good"],
    medium: ["Some caution", "text-warn border-warn"],
    high: ["High caution", "text-bad border-bad"],
  };
  const [label, cls] = map[level];
  return <span className={`text-xs border rounded-full px-2 py-0.5 ${cls}`}>{label}</span>;
}

function FlagRow({ f }: { f: Flag }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-t border-edge first:border-t-0">
      <div>
        <div className="text-sm">{f.label}</div>
        <div className="text-xs text-muted">{f.note}</div>
      </div>
      <div className={`text-sm text-right ${f.tone === "caution" ? "text-warn" : "text-good"}`}>{f.value}</div>
    </div>
  );
}

export default function TrustCard({ title, card }: { title: string; card: CardData }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">{title}</div>
          <div className="font-semibold">{card.displayName || "Unnamed"}</div>
        </div>
        <CautionPill level={card.caution} />
      </div>

      <div className="space-y-3">
        {card.results.map((r) => {
          if (r.kind === "identity") {
            const s = r.summary || {};
            return (
              <div key={r.kind} className="rounded-lg border border-edge p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Identity</div>
                  <span className={r.status === "pass" ? "text-good text-sm" : "text-bad text-sm"}>
                    {r.status === "pass" ? "Verified" : "Not verified"}
                  </span>
                </div>
                {r.status === "pass" && (
                  <div className="text-xs text-muted mt-1">
                    {s.verifiedName} · {s.country}
                  </div>
                )}
                <div className="mt-2 space-y-0.5">
                  {(s.checks || []).map((c: any) => (
                    <div key={c.label} className="flex justify-between text-xs">
                      <span className="text-muted">{c.label}</span>
                      <span>{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          const flags: Flag[] = (r.summary?.flags as Flag[]) || [];
          return (
            <div key={r.kind} className="rounded-lg border border-edge p-3">
              <div className="text-sm font-semibold capitalize mb-1">{r.kind}</div>
              {flags.map((f, i) => (
                <FlagRow key={i} f={f} />
              ))}
            </div>
          );
        })}
        {card.results.length === 0 && <div className="text-muted text-sm">No checks completed.</div>}
      </div>
    </div>
  );
}
