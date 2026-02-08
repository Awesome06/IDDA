/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        idda: {
          dark: '#2c3e50',   // Professional Navy
          cyan: '#1abc9c',   // Tech/Agent Teal
          light: '#f4f7f6',  // Soft background grey
        },
      },
      boxShadow: {
        'idda-soft': '0 4px 15px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};