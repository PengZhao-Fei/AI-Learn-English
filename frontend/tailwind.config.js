const { heroui } = require("@heroui/react");

// Tailwind CSS configuration for HeroUI
// Tailwind CSS 配置，用于 HeroUI
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // HeroUI theme path
    // HeroUI 主题路径
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};
