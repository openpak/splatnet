import { createError, getQuery, sendRedirect, setResponseHeader } from 'h3';
import { beginLogin } from '~~/server/sso/core';

export default defineEventHandler((event) => {
	const cfg = ssoConfig();

	if (!cfg) {
		throw createError({ statusCode: 404 });
	}
	setResponseHeader(event, 'cache-control', 'no-store');
	const { url, flow } = beginLogin(cfg, getQuery(event).next);

	setFlowCookie(event, cfg, flow);
	return sendRedirect(event, url, 302);
});
