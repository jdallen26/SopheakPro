// File: `tailwind.config.js`
module.exports = {
    content: [
        './app/**/*.{ts,tsx,js,jsx}',
        './components/**/*.{ts,tsx,js,jsx}',
        './pages/**/*.{ts,tsx,js,jsx}',
        './src/**/*.{ts,tsx,js,jsx}',
        './assets/**/*.{ts,tsx,js,jsx}',
    ],
    darkMode: 'class', // matches NextThemeProvider attribute="class"
    theme:
        {
            extend: {
                fontFamily: {
                    sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
                    mono:
                        ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular'],
                }
                ,
                colors: {
                    primary: {
                        DEFAULT: '#1f6feb',
                    }
                    ,
                }
                ,
            }
            ,
        }
    ,
// plugins: [
//   require('@tailwindcss/forms'),
//   require('@tailwindcss/typography'),
// ],
}
