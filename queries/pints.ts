import { supabase } from "@/config/supabase";

export async function GetAllPints() {
	const { data, error } = await supabase
		.from("pints")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching pints:", error);
		return [];
	}

	return data;
}

export async function GetFriendsPints(userId: string, todayOnly: boolean) {
	const { data: friends, error: friendsError } = await supabase
		.from("friends")
		.select("friend_id")
		.eq("user_id", userId)
		.eq("status", "accepted");

	if (friendsError) {
		console.error("Error fetching friends:", friendsError);
		return [];
	}

	const friendIds = friends.map((f: { friend_id: string }) => f.friend_id);

	if (friendIds.length === 0) return [];

	const query = supabase.from("pints").select("*").in("user_id", friendIds);

	if (todayOnly) {
		const today = new Date();
		const startOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		).toISOString();
		const endOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate() + 1,
		).toISOString();
		query.gte("created_at", startOfDay).lt("created_at", endOfDay);
	}

	query.order("created_at", { ascending: false });

	const { data: posts, error: postsError } = await query;

	if (postsError) {
		console.error("Error fetching friends' pints:", postsError);
		return [];
	}

	return posts;
}

export async function CreatePost({
	userId,
	description,
	location,
	imageUrl,
}: {
	userId: string;
	description: string;
	location: string;
	imageUrl: string;
}) {
	const { data, error } = await supabase
		.from("pints")
		.insert([
			{
				user_id: userId,
				location,
				description,
				image_url: imageUrl,
			},
		])
		.select("*");

	if (error) {
		console.error("Error creating post:", error);
		return null;
	}

	return data[0];
}
