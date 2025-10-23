import { UserService, Friend } from "../services/user.service";
import { AuthStore } from "../stores/auth.store";
import { escapeHtml } from "../utils/sanitizer";
import { navigateTo } from '../router';

export class Tournaments {
	private container: HTMLElement;
	private userId: number | null = null;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	async init(): Promise<void> {
		this.render();
		this.attachListeners();
	}

	private render(): void {
		this.container.innerHTML = `
			<div class="h-full bg-gradient-to-b from-gray-900 flex items-center justify-center p-6">
				<div class="bg-gray-800 text-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
					<h2 class="text-3xl font-bold mb-6 text-center text-indigo-400">
					Créer un tournoi
					</h2>

					<form id="tournamentForm" class="space-y-6">
						<!-- Nom du tournoi -->
						<div>
							<label for="tournamentName" class="block text-sm font-medium text-gray-300 mb-2">
							Nom du tournoi
							</label>
							<input
							type="text"
							id="tournamentName"
							name="tournamentName"
							placeholder="Ex: Tournoi privé"
							class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
							/>
						</div>

						<!-- Nombre de joueurs -->
						<div>
							<label for="playerCount" class="block text-sm font-medium text-gray-300 mb-2">
							Nombre de joueurs
							</label>
							<select
							id="playerCount"
							name="playerCount"
							class="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
							>
								<option value="" disabled selected>Choisissez le nombre de joueurs</option>
								<option value="4">4 joueurs</option>
								<option value="8">8 joueurs</option>
								<option value="16">16 joueurs</option>
							</select>
						</div>

						<!-- Bouton -->
						<button
							type="submit"
							class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-400"
						>
							Valider
						</button>
					</form>
				</div>
			</div>

		`
	}

	private attachListeners(): void {
		const form = document.getElementById('tournamentForm') as HTMLFormElement;
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			const name = document.getElementById('tournamentName') as HTMLInputElement;
			const players = document.getElementById('playerCount') as HTMLSelectElement;
			
		});
	}
}


