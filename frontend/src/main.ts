import './styles/global.css';
import { initRouter } from './router';
import { renderHome } from './pages/home';
import { initializeNavigation } from './scripts/navigation';
import { initializeTheme } from './scripts/theme';
import { AuthStore } from './stores/auth.store';

AuthStore.init();

// Initialize the theme
initializeTheme();

// Initialize the router
initRouter();

// Rendu initial + abonnement aux changements d'auth
const render = () => renderHome();
AuthStore.subscribe(() => render());

// Premier rendu (AuthStore peut déjà avoir l'utilisateur)
render();

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
});
