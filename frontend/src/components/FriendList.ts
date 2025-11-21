import { UserService, Friend } from "../services/user.service";
import { AuthStore } from "../stores/auth.store";
import { escapeHtml } from "../utils/sanitizer";
import { getApiUrl } from '../config';
import { navigateTo } from "../router";

export class FriendsListComponent {
	private container: HTMLElement;
	private userId: number | null = null;
	private username: string = "";
	private friends: Friend[] = [];
	private currentUserFriends: Friend[] = [];
	private isOwnList: boolean = false;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	private getFullAvatarUrl(avatarUrl: string | null): string {
		if (!avatarUrl) return "/uploads/default.png";
		if (avatarUrl.startsWith("http")) return avatarUrl;
		return `${getApiUrl()}${avatarUrl}`;
	}

	async init(username: string): Promise<void> {
		try {
			this.cleanup();
			this.username = username;
			const currentUser = AuthStore.getUser();
			if (!currentUser) throw new Error("You must be logged in.");
			const user = await UserService.getUserProfile(username);
			this.userId = user?.id ?? currentUser.id;
			this.isOwnList = this.userId === currentUser.id;

			this.friends = await UserService.getUserFriends(this.userId);
			this.currentUserFriends = await UserService.getUserFriends(currentUser.id);

			this.render();
			this.container.addEventListener("click", async (e) => {
				const target = e.target as HTMLElement;
				const action = target.dataset.action;
				const friendId = target.dataset.friendId;

				if (!action || !friendId) return;
				

				if (action === "remove") {
					await this.handleRemoveFriend(parseInt(friendId));
				} else if (action === "add") {
					this.handleAddFriend(parseInt(friendId));
				}else if (action === "duel") {
					const friendData = this.friends.find(f => f.friend_id === parseInt(friendId));
    				if (friendData) 
						this.handleChallengeFriend(friendData.friend_id, friendData.friend_name);
				}
			});
			this.attachListeners();
		} catch (error: any) {
			console.error("Error loading friends:", error);
			this.container.innerHTML = `<p class="text-red-500">Erreur: ${escapeHtml(error.message)}</p>`;
		}
	}

