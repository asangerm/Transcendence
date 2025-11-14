import { Database } from "better-sqlite3";

export interface Match {
	id: number;
	tournamentId: number;
	winner_id?: number;
}

export function updateMatchTournament(db: Database, match: Match): void {
	try{
		const dbMatch = db.prepare("SELECT tournament_id, player1_id, player2_id, next_match_id, position_in_next FROM tournament_matches WHERE id = ?").get(match.id);
		if (!dbMatch)
			throw new Error("Match introuvable.");
		if (match.winner_id !== dbMatch.player1_id && match.winner_id !== dbMatch.player2_id)
			throw new Error("winner id incoherent");
		
	}  catch (err: any) {
		console.error("Erreur :", err);
	}
}