import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustGain — Know Your Stranger",
  description: "Consent-first, mutual trust verification before you deal with a stranger.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
