import { UserService, Friend } from "../services/user.service";
import { AuthStore } from "../stores/auth.store";
import { escapeHtml } from "../utils/sanitizer";

export class FriendsListComponent {
	private container: HTMLElement;
	private userId: number | null = null;
	private friends: Friend[] = [];
	private isOwnList: boolean = false;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	private getFullAvatarUrl(avatarUrl: string | null): string {
		if (!avatarUrl) return "/uploads/avatars/default.png";
		if (avatarUrl.startsWith("http")) return avatarUrl;
		return `http://localhost:8000${avatarUrl}`;
	}

	async init(userId?: number): Promise<void> {
		try {
		this.cleanup();
		const currentUser = AuthStore.getUser();
		if (!currentUser) throw new Error("You must be logged in.");

		// Déterminer de qui on affiche la liste
		this.userId = userId ?? currentUser.id;
		this.isOwnList = this.userId === currentUser.id;

		// Charger la liste d’amis
		this.friends = await UserService.getUserFriends(this.userId);
		console.log(this.friends);

		this.render();
		this.attachListeners();
		} catch (error: any) {
		console.error("Error loading friends:", error);
		this.container.innerHTML = `<p class="text-red-500">Erreur: ${escapeHtml(error.message)}</p>`;
		}
	}

	private render(): void {
		if (!this.friends || this.friends.length === 0) {
		this.container.innerHTML = `
			<div class="text-center text-text-muted dark:text-text-muted-dark py-10">
			<p>${this.isOwnList ? "Vous n’avez aucun ami pour le moment." : "Aucun ami à afficher."}</p>
			</div>`;
		return;
		}

		this.container.innerHTML = `
		<div class="max-w-6xl mx-auto px-6 py-8">
			<h2 class="text-3xl font-bold mb-6 text-center text-text dark:text-text-dark">
			${this.isOwnList ? "Mes amis" : "Amis de cet utilisateur"}
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
								Amis depuis : ${friend.since}
							</span>
							</div>
						</div>
					</div>

					<div class="flex justify-center gap-2">
					<button
						data-action="duel"
						data-friend-id="${friend.friend_id}"
						class="px-3 py-2 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs transition-all"
					>
						Défier en duel
					</button>

					${
						this.isOwnList
						? `
							<button data-action="remove"
								data-friend-id="${friend.friend_id}"
								class="px-4 py-3 text-xs border-2 text-button font-medium rounded-lg fill-red-500 hover:bg-button hover:text-text-dark transform transition-all duration-300 hover:scale-105 dark:text-button-dark dark:hover:bg-red-500 dark:hover:fill-black dark:hover:text-text flex items-center justify-center gap-2 border border-red-500 text-xs">
									
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20">
									<path d="M11 5a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573c.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM12.75 7.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/>
								</svg>
								Retirer des amis
							</button>`
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
			console.log('Valeur actuelle :', searchInput.value);
		});

		this.container.addEventListener("click", async (e) => {
			const target = e.target as HTMLElement;
			const action = target.dataset.action;
			const friendId = target.dataset.friendId;

			if (!action || !friendId) return;

			if (action === "remove" && this.isOwnList) {
				await this.handleRemoveFriend(parseInt(friendId));
			} else if (action === "duel") {
				this.handleChallengeFriend(parseInt(friendId));
			}
		});
	}

	private async handleRemoveFriend(friendId: number) {
		try {
		const currentUser = AuthStore.getUser();
		if (!currentUser)
			throw('You must be logged in to remove friends');
		await UserService.removeFriend(currentUser.id, friendId);
		this.friends = await UserService.getUserFriends(currentUser.id);
		this.render();
		} catch (error: any) {
		console.error("Error removing friend:", error);
		alert("Impossible de retirer cet ami.");
		}
	}


	private handleChallengeFriend(friendId: number) {
		console.log(`Lancer un duel contre l'utilisateur ${friendId}`);
		// TODO: ouvrir une modale de défi ou rediriger vers la salle de duel
	}

	private cleanup(): void {
		if (!this.container) return;

		const newContainer = this.container.cloneNode(false) as HTMLElement;
		this.container.replaceWith(newContainer);
		this.container = newContainer;

	}

}


