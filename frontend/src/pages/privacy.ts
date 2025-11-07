export function renderPrivacy() {
  const content = `
    <div class="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 class="text-4xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Politique de confidentialité</h1>
      <p class="mb-6 text-gray-700 dark:text-gray-300">Nous respectons vos données personnelles conformément au RGPD.</p>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Données collectées</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Adresse email (inscription, connexion, récupération de compte)</li>
          <li>Identifiants techniques (ID utilisateur, tokens d'authentification)</li>
          <li>Données de profil (pseudo, avatar)</li>
          <li>Données techniques (logs de connexion, adresse IP)</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Utilisation des données</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Authentification et gestion du compte</li>
          <li>Fonctionnement du jeu et interactions entre utilisateurs</li>
          <li>Amélioration de la sécurité</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Vos droits</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li><b>Accès :</b> via "Profil"</li>
          <li><b>Rectification :</b> via "Modifier le profil"</li>
          <li><b>Anonymisation :</b> via "Anonymiser mon compte"</li>
          <li><b>Suppression :</b> via "Supprimer mon compte"</li>
          <li><b>Portabilité :</b> via "Exporter mes données"</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Sécurité</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Mots de passe chiffrés</li>
          <li>Chiffrement des secrets sensibles</li>
          <li>Protection contre la force brute</li>
        </ul>
      </section>

      <section>
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Contact</h2>
        <p class="text-gray-700 dark:text-gray-300">DPO : onievayoan@gmail.com / 06.28.32.27.46</p>
      </section>
    </div>
  `;

  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = content;
  }
}
