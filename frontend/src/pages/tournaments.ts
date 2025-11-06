import { CreateTournaments } from '../components/CreateTournaments';
import { AuthStore } from '../stores/auth.store';
import { TournamentService } from '../services/tournament.service';
import { DisplayTournaments } from '../components/DisplayTournaments';

export async function renderTournaments() {
	const app = document.getElementById('app');
	if (!app) return;

	app.innerHTML = '<div class="text-center text-xl p-6">Chargement du tournoi...</div>';

	const user = AuthStore.getUser();
	if (!user) {
		app.innerHTML = '<p class="text-center text-red-500">Veuillez vous connecter pour accéder aux tournois.</p>';
		return;
	}

	try {
		// Vérifie si un tournoi est déjà en cours pour ce joueur
		const existingTournament = await TournamentService.getOngoingTournament(user.id);

		app.innerHTML = ''; // Nettoyer avant d'afficher le composant

		if (existingTournament) {
			const displayTourn = new DisplayTournaments(app);
			displayTourn.init();
		} else {
			const createTourn = new CreateTournaments(app);
			createTourn.init();
		}

	} catch (error) {
		console.error('Erreur lors du chargement du tournoi :', error);
		app.innerHTML = `
			<div class="text-center text-red-500">
				Une erreur est survenue lors du chargement du tournoi.
			</div>`;
	}
}
