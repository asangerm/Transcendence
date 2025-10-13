import { UserService, UserProfile, UserStats } from '../services/user.service';
import { AuthService, User } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { sanitizeHtml, sanitizeInput, escapeHtml } from '../utils/sanitizer';

export class UserProfileComponent {
	private container: HTMLElement;
	private userProfile: UserProfile | null = null;
	private userStats: UserStats[] = [];
	private isOwnProfile: boolean = false;
	private user: User | null;
	private unsubscribe?: () => void;

	constructor(container: HTMLElement) {
		this.container = container;
		this.user = AuthStore.getUser();
	}

	private getFullAvatarUrl(avatarUrl: string | null): string {
		if (!avatarUrl) return '/src/assets/default-avatar.png';
		if (avatarUrl.startsWith('http')) return avatarUrl;
		return `http://localhost:8000${avatarUrl}`;
	}

	async init(username?: string): Promise<void> {
		try {
			const currentUser = AuthStore.getUser();

			if (username) {
				if (currentUser && currentUser?.display_name == username) {
					this.isOwnProfile = true;
				}
				else if (currentUser && currentUser?.display_name != username) {
					// username = UserService.getUserProfile(username);
					this.isOwnProfile = false;
				}
			} else if (!username && currentUser) {
				username = currentUser.display_name;
				this.isOwnProfile = true;
			}
			if (!username) {
				this.showError('User not found');
				return;
			}

			// S'abonner aux changements d'utilisateur
			this.unsubscribe = AuthStore.subscribe((user) => {
				this.user = user;
				// Si l'utilisateur change, recharger le profil si c'est son propre profil
					if (this.isOwnProfile && user && user.id !== this.userProfile?.id) {
						// Vérifier qu'on est toujours sur la page profil
						if (window.location.pathname === '/profile') {
							this.loadUserData(user.display_name);
						}
					}
			});

			await this.loadUserData(username);
		} catch (error: any) {
			console.error('Error loading user profile:', error);
			this.showError(error.message || 'Failed to load profile');
		}
	}

	public destroy(): void {
		this.unsubscribe?.();
	}

