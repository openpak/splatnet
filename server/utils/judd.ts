// Judd's read API (aggregate Splatfest tallies from the results the game posts). It lives on an
// internal port; JUDD_URL is where it is, e.g. http://openpak-judd:20141. Unset or down means
// "no Judd numbers", never an error for the page.
const { juddURL } = useRuntimeConfig();

async function juddGet<T>(path: string): Promise<T | null> {
	if (!juddURL) {
		return null;
	}
	try {
		const res = await fetch(`${juddURL}${path}`, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) {
			return null;
		}
		return (await res.json()) as T;
	} catch (e) {
		logger.warn({ err: String(e) }, 'Judd read API failed');
		return null;
	}
}

export const juddAvailable = (): boolean => !!juddURL;
export const fetchJuddFests = (): Promise<{ festId: number; matches: number; players: number }[] | null> => juddGet<{ festId: number; matches: number; players: number }[]>('/api/splatfests');
export const fetchJuddFest = (festId: number): Promise<JuddFest | null> => juddGet<JuddFest>(`/api/splatfests/${festId}`);
