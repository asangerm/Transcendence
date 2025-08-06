/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
		colors: {
			light_white: '#f5efe6',
			background: {
				DEFAULT: '#F6F5F1',    // clair
          		dark: '#242423'        // sombre
			},
			text: {
			  DEFAULT: '#111827',
			  dark: '#f9fafb',
			  success: '#68A357',
			  success_dark: '#D1F0B1',
			  warning: '#DAE232',
			  warning_dark: '#EAD94C',
			  error: '#BA1F33',
			  error_dark: '#FF6868',
			},
			link: {
				DEFAULT: '#3c3cff',
				dark: '#8ab4f8',
				hover: {
					DEFAULT: '#1a0dab',
					dark: '#a5c9ff'
				}
			},
			primary: {
				DEFAULT: '#BEBAB3',
         		dark: '#8B827D'
			},
			secondary: {
				DEFAULT: '#333031',
				dark: '#EFE3C5'
			},
			button: {
				DEFAULT: '#47403B',
				dark: '#E4E4E4',
				text: {
					DEFAULT: '#ffffff',
					dark: '#111827'
				}
			},
			muted: {
				DEFAULT: '#585858',
				dark: '#F9FCFB'
			}
		}
	},
  },
  plugins: [],
}