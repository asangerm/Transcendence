import { Database } from "better-sqlite3";

export interface MatchUpdate {
	id: number;
	winner_id?: number;
}

export interface Match {
	id: number;
	tournamentId: number;
	player1_id: number;
	player2_id: number;
	next_match_id: number;
	position_in_next: number;
}

export function updateMatchTournament(db: Database, match: MatchUpdate): void {
	try {
		const dbMatch = db.prepare(`
            SELECT id, tournament_id, player1_id, player2_id, next_match_id, position_in_next
            FROM tournament_matches
            WHERE id = ?
        `).get(match.id) as Match;

		if (!dbMatch)
			throw new Error("Match introuvable.");

		if (match.winner_id !== dbMatch.player1_id && match.winner_id !== dbMatch.player2_id)
			throw new Error("winner_id incohérent (ne correspond à aucun joueur).");

		db.prepare(`
            UPDATE tournament_matches
            SET winner_id = ?, finished = 1
            WHERE id = ?
        `).run(match.winner_id, match.id);

		if (!dbMatch.next_match_id)
			return;

		if (dbMatch.position_in_next === 1) {
			db.prepare(`
                UPDATE tournament_matches
                SET player1_id = ?
                WHERE id = ?
            `).run(match.winner_id, dbMatch.next_match_id);
		} else {
			db.prepare(`
                UPDATE tournament_matches
                SET player2_id = ?
                WHERE id = ?
            `).run(match.winner_id, dbMatch.next_match_id);
		}

	} catch (err) {
		console.error("Erreur updateMatchTournament :", err);
	}
}

export function getMatchData(db: Database, matchId: number) {
	return db.prepare(`
		SELECT 
			m.player1_id,
			m.player2_id,
			p1.name AS player1_name,
			p2.name AS player2_name
		FROM tournament_matches m
		LEFT JOIN participants p1 ON p1.id = m.player1_id
		LEFT JOIN participants p2 ON p2.id = m.player2_id
		WHERE m.id = ?;
	`).get(matchId) as Match;
}