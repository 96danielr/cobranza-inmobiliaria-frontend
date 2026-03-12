/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // Glassmorphism dark theme
        dark: {
          primary: '#0f0f1a',
          secondary: '#1a1a2e',
          accent: '#16213e'
        },
        glass: {
          primary: 'rgba(255, 255, 255, 0.08)',
          secondary: 'rgba(255, 255, 255, 0.12)',
          border: 'rgba(255, 255, 255, 0.15)',
          'border-hover': 'rgba(255, 255, 255, 0.25)'
        },
        text: {
          primary: '#ffffff',
          secondary: '#e2e8f0', 
          muted: '#cbd5e1'
        },
        accent: {
          blue: '#60a5fa',
          green: '#4ade80',
          yellow: '#fbbf24',
          red: '#f87171',
          purple: '#a78bfa'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-primary': 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        xl: '24px'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(96, 165, 250, 0.3)',
        'glow-hover': '0 0 30px rgba(96, 165, 250, 0.4)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-up-delay': 'fadeInUp 0.6s ease-out 0.2s both',
        'fade-in-up-delay-2': 'fadeInUp 0.6s ease-out 0.4s both',
        'fade-in-up-delay-3': 'fadeInUp 0.6s ease-out 0.6s both',
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