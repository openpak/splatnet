import { createChannel, createClient, Metadata } from 'nice-grpc';
import { AccountServiceDefinition } from '@pretendonetwork/grpc/account/v2/account_service';
import { FriendsServiceDefinition } from '@pretendonetwork/grpc/friends/v2/friends_service';
import type { GetPNIDsResponse } from '@pretendonetwork/grpc/account/v2/get_pnids_rpc';
import type { GetUserFriendsDataWiiUResponse } from '@pretendonetwork/grpc/friends/v2/get_user_friend_data_wiiu_rpc';
import type { GetUserDataWiiUResponse } from '@pretendonetwork/grpc/friends/v2/get_user_data_wiiu_rpc';
import type { FriendInfoWiiU } from '@pretendonetwork/grpc/friends/v2/friend_info';

const config = useRuntimeConfig();

const { api_key: api_key_account, host: host_account, port: port_account } = config.grpc.account;
const { api_key: api_key_friends, host: host_friends, port: port_friends } = config.grpc.friends;

const gRPCAccountChannel = createChannel(`${host_account}:${port_account}`);
const gRPCAccountClient = createClient(AccountServiceDefinition, gRPCAccountChannel);

const gRPCFriendsChannel = createChannel(`${host_friends}:${port_friends}`);
const gRPCFriendsClient = createClient(FriendsServiceDefinition, gRPCFriendsChannel);

// OpenPak's account server (nn-account) serves account.v2 GetUserData per pid and has no
// GetPNIDs, so the batch lookup is done pid by pid. Unknown pids are left out of the result.
export async function fetchPNIDs(pids: number[]): Promise<GetPNIDsResponse['userData']> {
	const userData: GetPNIDsResponse['userData'] = {};
	await Promise.all([...new Set(pids)].map(async (pid) => {
		try {
			userData[pid] = await gRPCAccountClient.getUserData({ pid }, {
				metadata: Metadata({
					'X-API-Key': api_key_account
				}),
				signal: AbortSignal.timeout(5000)
			});
		} catch (e) {
			logger.debug(e, 'Error fetching PNID');
		}
	}));
	return userData;
}

export async function fetchFriendInfo(pid: number): Promise<GetUserDataWiiUResponse> {
	return gRPCFriendsClient.getUserDataWiiU({
		pid
	}, {
		metadata: Metadata({
			'X-API-Key': api_key_friends
		})
	});
}

export async function fetchFriends(pid: number): Promise<FriendInfoWiiU[]> {
	try {
		const result: GetUserFriendsDataWiiUResponse = await gRPCFriendsClient.getUserFriendsDataWiiU({
			pid
		}, {
			metadata: Metadata({
				'X-API-Key': api_key_friends
			}),
			signal: AbortSignal.timeout(5000)
		});
		return result.friends;
	} catch (e) {
		logger.error(e, 'Error fetching friends');
		throw new Error('Failed to fetch friends');
	}
}
