import { AuthService, RegisterCredentials, User } from '../services/auth.service';
import { UserService, UserProfile } from '../services/user.service';
import { AuthStore } from '../stores/auth.store';

export class NavBar {
  	private container: HTMLElement;
	private onSuccess?: (user: any) => void;
	private onError?: (error: string) => void;
	private userProfile: UserProfile | null = null;
	private user: User | null;
	private unsubscribe?: () => void;

	constructor(container: HTMLElement, options: { onSuccess?: (user: any) => void; onError?: (error: string) => void } = {}) {
		this.container = container;
		this.onSuccess = options.onSuccess;
		this.onError = options.onError;
		this.render();
		this.attachEventListeners();
		this.user = AuthStore.getUser();
		this.unsubscribe = AuthStore.subscribe((u) => {
			this.user = u;
			this.updateAuthState();
		});
	}

	private get isAuth(): boolean {
		return AuthService.isAuthenticated();
	}

	private render(): void {
 		this.container.innerHTML = `
			<nav class="bg-primary shadow-xl fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 dark:bg-primary-dark">
				<div class="max-w-6xl mx-auto px-4">
					<div class="flex justify-between">
						<!-- Logo -->
						<div class="flex items-center py-4">
							<a href="/" data-nav class="font-bold text-text hover:text-button transition-colors duration-300 text-xl dark:text-text-dark dark:hover:text-button-dark">ft_transcendence</a>
						</div>

						<!-- Mobile menu button -->
						<div class="md:hidden flex items-center">
							<button id="mobile-menu-button" class="text-text hover:text-button focus:outline-none dark:text-text-dark dark:hover:text-button-dark">
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path id="menu-icon" class="block" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
									<path id="close-icon" class="hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<!-- Desktop menu -->
						<div class="hidden md:flex items-center space-x-6">
							<a href="/games" data-nav class="py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">Games</a>
							<div class="border-l border-muted dark:border-muted-dark h-6 mx-2"></div>
							${this.isAuth ? `
								<div id="profile-nav" class="relative w-10 h-10 hover:cursor-pointer bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold mb-2 mx-auto border border-2">
									<img 
										src="../../images/profile1.png"
										alt="${this.user?.display_name}"
										class="rounded-full object-cover"
										id="profile-avatar"
									>
									${this.isAuth ? `
									<div class="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2"></div>
									` : `
									<div class="absolute right-0 bottom-0 w-3 h-3 bg-gray-500 rounded-full border-2"></div>
									`}
									<!-- Menu déroulant -->
									<div id="profile-dropdown" class="hidden absolute top-10 left-0 mt-2 w-40 bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-lg shadow-lg ">
										<a href="/profile" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg">Profile</a>
										<a id="friends" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg">Friends</a>
										<a id="history" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg">Statistics</a>
										<a id="logout" 
											class="flex items-center gap-2 w-full px-4 py-2 text-left text-red-500 hover:bg-gray-700 rounded-b-lg border-t border-gray-600">
											<svg xmlns="http://www.w3.org/2000/svg" 
												class="w-6 h-6 text-red-500" 
												fill="none" 
												viewBox="0 0 24 24" 
												stroke="currentColor" 
												stroke-width="2">
												<path d="M21 12L13 12" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M18 15L20.913 12.087V12.087C20.961 12.039 20.961 11.961 20.913 11.913V11.913L18 9" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M16 5V4.5V4.5C16 3.67157 15.3284 3 14.5 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H14.5C15.3284 21 16 20.3284 16 19.5V19.5V19" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
											Logout
										</a>
									</div>
								</div>
								` :	`
								<a href="/login" data-nav class="py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">Connexion</a>
								<a href="/register" data-nav class="button-primary">Inscription</a>
							`}
						</div>
					</div>

					<!-- Mobile menu -->
					<div id="mobile-menu" class="hidden md:hidden pb-4">
						<a href="/games" data-nav class="block py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">Games</a>
						${this.isAuth ? `
							<a href="/profile" data-nav class="block py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">Profile</a>
							<a href="/logout" data-nav class="block py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">Déconnexion</a>
						` : `
							<a href="/login" data-nav class="block py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">Connexion</a>
							<a href="/register" data-nav class="button-primary">Inscription</a>
						`}
					</div>
				</div>
			</nav>
		`
	}

	private attachEventListeners(): void {
		const mobileMenuButton = this.container.querySelector('#mobile-menu-button');
		const mobileMenu = this.container.querySelector('#mobile-menu');
		const menuIcon = this.container.querySelector('#menu-icon');
		const closeIcon = this.container.querySelector('#close-icon');
		const navProfile = this.container.querySelector('#profile-nav');
		const dropdownProfile = this.container.querySelector('#profile-dropdown');
		const logoutBtn = this.container.querySelector('#logout');

		mobileMenuButton?.addEventListener('click', () => {
			mobileMenu?.classList.toggle('hidden');
			menuIcon?.classList.toggle('hidden');
			closeIcon?.classList.toggle('hidden');
		});

		navProfile?.addEventListener('click', () => {
			dropdownProfile?.classList.toggle('hidden');
		});
		logoutBtn?.addEventListener('click', () => {
			this.handleLogout();
		});

	}

	private async handleLogout(): Promise<void> {
	  try {
		await AuthService.logoutAsync();
		window.location.href = '/login';
	  } catch (error: any) {
	  }
	}

	// Méthode publique pour mettre à jour la navbar après connexion/déconnexion
	public updateAuthState(): void {
		this.render();
		this.attachEventListeners();
	}
}