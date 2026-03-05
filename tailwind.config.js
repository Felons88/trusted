/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
}
