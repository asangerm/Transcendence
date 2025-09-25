import { UserService, UserProfile } from '../services/user.service';
import { AuthService } from '../services/auth.service';

export class UserProfileComponent {
  private container: HTMLElement;
  private userProfile: UserProfile | null = null;
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
      
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      this.showError(error.message || 'Failed to load profile');
    }
  }

  private render(): void {
    if (!this.userProfile) return;

    const winRate = this.userProfile.wins + this.userProfile.losses > 0 
      ? ((this.userProfile.wins / (this.userProfile.wins + this.userProfile.losses)) * 100).toFixed(1)
      : '0.0';

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Profile Header -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div class="flex items-center space-x-6">
            <div class="relative">
              <img 
                src="${this.getFullAvatarUrl(this.userProfile.avatar_url)}"
                alt="${this.userProfile.display_name}"
                class="w-24 h-24 rounded-full object-cover"
                id="profile-avatar"
              >
              ${this.isOwnProfile ? `
                <button 
                  id="change-avatar" 
                  class="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors"
                  title="Change avatar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>
              ` : ''}
              <input type="file" id="avatar-upload" class="hidden" accept="image/*">
            </div>
            
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    ${this.userProfile.display_name}
                    ${this.userProfile.is_online ? `
                      <span class="ml-2 inline-block w-3 h-3 bg-green-400 rounded-full" title="Online"></span>
                    ` : `
                      <span class="ml-2 inline-block w-3 h-3 bg-gray-400 rounded-full" title="Offline"></span>
                    `}
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400">${this.userProfile.email}</p>
                </div>
                
                ${this.isOwnProfile ? `
                  <div class="flex space-x-3">
                    <button 
                      id="edit-profile" 
                      class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button 
                      id="logout-btn" 
                      class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ` : `
                  <button 
                    id="add-friend" 
                    class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add Friend
                  </button>
                `}
              </div>
              
              <!-- Stats -->
              <div class="mt-4 grid grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.userProfile.wins}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Wins</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.userProfile.losses}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Losses</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">${winRate}%</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.userProfile.friendCount || 0}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Friends</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex space-x-8" aria-label="Tabs">
              <button 
                class="tab-button border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600 dark:text-indigo-400" 
                data-tab="matches"
              >
                Match History
              </button>
              <button 
                class="tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300" 
                data-tab="friends"
              >
                Friends (${this.userProfile.friendCount || 0})
              </button>
            </nav>
          </div>

          <div class="p-6">
            <!-- Match History Tab -->
            <div id="matches-tab" class="tab-content">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Matches</h3>
              <div id="matches-list" class="space-y-4">
                ${this.renderMatchHistory()}
              </div>
            </div>

            <!-- Friends Tab -->
            <div id="friends-tab" class="tab-content hidden">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Friends</h3>
              <div id="friends-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${this.renderFriends()}
              </div>
            </div>
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

        <div id="error-message" class="hidden mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"></div>
        <div id="success-message" class="hidden mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded"></div>
      </div>
    `;
  }

  private renderMatchHistory(): string {
    if (!this.userProfile?.matchHistory || this.userProfile.matchHistory.length === 0) {
      return '<p class="text-gray-500 dark:text-gray-400">No matches played yet.</p>';
    }

    return this.userProfile.matchHistory.map(match => `
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                match.result === 'win' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }">
                ${match.result.toUpperCase()}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">${match.game_name}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">vs ${match.opponent_name}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900 dark:text-white">${match.player_score} - ${match.opponent_score}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(match.played_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `).join('');
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

  private attachEventListeners(): void {
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const tabName = target.getAttribute('data-tab');
        this.switchTab(tabName!);
      });
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

  private switchTab(tabName: string): void {
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      if (button.getAttribute('data-tab') === tabName) {
        button.className = 'tab-button border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600 dark:text-indigo-400';
      } else {
        button.className = 'tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300';
      }
    });

    const tabContents = this.container.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.add('hidden');
    });
    
    const activeTab = this.container.querySelector(`#${tabName}-tab`);
    activeTab?.classList.remove('hidden');
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