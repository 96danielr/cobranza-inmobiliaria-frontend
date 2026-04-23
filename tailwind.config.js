/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-primary)',
        surface: 'var(--bg-secondary)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)'
        },
        glass: {
          primary: 'var(--surface-glass-primary)',
          secondary: 'var(--surface-glass-secondary)',
          border: 'var(--border-glass)',
          'border-hover': 'var(--border-glass-hover)'
        },
        accent: {
          blue: 'rgb(var(--accent-blue-rgb) / <alpha-value>)',
          green: 'rgb(var(--accent-green-rgb) / <alpha-value>)',
          yellow: 'rgb(var(--accent-yellow-rgb) / <alpha-value>)',
          red: 'rgb(var(--accent-red-rgb) / <alpha-value>)',
          purple: 'rgb(var(--accent-purple-rgb) / <alpha-value>)'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        xl: '24px'
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        'glass-hover': 'var(--shadow-glass-hover)',
        glow: 'var(--shadow-glow)',
        'glow-hover': 'var(--shadow-glow-hover)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-up-delay': 'fadeInUp 0.5s ease-out 0.1s both',
        'fade-in-up-delay-2': 'fadeInUp 0.5s ease-out 0.2s both',
        'fade-in-up-delay-3': 'fadeInUp 0.5s ease-out 0.3s both',
        'slide-in': 'slideIn 0.3s ease-out',
        'glass-glow': 'glassGlow 2s ease-in-out infinite alternate',
        'twinkle': 'twinkle 3s ease-in-out infinite'
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideIn: {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '100%': {
            transform: 'translateX(0)'
          }
        },
        glassGlow: {
          '0%': {
            boxShadow: '0 0 20px rgba(96, 165, 250, 0.2)'
          },
          '100%': {
            boxShadow: '0 0 30px rgba(96, 165, 250, 0.4)'
          }
        },
        twinkle: {
          '0%, 100%': {
            opacity: '0.3'
          },
          '50%': {
            opacity: '0.8'
          }
        }
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)'
      }
    },
  },
  plugins: [],
}