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
			  light_white: 'hsl(42, 25%, 96%)',
			  background: {
				  DEFAULT: 'hsl(48, 15%, 97%)',    // clair
					dark: 'hsl(222, 47%, 11%)'     // sombre
			  },
			  text: {
				DEFAULT: 'hsl(220, 15%, 13%)',
				dark: 'hsl(210, 25%, 97%)',
				success: 'hsl(142, 45%, 45%)',
				success_dark: 'hsl(142, 60%, 85%)',
				warning: 'hsl(45, 85%, 55%)',
				warning_dark: 'hsl(45, 90%, 70%)',
				error: 'hsl(0, 65%, 45%)',
				error_dark: 'hsl(0, 75%, 75%)',
			  },
			  link: {
				  DEFAULT: 'hsl(220, 85%, 55%)',
				  dark: 'hsl(210, 90%, 80%)',
				  hover: {
					  DEFAULT: 'hsl(220, 85%, 40%)',
					  dark: 'hsl(210, 90%, 90%)'
				  }
			  },
			  primary: {
				  DEFAULT: 'hsl(35, 12%, 75%)',
				   dark: 'hsl(217, 39%, 14%)'
			  },
			  secondary: {
				  DEFAULT: 'hsl(280, 8%, 20%)',
				  dark: 'hsl(42, 30%, 88%)'
			  },
			  button: {
				  DEFAULT: 'hsl(35, 15%, 28%)',
				  dark: 'hsl(0, 0%, 92%)',
				  text: {
					  DEFAULT: 'hsl(0, 0%, 100%)',
					  dark: 'hsl(220, 15%, 13%)'
				  }
			  },
			  muted: {
				  DEFAULT: 'hsl(220, 8%, 40%)',
				  dark: 'hsl(160, 15%, 97%)'
			  }
		  }
	  },
	},
	plugins: [],
  }