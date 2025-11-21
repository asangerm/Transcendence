import { Tournament } from "../services/tournament.service";
import { AuthStore } from "../stores/auth.store";
import { escapeHtml } from "../utils/sanitizer";
import { navigateTo } from '../router';
import { TournamentService } from "../services/tournament.service";

export class CreateTournaments {
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
			<div class="h-full flex items-center justify-center p-6">
				<div class="bg-primary dark:bg-primary-dark rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
					<h2 class="text-4xl font-bold text-center mb-6">
						Créer un tournoi
					</h2>

					<form id="tournamentForm" class="space-y-6">
						<!-- Nom du tournoi -->
						<div>
							<label for="tournamentName" class="block text-sm font-medium mb-2">
							Nom du tournoi
							</label>
							<input
							type="text"
							id="tournamentName"
							name="tournamentName"
							placeholder="Ex: Tournoi privé"
							class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
							required
							/>
						</div>

						<!-- Nombre de joueurs -->
						<div>
							<label for="playerCount" class="block text-sm font-medium mb-2">
							Nombre de joueurs
							</label>
							<select
							id="playerCount"
							name="playerCount"
							class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
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
							class="w-full button-primary"
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
			const playerSelect = document.getElementById('playerCount') as HTMLSelectElement;
			const safeName = escapeHtml(name.value.trim());
			
			this.container.innerHTML = `
				<div class="h-full flex items-center justify-center p-6">
					<div class="bg-primary dark:bg-primary-dark text-white rounded-2xl shadow-2xl p-8 border border-gray-700">
						<h2 class="text-4xl font-bold text-center mb-12">
							Créer le Tournoi '${safeName}'
						</h2>
						<form id="playersForm" class="space-y-6"> 
							${this.displayInputNames(Number(playerSelect.value))}
							<!-- Message d'erreur -->
							<div id="errorMessage" class="text-red-500 text-sm mt-2 hidden"></div>
							<button
								type="submit"
								class="w-full button-primary"
							>
								Créer le tournoi
							</button>
						</form>
					</div>
				</div>`;

			const playersForm = document.getElementById('playersForm') as HTMLFormElement;
			const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

			t
			for (let i = 1; i <= Number(playerSelect.value); i++) {
				const input = document.getElementById(`player${i}`) as HTMLInputElement;
				input.addEventListener("input", () => {
					errorMessage.textContent = "";
					errorMessage.classList.add("hidden");
				});
			}

			playersForm.addEventListener("submit", (e) => {
				e.preventDefault();

				const names: string[] = [];
				for (let i = 1; i <= Number(playerSelect.value); i++) {
					const input = document.getElementById(`player${i}`) as HTMLInputElement;
					names.push(input.value.trim().toLowerCase());
				}

				
				const uniqueNames = new Set(names);
				if (uniqueNames.size !== names.length) {
					errorMessage.textContent = "Deux joueurs ne peuvent pas avoir le même nom !";
					errorMessage.classList.remove("hidden");
					return;
				}

				const tournamentInfos = this.extractTournamentInfos(Number(playerSelect.value), safeName);
				this.registerTournament(tournamentInfos);
			});
		});
	}

	private displayInputNames(playersNumber : number) : string {
		let displayInputs = `<div class="flex flex-row gap-6 justify-center">`;
		for (let i = 1; i <= playersNumber; i++) {
			if (i === 1)
				displayInputs += `<div class="w-full flex flex-col gap-6 justify-between items-center">`
			displayInputs += `<input required maxlength="15" type="text" id="player${i}" name="player${i}" placeholder="Nom du joueur ${i}" class="w-full dark:bg-gray-700 h-10 px-4 py-2 text-muted dark:text-muted-dark border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300">`;
			if (i !== 1 && i % 4 === 0 && i !== playersNumber)
				displayInputs += `</div> <div class="w-full flex flex-col gap-6 justify-items items-center">`;
			else if (i === playersNumber)
				displayInputs += `</div>`;
		}
		displayInputs += `</div>`;

		return displayInputs;
	}

	private extractTournamentInfos(playersNumber: number, tournamentName: string): Tournament {
		const playerNames: string[] = [];
		for (let i  = 1; i <= playersNumber; i++) {
			const player =  document.getElementById(`player${i}`) as HTMLInputElement;
			playerNames.push(player.value);
		}
		const tournamentInfos: Tournament = {
			name: tournamentName,
			creator_id: AuthStore.getUser()!.id,
			playersNumber: playersNumber,
			playersNames: playerNames,
 		};
		return tournamentInfos;
	}

	private registerTournament(tournamentInfos: Tournament) {
		console.log('tournament : ', tournamentInfos);
		TournamentService.createNewTournament(tournamentInfos);
		navigateTo("/tournaments");
	}
}
