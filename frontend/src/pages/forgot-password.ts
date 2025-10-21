export async function renderForgotPassword() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          Mot de passe oublié
        </h2>

        <p class="text-center text-gray-600 dark:text-gray-300 mb-6 text-sm">
          Entrez votre adresse e-mail pour recevoir les instructions de réinitialisation.
        </p>

        <form id="forgot-form" class="space-y-4">
          <input 
            type="email" 
            id="email" 
            placeholder="Votre adresse e-mail" 
            required
            class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />

          <div id="message" class="hidden text-center text-sm mt-2"></div>

          <button 
            type="submit"
            class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            Envoyer le lien
          </button>

          <a href="/login" 
            class="block text-center text-sm text-gray-500 dark:text-gray-300 mt-4 hover:underline">
            Retour à la connexion
          </a>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('forgot-form') as HTMLFormElement;
  const messageDiv = document.getElementById('message') as HTMLDivElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (document.getElementById('email') as HTMLInputElement).value;
    messageDiv.classList.remove('hidden');
    messageDiv.classList.remove('text-red-500', 'text-green-600');
    messageDiv.textContent = 'Envoi en cours...';
    messageDiv.classList.add('text-gray-500');

    // Pas encore de backend → simple simulation
    setTimeout(() => {
      messageDiv.classList.remove('text-gray-500');
      messageDiv.classList.add('text-green-600');
      messageDiv.textContent = `Si un compte existe pour ${email}, un lien de réinitialisation vous a été envoyé.`;
    }, 1000);
  });
}
