/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: '#F77F00',
        bharatgreen: '#2B9348',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Poppins',
          'Noto Sans',
          'Noto Sans Devanagari',
          'Baloo Bhai',
          'sans-serif',
        ],
      },
      boxShadow: {
        glass: '0 4px 32px 0 rgba(31, 38, 135, 0.15)',
      },
      backdropBlur: {
        glass: '8px',
      },
    },
  },
  plugins: [],
}

