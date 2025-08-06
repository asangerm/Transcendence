export function render404() {
    const content = `
        <div class="min-h-screen flex items-center justify-center px-4">
            <div class="max-w-2xl w-full mx-auto text-center">
                <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-2xl">
                    <!-- 404 Image -->
                    <div class="mb-8 relative">
                        <img 
                            src="../../images/404-pong.svg" 
                            alt="404 Error" 
                            class="w-full max-w-md mx-auto h-auto transform transition-all duration-500 hover:scale-105"
                        >
                    </div>

                    <!-- Error Message -->
                    <h1 class="text-6xl font-bold mb-4">404</h1>
                    <h2 class="text-3xl font-bold mb-4">Game Over !</h2>
                    <p class="text-muted dark:text-muted-dark mb-8">
                        La page que vous recherchez semble avoir quitté le terrain...
                    </p>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row justify-center gap-4">
                        <a 
                            href="/"
                            data-nav 
                            class="px-6 py-3 button-primary"
                        >
                            Retour à l'accueil
                        </a>
                        <a 
                            href="/games"
                            data-nav 
                            class="px-6 py-3 button-secondary"
                        >
                            Jouer maintenant
                        </a>
                    </div>

                    <!-- Fun Message -->
                    <p class="text-muted dark:text-muted-dark text-sm mt-8">
                        Conseil : Pendant que vous êtes là, pourquoi ne pas faire une partie ? 🏓
                    </p>
                </div>
            </div>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
    }
} 