import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FDF8E1",
        /** Texto y elementos oscuros de marca */
        navy: "#1A2B4A",
        /** Acción principal — azul CineUABCS */
        primary: {
          DEFAULT: "#005b96",
          dark: "#004a7c",
          foreground: "#FFFFFF",
        },
        /** Acento movilidad / etiquetas de asiento (oro suave) */
        mobility: {
          DEFAULT: "#F5E6A8",
          accent: "#F5C842",
          foreground: "#1A2B4A",
        },
        /** Alias legacy: usar solo para movilidad, no como CTA principal */
        paliacate: "#F5C842",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        pill: "9999px",
      },
      boxShadow: {
        matinee: "0 8px 30px rgba(0, 74, 124, 0.12)",
        primary: "0 6px 20px rgba(0, 91, 150, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
