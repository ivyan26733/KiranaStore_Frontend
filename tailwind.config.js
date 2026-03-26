/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm saffron palette
        saffron: {
          50:  '#fff8f0',
          100: '#feecd8',
          200: '#fcd5a8',
          300: '#f9b975',
          400: '#f59340',
          500: '#f97316', // primary action
          600: '#ea6010',
          700: '#c04d0c',
          800: '#983d10',
          900: '#7a3310',
        },
        cream: {
          50:  '#fffbf5',
          100: '#fff5e6',
          200: '#fde8cc',
        },
        success: '#16a34a',
        danger:  '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(249,115,22,0.08)',
        'card-hover': '0 6px 24px 0 rgba(249,115,22,0.16)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
