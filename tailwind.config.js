/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#040608',
                primary: '#00f3ff',
                secondary: '#4ca5ff',
                glass: 'rgba(255, 255, 255, 0.05)',
                'glass-heavy': 'rgba(10, 10, 12, 0.7)',
                text: '#ffffff',
                'text-dim': 'rgba(255, 255, 255, 0.6)',
            },
            backdropBlur: {
                xs: '2px',
            },
            fontFamily: {
                sans: [
                    'SF Pro Display',
                    'Inter',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'sans-serif',
                ],
            },
        },
    },
    plugins: [],
}
