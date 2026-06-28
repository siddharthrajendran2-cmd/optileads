/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1B4F72",
          teal: "#17A589",
          lightblue: "#2E86C1",
          bg: "#F4F6F7",
        },
      },
    },
  },
  plugins: [],
}

