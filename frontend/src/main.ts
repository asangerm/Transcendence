import './styles/global.css';
import { initRouter } from './router';
import { renderHome } from './pages/home';
import { initializeNavigation } from './scripts/navigation';
import { initializeTheme } from './scripts/theme';

// Initialize the theme
initializeTheme();

// Initialize the router
initRouter();

// Initial render
renderHome();

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
});