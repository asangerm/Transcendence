import { LoginForm } from '../components/LoginForm';
import { navigateTo } from '../router';

export function renderLogin() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '';
        
        new LoginForm(app, {
            onSuccess: () => {
                navigateTo('/');
            },
            onError: (error) => {
                console.error('Login error:', error);
            }
        });
    }
}