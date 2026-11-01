// A friend of the signed-in player, as the friends tab shows them.
export type Friend = {
	pid: number;
	name: string;
};

export type FriendsResponse = {
	linked: boolean;
	friends: Friend[];
};
