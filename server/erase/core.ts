// Account erasure (card openpak/prds#120):
//
//   DELETE /internal/accounts/{account_id}/data     Authorization: Bearer $ACCOUNT_ERASE_KEY
//
// served on its own container-network-only listener (never routed by Traefik). This file is plain
// node (no Nuxt auto-imports) so `npm test` can run it; server/plugins/erase.ts wires it up.
import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import type { Server } from 'node:http';

export const SERVICE = 'splatnet';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROUTE = /^\/internal\/accounts\/([^/]+)\/data$/;

export type EraseDeps = {
	key: string; // ACCOUNT_ERASE_KEY; empty: the route answers 503
	// Every Wii U PID the account has. Throws when they cannot be resolved (answered 502).
	pids: (account: string) => Promise<number[]> | null;
	// Removes the stored rows of these PIDs, returns how many.
	erase: (pids: number[]) => Promise<number>;
	log: (level: 'info' | 'error', fields: Record<string, unknown>, msg: string) => void;
};

function keyMatches(given: string, want: string): boolean {
	const a = Buffer.from(given);
	const b = Buffer.from(want);

	return a.length === b.length && timingSafeEqual(a, b);
}

export async function handleErase(deps: EraseDeps, method: string, url: string, authorization: string | undefined): Promise<{ status: number; body: unknown }> {
	const path = url.split('?')[0] ?? '';
	const m = ROUTE.exec(path);

	if (!m) {
		return { status: 404, body: { error: 'not found' } };
	}
	if (method !== 'DELETE') {
		return { status: 405, body: { error: 'method not allowed' } };
	}
	if (!deps.key) {
		return { status: 503, body: { error: 'erasure is not configured' } };
	}
	const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

	if (!keyMatches(bearer, deps.key)) {
		return { status: 401, body: { error: 'unauthorized' } };
	}
	const account = decodeURIComponent(m[1] ?? '');

	if (!UUID.test(account)) {
		return { status: 400, body: { error: 'account_id must be a UUID' } };
	}
	const id = account.toLowerCase();
	const lookup = deps.pids(id);

	// No account core configured: erasing "nothing" for an unknown PID set would be a lie.
	if (!lookup) {
		deps.log('error', { service: SERVICE }, 'account erase failed: account core is not configured');

		return { status: 502, body: { error: 'erase failed' } };
	}
	try {
		const pids = await lookup;
		const rows = pids.length ? await deps.erase(pids) : 0;

		deps.log('info', { account: id, rows, service: SERVICE }, 'account erased');

		return { status: 200, body: { service: SERVICE, rows } };
	} catch (e) {
		deps.log('error', { service: SERVICE, err: e instanceof Error ? e.message : String(e) }, 'account erase failed');

		return { status: 502, body: { error: 'erase failed' } };
	}
}

export function createEraseServer(deps: EraseDeps): Server {
	return createServer((req, res) => {
		handleErase(deps, req.method ?? '', req.url ?? '', req.headers.authorization).then(({ status, body }) => {
			deps.log('info', { method: req.method, status }, 'erase request');
			res.writeHead(status, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(body));
		}).catch(() => {
			res.writeHead(500);
			res.end();
		});
	});
}
