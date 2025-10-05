export function renderHome() {
    const content = `
        <div class="h-full w-full">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary shadow-xl rounded-xl p-8 transform transition-all duration-300 hover:shadow-2xl dark:bg-primary-dark">
                    <h1 class="text-4xl font-bold text-text mb-6 dark:text-text-dark">
                        Bienvenue sur ft_transcendence
                    </h1>
                    <p class="text-muted text-lg mb-8 dark:text-muted-dark">
                        Prêt à jouer au Pong ? Rejoignez la partie et défiez d'autres joueurs !
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button 
                            id="playButton" 
                            class="px-6 py-3 button-primary"
                        >
                            Jouer maintenant
                        </button>
                        <a 
                            href="/register" 
                            data-nav
                            class="px-6 py-3 button-secondary"
                        >
                            Créer un compte
                        </a>
                    </div>

                    <!-- Features Section -->
                    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="p-6 rounded-lg border border-muted dark:border-muted-dark transform transition-all duration-300 hover:scale-105">
                            <div class="text-button dark:text-button-dark mb-4">
                                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-text mb-2 dark:text-text-dark">Jeu Rapide</h3>
                            <p class="text-muted dark:text-muted-dark">Commencez une partie instantanément et défiez des joueurs du monde entier.</p>
                        </div>
                        <div class="p-6 rounded-lg border border-muted dark:border-muted-dark transform transition-all duration-300 hover:scale-105">
                            <div class="text-button dark:text-button-dark mb-4">
                                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-text mb-2 dark:text-text-dark">Classement</h3>
                            <p class="text-muted dark:text-muted-dark">Grimpez dans le classement et devenez le meilleur joueur de Pong.</p>
                        </div>
                        <div class="p-6 rounded-lg border border-muted dark:border-muted-dark transform transition-all duration-300 hover:scale-105">
                            <div class="text-button dark:text-button-dark mb-4">
                                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-text mb-2 dark:text-text-dark">Multijoueur</h3>
                            <p class="text-muted dark:text-muted-dark">Jouez avec vos amis ou trouvez de nouveaux adversaires en ligne.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
        
        // Add event listener to the play button
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                import('../router').then(m => m.navigateTo('/games'));
            });
        }
    }
}