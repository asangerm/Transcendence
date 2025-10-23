import { RegisterForm } from '../components/RegisterForm';
import { navigateTo } from '../router';

export function renderRegister() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '';
        
        new RegisterForm(app, {
            onSuccess: (user) => {
                navigateTo('/login');
            },
            onError: (error) => {
                console.error('Registration error:', error);
            }
        });
    }
}