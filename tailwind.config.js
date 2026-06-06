/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3b6ef5',
          600: '#2c54d4',
          700: '#2342a8',
        },
      },
    },
  },
  plugins: [],
};
