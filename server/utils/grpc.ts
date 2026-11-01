import { createChannel, createClient, Metadata } from 'nice-grpc';
import { AccountServiceDefinition } from '@pretendonetwork/grpc/account/v2/account_service';
import { FriendsServiceDefinition } from '@pretendonetwork/grpc/friends/v2/friends_service';
import { APIDefinition } from '@pretendonetwork/grpc/api/api_service';
import type { GetPNIDsResponse } from '@pretendonetwork/grpc/account/v2/get_pnids_rpc';
import type { GetUserDataResponse } from '@pretendonetwork/grpc/api/get_user_data_rpc';
import type { GetUserFriendsDataWiiUResponse } from '@pretendonetwork/grpc/friends/v2/get_user_friend_data_wiiu_rpc';
import type { GetUserDataWiiUResponse } from '@pretendonetwork/grpc/friends/v2/get_user_data_wiiu_rpc';
import type { FriendInfoWiiU } from '@pretendonetwork/grpc/friends/v2/friend_info';

const config = useRuntimeConfig();

const { api_key: api_key_account, host: host_account, port: port_account } = config.grpc.account;
const { api_key: api_key_friends, host: host_friends, port: port_friends } = config.grpc.friends;

const gRPCAccountChannel = createChannel(`${host_account}:${port_account}`);
const gRPCAccountClient = createClient(AccountServiceDefinition, gRPCAccountChannel);

const gRPCApiChannel = createChannel(`${host_account}:${port_account}`);
const gRPCApiClient = createClient(APIDefinition, gRPCApiChannel);

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
				})
			});
		} catch (e) {
			logger.debug(e, 'Error fetching PNID');
		}
	}));
	return userData;
}

// Sign-in by access token needs the Pretendo `api` service, which OpenPak's account server does
// not serve; without it nobody is signed in and the friends and profile views stay empty.
export async function fetchPNID(token: string): Promise<GetUserDataResponse | null> {
	try {
		return await gRPCApiClient.getUserData({}, {
			metadata: Metadata({
				'X-API-Key': api_key_account,
				'X-Token': token
			})
		});
	} catch (e) {
		logger.debug(e, 'Error fetching signed-in user');
		return null;
	}
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
			})
		});
		return result.friends;
	} catch (e) {
		logger.error(e, 'Error fetching friends');
		throw new Error('Failed to fetch friends');
	}
}
