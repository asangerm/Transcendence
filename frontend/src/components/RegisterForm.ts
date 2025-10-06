import { AuthService, RegisterCredentials } from '../services/auth.service';
import { RegisterFormHandler } from '../scripts/register-form';

export class RegisterForm {
  private container: HTMLElement;
  private onSuccess?: (user: any) => void;
  private onError?: (error: string) => void;
  private formHandler;

  constructor(container: HTMLElement, options: { onSuccess?: (user: any) => void; onError?: (error: string) => void } = {}) {
    this.container = container;
    this.onSuccess = options.onSuccess;
    this.onError = options.onError;
    this.render();
    this.attachEventListeners();
	this.formHandler = new RegisterFormHandler();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="h-full w-full flex items-center justify-center p-4 pt-10">
			<div class="max-w-md w-full mx-auto">
				<div class="bg-primary dark:bg-primary-dark rounded-md shadow-lg py-5 px-10 transform transition-all duration-300 hover:shadow-2xl">
					<h2 class="text-3xl font-extrabold text-center mb-6">Inscription</h2>
					
					<form id="registerForm" class="space-y-3" novalidate>
						<!-- Username Input -->
						<div>
							<label for="username" class="block text-sm font-medium mb-2">
								Nom d'utilisateur
							</label>
							<input
								type="text"
								id="username"
								name="username"
								required
								class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
								placeholder="Choisissez un nom d'utilisateur"
							>
							<p id="usernameError" class="mt-2 text-sm error-text hidden"></p>
						</div>

						<!-- Email Input -->
						<div class="relative overflow-visible">
							<label for="email" class="block text-sm font-medium mb-2">
								Email
							</label>
							<div id="emailVerif" class="transition-all duration-150 invisible scale-0 absolute top-2 -right-4 z-10 inline-block w-48 h-7 flex items-center justify-center text-sm font-medium bg-red-500 rounded-full shadow-xs text-black">
								Format Email Invalide
							</div>

							<input
								type="email"
								id="email"
								name="email"
								required
								class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
								placeholder="Entrez votre email"
							>
						</div>

						<!-- Password Input -->
						<div class="relative">
							<label for="password" class="block text-sm font-medium mb-2">
								Mot de passe
							</label>
							<div id="pwdVerifContainer" class="transition-all duration-150 invisible scale-0 absolute top-2 -right-4 w-48 h-7 z-50 inline-block text-black text-sm font-medium bg-neutral-300 rounded-full shadow-xs overflow-hidden">
								
								<p id="passwordVerif" class="transition-all duration-500 text-sm absolute inset-0 w-full h-full text-center rounded-full border-2 text-dark">
									Veuillez taper un mot de passe
								</p>
								<div id="passwordStrengthBar" class="transition-all duration-500 bg-red-500 h-full">
								</div>	
							</div>
							
							<input
								type="password"
								id="password"
								name="password"
								required
								class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
								placeholder="Créez un mot de passe"
							>

						</div>

						<!-- Confirm Password Input -->
						<div class="relative">
							<label for="confirmPassword" class="block text-sm font-medium mb-2">
								Confirmer le mot de passe
							</label>
							<div id="confirmPasswordVerif" class="bg-red-500 transition-all duration-150 invisible scale-0 absolute top-2 -right-4 z-10 inline-block w-48 h-7 flex items-center justify-center text-sm font-medium text-black rounded-full shadow-xs whitespace-nowrap">
								Mot de passe différent
							</div>
							<input
								type="password"
								id="confirmPassword"
								name="confirmPassword"
								required
								class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
								placeholder="Confirmez votre mot de passe"
							>
						</div>

						<!-- Terms Checkbox -->
						<div class="flex items-start">
							<div class="flex items-center h-5">
								<input
									type="checkbox"
									id="terms"
									name="terms"
									required
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-300"
								>
							</div>
							<div class="ml-3">
								<label for="terms" class="text-sm text-muted dark:text-muted-dark">
									J'accepte les <a href="#" class="links-style">conditions d'utilisation</a>
									et la <a href="#" class="links-style">politique de confidentialité</a>
								</label>
							</div>
						</div>

						<!-- Submit Button -->
						<button
							type="submit"
							class="w-full button-primary rounded-md"
							id="register-button"
						>
							S'inscrire
						</button>

						<!-- Login Link -->
						<div class="text-center mt-4">
							<span class="text-muted dark:text-muted-dark">Déjà un compte?</span>
							<a href="/login" class="links-style">
								Se connecter
							</a>
						</div>

						<div id="error-message" class="hidden mt-3 text-center text-sm text-red-600 dark:text-red-400"></div>
						<div id="success-message" class="hidden mt-3 text-center text-sm text-green-600 dark:text-green-400"></div>
					</form>
				</div>
			</div>
		</div>
    `;
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('#registerForm') as HTMLFormElement;
    
    form?.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    

	if (!this.formHandler.validateForm()) {
		return;
	}

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const password = formData.get('password') as string;


    const credentials: RegisterCredentials = {
      email: formData.get('email') as string,
      password,
      name: formData.get('username') as string,
    };

    const button = form.querySelector('#register-button') as HTMLButtonElement;
    const errorDiv = form.querySelector('#error-message') as HTMLDivElement;

    button.disabled = true;
    button.textContent = 'Creating Account...';
    errorDiv.classList.add('hidden');

    try {
      const result = await AuthService.register(credentials);
      
      if (result.success) {
        this.showSuccess('Account created successfully!');
        setTimeout(() => {
          this.onSuccess?.();
        }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      this.showError(error.message);
      this.onError?.(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Create Account';
    }
  }

  private showError(message: string): void {
    const errorDiv = this.container.querySelector('#error-message') as HTMLDivElement;
    const successDiv = this.container.querySelector('#success-message') as HTMLDivElement;
    
    successDiv.classList.add('hidden');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  private showSuccess(message: string): void {
    const errorDiv = this.container.querySelector('#error-message') as HTMLDivElement;
    const successDiv = this.container.querySelector('#success-message') as HTMLDivElement;
    
    errorDiv.classList.add('hidden');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
  }
}