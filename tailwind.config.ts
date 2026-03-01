import type { Config } from "tailwindcss";

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          body: '#2A2F22',
          sidebar: '#242E16',
          heading: '#242E16',
          accent: '#C2785C',
          bg: '#FBF9F5',
          'bg-card': '#FFFFFF',
          'bg-hover': '#E6CEBC',
          muted: '#A2A182',
          border: '#DDD0C3',
          chestnut: '#8E412E',
          gold: '#E3B45E',
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
