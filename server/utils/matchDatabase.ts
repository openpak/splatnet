import postgres from 'postgres';

const config = useRuntimeConfig();
const { postgresURI } = config;

let sql: postgres.Sql | undefined = undefined;

export async function connectDB(): Promise<void> {
	logger.info('Connecting to database...');
	try {
		sql = postgres(postgresURI);
		logger.success('Database connected!');
	} catch (e) {
		logger.fatal(e, 'Failed to connect to DB!');
		process.exit(-1);
	}
}

export async function fetchMatches(): Promise<Match[]> {
	if (!sql) {
		await connectDB();
	}
	if (!sql) {
		return [];
	}
	try {
		const result = await sql<Match[]>`
			SELECT g.id, g.started_time, g.participants,g.owner_pid,s.game_mode,g.flags,s.matchmake_param
			FROM matchmaking.gatherings g
			JOIN matchmaking.matchmake_sessions s ON (g.id = s.id)
			WHERE array_length(g.participants, 1) > 0 and g.registered=true AND s.open_participation = true
			ORDER BY started_time ASC LIMIT 25`;

		return result;
	} catch (e) {
		logger.error(e);
		return [];
	}
}

// The Splatfest competition ranking, written by the game server (ranking_splatoon schema).
// Both reads answer "nothing yet" if the schema is missing or the database is down.
export async function fetchNexFests(): Promise<{ festId: number; players: number }[]> {
	if (!sql) {
		await connectDB();
	}
	if (!sql) {
		return [];
	}
	try {
		const rows = await sql<{ splatfest_id: string; players: string }[]>`
			SELECT splatfest_id, count(*) AS players FROM ranking_splatoon.user_scores
			GROUP BY splatfest_id ORDER BY splatfest_id DESC LIMIT 50`;
		return rows.map(r => ({ festId: Number(r.splatfest_id), players: Number(r.players) }));
	} catch {
		return [];
	}
}

export async function fetchNexFest(festId: number): Promise<NexFest | null> {
	if (!sql) {
		await connectDB();
	}
	if (!sql) {
		return null;
	}
	try {
		const votes = await sql<{ team_id: number; n: string }[]>`
			SELECT team_id, count(*) AS n FROM ranking_splatoon.user_scores
			WHERE splatfest_id = ${festId} AND team_id < 2 GROUP BY team_id`;
		const wins = await sql<{ team_id: number; n: string }[]>`
			SELECT team_id, COALESCE(sum(team_score), 0) AS n FROM ranking_splatoon.results
			WHERE splatfest_id = ${festId} AND team_id < 2 GROUP BY team_id`;
		const out: NexFest = { festId, votes: [0, 0], wins: [0, 0], players: 0 };
		for (const r of votes) {
			out.votes[r.team_id] = Number(r.n);
			out.players += Number(r.n);
		}
		for (const r of wins) {
			out.wins[r.team_id] = Number(r.n);
		}
		return out;
	} catch {
		return null;
	}
}
