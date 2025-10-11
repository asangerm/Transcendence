import { AuthService, LoginCredentials } from '../services/auth.service';
import '../types/google.d.ts';

export class LoginForm {
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
      <div class="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Or
              <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                create a new account
              </a>
            </p>
          </div>
          <form class="mt-8 space-y-6" id="login-form">
            <input type="hidden" name="remember" value="true">
            <div class="rounded-md shadow-sm -space-y-px">
              <div>
                <label for="email-address" class="sr-only">Email address</label>
                <input 
                  id="email-address" 
                  name="email" 
                  type="email" 
                  autocomplete="email" 
                  required 
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                  placeholder="Email address"
                >
              </div>
              <div>
                <label for="password" class="sr-only">Password</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autocomplete="current-password" 
                  required 
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                  placeholder="Password"
                >
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox" 
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                >
                <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-white">
                  Remember me
                </label>
              </div>

              <div class="text-sm">
                <a href="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                id="login-button"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </span>
                Sign in
              </button>
            </div>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              <div class="mt-6" id="google-signin-container">
                <!-- Google Sign-In button will be rendered here -->
              </div>
            </div>

            <div id="error-message" class="hidden mt-3 text-center text-sm text-red-600 dark:text-red-400"></div>
          </form>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('#login-form') as HTMLFormElement;
    
    
    form?.addEventListener('submit', this.handleSubmit.bind(this));
    
    this.initializeGoogleSignIn();
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const credentials: LoginCredentials = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const button = form.querySelector('#login-button') as HTMLButtonElement;
    const errorDiv = form.querySelector('#error-message') as HTMLDivElement;

    button.disabled = true;
    button.textContent = 'Signing in...';
    errorDiv.classList.add('hidden');

    try {
      const result = await AuthService.login(credentials);
      
      if (result.success) {
        const user = await AuthService.verifyToken();
        this.onSuccess?.(user);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      this.showError(error.message);
      this.onError?.(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Sign in';
    }
  }

  private async initializeGoogleSignIn(): Promise<void> {
    try {
      setTimeout(async () => {
        await this.renderGoogleButton();
      }, 500);
    } catch (error: any) {
      console.error('Google Sign-In initialization error:', error);
    }
  }

  private async renderGoogleButton(): Promise<void> {
    try {
      if (typeof window.google === 'undefined') {
        setTimeout(() => this.renderGoogleButton(), 1000);
        return;
      }

      const googleContainer = this.container.querySelector('#google-signin-container');
      if (!googleContainer) {
        return;
      }
      googleContainer.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: this.handleGoogleResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
      });

      window.google.accounts.id.renderButton(googleContainer as HTMLElement, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: '100%'
      });

    } catch (error: any) {
      console.error('Google button render error:', error);
      const googleContainer = this.container.querySelector('#google-signin-container');
      if (googleContainer) {
        googleContainer.innerHTML = `
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            Google Sign-In unavailable. Please use email/password login.
          </div>
        `;
      }
    }
  }

  private async handleGoogleResponse(response: any): Promise<void> {
    try {
      const result = await AuthService.googleLogin(response.credential);
      this.onSuccess?.(result.user);
    } catch (error: any) {
      console.error('Google response error:', error);
      this.showError(error.message);
      this.onError?.(error.message);
    }
  }

  private showError(message: string): void {
    const errorDiv = this.container.querySelector('#error-message') as HTMLDivElement;
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  private showSuccess(message: string): void {
  }
}