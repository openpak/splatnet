import type { H3Event } from 'h3';

// The festival picker plus one festival's results from both sources. ?id= selects a festival;
// without it the newest one is shown.
export default cachedEventHandler(async (event: H3Event): Promise<SplatfestView> => {
	const [juddFests, nexFests] = await Promise.all([fetchJuddFests(), fetchNexFests()]);

	const byId = new Map<number, SplatfestIndexEntry>();
	for (const f of juddFests ?? []) {
		byId.set(f.festId, { festId: f.festId, matches: f.matches, players: f.players });
	}
	for (const f of nexFests) {
		const known = byId.get(f.festId);
		byId.set(f.festId, { festId: f.festId, matches: known?.matches ?? 0, players: Math.max(known?.players ?? 0, f.players) });
	}
	const fests = [...byId.values()].sort((a, b) => b.festId - a.festId);

	const asked = Number(getQuery(event).id);
	const selected = Number.isInteger(asked) && byId.has(asked) ? asked : (fests[0]?.festId ?? null);
	if (selected === null) {
		return { fests, selected, judd: null, nex: null, juddAvailable: juddAvailable() };
	}
	const [judd, nex] = await Promise.all([fetchJuddFest(selected), fetchNexFest(selected)]);
	return { fests, selected, judd, nex, juddAvailable: juddAvailable() };
}, {
	maxAge: 60,
	getKey: (event: H3Event) => event.path
});
