// Per-team Splatfest numbers. Teams are the game's: 0 = Alpha, 1 = Bravo.
export type JuddTeam = {
	team: number;
	players: number;
	matches: number;
	wins: number;
	paint: number;
	kills: number;
	deaths: number;
	bestPower: number;
	winPercent: number;
};

// Judd: the results the game posts after each match (BOSS web post).
export type JuddFest = {
	festId: number;
	matches: number;
	players: number;
	teams: JuddTeam[];
	leader: number | null;
	firstUpload: string | null;
	lastUpload: string | null;
};

// The game server's Ranking tally: players who joined each team and the match wins
// they uploaded through UploadCompetitionRankingScore.
export type NexFest = {
	festId: number;
	votes: [number, number];
	wins: [number, number];
	players: number;
};

export type SplatfestIndexEntry = {
	festId: number;
	matches: number;
	players: number;
};

export type SplatfestView = {
	fests: SplatfestIndexEntry[];
	selected: number | null;
	judd: JuddFest | null;
	nex: NexFest | null;
	juddAvailable: boolean;
};
