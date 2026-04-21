/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050c1a',
          900: '#080f20',
          800: '#0a1628',
          700: '#0d1f3c',
          600: '#112a50',
          500: '#153464',
        },
        electric: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        glass: {
          white: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.10)',
          hover: 'rgba(255,255,255,0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-glow': 'radial-gradient(ellipse at top left, rgba(14,165,233,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(251,191,36,0.08) 0%, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        glow: { '0%': { boxShadow: '0 0 5px rgba(14,165,233,0.3)' }, '100%': { boxShadow: '0 0 20px rgba(14,165,233,0.8)' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glow-blue': '0 0 30px rgba(14,165,233,0.4)',
        'glow-amber': '0 0 30px rgba(251,191,36,0.4)',
        'glow-red': '0 0 30px rgba(239,68,68,0.4)',
      }
    },
  },
  plugins: [],
}
