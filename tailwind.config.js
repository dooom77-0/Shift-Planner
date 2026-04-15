/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}" // أضف هذا لضمان قراءة صف الايام
  ],
  // ... الإعدادات السابقة
  theme: {
    extend: {
      colors: {
        study: {
          primary: '#4f46e5',
          secondary: '#6366f1',
          accent: '#e0e7ff',
          bg: '#f8fafc', // لون خلفية هادئ جداً مائل للأزرق
        },
        coding: {
          primary: '#064e3b',
          secondary: '#047857',
          accent: '#d1fae5',
          bg: '#f0fdf4', // لون خلفية هادئ جداً مائل للأخضر
        },
      },
    },
  },
}
