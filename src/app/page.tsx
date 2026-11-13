import CreateDealForm from "@/components/CreateDealForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <div className="text-brand font-bold tracking-wide">TRUSTGAIN</div>
        <h1 className="text-3xl font-bold mt-1">Know your stranger, before you deal.</h1>
        <p className="text-muted mt-3 leading-relaxed">
          About to send money or goods to someone you have never met? Create a deal, send one link,
          and both of you verify through the <strong>same</strong> flow. You each see the other&apos;s
          result at the same moment. Nobody is secretly checked.
        </p>
      </header>

      <section className="card p-5 mb-8">
        <h2 className="font-semibold mb-4">Start a trust check</h2>
        <CreateDealForm />
      </section>

      <section className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          ["1. Consent first", "Before anything is collected, you both see exactly what is checked and agree to it, step by step."],
          ["2. Verify mutually", "Identity runs through a licensed provider. Risk flags come from your connection and contacts, disclosed up front."],
          ["3. Reveal together", "Both trust cards unlock at the same instant. Either side can walk away, no penalty."],
        ].map(([t, b]) => (
          <div key={t} className="card p-4">
            <div className="font-semibold text-sm">{t}</div>
            <div className="text-muted text-sm mt-1">{b}</div>
          </div>
        ))}
      </section>

      <section className="card p-5 border-edge">
        <h2 className="font-semibold mb-2">What TrustGain never does</h2>
        <ul className="text-muted text-sm space-y-1 list-disc pl-5">
          <li>No secret webcam, microphone, screen, contacts, or browser-profile capture.</li>
          <li>No live or continuous location tracking. A one-time, disclosed connection check only.</li>
          <li>No one-sided links that check a person without their matching consent.</li>
          <li>No storing raw IDs, selfies, biometrics, or card numbers. Only pass/fail results and neutral flags.</li>
        </ul>
      </section>

      <footer className="text-muted text-xs mt-8">
        Prototype. Identity, payments, and risk run on mock providers until licensed keys are configured.
        Not legal advice; a real launch needs counsel, a DPIA, and signed provider agreements.
      </footer>
    </main>
  );
}
