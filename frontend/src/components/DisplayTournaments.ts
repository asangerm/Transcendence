import { AuthStore } from "../stores/auth.store";
import { TournamentService, Tournament, Match, UpdateMatch } from "../services/tournament.service";

	export class DisplayTournaments {
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

			if (ongoing) {
				this.renderOngoing(ongoing);
			} else {
				this.container.innerHTML = `
					<div class="text-center text-gray-500 p-10">
						Aucun tournoi en cours. Créez-en un nouveau pour commencer !
					</div>`;
			}
		}

		private renderOngoing(tournamentData: any): void {
			const { tournament, matches } = tournamentData;

			// Trouver le prochain match
			const nextMatch = matches.find(
				(m: any) => !m.winner_id && m.player1_name && m.player2_name
			);

			// Grouper les matchs par round
			const totalRounds = Math.max(...matches.map((m: any) => m.round));
			const rounds: any[][] = [];
			for (let r = 1; r <= totalRounds; r++) {
				rounds[r - 1] = matches.filter((m: any) => m.round === r);
			}

			const matchHeight = 100;
			const verticalGap = 50;

			// Calcul dynamique de la position Y des matchs
			const positions: number[][] = [];

			for (let i = 0; i < rounds.length; i++) {
				positions[i] = [];
				if (i === 0) {
					// Round 1 : espacement fixe
					for (let j = 0; j < rounds[i].length; j++) {
						positions[i][j] = j * (matchHeight + verticalGap);
					}
				} else {
					// Round suivant : centré entre deux matchs du round précédent
					for (let j = 0; j < rounds[i].length; j++) {
						const prev1 = positions[i - 1][j * 2];
						const prev2 = positions[i - 1][j * 2 + 1];
						positions[i][j] = (prev1 + prev2) / 2;
					}
				}
			}

			// Hauteur totale du premier round
			const totalHeight =
				positions[0][positions[0].length - 1] + matchHeight + verticalGap;

			// Construction HTML
			const treeHtml = rounds
				.map((roundMatches, i) => {
					const isFinal = i === totalRounds - 1;
					return `
					<div class="flex flex-col items-center relative min-w-[240px]">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 self-start ml-52">
							${isFinal ? "🏆 FINALE 🏆" : `ROUND ${i + 1}`}
						</h3>

						<div class="relative" style="height:${totalHeight}px;">
							${roundMatches
								.map((m: any, j: number) => {
									const isNextMatch = nextMatch && nextMatch.id === m.id;
									const top = positions[i][j];
									return `
									<div class="absolute left-0 right-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800
										border border-gray-300 dark:border-gray-700 rounded-xl shadow-md p-4 w-[220px]
										transition-all duration-300 hover:scale-[1.02] ${
											isNextMatch ? "ring-2 ring-blue-500" : ""
										}"
										style="top:${top}px;">
										<div class="text-center font-semibold text-gray-800 dark:text-gray-100">
											${m.player1_name || '<span class="italic text-gray-400">En attente</span>'}
										</div>
										<div class="text-sm text-gray-500 dark:text-gray-400 my-1">vs</div>
										<div class="text-center font-semibold text-gray-800 dark:text-gray-100">
											${m.player2_name || '<span class="italic text-gray-400">En attente</span>'}
										</div>
										<div class="mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
											m.winner_id
												? "bg-green-500 text-white"
												: isNextMatch
												? "bg-blue-500 text-white"
												: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
										}">
											${
												m.winner_id
													? `Gagnant : ${m.winner_id}`
													: isNextMatch
													? "Prochain match"
													: "Match à venir"
											}
										</div>
									</div>`;
								})
								.join("")}
						</div>
					</div>
				`;
				})
				.join("");

			this.container.innerHTML = `
				<div class="flex flex-col items-center justify-center p-10">
					<h2 class="text-4xl font-extrabold mb-10 text-center text-gray-900 dark:text-white drop-shadow">
						Tournoi en cours :
						<span class="text-blue-600 dark:text-blue-400">${tournament.name}</span>
					</h2>

					<div class="overflow-x-auto w-full flex justify-center">
						<div class="flex gap-24 justify-center items-start relative pb-6" style="margin-left: -200px;">
							${treeHtml}
						</div>
					</div>

					<div class="mt-10 text-center flex flex-col gap-4 items-center">
						${
							nextMatch
								? `
							<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
								Prochain match :
								<span class="text-blue-600 dark:text-blue-400">
									${nextMatch.player1_name} vs ${nextMatch.player2_name}
								</span>
							</h3>
							<button id="startMatchBtn"
								class="px-6 py-3 button-primary">
								Lancer ce match
							</button>
						`
								: `
							<p class="text-green-500 text-lg font-semibold">🏆 Le tournoi est terminé !</p>
						`
						}
						
						<button id="deleteTournamentBtn"
							class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md transition-all">
							Supprimer le tournoi
						</button>
					</div>
				</div>
			`;

			// === Actions ===
			const startBtn = document.getElementById("startMatchBtn");
			if (startBtn && nextMatch) {
				startBtn.addEventListener("click", () => this.startMatch(nextMatch));
			}

			const deleteBtn = document.getElementById("deleteTournamentBtn");
			if (deleteBtn) {
				deleteBtn.addEventListener("click", async () => {
					const confirmDelete = confirm(`Voulez-vous vraiment supprimer le tournoi "${tournament.name}" ?`);
					if (!confirmDelete) return;

					try {
						await TournamentService.deleteTournament(tournament.id);
						alert("Tournoi supprimé avec succès ");
						location.reload();
					} catch (err) {
						alert(" Erreur lors de la suppression du tournoi.");
						console.error(err);
					}
				});
			}
		}
		private startMatch(nextMatch: Match) {
			console.log("joueur 1 : ", nextMatch.player1_id);
			console.log("joueur 2 : ", nextMatch.player2_id);

			TournamentService.updateTournament({id: nextMatch.id, winner_id: nextMatch.player1_id})
		}
		
}


