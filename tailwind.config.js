/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-muted': 'var(--color-surface-muted)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-soft': 'var(--color-text-soft)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        primary: {
          DEFAULT: '#c7a45e',
          foreground: '#34271a',
          emphasis: '#ae8845',
        },
        secondary: 'var(--color-secondary)',
      },
    },
  },
  plugins: [],
}
