// openpak.org single sign-on for OpenSplat (contract: docs/sso.md in the website repo).
//
// This file is plain TypeScript with no Nuxt or h3 in it, so the flow can be tested with
// `node --test` against a fake token server. The route files in server/routes/auth only
// translate it to cookies and redirects.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SSO_CLIENT = 'opensplat';
export const SESSION_COOKIE = 'opensplat_session';
export const FLOW_COOKIE = 'opensplat_sso';
export const SESSION_TTL = 7 * 24 * 3600; // seconds
export const FLOW_TTL = 600;

export type SsoConfig = {
	publicURL: string; // https://splat.openpak.org
	openpakURL: string; // https://openpak.org
	internalURL: string; // http://openpak-website:20010, server to server
	secret: string; // SSO_CLIENT_OPENSPLAT_SECRET
	sessionKey: string; // signs both cookies, 32+ characters
};

// What the site remembers about a signed-in visitor. Never a password or token.
export type Session = {
	account: string;
	name: string;
	pid: number | null; // Wii U / 3DS PID; null when the account has no Wii U linked
	exp: number; // unix seconds
};

type Flow = { s: string; v: string; n: string; e: number };

export function ssoEnabled(cfg: SsoConfig): boolean {
	return !!(cfg.publicURL && cfg.internalURL && cfg.secret && cfg.sessionKey.length >= 32);
}

const b64 = (b: Buffer): string => b.toString('base64url');

function sign(key: string, data: string): string {
	return b64(createHmac('sha256', key).update(data).digest());
}

export function seal(key: string, value: object): string {
	const body = b64(Buffer.from(JSON.stringify(value)));
	return `${body}.${sign(key, body)}`;
}

export function open<T>(key: string, sealed: string | undefined): T | null {
	if (!sealed) {
		return null;
	}
	const [body, sig, extra] = sealed.split('.');

	if (!body || !sig || extra !== undefined) {
		return null;
	}
	const want = Buffer.from(sign(key, body));
	const got = Buffer.from(sig);

	if (want.length !== got.length || !timingSafeEqual(want, got)) {
		return null;
	}
	try {
		return JSON.parse(Buffer.from(body, 'base64url').toString()) as T;
	} catch {
		return null;
	}
}

// Keeps "next" on this site: a path, never another host and never the auth routes themselves.
export function localPath(p: unknown): string {
	if (typeof p !== 'string' || !p.startsWith('/') || p.startsWith('//') || p.startsWith('/\\') || p.startsWith('/auth/') || /[\r\n]/.test(p)) {
		return '/';
	}
	return p;
}

export const callbackURL = (cfg: SsoConfig): string => `${cfg.publicURL}/auth/callback`;

// Step 1: where to send the browser, and the cookie that remembers state and PKCE verifier.
export function beginLogin(cfg: SsoConfig, next: unknown, now = Date.now()): { url: string; flow: string } {
	const f: Flow = { s: b64(randomBytes(24)), v: b64(randomBytes(32)), n: localPath(next), e: Math.floor(now / 1000) + FLOW_TTL };
	const q = new URLSearchParams({
		client: SSO_CLIENT,
		redirect_uri: callbackURL(cfg),
		state: f.s,
		code_challenge: b64(createHash('sha256').update(f.v).digest()),
		code_challenge_method: 'S256'
	});

	return { url: `${cfg.openpakURL}/account/sso/authorize?${q}`, flow: seal(cfg.sessionKey, f) };
}

export type CallbackResult =
	| { ok: true; session: Session; next: string } |
	{ ok: false; status: 400 | 502 };

// Step 2: check the state against the flow cookie, then swap the code for the account.
export async function completeCallback(
	cfg: SsoConfig,
	input: { flow: string | undefined; code: unknown; state: unknown },
	doFetch: typeof fetch = fetch,
	now = Date.now()
): Promise<CallbackResult> {
	const f = open<Flow>(cfg.sessionKey, input.flow);
	const { code, state } = input;

	if (!f || !f.s || f.e < now / 1000 || typeof code !== 'string' || !code || typeof state !== 'string' || state !== f.s) {
		return { ok: false, status: 400 };
	}
	try {
		const res = await doFetch(`${cfg.internalURL}/internal/sso/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${Buffer.from(`${SSO_CLIENT}:${cfg.secret}`).toString('base64')}`
			},
			body: new URLSearchParams({ code, redirect_uri: callbackURL(cfg), code_verifier: f.v }),
			signal: AbortSignal.timeout(10000)
		});

		if (res.status !== 200) {
			return { ok: false, status: 502 };
		}
		const t = await res.json() as { account_id?: string; display_name?: string; wiiu_pid?: number | null };

		if (!t.account_id) {
			return { ok: false, status: 502 };
		}
		const pid = typeof t.wiiu_pid === 'number' && t.wiiu_pid > 0 ? t.wiiu_pid : null;
		const session: Session = { account: t.account_id, name: t.display_name ?? '', pid, exp: Math.floor(now / 1000) + SESSION_TTL };

		return { ok: true, session, next: f.n };
	} catch {
		return { ok: false, status: 502 };
	}
}

export function readSession(cfg: SsoConfig, cookie: string | undefined, now = Date.now()): Session | null {
	const s = open<Session>(cfg.sessionKey, cookie);

	return s && s.account && s.exp > now / 1000 ? s : null;
}

// Sign out: openpak.org asks before it ends its own session, then sends the person back here.
export const logoutURL = (cfg: SsoConfig): string =>
	`${cfg.openpakURL}/account/sso/logout?redirect_uri=${encodeURIComponent(`${cfg.publicURL}/`)}`;