	private async loadUserData(username: string): Promise<void> {
		// this.userProfile = this.isOwnProfile 
		// ? await UserService.getCurrentUserProfile()
		// : await UserService.getUserProfile(username);
		this.userProfile = await UserService.getUserProfile(username);
		this.userStats = await UserService.getUserStats(this.userProfile.id);
		this.userProfile.matchHistory = await UserService.getMatchHistory(this.userProfile.id);
		this.render();
		this.attachEventListeners();
	}

private render(): void {
	if (!this.userProfile) return;

	const safeDisplayName = escapeHtml(this.userProfile.display_name);
	const safeAvatarUrl = this.getFullAvatarUrl(this.userProfile.avatar_url);

	this.container.innerHTML = `
	<div class="max-w-6xl max-h-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
			<!-- Profile Card -->
			<div class="relative bg-primary dark:bg-primary-dark rounded-2xl p-6 border border-white/10">
				<a href="/profile" class="absolute z-50 top-5 right-5 flex flex-col items-center transform transition-all duration-300 hover:scale-105">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 20 20">
						<path fill="#e8e8e8" d="M10 9a3 3 0 1 0 0-6a3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm-4.51 7.326a.78.78 0 0 1-.358-.442a3 3 0 0 1 4.308-3.516a6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655Zm14.95.654a4.97 4.97 0 0 0 2.07-.654a.78.78 0 0 0 .357-.442a3 3 0 0 0-4.308-3.517a6.484 6.484 0 0 1 1.907 3.96a2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71a5 5 0 0 1 9.947 0a.843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z"/>
					</svg>
					<span>Amis : ${this.userProfile.friendCount || 0}</span>
				</a>
				<div class="text-center mb-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div class="relative inline-block col-span-1">
						<div class="relative w-28 h-28 bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold mb-2 mx-auto border border-2">
							<img 
								src="${safeAvatarUrl}"
								alt="${safeDisplayName}"
								class="w-28 h-28 rounded-full object-cover"
								id="profile-avatar"
							>
							${this.userProfile.is_online ? ` //TODO: implementer le isonline dans le backend
							<div class="absolute right-0 bottom-0 w-8 h-8 bg-green-500 rounded-full border-2"></div>
							` : `
							<div class="absolute right-0 bottom-0 w-8 h-8 bg-gray-500 rounded-full border-2"></div>
							`}
						</div>
					</div>
					<div class="relative flex flex-col col-span-2 text-left text-text-muted dark:text-text-muted-dark">
						<h2 class="text-3xl text-text dark:text-text-dark font-bold mb-3">${safeDisplayName}</h2>
						<span>Membre depuis : 09/2025</span>
					</div>
				</div>
				<div class="flex justify-left mb-8 items-center">
				${this.isOwnProfile ? `
					<button id="edit-profile" class="flex items-center justify-center gap-2 button-secondary fill-text-dark dark:hover:fill-text text-xs">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
							<path fill-rule="evenodd" d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608a7.45 7.45 0 0 0-.478.198a.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796a7.448 7.448 0 0 0-.198.478a.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517c.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198c.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608a7.52 7.52 0 0 0 .478-.198a.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478c.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517a7.507 7.507 0 0 0-.198-.478a.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064a7.462 7.462 0 0 0-.478-.198a.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5a3.75 3.75 0 0 0 0 7.5Z" clip-rule="evenodd"/>
						</svg>
						Modifier le profil
					</button>
				` : `
					<button id="add-friend" class="px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-green-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-green-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-green-500 text-xs">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
							<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.615 16.428a1.224 1.224 0 0 1-.569-1.175a6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 8 18a9.953 9.953 0 0 1-5.385-1.572ZM16.25 5.75a.75.75 0 0 0-1.5 0v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2Z"/>
						</svg>
						Ajouter en ami
					</button>
					<button id="add-friend" class="hidden px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-red-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-red-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-red-500 text-xs">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
							<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573c.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/>
						</svg>
						Ajouter en ami
					</button>
				`}
				</div>
				<!-- Level Progress -->
				<div>
					<div class="flex justify-between items-end mb-4">
						<span class="leading-none text-xl text-text dark:text-text-dark font-semibold">Niveau 7</span>
						<span class="leading-none text-text-muted dark:text-text-muted-dark">1500 / 2500 XP</span>
					</div>
					<div class="w-full bg-gray-700 rounded-full h-4">
						<div class="bg-red-500 h-4 rounded-full transition-all duration-500" style="width: 60%"></div>
					</div>
				</div>
			</div>

			<!-- Stats Card with Game Selector -->
			<div class="bg-primary dark:bg-primary-dark backdrop-blur-sm rounded-2xl p-6 border border-white/10">
				<div class="flex items-center justify-between mb-8">
					<h3 class="text-2xl font-bold" id="currentGameTitle">PONG</h3>
					<button id="dropdownArrow" class="transition-all duration-150 text-gray-400 hover:text-white transition-colors">
						<svg class="w-6 h-6 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</button>
				</div>
				<!-- Menu déroulant -->
				<div id="gameDropdown" class="invisible transition-all duration-150 scale-0 origin-top-right absolute top-14 right-5 mt-2 w-40 bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-lg shadow-lg ">
					<button id="pongChoice" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg">PONG</button>
					<button id="aowChoice" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-b-lg">AGE OF WAR</button>
				</div>
				
				<!-- Pong Stats (default) -->
				<div id="gameStats" class="grid grid-cols-2 gap-6">
					${this.renderStats('PONG')}
				</div>
				
				<a href="/stats" class="w-full text-center block button-secondary">
					Voir plus de statistiques
				</a>
			</div>
		</div>


		<!-- Recent Games Section (Full Width) -->
		<div class="bg-primary dark:bg-primary-dark rounded-2xl p-6 border border-white/10">
			<h3 class="text-center text-2xl font-bold mb-4">Parties récentes</h3>
			
			<div class="space-y-4 flex flex-col items-center" id="gameHistory">
				${this.renderMatchHistory()}
			</div>
			
			<button class="w-full mt-6 bg-gaming-accent/20 hover:bg-gaming-accent/30 border border-gaming-accent/50 py-3 rounded-lg font-medium transition-colors">
				Voir tout l'historique
			</button>
		</div>
	</div>


	<!-- Modals -->
		<div id="edit-profile-modal" class="modal hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
				<div class="mt-3">
					<h3 class="text-lg font-medium text-gray-900 dark:text-white">Modifier le Profil</h3>
					<form id="edit-profile-form" class="mt-4 space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
							<input 
								type="text" 
								name="displayName" 
								value="${safeDisplayName}"
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								required
								minlength="3"
								maxlength="50"
							>
							</div>
							<div class="flex justify-end space-x-3">
							<button 
								type="button" 
								id="cancel-edit"
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
							>
								Cancel
							</button>
							<button 
								type="submit"
								class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
							>
								Save Changes
							</button>
							</div>
							<div class="mt-4 flex justify-between gap-2">
							<button 
								type="button" 
								id="anonymize-btn" 
								class="px-2 py-1 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600"
							>
								Anonymiser mon compte
							</button>
							<button 
								type="button" 
								id="delete-btn" 
								class="px-2 py-1 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600"
							>
								Supprimer mon compte
          					</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	`;
}

private renderDefaultStats(game: string): string {
	return `
	<!-- ${game} Stats (No data) -->
	<div>
		<div class="grid grid-cols-2 gap-4 mb-8">
		<div class="text-center">
			<div class="text-4xl text-text dark:text-text-dark font-bold mb-1">0</div>
			<div class="text-muted dark:text-muted-dark">Victoires</div>
		</div>
		<div class="text-center">
			<div class="text-4xl text-text dark:text-text-dark font-bold mb-1">0</div>
			<div class="text-muted dark:text-muted-dark">Défaites</div>
		</div>
		</div>
		
		<div class="text-center mb-6">
		<div class="text-xl text-muted dark:text-muted-dark">Parties jouées : 0</div>
		</div>
	</div>
	<!-- Win Rate Circle -->
	<div class="flex justify-center mb-6">
		<div class="relative w-32 h-32">
		<svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
			<path class="text-gray-700" stroke="currentColor" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
			<path class="text-gaming-success" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
		</svg>
		<div class="absolute inset-0 flex items-center justify-center">
			<span class="text-lg font-bold">0%</span>
		</div>
		</div>
	</div>
	`;
}

private renderStats(game: string): string{
		console.log('Rendering stats for game:', game);
		console.log('User stats:', this.userStats);

		// Vérifier que userStats existe et est un tableau
		if (!this.userStats || !Array.isArray(this.userStats)) {
			console.warn('UserStats not available or not an array:', this.userStats);
			return this.renderDefaultStats(game);
		}
		const gameStats = this.userStats.find(stat => 
			stat.game_name.toUpperCase() === game.toUpperCase()
		);
		// Si pas de stats pour ce jeu, afficher des valeurs par défaut
		if (!gameStats) {
			return this.renderDefaultStats(game);
		}
		const victories = gameStats.victories;
		const defeats = gameStats.defeats;
		const totalGames = victories + defeats;
		const winRate = totalGames > 0 ? Math.round((victories / totalGames) * 100) : 0;

		return `
		<!-- ${game} Stats -->
			<div>
				<div class="grid grid-cols-2 gap-4 mb-8">
					<div class="text-center">
					<div class="text-4xl text-text dark:text-text-dark font-bold mb-1">${victories}</div>
					<div class="text-muted dark:text-muted-dark">Victoires</div>
					</div>
					<div class="text-center">
					<div class="text-4xl text-text dark:text-text-dark font-bold mb-1">${defeats}</div>
					<div class="text-muted dark:text-muted-dark">Défaites</div>
					</div>
				</div>
				
				<div class="text-center mb-6">
					<div class="text-xl text-muted dark:text-muted-dark">Parties jouées : ${totalGames}</div>
				</div>
				</div>
				<!-- Win Rate Circle -->
				<div class="flex justify-center mb-6">
				<div class="relative w-32 h-32">
					<svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
					<path class="text-gray-700" stroke="currentColor" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
					<path class="text-gaming-success" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="${winRate}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
					</svg>
					<div class="absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-lg font-bold">Ratio V/D</span>
					<span class="text-lg font-bold">${winRate}%</span>
					</div>
				</div>
			</div>
		`;
}

private renderMatchHistory(): string {  
	if (!this.userProfile?.matchHistory || this.userProfile.matchHistory.length === 0) {
		return '<p class="text-gray-500 dark:text-gray-400">Aucune partie jouée pour le moment.</p>';
	}

	return this.userProfile.matchHistory.map(match => {
		const isVictory = match.winner_id == this.userProfile?.id;
		const bgClass = isVictory ? 'bg-green-500/5 border-green-500' : 'bg-red-500/10 border-red-500';
		const badgeClass = isVictory ? 'bg-success' : 'bg-danger';
		const badgeText = isVictory ? 'VICTOIRE' : 'DÉFAITE';

		// Échapper toutes les données utilisateur
		const safeGameName = escapeHtml(match.game_name);
		const safeOpponentName = escapeHtml(match.opponent_name);
		
		// Formater la date
		const matchDate = new Date(match.played_at).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

		return `
			<div class="${bgClass} border rounded-lg p-4 mb-2 min-w-[700px]">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center space-x-4 mb-2 sm:mb-0">
				<span class="${badgeClass} text-xl text-white px-4 py-2 rounded-full text-sm font-bold">${badgeText}</span>
				<div class="flex flex-col">
					<span class="text-xl font-semibold">${safeGameName}</span>
					<a href="/profile/" class="text-lg text-gray-600 dark:text-gray-400">vs ${safeOpponentName}</a>
					${match.game_name == 'PONG' ? `
					<span class="text-sm font-medium">Score : ${match.score_p1} / ${match.score_p2}</span>
					`:``}
				</div>
				</div>
				<div class="text-gray-400 text-sm">
				<div>${matchDate}</div>
				</div>
			</div>
			</div>
		`;
	}).join('');
}

private updateGameStats(gameName: string): void {
	const gameStatsContainer = this.container.querySelector('#gameStats');
	if (gameStatsContainer) {
		// Créer un élément temporaire pour le contenu sécurisé
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = sanitizeHtml(this.renderStats(gameName));
		
		// Vider le conteneur et ajouter le contenu sécurisé
		gameStatsContainer.innerHTML = '';
		while (tempDiv.firstChild) {
		gameStatsContainer.appendChild(tempDiv.firstChild);
		}
	}
	
	// Mettre à jour le titre du jeu
	const gameTitle = this.container.querySelector('#currentGameTitle');
	if (gameTitle) {
	gameTitle.textContent = gameName;
	}
}

private attachEventListeners(): void {
	const dropdown = document.getElementById('gameDropdown') as HTMLDivElement;
	const arrow = document.getElementById('dropdownArrow') as HTMLButtonElement;
	const pongbtn = document.getElementById("pongChoice") as HTMLButtonElement
	const aowbtn = document.getElementById("aowChoice") as HTMLButtonElement

	arrow.addEventListener('click', (e) => {
		e.preventDefault();
		if (dropdown.classList.contains("invisible")) {
			dropdown.classList.add("scale-100");
			dropdown.classList.remove("scale-0");
		}
		else {
			dropdown.classList.remove("scale-100");
			dropdown.classList.add("scale-0");
		}
		arrow.classList.toggle("rotate-180");
		dropdown.classList.toggle("invisible");
	});

	pongbtn.addEventListener("click", () => {
		dropdown.classList.toggle("invisible");
		arrow.classList.toggle("rotate-180");
		this.updateGameStats('PONG');
	});

	aowbtn.addEventListener("click", () => {
		dropdown.classList.toggle("invisible");
		arrow.classList.toggle("rotate-180");
		this.updateGameStats('AGE OF WAR');
	});

	if (this.isOwnProfile) {
	const changeAvatarBtn = this.container.querySelector('#change-avatar');
	const avatarUpload = this.container.querySelector('#avatar-upload') as HTMLInputElement;
	
	changeAvatarBtn?.addEventListener('click', () => avatarUpload.click());
	avatarUpload?.addEventListener('change', this.handleAvatarUpload.bind(this));

	const editBtn = this.container.querySelector('#edit-profile');
	const editModal = this.container.querySelector('#edit-profile-modal');
	const cancelBtn = this.container.querySelector('#cancel-edit');
	const editForm = this.container.querySelector('#edit-profile-form') as HTMLFormElement;
	const logoutBtn = this.container.querySelector('#logout-btn');
	const anonymizeBtn = this.container.querySelector('#anonymize-btn');
    const deleteBtn = this.container.querySelector('#delete-btn');

	editBtn?.addEventListener('click', () => editModal?.classList.remove('hidden'));
	cancelBtn?.addEventListener('click', () => editModal?.classList.add('hidden'));
	editForm?.addEventListener('submit', this.handleProfileUpdate.bind(this));
	logoutBtn?.addEventListener('click', this.handleLogout.bind(this));
    anonymizeBtn?.addEventListener('click', this.handleAnonymizeAccount.bind(this));
    deleteBtn?.addEventListener('click', this.handleDeleteAccount.bind(this));
	} 
	else {
	const addFriendBtn = this.container.querySelector('#add-friend');
	addFriendBtn?.addEventListener('click', this.handleAddFriend.bind(this));
	}
}

private async handleAvatarUpload(event: Event): Promise<void> {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	if (!file) return;

	try {
		const result = await UserService.uploadAvatar(file);
		const avatarImg = this.container.querySelector('#profile-avatar') as HTMLImageElement;
		
		const fullAvatarUrl = this.getFullAvatarUrl(result.avatarUrl);
		avatarImg.src = fullAvatarUrl;
		
		if (this.userProfile) {
			this.userProfile.avatar_url = result.avatarUrl;
			
			if (this.isOwnProfile) {
			const currentUser = AuthService.getUser();
			if (currentUser) {
				currentUser.avatar_url = result.avatarUrl;
				AuthService.setUser(currentUser);
			}
			}
		}
		
		this.showSuccess('Avatar updated successfully!');
	} catch (error: any) {
		this.showError(error.message || 'Failed to upload avatar');
	}
}

private async handleProfileUpdate(event: Event): Promise<void> {
	event.preventDefault();
	
	const form = event.target as HTMLFormElement;
	const formData = new FormData(form);
	const displayName = sanitizeInput(formData.get('displayName') as string);

	try {
	await UserService.updateProfile({ display_name: displayName });
	this.userProfile!.display_name = displayName;
	
	// Mettre à jour le store si c'est le profil de l'utilisateur connecté
	if (this.isOwnProfile) {
		const currentUser = AuthStore.getUser();
		if (currentUser) {
		currentUser.display_name = displayName;
		AuthStore.setUser(currentUser);
		}
	}
	
	// Mettre à jour l'affichage de manière sécurisée
	const nameElement = this.container.querySelector('h2');
	if (nameElement) {
		nameElement.textContent = displayName;
	}
	
	const modal = this.container.querySelector('#edit-profile-modal');
	modal?.classList.add('hidden');
	
	this.showSuccess('Profile updated successfully!');
	} catch (error: any) {
	this.showError(error.message || 'Failed to update profile');
	}
}

private async handleAddFriend(): Promise<void> {
	if (!this.userProfile) return;

	try {
	await UserService.sendFriendRequest(this.userProfile.id);
	this.showSuccess('Friend request sent!');
	} catch (error: any) {
	this.showError(error.message || 'Failed to send friend request');
	}
}

private async handleLogout(): Promise<void> {
	try {
	await AuthService.logoutAsync();
	window.location.href = '/login';
	} catch (error: any) {
	this.showError(error.message || 'Failed to logout');
	}
}

private showError(message: string): void {
	const errorDiv = this.container.querySelector('#error-message') as HTMLDivElement;
	const successDiv = this.container.querySelector('#success-message') as HTMLDivElement;
	
	if (successDiv) {
	successDiv.classList.add('hidden');
	}
	if (errorDiv) {
	errorDiv.textContent = message;
	errorDiv.classList.remove('hidden');
	setTimeout(() => errorDiv.classList.add('hidden'), 5000);
	}
}

private showSuccess(message: string): void {
	const errorDiv = this.container.querySelector('#error-message') as HTMLDivElement;
	const successDiv = this.container.querySelector('#success-message') as HTMLDivElement;
	
	if (errorDiv) {
	errorDiv.classList.add('hidden');
	}
	if (successDiv) {
	successDiv.textContent = message;
	successDiv.classList.remove('hidden');
	setTimeout(() => successDiv.classList.add('hidden'), 3000);
	}
}

private async handleAnonymizeAccount(): Promise<void> {
	if (!this.userProfile) return;

	const confirmed = confirm(
		"⚠️ Êtes-vous sûr de vouloir ANONYMISER votre compte ?\n\n" +
		"👉 Conséquences :\n" +
		"- Votre nom, email et avatar seront remplacés par des données anonymes.\n" +
		"- Vous resterez inscrit, mais sous un profil anonyme.\n" +
		"- Cette action est irréversible.\n\n" +
		"Voulez-vous continuer ?"
	);

	if (!confirmed) return;

	try {
		const response = await UserService.anonymizeAccount(this.userProfile.id);
		alert(response.message || "Votre compte a été anonymisé avec succès.");

		// Nettoyage local pour forcer une reconnexion
		AuthService.logout();
		this.userProfile = null;

		// Recharge complète de la page pour rafraîchir l'état
		window.location.href = "/";
	} catch (error: any) {
		console.error("Erreur lors de l'anonymisation :", error);
		alert("Une erreur est survenue lors de l'anonymisation du compte.");
	}
}




	private async handleDeleteAccount(): Promise<void> {
	if (!this.userProfile) return;

	const confirmed = confirm(
		"⚠️ Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT votre compte ?\n\n" +
		"👉 Conséquences :\n" +
		"- Votre compte sera entièrement effacé de notre base de données.\n" +
		"- Vous ne pourrez plus jamais vous reconnecter.\n" +
		"- Vos amis perdront la relation avec vous.\n" +
		"- Votre historique de matchs sera supprimé.\n\n" +
		"⚠️ Cette action est IRRÉVERSIBLE.\n\n" +
		"Voulez-vous continuer ?"
	);

	if (!confirmed) return;

	try {
		const response = await UserService.deleteAccount(this.userProfile.id);
		alert(response.message || "Votre compte a été supprimé avec succès.");

		// Nettoyage local AVANT la redirection
		AuthService.logout();
		this.userProfile = null;

		// Forcer le rechargement complet de la page pour vider la session UI
		window.location.href = "/";
	} catch (error: any) {
		console.error("Erreur lors de la suppression :", error);
		alert("Une erreur est survenue lors de la suppression du compte.");
	}
  }



}