import { UserService, UserProfile, UserStats } from '../services/user.service';
import { AuthService } from '../services/auth.service';

export class UserProfileComponent {
  private container: HTMLElement;
  private userProfile: UserProfile | null = null;
  private userStats: UserStats[] = [];
  private isOwnProfile: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  private getFullAvatarUrl(avatarUrl: string | null): string {
    if (!avatarUrl) return '/src/assets/default-avatar.png';
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `http://localhost:8000${avatarUrl}`;
  }

  async init(userId?: number): Promise<void> {
    try {
      const currentUser = AuthService.getUser();

      if (!userId && currentUser) {
        userId = currentUser.id;
        this.isOwnProfile = true;
      } else if (userId && currentUser && userId === currentUser.id) {
        this.isOwnProfile = true;
      }

      if (!userId) {
        this.showError('User not found');
        return;
      }

      this.userProfile = this.isOwnProfile 
        ? await UserService.getCurrentUserProfile()
        : await UserService.getUserProfile(userId);
      this.userStats = await UserService.getUserStats(userId);
	  this.userProfile.matchHistory = await UserService.getMatchHistory(userId);
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      this.showError(error.message || 'Failed to load profile');
    }
  }

  private render(): void {
    if (!this.userProfile) return;
    this.container.innerHTML = `
      <div class="max-w-6xl max-h-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Profile Card -->
            <div class="relative bg-primary dark:bg-primary-dark rounded-2xl p-6 border border-white/10">
				<a href="/profile" class="absolute z-50 top-5 right-5 flex flex-col items-center transform transition-all duration-300 hover:scale-105">
					<svg class="transform transition-transform" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffffff" version="1.1" id="Capa_1" width="24" height="24" viewBox="0 0 45.902 45.902" xml:space="preserve">
						<g>
							<g>
								<path d="M43.162,26.681c-1.564-1.578-3.631-2.539-5.825-2.742c1.894-1.704,3.089-4.164,3.089-6.912    c0-5.141-4.166-9.307-9.308-9.307c-4.911,0-8.932,3.804-9.281,8.625c4.369,1.89,7.435,6.244,7.435,11.299    c0,1.846-0.42,3.65-1.201,5.287c1.125,0.588,2.162,1.348,3.066,2.26c2.318,2.334,3.635,5.561,3.61,8.851l-0.002,0.067    l-0.002,0.057l-0.082,1.557h11.149l0.092-12.33C45.921,30.878,44.936,28.466,43.162,26.681z"/>
								<path d="M23.184,34.558c1.893-1.703,3.092-4.164,3.092-6.912c0-5.142-4.168-9.309-9.309-9.309c-5.142,0-9.309,4.167-9.309,9.309    c0,2.743,1.194,5.202,3.084,6.906c-4.84,0.375-8.663,4.383-8.698,9.318l-0.092,1.853h14.153h15.553l0.092-1.714    c0.018-2.514-0.968-4.926-2.741-6.711C27.443,35.719,25.377,34.761,23.184,34.558z"/>
								<path d="M6.004,11.374v3.458c0,1.432,1.164,2.595,2.597,2.595c1.435,0,2.597-1.163,2.597-2.595v-3.458h3.454    c1.433,0,2.596-1.164,2.596-2.597c0-1.432-1.163-2.596-2.596-2.596h-3.454V2.774c0-1.433-1.162-2.595-2.597-2.595    c-1.433,0-2.597,1.162-2.597,2.595V6.18H2.596C1.161,6.18,0,7.344,0,8.776c0,1.433,1.161,2.597,2.596,2.597H6.004z"/>
							</g>
						</g>
					</svg>
					<span>Amis : ${this.userProfile.friendCount}</span>
				</a>
				<div class="text-center mb-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="relative inline-block col-span-1">
                        <div class="relative w-28 h-28 bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold mb-2 mx-auto border border-2">
                            <img 
								src="${this.getFullAvatarUrl(this.userProfile.avatar_url)}"
								alt="${this.userProfile.display_name}"
								class="w-28 h-28 rounded-full object-cover"
								id="profile-avatar"
							>
							${this.userProfile.is_online ? `
							<div class="absolute right-0 bottom-0 w-8 h-8 bg-green-500 rounded-full border-2"></div>
							` : `
							<div class="absolute right-0 bottom-0 w-8 h-8 bg-gray-500 rounded-full border-2"></div>
							`}
						</div>
                    </div>
                    <div class="relative flex flex-col col-span-2 text-left text-text-muted dark:text-text-muted-dark">
                    	<h2 class="text-3xl text-text dark:text-text-dark font-bold mb-3">${this.userProfile.display_name}</h2>
                        <span>Membre depuis : 09/2025</span>
                    </div>
                </div>
				<div class="flex justify-left mb-8 items-center">
				${this.isOwnProfile ? `
					<button id="edit-profile" class="button-secondary text-xs">
						Modifier le profil
					</button>
                ` : `
					<button id="add-friend" class="button-secondary text-xs">
						Add Friend
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
                    <button id="dropdownArrow" class="text-gray-400 hover:text-white transition-colors">
                        <svg class="w-6 h-6 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                </div>
				 <!-- Menu déroulant -->
				<div id="gameDropdown" class="hidden absolute top-14 right-5 mt-2 w-40 bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-lg shadow-lg ">
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
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Edit Profile</h3>
              <form id="edit-profile-form" class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                  <input 
                    type="text" 
                    name="displayName" 
                    value="${this.userProfile.display_name}"
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
	console.log('=== DEBUG MATCH HISTORY ===');
	console.log('userProfile:', this.userProfile);
	console.log('matchHistory:', this.userProfile?.matchHistory);
	console.log('matchHistory type:', typeof this.userProfile?.matchHistory);
	console.log('matchHistory is array:', Array.isArray(this.userProfile?.matchHistory));
	console.log('matchHistory length:', this.userProfile?.matchHistory?.length);
	
	if (!this.userProfile?.matchHistory || this.userProfile.matchHistory.length === 0) {
	  return '<p class="text-gray-500 dark:text-gray-400">Aucune partie jouée pour le moment.</p>';
	}

	return this.userProfile.matchHistory.map(match => {
	  const isVictory = match.winner_id == this.userProfile?.id;
	  const bgClass = isVictory ? 'bg-green-500/5 border-green-500' : 'bg-red-500/10 border-red-500';
	  const badgeClass = isVictory ? 'bg-success' : 'bg-danger';
	  const badgeText = isVictory ? 'VICTOIRE' : 'DÉFAITE';
	  
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
				<span class="text-xl font-semibold">${match.game_name}</span>
				<a href="/profile/" class="text-lg text-gray-600 dark:text-gray-400">vs ${match.opponent_name}</a>
				${match.game_name == 'PONG' ? `
				<span class="text-sm font-medium">Score : ${match.score_p1} / ${match.score_p2}</span>
				`:`
				`}
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

  private renderFriends(): string {
    if (!this.userProfile?.friends || this.userProfile.friends.length === 0) {
      return '<p class="text-gray-500 dark:text-gray-400 col-span-full">No friends yet.</p>';
    }

    return this.userProfile.friends.map(friend => `
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <img src="${this.getFullAvatarUrl(friend.avatar_url)}" alt="${friend.display_name}" class="w-10 h-10 rounded-full object-cover">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">${friend.display_name}</p>
            <p class="text-xs ${friend.is_online ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
              ${friend.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
    `).join('');
  }

  private updateGameStats(gameName: string): void {
	const gameStatsContainer = this.container.querySelector('#gameStats');
	if (gameStatsContainer) {
	  gameStatsContainer.innerHTML = this.renderStats(gameName);
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
		dropdown.classList.toggle("hidden");
		arrow.classList.toggle("rotate-180");
	});

	pongbtn.addEventListener("click", () => {
		dropdown.classList.toggle("hidden");
		arrow.classList.toggle("rotate-180");
 		this.updateGameStats('PONG');
	});

	aowbtn.addEventListener("click", () => {
		dropdown.classList.toggle("hidden");
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

      editBtn?.addEventListener('click', () => editModal?.classList.remove('hidden'));
      cancelBtn?.addEventListener('click', () => editModal?.classList.add('hidden'));
      editForm?.addEventListener('submit', this.handleProfileUpdate.bind(this));
      logoutBtn?.addEventListener('click', this.handleLogout.bind(this));
    } else {
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
    const displayName = formData.get('displayName') as string;

    try {
      await UserService.updateProfile({ display_name: displayName });
      this.userProfile!.display_name = displayName;
      
      const nameElement = this.container.querySelector('h1');
      if (nameElement) {
        nameElement.innerHTML = `${displayName}${nameElement.innerHTML.substring(nameElement.innerHTML.indexOf('<span'))}`;
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
}