import { LoginFormHandler } from '../scripts/login-form';

export function renderLogin() {
    const content = `
        <div class="min-h-screen flex items-center justify-center">
            <div class="max-w-md w-full mx-auto">
                <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-2xl">
                    <h2 class="text-3xl font-bold text-center mb-8">Connexion</h2>
                    
                    <form id="loginForm" class="space-y-6" novalidate>
                        <!-- Username/Email Input -->
                        <div>
                            <label for="username" class="block text-sm font-medium mb-2">
                                Nom d'utilisateur ou Email
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                required
                                class="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                placeholder="Entrez votre nom d'utilisateur"
                            >
                        </div>

                        <!-- Password Input -->
                        <div>
                            <label for="password" class="block text-sm font-medium mb-2">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                class="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                placeholder="Entrez votre mot de passe"
                            >
                        </div>

                        <!-- Remember Me Checkbox -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    name="remember"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-300"
                                >
                                <label for="remember" class="ml-2 block text-sm text-muted dark:text-muted-dark">
                                    Se souvenir de moi
                                </label>
                            </div>
                            <a href="/forgot-password" class="text-sm links-style">
                                Mot de passe oublié?
                            </a>
                        </div>

                        <!-- Submit Button -->
                        <button
                            type="submit"
                            class="button-primary w-full "
                        >
                            Se connecter
                        </button>

                        <!-- Sign Up Link -->
                        <div class="text-center mt-4">
                            <span class="text-muted dark:text-muted-dark">Pas encore de compte?</span>
                            <a href="/register" class="links-style">
                                S'inscrire
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
        
        const formHandler = new LoginFormHandler();
        // Add form submission handler
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                formHandler.validateForm();
            });
        }
    }
}