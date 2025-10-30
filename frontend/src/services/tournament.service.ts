import { apiService } from './api.service';

export interface Tournament {
	id?: number;
	name: string;
	game: string;
	status?: string;
	playersNumber: number;
	playersNames: string[];
}

export class TournamentService {
	static async createNewTournament(tournamentInfos: Tournament): Promise<Tournament> {
		const response = await apiService.post('/tournament/create', tournamentInfos);
		return response.tournament
	}
}