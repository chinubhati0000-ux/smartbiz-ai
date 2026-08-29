/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ledger: {
          paper: '#F7F5F0',
          ink: '#1E2A28',
          teal: '#0F4C46',
          tealLight: '#166C63',
          amber: '#C97A2B',
          rust: '#B4442E',
          line: '#DCD6C7'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
