import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        paper: "var(--paper)",
        bg: "var(--bg)",
        brand: "var(--brand)",
        green: "var(--green)",
        "green-soft": "var(--green-soft)",
        amber: "var(--amber)",
        "amber-soft": "var(--amber-soft)",
        red: "var(--red)",
        "red-soft": "var(--red-soft)",
        gold: "var(--gold)",
        "gold-soft": "var(--gold-soft)",
        purple: "var(--purple)",
        "purple-soft": "var(--purple-soft)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
