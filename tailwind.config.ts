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
        brand: {
          body: '#0D2B00',
          heading: '#FE6728',
          accent: '#FE6728',
          bg: '#FBF9F5',
          'bg-card': '#FFFFFF',
          'bg-hover': '#F5F0E8',
          muted: '#6B7B64',
          border: '#E2DDD4',
        },
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
