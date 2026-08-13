/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Adaptive tokens — driven by CSS variables, flip automatically with .dark
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",

        // Fixed dark chrome (sidebar, login) — always navy, in both themes
        navy: {
          DEFAULT: "rgb(11 21 48 / <alpha-value>)",
          700: "rgb(19 32 68 / <alpha-value>)",
          800: "rgb(11 21 48 / <alpha-value>)",
          900: "rgb(6 11 28 / <alpha-value>)",
        },

        // Brand blue — primary accent
        primary: {
          50: "rgb(238 244 255 / <alpha-value>)",
          100: "rgb(220 234 255 / <alpha-value>)",
          300: "rgb(143 184 255 / <alpha-value>)",
          400: "rgb(93 145 255 / <alpha-value>)",
          DEFAULT: "rgb(46 110 246 / <alpha-value>)",
          500: "rgb(46 110 246 / <alpha-value>)",
          600: "rgb(29 84 214 / <alpha-value>)",
          700: "rgb(22 64 168 / <alpha-value>)",
        },

        // Bright cyan pop — secondary accent for gradients/highlights
        accent: {
          DEFAULT: "rgb(34 211 238 / <alpha-value>)",
          400: "rgb(34 211 238 / <alpha-value>)",
        },

        // Positive / paid / on-time
        teal: {
          50: "rgb(230 251 246 / <alpha-value>)",
          300: "rgb(111 224 200 / <alpha-value>)",
          DEFAULT: "rgb(20 184 160 / <alpha-value>)",
          500: "rgb(20 184 160 / <alpha-value>)",
          700: "rgb(11 126 108 / <alpha-value>)",
        },

        // Overdue / debt / danger
        rose: {
          50: "rgb(255 236 236 / <alpha-value>)",
          300: "rgb(255 168 168 / <alpha-value>)",
          DEFAULT: "rgb(240 71 63 / <alpha-value>)",
          500: "rgb(240 71 63 / <alpha-value>)",
          700: "rgb(181 36 29 / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(16 25 46 / 0.04), 0 10px 28px -8px rgb(16 25 46 / 0.10)",
        glow: "0 8px 28px -6px rgb(46 110 246 / 0.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2E6EF6 0%, #22D3EE 100%)",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
      },
      animation: {
        blob: "blob 14s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
