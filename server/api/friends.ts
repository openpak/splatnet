import { createError, setResponseHeader } from 'h3';

// The signed-in player's own friend list, by the Wii U PID their OpenPak account carries.
// Signed out is a 401; an account with no Wii U linked has no list (linked: false).
export default defineEventHandler(async (event): Promise<FriendsResponse> => {
	setResponseHeader(event, 'cache-control', 'no-store');
	const session = currentSession(event);

	if (!session) {
		throw createError({ statusCode: 401 });
	}
	if (!session.pid) {
		return { linked: false, friends: [] };
	}
	try {
		const friends = await fetchFriends(session.pid);
		const pids = friends.map(friend => friend.nnaInfo?.principalBasicInfo?.pid ?? 0).filter(pid => pid > 0);
		const accounts = await fetchPNIDs(pids);

		return {
			linked: true,
			friends: pids.map(pid => ({
				pid,
				name: accounts[pid]?.mii?.name ??
					friends.find(friend => friend.nnaInfo?.principalBasicInfo?.pid === pid)?.nnaInfo?.principalBasicInfo?.mii?.name ??
					accounts[pid]?.username ??
					''
			})).filter(friend => friend.name)
		};
	} catch (e) {
		logger.error(e, 'Failed to load the friend list');
		throw createError({ statusCode: 502 });
	}
});
