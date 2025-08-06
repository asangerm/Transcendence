type Route = {
    path: string;
    component: () => void;
}

const routes: Route[] = [
    { path: '/', component: () => import('./pages/home').then(m => m.renderHome()) },
    { path: '/games', component: () => import('./pages/game-selection').then(m => m.renderGameSelection()) },
    { path: '/pong', component: () => import('./pages/pong').then(m => m.renderPong()) },
    { path: '/game2', component: () => import('./pages/pong').then(m => m.renderPong()) },
    { path: '/profile', component: () => import('./pages/profile').then(m => m.renderProfile()) },
    { path: '/login', component: () => import('./pages/login').then(m => m.renderLogin()) },
    { path: '/forgot-password', component: () => import('./pages/forgot-password').then(m => m.renderForgotPassword()) },
    { path: '/register', component: () => import('./pages/register').then(m => m.renderRegister()) }
];


export function initRouter() {
    // Handle initial route
    handleRoute();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleRoute);

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

function handleRoute() {
    const path = window.location.pathname;
    const route = routes.find(route => route.path === path);
	if (route) {
		route.component();
	}
	else {
		import('./pages/not-found').then(m => m.render404());
	}
}

export function navigateTo(path: string) {
	window.history.pushState({}, '', path);
	handleRoute();	
} 