import { AuthService, RegisterCredentials } from '../services/auth.service';

export class RegisterForm {
  private container: HTMLElement;
  private onSuccess?: (user: any) => void;
  private onError?: (error: string) => void;

  constructor(container: HTMLElement, options: { onSuccess?: (user: any) => void; onError?: (error: string) => void } = {}) {
    this.container = container;
    this.onSuccess = options.onSuccess;
    this.onError = options.onError;
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?
              <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Sign in
              </a>
            </p>
          </div>
          <form class="mt-8 space-y-6" id="register-form">
            <div class="rounded-md shadow-sm space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autocomplete="email" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                  placeholder="Email address"
                >
              </div>
              <div>
                <label for="display-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name
                </label>
                <input 
                  id="display-name" 
                  name="displayName" 
                  type="text" 
                  autocomplete="username" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                  placeholder="Choose a display name"
                  minlength="3"
                  maxlength="50"
                >
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">This will be your username in tournaments and games.</p>
              </div>
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autocomplete="new-password" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                  placeholder="Password"
                  minlength="8"
                >
              </div>
              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <input 
                  id="confirm-password" 
                  name="confirmPassword" 
                  type="password" 
                  autocomplete="new-password" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                  placeholder="Confirm password"
                >
              </div>
            </div>

            <div class="password-strength mt-3" id="password-strength" style="display: none;">
              <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Password strength:</div>
              <div class="flex space-x-1">
                <div class="h-1 w-1/4 bg-gray-300 rounded"></div>
                <div class="h-1 w-1/4 bg-gray-300 rounded"></div>
                <div class="h-1 w-1/4 bg-gray-300 rounded"></div>
                <div class="h-1 w-1/4 bg-gray-300 rounded"></div>
              </div>
              <div class="text-xs mt-1" id="password-feedback"></div>
            </div>

            <div>
              <button 
                type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                id="register-button"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  </svg>
                </span>
                Create Account
              </button>
            </div>

            <div id="error-message" class="hidden mt-3 text-center text-sm text-red-600 dark:text-red-400"></div>
            <div id="success-message" class="hidden mt-3 text-center text-sm text-green-600 dark:text-green-400"></div>
          </form>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('#register-form') as HTMLFormElement;
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;
    const confirmPasswordInput = this.container.querySelector('#confirm-password') as HTMLInputElement;
    
    form?.addEventListener('submit', this.handleSubmit.bind(this));
    passwordInput?.addEventListener('input', this.checkPasswordStrength.bind(this));
    confirmPasswordInput?.addEventListener('input', this.validatePasswordMatch.bind(this));
    passwordInput?.addEventListener('input', this.validatePasswordMatch.bind(this));
  }

  private checkPasswordStrength(event: Event): void {
    const passwordInput = event.target as HTMLInputElement;
    const password = passwordInput.value;
    const strengthDiv = this.container.querySelector('#password-strength') as HTMLDivElement;
    const feedbackDiv = this.container.querySelector('#password-feedback') as HTMLDivElement;
    const bars = strengthDiv.querySelectorAll('div div');

    if (password.length === 0) {
      strengthDiv.style.display = 'none';
      return;
    }

    strengthDiv.style.display = 'block';

    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    else feedback.push('at least 8 characters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('uppercase letter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('lowercase letter');

    if (/[\d\W]/.test(password)) score++;
    else feedback.push('number or symbol');

    bars.forEach((bar, index) => {
      bar.className = `h-1 w-1/4 rounded ${
        index < score 
          ? score <= 1 ? 'bg-red-400' 
            : score <= 2 ? 'bg-yellow-400' 
            : score <= 3 ? 'bg-blue-400' 
            : 'bg-green-400'
          : 'bg-gray-300'
      }`;
    });

    if (score < 4) {
      feedbackDiv.textContent = `Add: ${feedback.join(', ')}`;
      feedbackDiv.className = 'text-xs mt-1 text-red-500';
    } else {
      feedbackDiv.textContent = 'Strong password!';
      feedbackDiv.className = 'text-xs mt-1 text-green-500';
    }
  }

  private validatePasswordMatch(): void {
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;
    const confirmInput = this.container.querySelector('#confirm-password') as HTMLInputElement;
    
    if (confirmInput.value && passwordInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity('Passwords do not match');
    } else {
      confirmInput.setCustomValidity('');
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    const credentials: RegisterCredentials = {
      email: formData.get('email') as string,
      password,
      displayName: formData.get('displayName') as string,
    };

    const button = form.querySelector('#register-button') as HTMLButtonElement;
    const errorDiv = form.querySelector('#error-message') as HTMLDivElement;

    button.disabled = true;
    button.textContent = 'Creating Account...';
    errorDiv.classList.add('hidden');

    try {
      const result = await AuthService.register(credentials);
      this.showSuccess('Account created successfully! You are now logged in.');
      setTimeout(() => {
        this.onSuccess?.(result.user);
      }, 1500);
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