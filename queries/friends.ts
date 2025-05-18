import { supabase } from "@/config/supabase";

export async function GetAllFriends() {
	const { data, error } = await supabase
		.from("friends")
		.select("*")
		.eq("status", "accepted");

	if (error) {
		console.error("Error fetching friends:", error);
		return [];
	}

	return data;
}

export async function SearchFriend({
	friend_username,
}: {
	friend_username: string;
}) {
	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("is_friend", false)
		.eq("username", friend_username)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error searching for friend:", error);
		return [];
	}
	return data;
}

export async function AcceptFriendRequest(userId: string, friendId: string) {
	const { data, error } = await supabase
		.from("friends")
		.update({ status: "accepted" })
		.eq("user_id", userId)
		.eq("friend_id", friendId);

	if (error) {
		console.error("Error accepting friend request:", error);
		return null;
	}

	return data;
}
export async function RejectFriendRequest(userId: string, friendId: string) {
	const { data, error } = await supabase
		.from("friends")
		.delete()
		.eq("user_id", userId)
		.eq("friend_id", friendId);

	if (error) {
		console.error("Error rejecting friend request:", error);
		return null;
	}

	return data;
}

export async function SendFriendRequest(userId: string, friendId: string) {
	const { data, error } = await supabase
		.from("friends")
		.insert({ user_id: userId, friend_id: friendId, status: "pending" });

	if (error) {
		console.error("Error sending friend request:", error);
		return null;
	}

	return data;
}
