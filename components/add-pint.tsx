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
			style={{
				backgroundColor: colors.dark.accent,
				padding: 16,
				borderRadius: 8,
				alignItems: "center",
				marginVertical: 8,
			}}
			onPress={() => router.push("/(protected)/show-pint")}
		>
			<Text
				style={{
					color: colors.dark.background,
					fontSize: 16,
					fontWeight: "bold",
				}}
			>
				Adicionar Pint
			</Text>
		</TouchableOpacity>
	);
}
