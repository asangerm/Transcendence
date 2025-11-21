import { UserService, UserProfile, UserStats, Friend } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';
import { sanitizeHtml, sanitizeInput, escapeHtml } from '../utils/sanitizer';
import { navigateTo } from '../router';
import { getApiUrl } from '../config';
import { ft_alert, ft_confirm } from '../utils/confirm';

export class UserProfileComponent {
	private container: HTMLElement;
	private currentUserFriends: Friend[] | null = null;
	private userProfile: UserProfile | null = null;
	private userStats: UserStats[] = [];
	private isOwnProfile: boolean = false;
	private unsubscribe?: () => void;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	private getFullAvatarUrl(avatarUrl: string | null): string {
		if (!avatarUrl) return '/uploads/default.png';
		if (avatarUrl.startsWith('http')) return avatarUrl;
		return `${getApiUrl()}${avatarUrl}`;
	}

	async init(username?: string): Promise<void> {
		try {
			const currentUser = AuthStore.getUser();

			if (username) {
				if (currentUser && currentUser?.display_name === username) {
					this.isOwnProfile = true;
				}
				else if (currentUser && currentUser?.display_name !== username) {
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

			this.unsubscribe = AuthStore.subscribe((user) => {
					if (this.isOwnProfile && user && user.id !== this.userProfile?.id) {
						if (window.location.pathname === '/profile') {
							this.loadUserData(user.display_name);
						}
					}
			});
			
			await this.loadUserData(username);
			
			window.addEventListener("beforeunload", () => {
				const currentUser = AuthStore.getUser();
				if (!currentUser) return;

				const url = `${getApiUrl()}${currentUser.id}/offline`;

				navigator.sendBeacon(url);
			});

		} catch (error: any) {
			console.error('Error loading user profile:', error);
			this.showError(error.message || 'Failed to load profile');
		}
	}

	public destroy(): void {
		this.unsubscribe?.();
	}

	private async loadUserData(username: string): Promise<void> {
		this.currentUserFriends = await UserService.getUserFriends(AuthStore.getUser()!.id);
		this.userProfile = await UserService.getUserProfile(username);
		if (!this.userProfile) {
			this.showError('User not found');
			return;
		}
		this.userStats = await UserService.getUserStats(this.userProfile.id);
		this.userProfile.matchHistory = await UserService.getMatchHistory(this.userProfile.id);
		this.render();
		this.attachEventListeners();
	}

private render(): void {
	if (!this.userProfile) return;

	const safeDisplayName = escapeHtml(this.userProfile.display_name);
	const safeAvatarUrl = this.getFullAvatarUrl(this.userProfile.avatar_url);
	const creationDate = (this.userProfile.created_at && !isNaN(new Date(this.userProfile.created_at).getTime()))
  		? new Date(this.userProfile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
  : 'Date inconnue';

	this.container.innerHTML = `
	<div class="max-w-6xl max-h-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
			<!-- Profile Card -->
			<div class="relative bg-primary dark:bg-primary-dark rounded-2xl p-6 border border-white/10">
				<a href="/friends/${safeDisplayName}" class="absolute z-40 top-5 right-5 flex flex-col items-center transform transition-all duration-300 hover:scale-105">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 20 20">
						<path fill="#e8e8e8" d="M10 9a3 3 0 1 0 0-6a3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0Zm-4.51 7.326a.78.78 0 0 1-.358-.442a3 3 0 0 1 4.308-3.516a6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655Zm14.95.654a4.97 4.97 0 0 0 2.07-.654a.78.78 0 0 0 .357-.442a3 3 0 0 0-4.308-3.517a6.484 6.484 0 0 1 1.907 3.96a2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71a5 5 0 0 1 9.947 0a.843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z"/>
					</svg>
					<span>Profils suivis : ${this.userProfile.friendCount || 0}</span>
				</a>
				<div class="text-center mb-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div class="relative inline-block col-span-1">
						<!-- Menu déroulant -->
						<div id="avatarDropdown" class="transition-all duration-150 origin-right scale-0 absolute mt-2 w-40 bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-lg shadow-lg right-[140px] top-[25px]">
							<button id="uploadAvatar-btn" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-t-lg text-xs">Importer un avatar</button>
							<button id="deleteAvatar-btn" class="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-b-lg text-xs">Supprimer l'avatar</button>
						</div>
						<div id="profile-photo" class="relative w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-2 border border-4">
							<img 
								src="${safeAvatarUrl}"
								alt="${safeDisplayName}"
								class="w-28 h-28 rounded-full object-cover"
								id="profile-avatar"
							>
							${this.isOwnProfile ? `
							<button id="modify-photo" class="transition-all duration-400 h-full w-full rounded-full flex flex-col justify-center items-center absolute text-black bg-gray-600 opacity-0">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
									<path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
								</svg>
							</button>
							` : ``}
							${this.userProfile.is_online ? `
							<div class="absolute right-0 bottom-0 w-8 h-8 bg-green-500 rounded-full border-2"></div>
							` : `
							<div class="absolute right-0 bottom-0 w-8 h-8 bg-gray-500 rounded-full border-2"></div>
							`}
						</div>
					</div>
					<div class="relative flex flex-col col-span-2 text-left text-text-muted dark:text-text-muted-dark">
						<h2 class="text-3xl text-text dark:text-text-dark font-bold mb-3">${safeDisplayName}</h2>
						<span class="mt-8 block">Membre depuis : ${creationDate}</span>
					</div>
				</div>
				<div class="flex justify-left mb-2 items-center">
				${this.isOwnProfile ? `
					<button id="edit-profile" class="flex items-center justify-center gap-2 button-secondary fill-text-dark dark:hover:fill-text text-xs">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
							<path fill-rule="evenodd" d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608a7.45 7.45 0 0 0-.478.198a.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796a7.448 7.448 0 0 0-.198.478a.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517c.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198c.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608a7.52 7.52 0 0 0 .478-.198a.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478c.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517a7.507 7.507 0 0 0-.198-.478a.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064a7.462 7.462 0 0 0-.478-.198a.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5a3.75 3.75 0 0 0 0 7.5Z" clip-rule="evenodd"/>
						</svg>
						Modifier le profil
					</button>
				` : `
					${this.isHeMyFriend() ? ` 
						<button id="remove-friend" class="px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-red-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-red-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-red-500 text-xs">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
								<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573c.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/>
							</svg>
							Ne plus suivre
						</button>
					` : `
						<button id="add-friend" class="px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-green-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-green-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-green-500 text-xs">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
								<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.615 16.428a1.224 1.224 0 0 1-.569-1.175a6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 8 18a9.953 9.953 0 0 1-5.385-1.572ZM16.25 5.75a.75.75 0 0 0-1.5 0v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2Z"/>
							</svg>
							Suivre ce joueur
						</button>
					`}
				`}
				</div>
			</div>

			<!-- Stats Card with Game Selector -->
			<div class="bg-primary dark:bg-primary-dark backdrop-blur-sm rounded-2xl p-6 border border-white/10">
				<div class="border-b border-white/10 mb-6">
					<nav class="flex gap-6">
						<button id="tabPong" class="py-2 text-sm font-semibold border-b-2 border-button text-white">PONG</button>
						<button id="tabTtt" class="py-2 text-sm font-semibold text-gray-400 hover:text-white">TIC-TAC-TOE</button>
					</nav>
				</div>
				
				<!-- Pong Stats (default) -->
				<div id="gameStats" class="grid grid-cols-2 gap-6">
					${this.renderStats('PONG')}
				</div>
			</div>
		</div>


		<!-- Recent Games Section (Full Width) -->
		<div class="bg-primary dark:bg-primary-dark rounded-2xl p-6 border border-white/10">
			<h3 class="text-center text-2xl font-bold mb-4">Parties récentes</h3>
			
			<div class="space-y-4 flex flex-col items-center" id="gameHistory">
				${this.renderMatchHistory()}
			</div>
		</div>
	</div>


	<!-- Modals -->
		<div id="edit-profile-modal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
				<div class="relative top-10 mx-auto p-5 w-96 shadow-md rounded-md bg-background dark:bg-background-dark shadow-text/10 dark:shadow-text-dark/10">
					<div class="">
						<h3 class="text-lg font-medium text-text dark:text-text-dark">Modifier le Profil</h3>
						<form id="edit-profile-form" class="mt-4 space-y-4">
							<div>
									<label class="block text-sm font-medium text-text dark:text-text-dark">Nom d'utilisateur</label>
									<input 
							id="username-modify"
										type="text" 
										name="displayName" 
										value=""
							class="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-0 bg-text/10 dark:bg-text-dark/10 text-text dark:text-text-dark"
							required
							minlength="3"
							maxlength="50"
						>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
						<input 
							id="email-modify"
							type="text" 
							name="email" 
							value=""
							class="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-0 bg-text/10 dark:bg-text-dark/10 text-text dark:text-text-dark"
							required
							minlength="3"
							maxlength="50"
						>
					</div>
					<!-- Bouton Modifier mdp -->
					<div class="mb-4">
							<a href="/change-password" 
							class="w-full px-4 py-2 mb-4 text-sm font-medium delete-secondary inline-block text-center">
							Modifier le mot de passe
						</a>
					</div>
							<div class="flex justify-end space-x-3">
								<button 
									type="button" 
									id="cancel-edit"
									class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:scale-105 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transform transition-all duration-300"
								>
									Annuler
								</button>
								<button 
									type="submit"
									class="px-4 py-2 text-sm font-medium button-primary"
								>
									Sauvegarder
								</button>
							</div>
						</form>
					</div>
				</div>
				<div class="relative top-10 mx-auto mt-8 p-5 w-96 shadow-md rounded-md bg-background dark:bg-background-dark shadow-text/10 dark:shadow-text-dark/10">
					<h3 class="text-lg font-medium text-text dark:text-text-dark">Gestion de compte</h3>
					<div class="mt-4 flex flex-col justify-between gap-4">
						<button 
							type="button" 
							id="export-btn" 
							class="flex items-center justify-center gap-2 button-secondary stroke-text-dark dark:hover:stroke-text text-xs"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
								<path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
							</svg>
							Exporter mes données
						</button>

						<div class="flex justify-between gap-2">
							<button 
							type="button" 
							id="anonymize-btn" 
							class="px-2 py-1 text-sm delete-secondary"
							>
							Anonymiser mon compte
							</button>
							<button 
							type="button" 
							id="delete-btn" 
							class="px-2 py-1 text-sm delete-primary"
							>
							Supprimer mon compte
							</button>
						</div>
					</div>
				</div>
		</div>
	`;
}


private fillModifyForm() {
	if (!this.userProfile)
		return;

	const editModal = this.container.querySelector('#edit-profile-modal');
	const safeDisplayName = escapeHtml(this.userProfile.display_name);
	const safeEmail = escapeHtml(this.userProfile.email);
	const usernameInput = editModal?.querySelector('#username-modify') as HTMLInputElement;
	const emailInput = editModal?.querySelector('#email-modify') as HTMLInputElement;
	usernameInput.value = safeDisplayName;
	emailInput.value = safeEmail;


	
	return;
}

private renderStats(game: string): string {

	if (!this.userStats || !Array.isArray(this.userStats)) {
		console.warn('UserStats not available or not an array:', this.userStats);
	}
	const gameType = game === 'TIC-TAC-TOE' ? 'Game2' : 'Pong'
	if (game === 'TIC-TAC-TOE'){
		game = 'Game2';
	}
	const gameStats: any = this.userStats.find(stat => 
		stat.game_name.toUpperCase() === gameType.toUpperCase()
	);
	console.log("stats : ", gameStats);
	// Si pas de stats pour ce jeu, afficher des valeurs par défaut
	let victories: number = gameStats !== undefined ? gameStats.victories : 0;
	let defeats: number = gameStats !== undefined ? gameStats.defeats : 0;
	let totalGames: number = victories + defeats;
	let winRate: number = gameStats !== undefined && totalGames > 0 ? Math.round((victories / totalGames) * 100) : 0;
	let elo: number = gameStats !== undefined ? 400 + (victories * 15 - defeats * 17)  : 400;

	return `
	<!-- ${game} Stats -->
		<div>
			${game === 'Game2' ? ` 
			<div class="grid grid-cols-3 gap-4 mb-8">
			`: `<div class="grid grid-cols-2 gap-4 mb-8">`}
				<div class="text-center">
				<div class="text-4xl text-text dark:text-green-200 font-bold mb-1">${victories}</div>
				<div class="text-muted dark:text-green-200">Victoires</div>
				</div>
				${game === 'Game2' ? ` 
				<div class="text-center">
					<div class="text-4xl text-text dark:text-gray-200 font-bold mb-1">${gameStats !== undefined ? gameStats.draws : 0}</div>
					<div class="text-muted dark:text-gray-200">Egalités</div>
				</div>
				`: ``}
				<div class="text-center">
				<div class="text-4xl text-text dark:text-red-200 font-bold mb-1">${defeats}</div>
				<div class="text-muted dark:text-red-200">Défaites</div>
				</div>
			</div>
			
			${game === 'Game2' ? ` 
				<div class="text-center">
					<div class="text-xl text-muted dark:text-muted-dark">Rang : ${elo}</div>
				</div>
			`: ` 
				<div class="text-center">
					<div class="text-xl text-muted dark:text-muted-dark">parties jouées : ${totalGames}</div>
				</div>
			`}
			</div>
			<!-- Win Rate Circle -->
			<div class="flex justify-center mb-2">
			<div class="relative w-32 h-32">
				<svg class="w-32 h-32 transform trasition-all duration-400 -rotate-90" viewBox="0 0 36 36">
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
		const isDraw = match.winner_id === null;
		let bgClass = 'bg-gray-500/5 border-gray-500';
		
		let badgeText = 'EGALITE';
		if (!isDraw) {
			const isVictory = match.winner_id === this.userProfile?.id;
			bgClass = isVictory ? 'bg-green-500/5 border-green-500' : 'bg-red-500/10 border-red-500';
			badgeText = isVictory ? 'VICTOIRE' : 'DÉFAITE';
		}

		// Échapper toutes les données utilisateur
		const safeGameName = match.game_name === 'Game2' ? 'Tic-Tac-Toe' : escapeHtml(match.game_name);
		const safeOpponentName = escapeHtml(match.opponent_name);
		
		// Formater la date
		const matchDate = new Date(match.played_at).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});

		return `
			<div class="${bgClass} border rounded-lg p-4 mb-2 min-w-[700px]">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center space-x-4 mb-2 sm:mb-0">
				<span class=" text-xl text-white px-4 py-2 rounded-full text-sm font-bold">${badgeText}</span>
				<div class="flex flex-col">
					<span class="text-xl font-semibold">${safeGameName}</span>
					<a href="/profile/${safeOpponentName}" class="text-lg text-gray-600 dark:text-gray-400">vs ${safeOpponentName}</a>
					${match.game_name === 'PONG' ? `
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
	const tabPong = document.getElementById('tabPong') as HTMLButtonElement;
	const tabTtt = document.getElementById('tabTtt') as HTMLButtonElement;

	const setActiveTab = (game: 'PONG' | 'TIC-TAC-TOE') => {
		if (!tabPong || !tabTtt) return;
		const activeClasses = ['border-b-2', 'border-button', 'text-white'];
		const inactiveClasses = ['text-gray-400'];

		if (game === 'PONG') {
			tabPong.classList.add(...activeClasses);
			tabPong.classList.remove(...inactiveClasses);
			tabTtt.classList.remove(...activeClasses);
			tabTtt.classList.add(...inactiveClasses);
		} else {
			tabTtt.classList.add(...activeClasses);
			tabTtt.classList.remove(...inactiveClasses);
			tabPong.classList.remove(...activeClasses);
			tabPong.classList.add(...inactiveClasses);
		}
	};

	tabPong?.addEventListener('click', () => {
		setActiveTab('PONG');
		this.updateGameStats('PONG');
	});

	tabTtt?.addEventListener('click', () => {
		setActiveTab('TIC-TAC-TOE');
		this.updateGameStats('TIC-TAC-TOE');
	});

	if (this.isOwnProfile) {

		const editBtn = this.container.querySelector('#edit-profile');
		const editModal = this.container.querySelector('#edit-profile-modal');
		const cancelBtn = this.container.querySelector('#cancel-edit');
		const editForm = this.container.querySelector('#edit-profile-form') as HTMLFormElement;
		const anonymizeBtn = this.container.querySelector('#anonymize-btn');
		const deleteBtn = this.container.querySelector('#delete-btn');
		const exportBtn = this.container.querySelector('#export-btn');
		const modifyPhoto = document.getElementById("modify-photo") as HTMLButtonElement;
		const profilePhoto = document.getElementById("profile-photo") as HTMLDivElement;
		const avatarDropdown = document.getElementById("avatarDropdown") as HTMLDivElement;
		const uploadAvatarBtn = this.container.querySelector('#uploadAvatar-btn') as HTMLButtonElement;
		const deleteAvatarBtn = this.container.querySelector('#deleteAvatar-btn') as HTMLButtonElement;


		if (modifyPhoto) {
			profilePhoto.addEventListener('mouseenter', () => {
				modifyPhoto.classList.remove("opacity-0");
				modifyPhoto.classList.add("opacity-80");
			});
			profilePhoto.addEventListener('mouseleave', () => {
				modifyPhoto.classList.add("opacity-0");
				modifyPhoto.classList.remove("opacity-80");
				
			});
			modifyPhoto.addEventListener('click', () => {
				if(avatarDropdown.classList.contains("scale-0"))
				{
					avatarDropdown.classList.remove("scale-0");
					avatarDropdown.classList.add("scale-100");
				}
				else
				{
					avatarDropdown.classList.add("scale-0");
					avatarDropdown.classList.remove("scale-100");
				}

			});
			uploadAvatarBtn?.addEventListener('click', async () => {
				avatarDropdown.classList.add("scale-0");
				avatarDropdown.classList.remove("scale-100");
				await this.handleModifyAvatar();
			});
			deleteAvatarBtn?.addEventListener('click', async () => {
				avatarDropdown.classList.add("scale-0");
				avatarDropdown.classList.remove("scale-100");
				await this.handleDeleteAvatar();
			});
			
		}

		editBtn?.addEventListener('click', () => {
			editModal?.classList.remove('hidden');
			this.fillModifyForm();
		});
		cancelBtn?.addEventListener('click', () => editModal?.classList.add('hidden'));
		editForm?.addEventListener('submit', this.handleProfileUpdate.bind(this));
	    anonymizeBtn?.addEventListener('click', this.handleAnonymizeAccount.bind(this));
		deleteBtn?.addEventListener('click', this.handleDeleteAccount.bind(this));
		exportBtn?.addEventListener('click', () => this.handleExportData());
	} 
	else {
		const addFriendBtn = this.container.querySelector('#add-friend');
		const removeFriendBtn = this.container.querySelector('#remove-friend');
		addFriendBtn?.addEventListener('click', this.handleAddFriend.bind(this));
		removeFriendBtn?.addEventListener('click', this.handleRemoveFriend.bind(this));
	}
}

private async handleProfileUpdate(event: Event): Promise<void> {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const displayName = sanitizeInput(formData.get('displayName') as string);
    const email = sanitizeInput(formData.get('email') as string);

    if (!displayName || !email) {
        ft_alert('Le nom et l’email sont requis.');
        return;
    }

    if (!this.userProfile) {
        ft_alert('Profil introuvable.');
        return;
    }

    try {
        const updatedUser = await UserService.updateInfos(
            { display_name: displayName, email }
        );

        ft_alert('Profil mis à jour avec succès !');

        this.userProfile.display_name = updatedUser.display_name;
        this.userProfile.email = updatedUser.email;

        const currentUser = AuthStore.getUser();
        if (currentUser) {
            const newUser = {
                ...currentUser,
                display_name: updatedUser.display_name,
                email: updatedUser.email,
            };
            AuthStore.setUser(newUser); 
        }

        const editModal = document.querySelector('#edit-profile-modal') as HTMLDivElement;
        if (editModal) editModal.classList.add('hidden');

        const newProfileUrl = `/profile/${encodeURIComponent(updatedUser.display_name)}`; 
        if (window.location.pathname !== newProfileUrl) {
                navigateTo(newProfileUrl);
        }

    } catch (error: any) {
        console.error('Erreur de mise à jour :', error);

        const backendMessage =
            error.response?.data?.message ||
            error.message ||
            'Impossible de mettre à jour le profil.';

        ft_alert('Erreur : ' + backendMessage);
    }
}

private isHeMyFriend(): boolean {
	const currentUser = AuthStore.getUser();
	if (!currentUser || !this.currentUserFriends) return false;

	// Vérifie si le profil consulté est dedans
	return this.currentUserFriends.some(friend => friend.friend_id === this.userProfile?.id);
}

private async handleAddFriend(): Promise<void> {
	if (!this.userProfile) return;

	try {
		const user = AuthStore.getUser();
		if (!user) {
			ft_alert('You must be logged in to add friends');
			return;
		}
		await UserService.addFriend(this.userProfile.id);
		this.loadUserData(this.userProfile.display_name);
	} catch (error: any) {
		ft_alert(error.message || 'Failed to add friend');
	}
}

private async handleRemoveFriend(): Promise<void> {
	if (!this.userProfile) return;
	
	try {
		const user = AuthStore.getUser();
		if (!user) {
			ft_alert('You must be logged in to remove friends');
			return;
		}
		await UserService.removeFriend(this.userProfile.id);
		this.loadUserData(this.userProfile.display_name);
	} catch (error: any) {
		ft_alert(error.message || 'Failed to remove friend');
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

	const confirmed = await ft_confirm(
		{
			title: 'Anonymisation de compte',
			message: "Êtes-vous sûr de vouloir ANONYMISER votre compte ?\n\n" +
			"Conséquences :\n" +
			"- Votre nom, email et avatar seront remplacés par des données anonymes.\n" +
			"- Vous resterez inscrit, mais sous un profil anonyme.\n" +
			"- Vous ne pourrez plus vous connecter.\n\n" +
			"Cette action est irréversible.\n\n" +
			"Voulez-vous continuer ?",
		}
	);

	if (!confirmed) return;

	try {
		const response = await UserService.anonymizeAccount();
		ft_alert(response.message || "Votre compte a été anonymisé avec succès.");

		AuthService.logout();
		AuthStore.clear();
		this.userProfile = null;

		navigateTo("/");
	} catch (error: any) {
		console.error("Erreur lors de l'anonymisation :", error);
		ft_alert("Une erreur est survenue lors de l'anonymisation du compte.");
	}
}




	private async handleDeleteAccount(): Promise<void> {
	if (!this.userProfile) return;

	const confirmed = await ft_confirm(
		{
			title: 'Suppression de compte',
			message: "Êtes-vous sûr de vouloir SUPPRIMER votre compte ?\n\n" +
			"Conséquences :\n" +
			"- Votre compte sera entièrement effacé de notre base de données.\n" +
			"- Vous ne pourrez plus jamais vous reconnecter.\n" +
			"- Vos amis perdront la relation avec vous.\n" +
			"- Votre historique de matchs sera supprimé.\n\n" +
			"Cette action est irréversible.\n\n" +
			"Voulez-vous continuer ?",
		}
	);

	if (!confirmed) return;

	try {
		const response = await UserService.deleteAccount();
		ft_alert(response.message || "Votre compte a été supprimé avec succès.");

		AuthService.logout();
		AuthStore.clear();
		this.userProfile = null;

		navigateTo("/");
	} catch (error: any) {
		console.error("Erreur lors de la suppression :", error);
		ft_alert("Une erreur est survenue lors de la suppression du compte.");
	}
  }

	private async handleExportData(): Promise<void> {
		try {
			const blob = await UserService.exportData();
			const url = window.URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `user_export.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();

			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error(error);
			ft_alert("Une erreur est survenue lors de l'export de vos données.");
		}
	}

	private async handleModifyAvatar(): Promise<void> {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.click();


		input.onchange = async () => {
			if (!input.files || input.files.length === 0) return;
			const file = input.files[0];

			try {
			const result = await UserService.uploadAvatar(file);
			if (this.userProfile) {
				this.userProfile.avatar_url = result.avatarUrl;
				const avatarImg = this.container.querySelector('#profile-avatar') as HTMLImageElement;
				if (avatarImg) avatarImg.src = this.getFullAvatarUrl(result.avatarUrl);
				const navAvatar = document.getElementById('navBar-avatar') as HTMLImageElement;
				if (navAvatar) navAvatar.src = this.getFullAvatarUrl(result.avatarUrl);
			}
			this.showSuccess('Avatar mis à jour avec succès !');
			} catch (error: any) {
			console.error(error);
			this.showError(error.message || 'Erreur lors de la mise à jour de l’avatar');
			}
		};

	}

	private async handleDeleteAvatar(): Promise<void> {
		try {
			const defaultAvatar = '/uploads/default.png';
			await UserService.deleteAvatar();
			if (this.userProfile) {
			this.userProfile.avatar_url = defaultAvatar;
			const avatarImg = this.container.querySelector('#profile-avatar') as HTMLImageElement;
			if (avatarImg) avatarImg.src = this.getFullAvatarUrl(defaultAvatar);
			}
			this.showSuccess('Avatar supprimé avec succès !');
		} catch (error: any) {
			console.error(error);
			this.showError(error.message || 'Erreur lors de la suppression de l’avatar');
		}
		const navAvatar = document.getElementById('navBar-avatar') as HTMLImageElement;
		if (navAvatar) 
		{
			navAvatar.src = this.getFullAvatarUrl(this.userProfile?.avatar_url || '/uploads/default.png');
		}
	}

}