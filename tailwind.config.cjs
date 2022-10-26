const plugin = require("tailwindcss/plugin");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{html,js}"],
  darkMode: ["class"],
  theme: {
    screens: {
      xs: "360px",
      ...defaultTheme.screens,
    },
    groups: ["nested"],
    extend: {
      fontFamily: {
        sans: ["Inter"],
      },
      boxShadow: {
        xs: "0 1px 2px rgb(16 24 40 / 0.05)",
        sm: "0 1px 3px rgb(16 24 40 / 0.1), 0 1px 2px rgb(16 24 40 / 0.06)",
        md: "0 4px 8px -2px rgb(16 24 40 / 0.1), 0 2px 4px -2px rgb(16 24 40 / 0.06)",
        lg: "0 12px 16px -4px rgb(16 24 40 / 0.08), 0 4px 6px -2px rgb(16 24 40 / 0.03)",
        xl: "0 20px 24px -4px rgb(16 24 40 / 0.08), 0 8px 8px -4px rgb(16 24 40 / 0.03)",
        "2xl": "0 24px 48px -12px rgb(16 24 40 / 0.18)",
        "3xl": "0 32px 64px -12px rgb(16 24 40 / 0.14)",
      },
      colors: {
        gray: {
          25: "rgb(var(--gray-25))",
          50: "rgb(var(--gray-50))",
          100: "rgb(var(--gray-100))",
          200: "rgb(var(--gray-200))",
          300: "rgb(var(--gray-300))",
          400: "rgb(var(--gray-400))",
          500: "rgb(var(--gray-500))",
          600: "rgb(var(--gray-600))",
          700: "rgb(var(--gray-700))",
          800: "rgb(var(--gray-800))",
          900: "rgb(var(--gray-900))",
        },
        primary: {
          25: "rgb(var(--primary-25))",
          50: "rgb(var(--primary-50))",
          100: "rgb(var(--primary-100))",
          200: "rgb(var(--primary-200))",
          300: "rgb(var(--primary-300))",
          400: "rgb(var(--primary-400))",
          500: "rgb(var(--primary-500))",
          600: "rgb(var(--primary-600))",
          700: "rgb(var(--primary-700))",
          800: "rgb(var(--primary-800))",
          900: "rgb(var(--primary-900))",
        },
        success: {
          25: "rgb(var(--success-25))",
          50: "rgb(var(--success-50))",
          300: "rgb(var(--success-300))",
          600: "rgb(var(--success-600))",
          700: "rgb(var(--success-700))",
        },
        error: {
          25: "rgb(var(--error-25))",
          50: "rgb(var(--error-50))",
          300: "rgb(var(--error-300))",
          500: "rgb(var(--error-500))",
          600: "rgb(var(--error-600))",
          700: "rgb(var(--error-700))",
          800: "rgb(var(--error-800))",
        },
      },
    },
  },
  plugins: [
    plugin(({ addVariant, theme }) => {
      const groups = theme("groups") || [];

      groups.forEach((group) => {
        addVariant(`group-${group}-hover`, () => `:merge(.group-${group}):hover &`);
      });
    }),
    plugin(function groupPeer({ addVariant }) {
      let pseudoVariants = ["checked"].map((variant) =>
        Array.isArray(variant) ? variant : [variant, `&:${variant}`]
      );

      for (let [variantName, state] of pseudoVariants) {
        addVariant(`group-peer-${variantName}`, (ctx) => {
          let result = typeof state === "function" ? state(ctx) : state;
          return result.replace(/&(\S+)/, ":merge(.peer)$1 ~ .group &");
        });
      }
    }),
  ],
};
