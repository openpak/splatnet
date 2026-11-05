/* eslint-disable no-restricted-imports -- node runs this file directly and cannot resolve the Nuxt aliases */
// Run with `npm test`. The erase route's contract: 503 / 401 / 400 / 502 / 200, idempotent, other accounts untouched.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleErase } from '../server/erase/core.ts';
import type { EraseDeps } from '../server/erase/core.ts';

const A = '11111111-2222-3333-4444-555555555555';
const B = '99999999-2222-3333-4444-555555555555';

function fixture(key = 'k3y'): { deps: EraseDeps; users: Map<number, string>; logs: { level: string; fields: Record<string, unknown>; msg: string }[] } {
	const users = new Map<number, string>([[100, 'a'], [200, 'b']]);
	const accounts: Record<string, number[]> = { [A]: [100], [B]: [200] };
	const logs: { level: string; fields: Record<string, unknown>; msg: string }[] = [];
	const deps: EraseDeps = {
		key,
		pids: async (account): Promise<number[]> => accounts[account] ?? [],
		erase: async (pids): Promise<number> => {
			let n = 0;

			for (const p of pids) {
				n += users.delete(p) ? 1 : 0;
			}

			return n;
		},
		log: (level, fields, msg) => logs.push({ level, fields, msg })
	};

	return { deps, users, logs };
}

const path = (id: string): string => `/internal/accounts/${id}/data`;

describe('erase', () => {
	it('503 when the key is unset', async () => {
		assert.equal((await handleErase(fixture('').deps, 'DELETE', path(A), 'Bearer x')).status, 503);
	});

	it('401 on a missing or wrong key', async () => {
		const f = fixture();

		assert.equal((await handleErase(f.deps, 'DELETE', path(A), undefined)).status, 401);
		assert.equal((await handleErase(f.deps, 'DELETE', path(A), 'Bearer nope')).status, 401);
		assert.equal(f.users.size, 2);
	});

	it('400 on a bad account id', async () => {
		assert.equal((await handleErase(fixture().deps, 'DELETE', path('not-a-uuid'), 'Bearer k3y')).status, 400);
	});

	it('502 when the PIDs cannot be resolved', async () => {
		const f = fixture();

		f.deps.pids = async (): Promise<number[]> => {
			throw new Error('core down');
		};
		assert.equal((await handleErase(f.deps, 'DELETE', path(A), 'Bearer k3y')).status, 502);
		f.deps.pids = (): null => null;
		assert.equal((await handleErase(f.deps, 'DELETE', path(A), 'Bearer k3y')).status, 502);
		assert.equal(f.users.size, 2);
	});

	it('200 deletes only that account, logs once, and is idempotent', async () => {
		const f = fixture();
		const r = await handleErase(f.deps, 'DELETE', path(A.toUpperCase()), 'Bearer k3y');

		assert.deepEqual([r.status, r.body], [200, { service: 'splatnet', rows: 1 }]);
		assert.deepEqual([...f.users.keys()], [200]);
		assert.equal(f.logs.filter(l => l.msg === 'account erased').length, 1);
		assert.ok(!JSON.stringify(f.logs).includes('k3y'));

		const again = await handleErase(f.deps, 'DELETE', path(A), 'Bearer k3y');

		assert.deepEqual([again.status, again.body], [200, { service: 'splatnet', rows: 0 }]);
		const unknown = await handleErase(f.deps, 'DELETE', path('00000000-0000-0000-0000-000000000000'), 'Bearer k3y');

		assert.deepEqual(unknown.body, { service: 'splatnet', rows: 0 });
		assert.deepEqual([...f.users.keys()], [200]);
	});
});
