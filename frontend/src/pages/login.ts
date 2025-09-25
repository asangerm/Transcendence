import { LoginForm } from '../components/LoginForm';
import { NavBar } from '../components/NavBar';
import { navigateTo } from '../router';

export function renderLogin() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '';
        
        new LoginForm(app, {
            onSuccess: (user) => {
				const navbarContainer = document.getElementById('navbar-container');
				if (navbarContainer) {
					new NavBar(navbarContainer);
				}
                console.log('Login successful:', user);
                navigateTo('/');
            },
            onError: (error) => {
                console.error('Login error:', error);
            }
        });
    }
}