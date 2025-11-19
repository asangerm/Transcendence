import { apiService } from './api.service';

export interface Tournament {
	id?: number;
	creator_id: number;
	name: string;
	status?: string;
	playersNumber: number;
	playersNames: string[];
}

export interface Match {
	id: number;
	match_number: number;
	player1_id: number;
	player2_id: number;
	player1_name: string;
	player2_name: string;
	winner_id?: number;
	winner_name?: string;
	next_match_id: number;
	position_in_next: number;
}

export interface UpdateMatch {
	id: number;
	winner_id?: number;
}

export interface OngoingTournamentResponse {
	tournament: Tournament;
	matches: Match[];
}

export class TournamentService {

	static async createNewTournament(tournamentInfos: Tournament): Promise<Tournament> {
		const response = await apiService.post('/tournament/create', tournamentInfos);
		return response.data; 
	}

	static async getOngoingTournament(userId: number): Promise<OngoingTournamentResponse | null> {
		try {
			const response = await apiService.get(`/tournament/${userId}`);
			console.log (response.data.data);
			return response.data.data;
		} catch (error: any) {
			if (error?.response?.status === 404) {
				console.warn(error.response.data.message);
				return null;
			}
			throw error;
		}
	}

	static async deleteTournament(tournamentId: number): Promise<void> {
		try {
			await apiService.delete(`/tournament/${tournamentId}`);
		} catch (error: any) {
			console.error("Erreur suppression tournoi :", error);
			throw error;
		}
	}

	static async updateTournament(match: UpdateMatch): Promise<void> {
		try {
			await apiService.put(`/tournament/update`, match);
		} catch (error: any) {
			console.error("Erreur mise a jour tournoi :", error);
			throw error;
		}
	}

}
