import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'oefa-green': '#22c55e',
        'oefa-dark-green': '#16a34a',
        'oefa-light-green': '#dcfce7',
        'oefa-blue': '#3b82f6',
        'oefa-dark-blue': '#1d4ed8',
        'oefa-gray': '#6b7280',
        'oefa-dark-gray': '#374151',
        'oefa-light-gray': '#f9fafb',
        'risk-low': '#22c55e',
        'risk-medium': '#fbbf24',
        'risk-high': '#ef4444',
        'risk-very-high': '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;