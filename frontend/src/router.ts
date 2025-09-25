import { NavBar } from './components/NavBar';
import { AuthService } from './services/auth.service';

type Route = {
    path: string;
    component: () => void;
    requiresAuth?: boolean;
    guestOnly?: boolean;
}

const routes: Route[] = [
    { path: '/', component: () => import('./pages/home').then(m => m.renderHome()) },
    { path: '/games', component: () => import('./pages/game-selection').then(m => m.renderGameSelection()), requiresAuth: false },
    { path: '/pong', component: () => import('./pages/pong').then(m => m.renderPong()), requiresAuth: false },
    { path: '/game2', component: () => import('./pages/game2').then(m => m.renderGame2()), requiresAuth: false },
    { path: '/profile', component: () => import('./pages/profile').then(m => m.renderProfile()), requiresAuth: true },
    { path: '/profile2', component: () => import('./pages/profileold').then(m => m.renderProfile()), requiresAuth: true },
    { path: '/login', component: () => import('./pages/login').then(m => m.renderLogin()), guestOnly: true },
    { path: '/forgot-password', component: () => import('./pages/forgot-password').then(m => m.renderForgotPassword()), guestOnly: true },
    { path: '/register', component: () => import('./pages/register').then(m => m.renderRegister()), guestOnly: true }
];


export function initRouter() {
    // Handle initial route
    handleRoute();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleRoute);
	const navbarContainer = document.getElementById('navbar-container');
	if (navbarContainer) {
		new NavBar(navbarContainer);
	}

    // Handle clicks on navigation links
    document.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.getAttribute('href')?.startsWith('/')) {
            e.preventDefault();
            const path = link.getAttribute('href') || '/';
            navigateTo(path);
        }
    });
}

async function handleRoute() {
    const path = window.location.pathname;
    const route = routes.find(route => route.path === path);
    
    if (!route) {
        import('./pages/not-found').then(m => m.render404());
        return;
    }

    // Check authentication requirements
    const isAuthenticated = AuthService.isAuthenticated();

    // If route requires auth but user is not authenticated
    if (route.requiresAuth && !isAuthenticated) {
        navigateTo('/login');
        return;
    }

    // If route is guest only but user is authenticated
    if (route.guestOnly && isAuthenticated) {
        navigateTo('/');
        return;
    }

    // Verify token if user is authenticated
    if (isAuthenticated) {
        try {
            await AuthService.verifyToken();
        } catch (error) {
            // Token is invalid, redirect to login
            if (route.requiresAuth) {
                navigateTo('/login');
                return;
            }
        }
    }

    route.component();
}

export function navigateTo(path: string) {
	window.history.pushState({}, '', path);
	handleRoute();	
} 