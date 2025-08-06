export function renderGameSelection() {
    const content = `
        <div class="min-h-screen">
            <main class="container mx-auto px-4 py-8">
                <h1 class="text-4xl font-bold text-center mb-12">Sélection des Jeux</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <!-- Pong Game Card -->
                    <a href="/pong" class="group">
                        <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                            <div class="relative aspect-video bg-secondary dark:bg-secondary-dark">
                                <img 
                                    src="../../images/pong-image.jpg" 
                                    alt="Pong Game" 
                                    class="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-90"
                                >
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                    <span class="text-white text-2xl font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        Jouer au Pong
                                    </span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h2 class="text-2xl font-bold mb-2">Pong</h2>
                                <p class="text-muted dark:text-muted-dark">Le classique jeu de tennis de table revisité</p>
                            </div>
                        </div>
                    </a>

                    <!-- Second Game Card -->
                    <a href="/game2" class="group">
                        <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                            <div class="relative aspect-video bg-secondary dark:bg-secondary-dark">
                                <img 
                                    src="../../images/ageOfWar.jpg" 
                                    alt="Second Game" 
                                    class="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-90"
                                >
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                    <span class="text-white text-2xl font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        Jouer au Jeu 2
                                    </span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h2 class="text-2xl font-bold mb-2">Jeu 2</h2>
                                <p class="text-muted dark:text-muted-dark">Description du deuxième jeu</p>
                            </div>
                        </div>
                    </a>
                </div>
            </main>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
    }
} 