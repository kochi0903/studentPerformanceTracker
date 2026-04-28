/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        needSupport: '#EF4444',
        average: '#F59E0B',
        good: '#3B82F6',
        outstanding: '#10B981'
      }
    },
  },
  plugins: [],
}