	private render(): void {
		if (!this.friends || this.friends.length === 0) {
		this.container.innerHTML = `
			<div class="max-w-6xl mx-auto px-6 py-8">
				<p class="text-3xl font-bold mb-6 text-center text-text dark:text-text-dark">
					${this.isOwnList ? "Vous ne suivez personne pour le moment." : "Aucun suivi à afficher."}
				</p>
				<div class="flex justify-end w-full mb-6">
					<div class="flex justify-end w-full mb-6">
						<div class="relative w-72 flex flex-row border dark:border-gray-200 border-2 rounded-lg">
							<input
								type="search"
								id="search"
								name="search"
								class="w-full bg-gray-300 px-4 py-2 text-black placeholder-black rounded-l-sm transition-all duration-300"
								placeholder="Chercher un utilisateur"
							>
							<div class="bg-gray-300 border border-4 border-gray-300 rounded-r-sm">
								<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
								<path fill="#000000" fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06zM10.5 7a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0" clip-rule="evenodd"/>
								</svg>
							</div>
							<div id="searchDropdown" class="invisible transition-all duration-150 origin-top-right absolute top-12 right-0 mt-2 w-full bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-b-lg shadow-lg">
							</div>
						</div>
					</div>
				</div>
			</div>`;
		return;
		}

		this.container.innerHTML = `
		<div class="max-w-6xl mx-auto px-6 py-8">
			<h2 class="text-3xl font-bold mb-6 text-center text-text dark:text-text-dark">
			${this.isOwnList ? "Mes joueurs suivis" : `Amis de ${this.username}`}
			</h2>

			<div class="flex justify-end w-full mb-6">
				<div class="relative w-72 flex flex-row border dark:border-gray-200 border-2 rounded-lg">
					<input
						type="search"
						id="search"
						name="search"
						class="w-full bg-gray-300 px-4 py-2 text-black placeholder-black rounded-l-sm transition-all duration-300"
						placeholder="Chercher un utilisateur"
					>
					<div class="bg-gray-300 border border-4 border-gray-300 rounded-r-sm">
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
						<path fill="#000000" fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06zM10.5 7a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0" clip-rule="evenodd"/>
						</svg>
					</div>
					<div id="searchDropdown" class="invisible transition-all duration-150 origin-top-right absolute top-12 right-0 mt-2 w-full bg-primary dark:bg-primary-dark border border-grey-500 z-50 rounded-b-lg shadow-lg">
						
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-6">
			${this.friends
				.map((friend) => {
				const safeName = escapeHtml(friend.friend_name);
				const avatar = this.getFullAvatarUrl(friend.avatar_url);
				const isOnline = friend.is_online;

				return `
				<div class="relative flex w-full bg-primary justify-between items-center dark:bg-primary-dark rounded-2xl p-4 border border-white/10 text-center transform transition-all">
					<div class="text-left flex flex-row">
						<a href="/profile/${safeName}" class="relative w-28 h-28 bg-gray-700 rounded-full flex items-center justify-center mx-auto border border-4">
							<img
							src="${avatar}"
							alt="${safeName}"
							class="w-24 h-24 rounded-full object-cover"
							/>
							${isOnline ? `
								<div class="absolute right-0 bottom-0 w-8 h-8 bg-green-500 rounded-full border-2"></div>
								` : `
								<div class="absolute right-0 bottom-0 w-8 h-8 bg-gray-500 rounded-full border-2"></div>
								`}
						</a>
						<div class="ml-6 mt-6 justify-items items-center text-[1.5rem]">
							<a href="/profile/${safeName}" class="font-bold text-text dark:text-text-dark mt-6">${safeName}</a>
							<div class="flex justify-center items-center gap-2 mb-3">
							<span class="text-sm text-text-muted dark:text-text-muted-dark">
								Suivi depuis : ${friend.since}
							</span>
							</div>
						</div>
					</div>

					<div class="flex justify-center gap-2">
					${AuthStore.getUser()!.id !== friend.friend_id ?
						`
						<button
							data-action="duel"
							data-friend-id="${friend.friend_id}"
							class="flex flex-row justify-items items-center gap-2 px-3 py-2 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs transition-all"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="#000000">
								<g fill="#ffffffff" fill-rule="evenodd" clip-rule="evenodd"><path d="M16.69 3.384a.5.5 0 0 0-.583-.581l-2.421.45a.5.5 0 0 0-.263.14L7.33 9.507a.5.5 0 0 0 .002.707l1.98 1.972a.5.5 0 0 0 .706-.001l6.093-6.116a.5.5 0 0 0 .138-.263l.442-2.423Zm-.766-1.564a1.5 1.5 0 0 1 1.75 1.743l-.441 2.424a1.5 1.5 0 0 1-.413.79l-6.093 6.115a1.5 1.5 0 0 1-2.122.004l-1.98-1.973a1.5 1.5 0 0 1-.003-2.12l6.093-6.117a1.5 1.5 0 0 1 .788-.416l2.421-.45Z"/><path d="M7.954 11.57a.5.5 0 0 1-.001-.707l3.383-3.397a.5.5 0 1 1 .709.706L8.66 11.57a.5.5 0 0 1-.707 0Z"/><path d="M3.542 9.176a1.938 1.938 0 0 1 2.741-.005l4.076 4.06a1.938 1.938 0 0 1-2.736 2.747l-4.076-4.06a1.938 1.938 0 0 1-.005-2.742Zm2.036.703a.938.938 0 1 0-1.325 1.33l4.076 4.06a.938.938 0 1 0 1.324-1.329L5.578 9.88Z"/><path d="M5.307 12.96L2.63 15.648a.5.5 0 0 0 .002.707l.62.619a.5.5 0 0 0 .708-.002l2.678-2.688l.708.706l-2.678 2.688a1.5 1.5 0 0 1-2.121.004l-.621-.619a1.5 1.5 0 0 1-.004-2.12L4.6 12.254l.708.706ZM3.31 3.384a.5.5 0 0 1 .583-.581l2.421.45a.5.5 0 0 1 .263.14l3.29 3.301l.708-.706l-3.29-3.302a1.5 1.5 0 0 0-.788-.416l-2.421-.45a1.5 1.5 0 0 0-1.75 1.743l.441 2.424a1.5 1.5 0 0 0 .413.79l3.29 3.301l.708-.706l-3.29-3.302a.5.5 0 0 1-.137-.263L3.31 3.384Zm7.04 10.473l4.066-3.987a.944.944 0 0 1 1.327 1.343l-4.072 4.056a.938.938 0 0 1-1.327-.002l-.708.706c.755.758 1.983.76 2.74.005l4.073-4.057a1.944 1.944 0 0 0-2.734-2.765L9.65 13.143l.7.714Z"/><path d="m14.693 12.96l2.678 2.688a.5.5 0 0 1-.002.707l-.62.619a.5.5 0 0 1-.708-.002l-2.678-2.688l-.708.706l2.678 2.688a1.5 1.5 0 0 0 2.121.004l.621-.619a1.5 1.5 0 0 0 .004-2.12l-2.678-2.689l-.708.706Z"/>
								</g>
							</svg>
							Défier en duel
						</button>

						${this.isHeMyFriend(friend.friend_id)?
							`<button data-action="remove"
								data-friend-id="${friend.friend_id}"
								class="px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-red-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-red-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-red-500 text-xs">
									
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
									<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573c.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/>
								</svg>
								Retirer des suivis
							</button>`
							:
							`<button data-action="add"
								data-friend-id="${friend.friend_id}"
								class="px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-green-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-green-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-green-500 text-xs">
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
									<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.615 16.428a1.224 1.224 0 0 1-.569-1.175a6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 8 18a9.953 9.953 0 0 1-5.385-1.572ZM16.25 5.75a.75.75 0 0 0-1.5 0v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2Z"/>
								</svg>
								Suivre
							</button>`
						}
						
						`
						:
						`
						`
					}
						

					${
						this.isOwnList
						? `
							`
						: ""
					}
					</div>
				</div>`;
				})
				.join("")}
			</div>
		</div>`;
	}

