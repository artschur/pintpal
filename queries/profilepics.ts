import { decode } from "base64-arraybuffer";
import { supabase } from "@/config/supabase";
import * as ImagePicker from "expo-image-picker";

export async function uploadProfilePic(userId: string) {
	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images", "livePhotos"],
		allowsEditing: true,
		aspect: [1, 1],
		quality: 0.7,
		base64: true,
	});

	if (result.canceled) {
		return { error: "User cancelled image picker" };
	}

	const file = result.assets[0];
	if (!file.base64) {
		return { error: "No base64 data found" };
	}

	// Always use .jpg for simplicity
	const filePath = `${userId}/${userId}.jpg`;

	// Decode base64 to ArrayBuffer
	const arrayBuffer = decode(file.base64);

	// Upload to Supabase Storage
	const { data, error } = await supabase.storage
		.from("profilepics")
		.upload(filePath, arrayBuffer, {
			upsert: true,
			contentType: file.mimeType || "image/jpeg",
		});

	if (error) {
		console.error("Error uploading image:", error);
		return { error: "Error uploading image" };
	}

	const { data: publicUrlData } = supabase.storage
		.from("profilepics")
		.getPublicUrl(filePath);
	const avatarUrl = publicUrlData.publicUrl;

	const [profileUpdate, authUpdate] = await Promise.all([
		supabase
			.from("profiles")
			.update({ avatar_url: avatarUrl })
			.eq("id", userId),
		supabase.auth.updateUser({
			data: { avatar_url: avatarUrl },
		}),
	]);

	if (profileUpdate.error || authUpdate.error) {
		console.error(
			"Error updating avatar_url in profile or auth metadata:",
			profileUpdate.error,
			authUpdate.error,
		);
		return { error: "Error updating avatar_url" };
	}

	return { avatarUrl };
}

export async function getProfilePic(userId: string) {
	const { data, error } = await supabase
		.from("profiles")
		.select("avatar_url")
		.eq("id", userId)
		.single();

	if (error) {
		console.error("Error fetching profile picture:", error);
		return null;
	}
	return data.avatar_url;
}
