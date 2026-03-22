/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      colors: {
        'navy-deep': '#0B1C2D',
        'navy-dark': '#102A44',
        'electric-blue': '#1DB7E8',
        'bright-cyan': '#29D3FF',
        'metallic-silver': '#C8CED6',
        'light-gray': '#AAB2BD',
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(to bottom, #0B1C2D, #102A44)',
        'glass': 'linear-gradient(135deg, rgba(29, 183, 232, 0.1), rgba(41, 211, 255, 0.05))',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(29, 183, 232, 0.5)',
        'glow-cyan': '0 0 30px rgba(41, 211, 255, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
