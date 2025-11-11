import { AuthStore } from '../stores/auth.store';

export function renderHome() {
  const isAuth = AuthStore.isAuthenticated(); // Vérifie à l'instant T

  const content = `
    <div class="h-full w-full bg-background dark:bg-background-dark">
      <main class="container mx-auto px-4 py-16">
        <div class="shadow-2xl rounded-2xl p-10 bg-primary dark:bg-primary-dark">
          <h1 class="text-5xl font-extrabold text-text mb-6 dark:text-text-dark text-center tracking-tight">
            Bienvenue sur ft_transcendence
          </h1>
          <p class="text-muted dark:text-muted-dark text-lg mb-12 text-center max-w-3xl mx-auto leading-relaxed">
            Entrez dans l’univers compétitif de notre projet fait dans le cadre de notre cursus à<br><span class="font-semibold text-button dark:text-button-dark">42 PERPIGNAN-OCCITANIE.</span><br>  
            Un monde où chaque pixel compte, chaque réflexe fait la différence,<br>  
            et où les légendes du Pong côtoient les héros du jeu incroyable d’Arthur.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap justify-center gap-6 mb-16">
            <button 
              id="playButton" 
              class="px-8 py-4 button-primary"
            >
              Lancer une partie
            </button>

            ${!isAuth ? `
              <a href="/register" data-nav
                class="px-8 py-4 text-lg button-secondary"
              >
                😮 Pas encore inscrit ?🫵👇
              </a>
            ` : ''}
          </div>

          <!-- Features Section (Magazines style) -->
          <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div class="p-8 bg-primary border border-muted dark:bg-primary-dark dark:border-muted-dark shadow-lg rounded-tl-3xl rounded-br-2xl text-center">
              <h3 class="text-3xl font-extrabold text-text mb-4 dark:text-text-dark">🎮 JeuVideal.com</h3>
              <p class="text-muted dark:text-muted-dark text-center">
                10/10 – Partie instantanée et adrénaline pure !  
                Le guide ultime pour les pros du Pong et du “jeu incroyable d’Arthur”.
              </p>
            </div>
            <div class="p-8 bg-primary border border-muted dark:bg-primary-dark dark:border-muted-dark shadow-lg rounded-tr-3xl rounded-bl-2xl text-center">
              <h3 class="text-3xl font-extrabold text-text mb-4 dark:text-text-dark">🏆 Steam-ulation</h3>
              <p class="text-muted dark:text-muted-dark text-center">
                9/10 – Gravissez les échelons, défiez vos amis et devenez l’élite.  
                Les classements n’ont jamais été aussi excitants !
              </p>
            </div>
            <div class="p-8 bg-primary border border-muted dark:bg-primary-dark dark:border-muted-dark shadow-lg rounded-tl-2xl rounded-tr-3xl rounded-bl-3xl rounded-br-1xl text-center">
              <h3 class="text-3xl font-extrabold text-text mb-4 dark:text-text-dark">👾 Aïeçapique Games</h3>
              <p class="text-muted dark:text-muted-dark text-center">
                10/10 – Multijoueur épique, rivalités et fous rires garantis.  
                Défiez vos amis et devenez une légende des tournois !
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = content;

    const playButton = document.getElementById('playButton');
    if (playButton) {
      playButton.addEventListener('click', () => {
        import('../router').then(m => m.navigateTo('/games'));
      });
    }
  }
}
