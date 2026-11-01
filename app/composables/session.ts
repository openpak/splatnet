// Who is looking at the page: the sign-in control in the top bar and the friends tab read this.
export type SessionInfo = { enabled: boolean; signedIn: boolean; name: string; linked: boolean };

export function useSession(): ReturnType<typeof useFetch<SessionInfo>> {
	return useFetch<SessionInfo>('/api/session', { key: 'session', headers: useRequestHeaders(['cookie']) });
}