	private attachListeners(): void {
		const searchInput = document.getElementById('search') as HTMLInputElement;

		searchInput.addEventListener("input", async () => {
			this.handleSearchUser(searchInput.value.trim());
		});

	}

	private async handleSearchUser(query: string) {
		const searchDisplay = document.getElementById('searchDropdown') as HTMLDivElement;
		if (!query) {
			searchDisplay.classList.add("invisible");
			searchDisplay.innerHTML = "";
			return;
		}
		const result = await UserService.searchUsers(query);
		searchDisplay.innerHTML = "";
		if (!result || result.length === 0) {
			searchDisplay.innerHTML = `<p class="p-2 text-gray-400 italic">Aucun résultat</p>`;
			searchDisplay.classList.remove("invisible");
			return;
		}
		searchDisplay.classList.remove("invisible");
		result.forEach((user: any, index: number) => {
			const safeName = escapeHtml(user.display_name);
			const avatar = this.getFullAvatarUrl(user.avatar_url);

			const userElement = document.createElement("a");
			userElement.href = `/profile/${safeName}`;
			userElement.className = "flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer transition-colors";
			if (index === result.length - 1)
				userElement.classList.add("rounded-b-lg");

			userElement.innerHTML = `
				<img src="${this.getFullAvatarUrl(avatar)}" alt="${safeName}"
					class="w-8 h-8 rounded-full object-cover">
				<span class="text-sm">${safeName}</span>
				<span class="ml-auto text-xs ${user.is_online ? "text-green-500" : "text-gray-500"}">
					${user.is_online ? "En ligne" : "Hors ligne"}
				</span>
			`;
			searchDisplay.appendChild(userElement);

		});
	}

	private isHeMyFriend(friendId: number): boolean {
		const currentUser = AuthStore.getUser();
		if (!currentUser || !this.currentUserFriends) return false;

		// Vérifie si le profil consulté est dedans
		return this.currentUserFriends.some(friend => friend.friend_id === friendId);
	}

	private async handleAddFriend(friendId: number): Promise<void> {
		try {
			const user = AuthStore.getUser();
			if (!user)
				throw('You must be logged in to add friends');
			await UserService.addFriend(friendId);

			this.friends = await UserService.getUserFriends(this.userId!);
			this.currentUserFriends = await UserService.getUserFriends(user.id);

			this.render();
			this.attachListeners();
		} catch (error: any) {
			console.error("Error adding friend:", error);
			alert("Impossible d'ajouter cet ami.");
		}
	}

	private async handleRemoveFriend(friendId: number) {
		try {
			const currentUser = AuthStore.getUser();
			if (!currentUser)
				throw('You must be logged in to remove friends');
			await UserService.removeFriend(friendId);

			this.friends = await UserService.getUserFriends(this.userId!);
			this.currentUserFriends = await UserService.getUserFriends(currentUser.id);

			this.render();
			this.attachListeners();
		} catch (error: any) {
			console.error("Error removing friend:", error);
			alert("Impossible de retirer cet ami.");
		}
	}


	private handleChallengeFriend(friendId: number, friendName: string) {
    	navigateTo(`/pong-lobby?opponent=${encodeURIComponent(friendName)}&opponentId=${friendId}`);
	}

	private cleanup(): void {
		if (!this.container) return;

		const newContainer = this.container.cloneNode(false) as HTMLElement;
		this.container.replaceWith(newContainer);
		this.container = newContainer;
	}
}

