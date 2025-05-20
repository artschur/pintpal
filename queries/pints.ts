import { supabase } from "@/config/supabase";

export async function GetAllPints() {
	const { data, error } = await supabase
		.from("posts")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching pints:", error);
		return [];
	}

	return data;
}

export async function AddPintToStorage({
	backImage,
	frontImage,
	user_id,
}: {
	backImage: string;
	frontImage: string;
	user_id: string;
}): Promise<{ backImageUrl: string; frontImageUrl: string; error: any }> {
	try {
		const data = `${user_id}-${Date.now()}`;

		// Convert base64 to Blob-like object for Supabase
		const base64ToBuffer = async (base64String: string) => {
			const base64Data = base64String.split(",")[1]; // Remove the data:image/jpeg;base64, prefix
			const byteCharacters = atob(base64Data);
			const byteArray = new Uint8Array(byteCharacters.length);

			for (let i = 0; i < byteCharacters.length; i++) {
				byteArray[i] = byteCharacters.charCodeAt(i);
			}

			return byteArray;
		};

		// Convert and upload both images in parallel
		const [backBuffer, frontBuffer] = await Promise.all([
			base64ToBuffer(backImage),
			base64ToBuffer(frontImage),
		]);

		const [backData, frontData] = await Promise.all([
			supabase.storage.from("pints").upload(`back/${data}`, backBuffer, {
				contentType: "image/jpeg",
			}),
			supabase.storage.from("pints").upload(`front/${data}`, frontBuffer, {
				contentType: "image/jpeg",
			}),
		]);

		if (backData.error || frontData.error) {
			console.error("Upload error:", backData.error || frontData.error);
			return {
				backImageUrl: "",
				frontImageUrl: "",
				error: backData.error || frontData.error,
			};
		}

		// Get public URLs in parallel
		try {
			const [backPublicUrl, frontPublicUrl] = await Promise.all([
				supabase.storage.from("pints").getPublicUrl(`back/${data}`).data
					.publicUrl,
				supabase.storage.from("pints").getPublicUrl(`front/${data}`).data
					.publicUrl,
			]);

			return {
				backImageUrl: backPublicUrl,
				frontImageUrl: frontPublicUrl,
				error: null,
			};
		} catch (urlError) {
			console.error("Error getting public URLs:", urlError);
			return {
				backImageUrl: "",
				frontImageUrl: "",
				error: "Failed to generate public URLs",
			};
		}
	} catch (error) {
		console.error("Error in AddPintToStorage:", error);
		return {
			backImageUrl: "",
			frontImageUrl: "",
			error: "An unexpected error occurred",
		};
	}
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

	const query = supabase.from("posts").select("*").in("user_id", friendIds);

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

export async function hasUploadedPintToday(userId: string) {
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

	const { data, error } = await supabase
		.from("posts")
		.select("id")
		.eq("user_id", userId)
		.gte("created_at", startOfDay)
		.lt("created_at", endOfDay)
		.limit(1);

	if (error) {
		console.error("Error checking today's pint:", error);
		return false;
	}

	return data && data.length > 0;
}

export async function CreatePost({
	userId,
	description,
	location,
	imageUrl,
	groupId,
}: {
	userId: string;
	description: string;
	location: string;
	imageUrl: string;
	groupId: string;
}) {
	const { data, error } = await supabase
		.from("posts")
		.insert([
			{
				user_id: userId,
				location,
				description,
				image_url: imageUrl,
			},
		])
		.eq("group", groupId)
		.select("*");

	if (error) {
		console.error("Error creating post:", error);
		return null;
	}

	return data[0];
}
