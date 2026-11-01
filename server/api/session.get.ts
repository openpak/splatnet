import { setResponseHeader } from 'h3';

// What the page needs to draw the sign-in control: nothing about the account but its name.
export default defineEventHandler((event) => {
	setResponseHeader(event, 'cache-control', 'no-store');
	const enabled = !!ssoConfig();
	const s = currentSession(event);

	return { enabled, signedIn: !!s, name: s?.name || '', linked: !!s?.pid };
});
