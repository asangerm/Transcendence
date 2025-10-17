import { AuthStore } from '../stores/auth.store';
import { AuthService, User } from '../services/auth.service';
import UserService, { UserProfile } from '../services/user.service';
import { escapeHtml } from '../utils/sanitizer';

export class NavBar {
	private container: HTMLElement;
	private user: User | null = null;
	private userProfile: UserProfile | null = null;
	private unsubscribe?: () => void;

	constructor(container: HTMLElement) {
		this.container = container;
		this.init();
	}

	private async init(): Promise<void> {
		// Charger l'utilisateur actuel
		this.user = AuthStore.getUser();

		await this.loadUserProfile();
		this.render();
		this.attachEventListeners();

		// S'abonner aux changements d'utilisateur
		this.unsubscribe = AuthStore.subscribe(async (nextUser) => {
			this.user = nextUser;
			await this.loadUserProfile();
			this.render();
			this.attachEventListeners();
		});
	}

	private async loadUserProfile(): Promise<void> {
		if (!this.user?.display_name) {
			this.userProfile = null;
			return;
		}

		try {
			this.userProfile = await UserService.getUserProfile(this.user.display_name);
		} catch (error) {
			console.error('Erreur lors du chargement du profil :', error);
			this.userProfile = null;
		}
	}

	private get isAuth(): boolean {
		return AuthService.isAuthenticated();
	}

	private getFullAvatarUrl(avatarUrl: string | null): string {
		if (!avatarUrl) return 'http://localhost:8000/uploads/avatars/default.png';
		if (avatarUrl.startsWith('http')) return avatarUrl;
		return `http://localhost:8000${avatarUrl}`;
	}

	private render(): void {
		const safeDisplayName = escapeHtml(this.user?.display_name || '');
		const safeAvatarUrl = this.getFullAvatarUrl(this.userProfile?.avatar_url || null);

 		this.container.innerHTML = `
			<nav class="bg-primary font-extrabold shadow-xl fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 dark:bg-primary-dark">
				<div class="max-w-6xl mx-auto px-4">
					<div class="flex justify-between">
						<!-- Logo -->
						<div class="">
							<a href="/" data-nav class="flex flex-row justify-between justify-items items-center py-4 gap-2 font-extrabold text-text hover:text-button transition-colors duration-300 text-xl dark:text-text-dark dark:hover:text-button-dark">
							<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#000000">
								<g fill="#ffffffff"><path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z"/><path d="m12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z"/>
								</g>
							</svg>
							Acceuil
							</a>
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
							<a href="/games" data-nav class="flex flex-row justify-items items-center gap-2 py-2 px-4 text-text hover:text-button font-medium transition-colors duration-300 dark:text-text-dark dark:hover:text-button-dark">
								<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 20 20">
									<path fill="#ffffffff" d="M15.9 5.5C15.3 4.5 14.2 4 13 4H7c-1.2 0-2.3.5-2.9 1.5c-2.3 3.5-2.8 8.8-1.2 9.9c1.6 1.1 5.2-3.7 7.1-3.7s5.4 4.8 7.1 3.7c1.6-1.1 1.1-6.4-1.2-9.9zM8 9H7v1H6V9H5V8h1V7h1v1h1v1zm5.4.5c0 .5-.4.9-.9.9s-.9-.4-.9-.9s.4-.9.9-.9s.9.4.9.9zm1.9-2c0 .5-.4.9-.9.9s-.9-.4-.9-.9s.4-.9.9-.9s.9.4.9.9z"/>
								</svg>	
								Jouer
							</a>
							<div class="border-l border-muted dark:border-muted-dark h-6 mx-2"></div>
							${this.isAuth ? `
								<div id="profile-nav" class="relative w-10 h-10 hover:cursor-pointer bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold mb-2 mx-auto border border-2">
									<img 
										src="${safeAvatarUrl}"
										alt="${safeDisplayName}"
										class="rounded-full object-cover"
										id="profile-avatar"
									>
									${this.isAuth ? `
									<div class="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2"></div>
									` : `
									<div class="absolute right-0 bottom-0 w-3 h-3 bg-gray-500 rounded-full border-2"></div>
									`}
									<!-- Menu déroulant -->
									<div id="profile-dropdown" class="absolute transition-all duration-150 invisible origin-top-right scale-0 z-50 top-10 right-0 mt-2 w-40 bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-lg shadow-lg ">
										<a href="/profile/${safeDisplayName}" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg">Profil</a>
										<a id="friends" class="block w-full text-left px-4 py-2 hover:bg-gray-700 ">Amis</a>
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
		if (dropdownProfile) {
			navProfile?.addEventListener('click', () => {
				if (dropdownProfile.classList.contains("invisible")) {
					dropdownProfile.classList.remove("invisible", "scale-0");
					dropdownProfile.classList.add("scale-100");
				} else {
					dropdownProfile.classList.remove("scale-100");
					dropdownProfile.classList.add( "scale-0");
					dropdownProfile.classList.add("invisible");
				}
			});
		}
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

}