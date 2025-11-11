// Theme management
export function initializeTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');

    // Check for saved theme preference or use system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        showActiveIcon('dark');
    } else {
        document.documentElement.classList.remove('dark');
        showActiveIcon('light');
    }

    // Toggle theme
    themeToggleBtn?.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            showActiveIcon('light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            showActiveIcon('dark');
        }
    });

    // Show correct icon based on current theme
    function showActiveIcon(theme: 'dark' | 'light') {
        if (lightIcon && darkIcon) {
            if (theme === 'dark') {
                lightIcon.classList.remove('hidden');
                darkIcon.classList.add('hidden');
            } else {
                lightIcon.classList.add('hidden');
                darkIcon.classList.remove('hidden');
            }
        }
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.theme) { // Only react to system changes if no manual preference is set
            if (e.matches) {
                document.documentElement.classList.add('dark');
                showActiveIcon('dark');
            } else {
                document.documentElement.classList.remove('dark');
                showActiveIcon('light');
            }
        }
    });
} 