import { createError, getCookie, getQuery, sendRedirect, setResponseHeader } from 'h3';
import { FLOW_COOKIE, completeCallback, seal } from '~~/server/sso/core';

export default defineEventHandler(async (event) => {
	const cfg = ssoConfig();

	if (!cfg) {
		throw createError({ statusCode: 404 });
	}
	setResponseHeader(event, 'cache-control', 'no-store');
	const flow = getCookie(event, FLOW_COOKIE);
	const { code, state } = getQuery(event);

	clearFlowCookie(event, cfg); // a flow is used once, whatever happens
	const result = await completeCallback(cfg, { flow, code, state });

	if (!result.ok) {
		logger.warn({ status: result.status }, 'Sign-in did not complete');
		return sendRedirect(event, '/auth/error', 303); // a page in the site's own shell
	}
	setSessionCookie(event, cfg, seal(cfg.sessionKey, result.session));
	return sendRedirect(event, result.next, 303);
});
