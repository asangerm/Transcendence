import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export interface Tournament {
	id?: number;
	name: string;
	game: string;
	status?: string;
	playersNumber: number;
	playersNames: string[];
	creator_id: number;
}
export interface Match {
	id: number;
	round: number;
	match_number: number;
	next_match_id: number | null;
}

// Fisher yates shuffle
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array]; 
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1)); // index aléatoire
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // on échange les éléments
	}
	return shuffled;
}

export default async function createTournament(app: FastifyInstance) {
	app.post("/create", { preHandler: [requireAuth] }, async (req, reply) => {
		try {
			const tournamentInfos = req.body as Tournament;

			// Récuperer l'id du jeux choisi
			const gameId = app.db
			.prepare("SELECT id FROM games WHERE name = ?")
			.get(tournamentInfos.game) as { id: number } | undefined;
			if (!gameId) { // Si le jeu existe pas
				return reply.status(409).send({
					error: true,
					message: "Can't find wich game to use.",
       			});
			}
			const gameIdValue = gameId.id;

			// Insertion dans la table tournaments
			const result = app.db
			.prepare("INSERT INTO tournaments (name, game_id, creator_id) VALUES (?, ?, ?)")
			.run(tournamentInfos.name, gameIdValue, tournamentInfos.creator_id);
			//.prepare("INSERT INTO tournaments (name, game_id) VALUES (?, ?)")
			//.run(tournamentInfos.name, tournamentInfos.game);

			// Rajouter une verif si le creator a deja un tournois en cours

			// On recupère l'id du tournois qu'on vient de créer
			const tournamentId = result.lastInsertRowid;

			// On insère tous les particiants dans la table
			for (const name of tournamentInfos.playersNames) {
				app.db
				.prepare("INSERT INTO participants (tournament_id, name) VALUES (?, ?)")
				.run(tournamentId, name);
			}
			// On recupère tous les participants
			const players = (app.db
			.prepare("SELECT id FROM participants WHERE tournament_id = ?")
			.all(tournamentId) as { id: number }[]).map(p => p.id);
			const shuffledIds = shuffleArray<number>(players);

			// Génération des matchs du tournoi
			const totalRounds = Math.log2(tournamentInfos.playersNumber);
			let currentRound = totalRounds;
			
			let nextRoundMatches: Match[] = [];
			let currentMatches: Match[] = [];

			while (currentRound > 1) {
				currentMatches = []
				let matchesInRound = tournamentInfos.playersNumber / (2 ** currentRound);
				for (let i = 0; i < matchesInRound; i++) {
					let nextMatch = null;
					let positionInNext = null;
					if (currentRound !== totalRounds) {
						const nextIndex = Math.floor(i / 2);
						nextMatch = nextRoundMatches[nextIndex];
						positionInNext = i % 2 === 0 ? 1 : 2;
					}
					const result = app.db
						.prepare(`
							INSERT INTO tournament_matches 
								(tournament_id, round, match_number, next_match_id)
							VALUES (?, ?, ?, ?)
						`)
						.run(tournamentId, currentRound, i + 1, nextMatch?.id ?? null);

					currentMatches.push({
						id: Number(result.lastInsertRowid),
						round: currentRound,
						match_number: i + 1,
						next_match_id: nextMatch?.id ?? null,
					});
				}
				nextRoundMatches = currentMatches;
				currentRound--;
			}

			// gerer le premier round
			let playerId = 0;
			let matchesInRound = tournamentInfos.playersNumber / (2 ** currentRound);
			for (let i = 0; i < matchesInRound; i++) {
				let nextMatch = null;
				let positionInNext = null;
				const nextIndex = Math.floor(i / 2);
				nextMatch = nextRoundMatches[nextIndex];
				positionInNext = i % 2 === 0 ? 1 : 2;

				const result = app.db
					.prepare(`
						INSERT INTO tournament_matches 
							(tournament_id, round, match_number, player1_id, player2_id, next_match_id, position_in_next)
						VALUES (?, ?, ?, ?, ?, ?, ?)
					`)
					.run(tournamentId, currentRound, i + 1, shuffledIds[playerId], shuffledIds[playerId + 1], nextMatch?.id ?? null, positionInNext);
				playerId += 2;
			}

			// On renvoie l'id du tournois créer
			return reply.status(201).send({
				success: true,
				message: "Tournament created successfully.",
				data: { tournamentId: tournamentId },
      		});
		}
		catch (err) {
      		console.error(err);
			return reply.status(500).send({
				error: true,
				message: "An unexpected error occurred.",
			});
		}
	});
}