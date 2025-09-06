/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Agriko Brand Colors
        primary: {
          50: '#fdf2f0',
          100: '#fce4e1',
          200: '#f8ccc6',
          300: '#f2a89e',
          400: '#ea7a6c',
          500: '#de5540',
          600: '#c83b26',
          700: '#9a2b1d', // Main brand red
          800: '#7d241a',
          900: '#681f17',
          950: '#370e0b',
        },
        accent: {
          50: '#fefbf0',
          100: '#fef6db',
          200: '#fdeab7',
          300: '#fbd888',
          400: '#f8c158',
          500: '#e6a93d', // Brand gold/yellow
          600: '#d08a1f',
          700: '#ad6b18',
          800: '#8c5419',
          900: '#724419',
        },
        cream: '#f8f4f0', // Background cream
        neutral: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#222', // Neutral dark
          950: '#0a0a0b',
        }
      },
      fontFamily: {
        'serif': ['var(--font-crimson)', 'Georgia', 'serif'],
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'leaf-texture': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwIDVMMzUgMTVIMjVMMzAgNVoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPHBhdGggZD0iTTQ1IDMwTDM1IDM1VjI1TDQ1IDMwWiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8cGF0aCBkPSJNMzAgNTVMMjUgNDVIMzVMMzAgNTVaIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+CjxwYXRoIGQ9Ik0xNSAzMEwyNSAyNVYzNUwxNSAzMFoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+')",
      }
    },
  },
  plugins: [],
}