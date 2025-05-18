import { supabase } from "@/config/supabase";
import * as ImagePicker from "expo-image-picker";

// Upload a profile picture to Supabase Storage
export async function uploadProfilePic(userId: string) {
	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ImagePicker.MediaTypeOptions.Images,
		allowsEditing: true,
		aspect: [1, 1],
		quality: 0.7,
		base64: false,
	});

	if (result.canceled) {
		return { error: "User cancelled image picker" };
	}

	const file = result.assets[0];
	const response = await fetch(file.uri);
	const blob = await response.blob();

	const { data, error } = await supabase.storage
		.from("profile-pics")
		.upload(`${userId}.jpg`, blob, {
			upsert: true,
			contentType: "image/jpeg",
		});

	if (error) {
		console.error("Error uploading image:", error);
		return { error: "Error uploading image" };
	}

	const { data: publicUrlData } = supabase.storage
		.from("profile-pics")
		.getPublicUrl(`${userId}.jpg`);
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
