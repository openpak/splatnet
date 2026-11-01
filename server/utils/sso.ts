import { getCookie, setCookie, deleteCookie } from 'h3';
import { FLOW_COOKIE, FLOW_TTL, SESSION_COOKIE, SESSION_TTL, readSession, ssoEnabled } from '~~/server/sso/core';
import type { H3Event } from 'h3';
import type { Session, SsoConfig } from '~~/server/sso/core';

// null when single sign-on is not configured: the routes 404 and the site shows no sign-in.
export function ssoConfig(): SsoConfig | null {
	const config = useRuntimeConfig();
	const cfg: SsoConfig = {
		publicURL: (config.public.hostname || '').replace(/\/$/, ''),
		openpakURL: 'https://openpak.org',
		internalURL: (config.sso.url || '').replace(/\/$/, ''),
		secret: process.env.SSO_CLIENT_OPENSPLAT_SECRET ?? '',
		sessionKey: config.sso.sessionKey
	};

	return ssoEnabled(cfg) ? cfg : null;
}

const cookieOptions = (cfg: SsoConfig, path: string, maxAge: number): Parameters<typeof setCookie>[3] => ({
	httpOnly: true,
	secure: cfg.publicURL.startsWith('https://'),
	sameSite: 'lax',
	path,
	maxAge
});

export const setFlowCookie = (event: H3Event, cfg: SsoConfig, value: string): void => setCookie(event, FLOW_COOKIE, value, cookieOptions(cfg, '/auth', FLOW_TTL));
export const clearFlowCookie = (event: H3Event, cfg: SsoConfig): void => deleteCookie(event, FLOW_COOKIE, cookieOptions(cfg, '/auth', 0));
export const setSessionCookie = (event: H3Event, cfg: SsoConfig, value: string): void => setCookie(event, SESSION_COOKIE, value, cookieOptions(cfg, '/', SESSION_TTL));
export const clearSessionCookie = (event: H3Event, cfg: SsoConfig): void => deleteCookie(event, SESSION_COOKIE, cookieOptions(cfg, '/', 0));

export function currentSession(event: H3Event): Session | null {
	const cfg = ssoConfig();

	return cfg ? readSession(cfg, getCookie(event, SESSION_COOKIE)) : null;
}
