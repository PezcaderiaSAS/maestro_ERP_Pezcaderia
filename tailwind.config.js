/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        'primary-light': 'var(--primary-light)',
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover)',
        dark: 'var(--dark-color)',
        border: 'var(--border-color)',
        background: 'var(--bg-color)',
        card: 'var(--card-bg)',
        // Tokens de Google Stitch (Protegidos)
        'marine-indigo': 'var(--color-marine-indigo)',
        'cyan-wave': 'var(--color-cyan-wave)',
        'emerald-a': 'var(--color-emerald-a)',
        'slate-b': 'var(--color-slate-b)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
