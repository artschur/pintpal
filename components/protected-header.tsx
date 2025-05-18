import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/supabase-provider";
import { useEffect, useState } from "react";
import { getProfilePic } from "@/queries/profilepics";

export function ProtectedHeader() {
	const router = useRouter();
	const { session } = useAuth();
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

	useEffect(() => {
		async function fetchProfile() {
			if (session?.user?.id) {
				const profile = await getProfilePic(session.user.id);
				setAvatarUrl(profile?.avatar_url || null);
			}
		}
		fetchProfile();
	}, [session?.user?.id]);

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				paddingHorizontal: 16,
				paddingTop: 64,
				paddingBottom: 16,
				backgroundColor: "#000",
			}}
		>
			<Text style={{ fontSize: 22, fontWeight: "bold" }}>PintPal</Text>
			<TouchableOpacity onPress={() => router.push("/(protected)/profile-pic")}>
				<Image
					source={{
						uri: avatarUrl || "https://ui-avatars.com/api/?name=User",
					}}
					style={{
						width: 36,
						height: 36,
						borderRadius: 18,
						backgroundColor: "#eee",
					}}
				/>
			</TouchableOpacity>
		</View>
	);
}
