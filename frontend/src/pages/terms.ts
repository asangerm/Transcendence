export function renderTerms() {
  const content = `
    <div class="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 class="text-4xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Conditions Générales d'Utilisation</h1>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">1. Objet</h2>
        <p class="text-gray-700 dark:text-gray-300">Le présent document définit les conditions d’utilisation de du site web <b>Transcendence</b>, développée dans le cadre du cursus 42.</p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">2. Accès au service</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Le service est réservé aux utilisateurs disposant d’un compte.</li>
          <li>L’accès peut être restreint ou suspendu en cas de maintenance ou de problème technique.</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">3. Obligations de l’utilisateur</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Fournir des informations exactes lors de l’inscription.</li>
          <li>Ne pas usurper l’identité d’un autre utilisateur.</li>
          <li>Ne pas utiliser le service pour des activités illégales, offensantes ou frauduleuses.</li>
          <li>Respecter les autres utilisateurs (pas d’insultes, de harcèlement ni de triche).</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">4. Responsabilités</h2>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>L’équipe de développement n’est pas responsable des interruptions, pertes de données ou problèmes liés au service.</li>
          <li>L’utilisateur est responsable de la sécurité de son compte (mot de passe, 2FA si activé).</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">5. Sanctions</h2>
        <p class="text-gray-700 dark:text-gray-300">En cas de non-respect des présentes CGU, l’équipe pourra suspendre ou supprimer un compte.</p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">6. Modifications</h2>
        <p class="text-gray-700 dark:text-gray-300">Les CGU peuvent être mises à jour. L’utilisateur sera informé en cas de changements majeurs.</p>
      </section>
    </div>
  `;

  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = content;
  }
}
