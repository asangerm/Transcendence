export function renderGameSelection() {
    const content = `
        <div class="h-full w-full">
            <main class="container mx-auto px-4 py-8">
                <h1 class="text-4xl font-bold text-center mb-12">Sélection des Jeux</h1>
                <div class="grid grid-cols-1 grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <!-- Pong Game Card -->
                    <a href="/pong-lobby" class="group">
                        <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                            <div class="relative aspect-video bg-secondary dark:bg-secondary-dark">
                                <img 
                                    src="../../images/pong-image.png" 
                                    alt="Pong Game" 
                                    class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                                >
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                    <span class="text-white text-2xl font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        Jouer au Pong
                                    </span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h2 class="text-2xl font-bold mb-2">Pong 3D</h2>
                                <p class="text-muted dark:text-muted-dark">"Deux raquettes, une balle, et un chaos spatial où frapper correctement devient un sport de haut niveau. (solo / pvp local/ pvp en ligne)"</p>
                            </div>
                        </div>
                    </a>

                    <!-- Second Game Card -->
                    <a href="/game2-lobby" class="group">
                        <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                            <div class="relative aspect-video bg-secondary dark:bg-gray-800">
                                <img 
                                    src="../../images/tictactoe.png" 
                                    alt="Second Game" 
                                    class="absolute inset-0 h-full mx-auto object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-90"
                                >
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                    <span class="text-white text-2xl font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        Jouer au Tic-tac-toe
                                    </span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h2 class="text-2xl font-bold mb-2">Tic-tac-toe</h2>
                                <p class="text-muted dark:text-muted-dark">"Le fameux jeu où deux adversaires s’affrontent et ........... finissent toujours par égalité. (pvp en ligne)"</p>
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