import { AuthStore } from "../stores/auth.store";
import { escapeHtml } from "../utils/sanitizer";
import { TournamentService, Tournament } from "../services/tournament.service";


export class DisplayTournaments{
    private container: HTMLElement;
	private userId: number | null = null;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	async init(): Promise<void> {
		this.userId = AuthStore.getUser()?.id ?? null;
		if (!this.userId) {
			this.container.innerHTML = `<p class="text-center text-red-500">Veuillez vous connecter.</p>`;
			return;
		}
        const ongoing = await TournamentService.getOngoingTournament(this.userId);
        this.renderOngoing(ongoing);
    }

// === AFFICHAGE DU TOURNOI EN COURS ===
	private renderOngoing(tournamentData: any): void {
		const { tournament, matches } = tournamentData;

		// On calcule le nombre de rounds
		const totalRounds = Math.max(...matches.map((m: any) => m.round));

		// On crée un tableau de colonnes par round
		const rounds: any[][] = [];
		for (let r = 1; r <= totalRounds; r++) {
			rounds[r - 1] = matches.filter((m: any) => m.round === r);
		}

		// Génération HTML de l'arbre
		const treeHtml = rounds.map((roundMatches, i) => `
			<div class="flex flex-col gap-6">
				<h3 class="text-xl font-bold text-center mb-2">Ronde ${i + 1}</h3>
				${roundMatches.map((m: any) => `
					<div class="p-4 border rounded-md text-center bg-gray-100 dark:bg-gray-700">
						<div>${m.player1_name || '?'} vs ${m.player2_name || '?'}</div>
						${m.winner_id ? `<div class="text-green-500 font-bold mt-1">Gagnant : ${m.winner_id}</div>` : ''}
					</div>
				`).join('')}
			</div>
		`).join('');

		this.container.innerHTML = `
			<div class="p-6 overflow-x-auto">
				<h2 class="text-3xl font-bold mb-6 text-center">Tournoi en cours : ${tournament.name}</h2>
				<div class="flex gap-6">
					${treeHtml}
				</div>
			</div>
		`;
	}

}
