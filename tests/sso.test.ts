/* eslint-disable no-restricted-imports -- node runs this file directly and cannot resolve the Nuxt aliases */
// Run with `npm test` (node's own test runner; no Nuxt needed).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { after, describe, it } from 'node:test';
import { beginLogin, completeCallback, localPath, logoutURL, open, readSession, seal } from '../server/sso/core.ts';
import type { IncomingMessage, Server } from 'node:http';
import type { SsoConfig } from '../server/sso/core.ts';

type Seen = { calls: number; auth?: string; form?: URLSearchParams; challenge?: string };

// A fake openpak.org /internal/sso/token that checks the client credentials and the PKCE verifier.
async function fakeWebsite(answer: () => { status: number; body: unknown }, seen: Seen): Promise<{ server: Server; url: string }> {
	const server = createServer((req: IncomingMessage, res) => {
		let raw = '';

		req.on('data', (c) => {
			raw += c;
		});
		req.on('end', () => {
			seen.calls++;
			seen.auth = req.headers.authorization;
			seen.form = new URLSearchParams(raw);
			const verifier = seen.form.get('code_verifier') ?? '';
			const ok = req.method === 'POST' && req.url === '/internal/sso/token' &&
				seen.auth === `Basic ${Buffer.from('opensplat:s3cret').toString('base64')}` &&
				seen.form.get('code') === 'good' &&
				createHash('sha256').update(verifier).digest('base64url') === seen.challenge;
			const a = ok ? answer() : { status: 400, body: { error: 'invalid_grant' } };

			res.writeHead(a.status, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(a.body));
		});
	});

	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
	const addr = server.address();

	return { server, url: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}` };
}

const key = 'k'.repeat(32);
const cfgFor = (internalURL: string): SsoConfig => ({
	publicURL: 'https://opensplat.test',
	openpakURL: 'https://openpak.org',
	internalURL,
	secret: 's3cret',
	sessionKey: key
});

const servers: Server[] = [];

async function setup(answer: () => { status: number; body: unknown }): Promise<{ cfg: SsoConfig; seen: Seen }> {
	const seen: Seen = { calls: 0 };
	const { server, url } = await fakeWebsite(answer, seen);

	servers.push(server);
	return { cfg: cfgFor(url), seen };
}

const good = (pid: number | null) => (): { status: number; body: unknown } => ({ status: 200, body: { account_id: 'acc-1', display_name: 'Inkling', wiiu_pid: pid } });

after(() => {
	servers.forEach(s => s.close());
});

describe('login redirect', () => {
	it('goes to openpak.org authorize with the client, redirect_uri, state and S256 challenge', () => {
		const { url, flow } = beginLogin(cfgFor('http://x'), '/splatfest');
		const u = new URL(url);

		assert.equal(u.origin + u.pathname, 'https://openpak.org/account/sso/authorize');
		assert.equal(u.searchParams.get('client'), 'opensplat');
		assert.equal(u.searchParams.get('redirect_uri'), 'https://opensplat.test/auth/callback');
		assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
		assert.ok((u.searchParams.get('state') ?? '').length >= 8);
		assert.ok(!flow.includes('s3cret'));
	});
});

describe('callback', () => {
	it('happy path: exchanges the code with Basic auth and the verifier, and returns the session', async () => {
		const { cfg, seen } = await setup(good(1800000123));
		const { url, flow } = beginLogin(cfg, '/splatfest');
		const u = new URL(url);

		seen.challenge = u.searchParams.get('code_challenge') ?? '';
		const r = await completeCallback(cfg, { flow, code: 'good', state: u.searchParams.get('state') });

		assert.ok(r.ok);
		assert.equal(r.next, '/splatfest');
		assert.deepEqual({ ...r.session, exp: 0 }, { account: 'acc-1', name: 'Inkling', pid: 1800000123, exp: 0 });
		assert.equal(seen.form?.get('redirect_uri'), 'https://opensplat.test/auth/callback');
		assert.equal(seen.calls, 1);

		const cookie = seal(key, r.session);

		assert.equal(readSession(cfg, cookie)?.name, 'Inkling');
		assert.equal(readSession(cfg, cookie.replace('.', 'x.')), null, 'a tampered session is a stranger');
		assert.equal(readSession(cfg, seal('other'.repeat(8), r.session)), null, 'signed with another key');
		assert.equal(readSession(cfg, cookie, (r.session.exp + 1) * 1000), null, 'expired');
	});

	it('an account with no Wii U gets pid null', async () => {
		const { cfg, seen } = await setup(good(null));
		const { url, flow } = beginLogin(cfg, '/');
		const u = new URL(url);

		seen.challenge = u.searchParams.get('code_challenge') ?? '';
		const r = await completeCallback(cfg, { flow, code: 'good', state: u.searchParams.get('state') });

		assert.ok(r.ok);
		assert.equal(r.session.pid, null);
	});

	it('state mismatch is refused before any exchange', async () => {
		const { cfg, seen } = await setup(good(1));
		const { flow } = beginLogin(cfg, '/');

		for (const state of ['nope', undefined, '']) {
			const r = await completeCallback(cfg, { flow, code: 'good', state });

			assert.deepEqual(r, { ok: false, status: 400 });
		}
		assert.deepEqual(await completeCallback(cfg, { flow, code: undefined, state: 'x' }), { ok: false, status: 400 });
		assert.deepEqual(await completeCallback(cfg, { flow: undefined, code: 'good', state: 'x' }), { ok: false, status: 400 });
		assert.deepEqual(await completeCallback(cfg, { flow: `x${flow}`, code: 'good', state: 'x' }), { ok: false, status: 400 });
		assert.equal(seen.calls, 0);
	});

	it('an old flow is refused', async () => {
		const { cfg, seen } = await setup(good(1));
		const { url, flow } = beginLogin(cfg, '/', Date.now() - 3600 * 1000);

		assert.deepEqual(await completeCallback(cfg, { flow, code: 'good', state: new URL(url).searchParams.get('state') }), { ok: false, status: 400 });
		assert.equal(seen.calls, 0);
	});

	it('a failed exchange gives no session', async () => {
		const { cfg, seen } = await setup(good(1));
		const { url, flow } = beginLogin(cfg, '/');
		const u = new URL(url);

		seen.challenge = u.searchParams.get('code_challenge') ?? '';
		// The website refuses this code (bad, spent or expired).
		assert.deepEqual(await completeCallback(cfg, { flow, code: 'bad', state: u.searchParams.get('state') }), { ok: false, status: 502 });
		// The website cannot be reached at all.
		const down = { ...cfg, internalURL: 'http://127.0.0.1:1' };

		assert.deepEqual(await completeCallback(down, { flow, code: 'good', state: u.searchParams.get('state') }), { ok: false, status: 502 });
		// The website answers 200 without an account.
		const empty = await setup(() => ({ status: 200, body: {} }));
		const b = beginLogin(empty.cfg, '/');

		empty.seen.challenge = new URL(b.url).searchParams.get('code_challenge') ?? '';
		assert.deepEqual(await completeCallback(empty.cfg, { flow: b.flow, code: 'good', state: new URL(b.url).searchParams.get('state') }), { ok: false, status: 502 });
	});
});

describe('helpers', () => {
	it('next stays on this site', () => {
		for (const [input, want] of [['/splatfest', '/splatfest'], ['//evil.test', '/'], ['https://evil.test', '/'], [undefined, '/'], ['/auth/logout', '/'], ['/\\evil', '/']] as const) {
			assert.equal(localPath(input), want);
		}
	});

	it('sign-out goes through openpak.org and back', () => {
		assert.equal(logoutURL(cfgFor('http://x')), 'https://openpak.org/account/sso/logout?redirect_uri=https%3A%2F%2Fopensplat.test%2F');
	});

	it('open rejects junk', () => {
		for (const v of [undefined, '', 'a', 'a.b', 'a.b.c']) {
			assert.equal(open(key, v), null);
		}
	});
});
