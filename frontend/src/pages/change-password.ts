import UserService from '../services/user.service';
import { navigateTo } from '../router';

export async function renderChangePassword() {
  const app = document.getElementById('app');
  if (!app) return;

  const user = await UserService.getCurrentUserProfile();

  const style = document.createElement('style');
  style.innerHTML = `
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
    }
  `;

document.head.appendChild(style);

  app.innerHTML = `
    <div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-h-[100vh] pt-0 mt-0 ">
      <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mt-[-400px]">
        <h1 class="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          🔒 Changer le mot de passe
        </h1>

        <form id="change-password-form" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ancien mot de passe
            </label>
            <input type="password" id="old-password" placeholder="••••••••" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau mot de passe
            </label>
            <input type="password" id="new-password" placeholder="••••••••" required minlength="6"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <input type="password" id="confirm-password" placeholder="••••••••" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>

          <button type="submit"
            class="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-md transition-colors">
            Mettre à jour le mot de passe
          </button>

          <button type="button" id="cancel-change"
            class="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                   py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Annuler
          </button>
        </form>
      </div>
    </div>
  `;

  // --- Actions du formulaire ---
  const form = document.getElementById('change-password-form') as HTMLFormElement;
  const cancelBtn = document.getElementById('cancel-change');

  cancelBtn?.addEventListener('click', () => navigateTo('/profile'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const oldPassword = (document.getElementById('old-password') as HTMLInputElement).value;
    const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      await UserService.changePassword(oldPassword, newPassword);
      alert('Mot de passe changé avec succès !');
      navigateTo('/profile');
    } catch (err: any) {
      console.error('Change password error', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors du changement de mot de passe';
      alert('Erreur: ' + msg);
    }
  });
}
