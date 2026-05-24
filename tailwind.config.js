export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--brand-primary)',
        'primary-hover': 'var(--brand-primary-hover)',
        'primary-dark': 'var(--brand-primary-hover)',
        'primary-light': 'var(--brand-primary-light)',
        'primary-glow': 'var(--brand-primary-glow)',
        secondary: 'var(--brand-secondary)',
        accent: 'var(--brand-accent)',
        'accent-light': 'var(--brand-accent-light)',
        base: 'var(--bg-base)',
        background: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        'surface-3': 'var(--bg-surface-3)',
        overlay: 'var(--bg-overlay)',
        modal: 'var(--bg-modal)',
        'text-primary': 'var(--text-primary)',
        textMain: 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-inverse': 'var(--text-inverse)',
        'text-brand': 'var(--text-brand)',
        border: 'var(--border-default)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'border-brand': 'var(--border-brand)',
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        error: 'var(--error)',
        'error-light': 'var(--error-light)',
        info: 'var(--info)',
        'info-light': 'var(--info-light)',
        'macro-calories': 'var(--macro-calories)',
        'macro-protein': 'var(--macro-protein)',
        'macro-carbs': 'var(--macro-carbs)',
        'macro-fats': 'var(--macro-fats)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        }
      }
    },
  },
  plugins: [],
}
