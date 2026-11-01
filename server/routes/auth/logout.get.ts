import { createError, sendRedirect, setResponseHeader } from 'h3';
import { logoutURL } from '~~/server/sso/core';

export default defineEventHandler((event) => {
	const cfg = ssoConfig();

	if (!cfg) {
		throw createError({ statusCode: 404 });
	}
	setResponseHeader(event, 'cache-control', 'no-store');
	const was = !!currentSession(event);

	clearSessionCookie(event, cfg);
	return sendRedirect(event, was ? logoutURL(cfg) : '/', 303);
});
