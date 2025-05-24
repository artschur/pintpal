// components/add-pint.tsx
import { useEffect, useState } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { hasUploadedPintToday } from "@/queries/pints";
import { useAuth } from "@/context/supabase-provider";
import { Text } from "./ui/text";
import { colors } from "@/constants/colors";

export function AddPintButton() {
	const { session } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [hasUploaded, setHasUploaded] = useState(false);

	useEffect(() => {
		async function check() {
			if (session?.user?.id) {
				setLoading(true);
				const uploaded = await hasUploadedPintToday(session.user.id);
				setHasUploaded(uploaded);
				setLoading(false);
			}
		}
		check();
	}, [session?.user?.id]);

	if (loading) {
		return (
			<View style={{ padding: 12, alignItems: "center" }}>
				<ActivityIndicator color={colors.dark.accent} />
			</View>
		);
	}

	if (hasUploaded) return null;

	return (
		<TouchableOpacity
			className="bg-yellow-300 border border-neutral-800 rounded-lg text-center text-xl p-4 m-2"
			onPress={() => router.push("/(protected)/show-pint")}
		>
			<Text className="text-neutral-800 font-semibold text-lg">
				Adicionar Drink 🍻
			</Text>
		</TouchableOpacity>
	);
}
