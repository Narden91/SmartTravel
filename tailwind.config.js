/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      /* Typography System - Inter Font Family */
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      
      /* Font Sizes - Design Token Scale */
      fontSize: {
        'display': ['72px', { 
          lineHeight: '80px', 
          letterSpacing: '0.1em', 
          fontWeight: '900',
          textTransform: 'uppercase' 
        }],
        'h1': ['48px', { 
          lineHeight: '56px', 
          letterSpacing: '0.1em', 
          fontWeight: '900',
          textTransform: 'uppercase' 
        }],
        'h2': ['36px', { 
          lineHeight: '44px', 
          letterSpacing: '0.1em', 
          fontWeight: '900',
          textTransform: 'uppercase' 
        }],
        'h3': ['24px', { 
          lineHeight: '32px', 
          letterSpacing: '0.1em', 
          fontWeight: '900',
          textTransform: 'uppercase' 
        }],
        'body-lg': ['18px', { 
          lineHeight: '28px', 
          letterSpacing: '0.02em', 
          fontWeight: '400' 
        }],
        'body': ['16px', { 
          lineHeight: '24px', 
          letterSpacing: '0.02em', 
          fontWeight: '400' 
        }],
        'body-sm': ['14px', { 
          lineHeight: '20px', 
          letterSpacing: '0.02em', 
          fontWeight: '400' 
        }],
      },
      
      /* Layout System */
      maxWidth: {
        'container': '1180px',
      },
      spacing: {
        'section-sm': '80px',
        'section': '100px',
        'section-lg': '120px',
        'container-x': '24px',
      },
      
      /* Animation System */
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
