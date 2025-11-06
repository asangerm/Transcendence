import { apiService } from './api.service';

export interface Tournament {
	id?: number;
	creator_id: number;
	name: string;
	game: string;
	status?: string;
	playersNumber: number;
	playersNames: string[];
}

export interface OngoingTournamentResponse {
	tournament: Tournament;
	matches: any[]; // tu peux typer plus précisément si tu as l'interface Match
}

export class TournamentService {
	static async createNewTournament(tournamentInfos: Tournament): Promise<Tournament> {
		const response = await apiService.post('/tournament/create', tournamentInfos);
		return response.data; // correspond à { tournament: {...} } renvoyé par le backend
	}

	static async getOngoingTournament(userId: number): Promise<OngoingTournamentResponse | null> {
		try {
			const response = await apiService.get(`/tournament/${userId}`);
			return response.data.data; // car ta route renvoie { success, data: { tournament, matches } }
		} catch (error: any) {
			if (error?.response?.status === 404) {
				return null; // Aucun tournoi en cours
			}
			throw error;
		}
	}
}
