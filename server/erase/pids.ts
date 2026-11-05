// Resolves an account's Wii U PIDs: the account core's link table (namespace "wiiu") plus
// nn-account's resolution service (a Wii U id that was never linked). Plain node, no Nuxt imports.
import { createChannel, createClient, Metadata } from 'nice-grpc';
// eslint-disable-next-line import/default -- protobufjs is CommonJS; only the default import works under plain node
import protobuf from 'protobufjs';

const root = protobuf.parse(`
syntax = "proto3";
message ListAccountLinksRequest { string account_id = 1; string namespace = 2; }
message AccountLink { string link_id = 1; string namespace = 2; string subject_id = 3; string public_code = 4; }
message ListAccountLinksResponse { repeated AccountLink links = 1; }
message ResolveAccountRequest { string namespace = 1; string account_id = 2; }
message ResolveAccountResponse { bool found = 1; uint32 pid = 2; }
`).root;

const msg = (name: string): { encode: (m: unknown) => { finish: () => Uint8Array }; decode: (b: Uint8Array) => unknown } => {
	const t = root.lookupType(name);

	return {
		encode: m => t.encode(t.fromObject(m as Record<string, unknown>)),
		decode: b => t.toObject(t.decode(b), { defaults: true })
	};
};

const method = (name: string, req: string, res: string): Record<string, unknown> => ({
	name,
	requestType: msg(req),
	requestStream: false as const,
	responseType: msg(res),
	responseStream: false as const,
	options: {}
});

const LinksDefinition = {
	name: 'Links',
	fullName: 'openpak.account.v1.Links',
	methods: { listAccountLinks: method('ListAccountLinks', 'ListAccountLinksRequest', 'ListAccountLinksResponse') }
} as const;

const ResolutionDefinition = {
	name: 'Resolution',
	fullName: 'nn_account.resolution.v1.Resolution',
	methods: { resolveAccount: method('ResolveAccount', 'ResolveAccountRequest', 'ResolveAccountResponse') }
} as const;

export type PidSourceConfig = {
	coreAddr: string; // host:port of the account core gRPC
	coreKey: string;
	accountAddr: string; // host:port of nn-account gRPC (optional)
	accountKey: string;
};

type LinksClient = { listAccountLinks: (r: { accountId: string; namespace: string }, o: { metadata: ReturnType<typeof Metadata>; signal: AbortSignal }) => Promise<{ links: { namespace: string; subjectId: string }[] }> };
type ResolutionClient = { resolveAccount: (r: { namespace: string; accountId: string }, o: { metadata: ReturnType<typeof Metadata>; signal: AbortSignal }) => Promise<{ found: boolean; pid: number }> };

// null when the account core is not configured.
export function pidSource(cfg: PidSourceConfig): ((account: string) => Promise<number[]>) | null {
	if (!cfg.coreAddr || !cfg.coreKey) {
		return null;
	}
	const links = createClient(LinksDefinition as never, createChannel(cfg.coreAddr)) as unknown as LinksClient;
	const resolution = cfg.accountAddr
		? createClient(ResolutionDefinition as never, createChannel(cfg.accountAddr)) as unknown as ResolutionClient
		: null;

	return async (account) => {
		const pids = new Set<number>();
		const add = (n: number): void => {
			if (Number.isSafeInteger(n) && n > 0) {
				pids.add(n);
			}
		};
		const r = await links.listAccountLinks({ accountId: account, namespace: 'wiiu' }, {
			metadata: Metadata({ 'x-internal-key': cfg.coreKey }),
			signal: AbortSignal.timeout(10000)
		});

		for (const l of r.links) {
			if (l.namespace === 'wiiu' && /^\d+$/.test(l.subjectId.trim())) {
				add(Number(l.subjectId.trim()));
			}
		}
		if (resolution) {
			const rr = await resolution.resolveAccount({ namespace: 'wiiu', accountId: account }, {
				metadata: Metadata({ 'X-API-Key': cfg.accountKey }),
				signal: AbortSignal.timeout(10000)
			});

			if (rr.found) {
				add(rr.pid);
			}
		}

		return [...pids];
	};
}
