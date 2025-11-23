/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ocean-navy': '#1a2332',
        'ocean-teal': '#2d8b8b',
        'ocean-seafoam': '#a8dadc',
        'ocean-cream': '#f1faee',
        // Alias for common use
        primary: '#1a2332',
        secondary: '#2d8b8b',
        accent: '#a8dadc',
        light: '#f1faee',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
