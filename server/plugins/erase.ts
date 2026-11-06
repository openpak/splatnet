// Account erasure listener (see server/erase/core.ts). ACCOUNT_ERASE_KEY unset: it answers 503.
import { createEraseServer } from '~~/server/erase/core';
import { pidSource } from '~~/server/erase/pids';

export default defineNitroPlugin(() => {
	const config = useRuntimeConfig();
	const env = process.env;
	const pids = pidSource({
		coreAddr: env.SPLATNET_CORE_ADDR ?? env.ACCOUNT_GRPC_ADDR ?? '',
		coreKey: env.SPLATNET_CORE_KEY ?? env.ACCOUNT_INTERNAL_KEY ?? '',
		accountAddr: config.grpc.account.host ? `${config.grpc.account.host}:${config.grpc.account.port}` : '',
		accountKey: config.grpc.account.api_key
	});
	const server = createEraseServer({
		key: env.ACCOUNT_ERASE_KEY ?? '',
		pids: account => pids ? pids(account) : null,
		// * Nothing is stored per player here any more (the Mongo user collection was never read and is gone)
		erase: async () => 0,
		log: (level, fields, msg) => logger[level](fields, msg)
	});
	const port = Number(env.PN_SPLATOON_WEBSITE_ERASE_PORT || 8081);

	server.on('error', e => logger.error(e, 'erase listener failed'));
	server.listen(port, '0.0.0.0', () => logger.info({ port }, 'erase listener up'));
});
