import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        raleway: ['var(--font-raleway)'],
      },
      colors: {
  accent: 'var(--accent)',
  secondary:'var(--secondary)'
}
    },
  },
  plugins: [],
};

export default config;

