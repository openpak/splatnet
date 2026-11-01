import { createError, sendRedirect, setResponseHeader } from 'h3';

// Sign out of this site only: openpak.org stays signed in (like leaving one Google app).
export default defineEventHandler((event) => {
	const cfg = ssoConfig();

	if (!cfg) {
		throw createError({ statusCode: 404 });
	}
	setResponseHeader(event, 'cache-control', 'no-store');
	clearSessionCookie(event, cfg);
	return sendRedirect(event, '/', 303);
});
