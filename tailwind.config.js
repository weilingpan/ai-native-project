module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 900
        sidebar: '#1e293b', // Slate 800
        primary: '#3b82f6', // Blue 500
        secondary: '#64748b', // Slate 500
        text: '#f1f5f9', // Slate 100
        accent: '#8b5cf6', // Violet 500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
