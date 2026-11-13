"use client";

import { useState } from "react";

export interface ConsentCatalogItem {
  category: string;
  title: string;
  biometric: boolean;
  disclosure: string;
}

export default function ConsentGate({
  catalog,
  requiresPayment,
  onConsent,
  busy,
}: {
  catalog: ConsentCatalogItem[];
  requiresPayment: boolean;
  onConsent: (items: { category: string; granted: boolean }[]) => void;
  busy: boolean;
}) {
  const items = catalog.filter((c) => c.category !== "payment" || requiresPayment);
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.category, !i.biometric])),
  );

  const anyChecked = Object.values(checked).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="card p-4 bg-[#0d1527]">
        <div className="font-semibold">Before anything is collected</div>
        <p className="text-muted text-sm mt-1">
          You choose what to share. Nothing runs until you agree below, and the other person
          agrees to the same list. You can decline any item and still proceed with the rest.
          Your choices are logged as a consent receipt.
        </p>
      </div>

      {items.map((item) => (
        <label
          key={item.category}
          className={`card p-4 block cursor-pointer ${item.biometric ? "border-brand" : ""}`}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!checked[item.category]}
              onChange={(e) => setChecked((s) => ({ ...s, [item.category]: e.target.checked }))}
            />
            <div>
              <div className="font-semibold text-sm">
                {item.title}
                {item.biometric && (
                  <span className="ml-2 text-xs text-brand border border-brand rounded px-1.5 py-0.5">
                    separate biometric consent
                  </span>
                )}
              </div>
              <div className="text-muted text-sm mt-1 leading-relaxed">{item.disclosure}</div>
            </div>
          </div>
        </label>
      ))}

      <button
        className="btn btn-primary"
        disabled={busy || !anyChecked}
        onClick={() => onConsent(items.map((i) => ({ category: i.category, granted: !!checked[i.category] })))}
      >
        {busy ? "Saving…" : "Agree to the ticked checks & continue"}
      </button>
    </div>
  );
}
