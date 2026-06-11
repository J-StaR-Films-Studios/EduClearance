import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FAF9F6',
          card: '#FFFFFF',
          secondary: '#F5F2EB',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          800: '#1E293B',
          900: '#0F172A',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          600: '#059669',
          700: '#047857',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#D97706',
          700: '#B45309',
        },
        terracotta: {
          50: '#FEF2F2',
          600: '#DC2626',
          700: '#B91C1C',
        },
        slate: {
          500: '#64748B',
          600: '#475569',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        md: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
