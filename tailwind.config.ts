import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        panel: "#111a2e",
        edge: "#1e2a44",
        brand: "#4f8cff",
        good: "#2fbf71",
        warn: "#e0a73b",
        bad: "#e5575f",
        muted: "#8aa0c6",
      },
    },
  },
  plugins: [],
};
export default config;
