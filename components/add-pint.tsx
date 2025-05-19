import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { hasUploadedPintToday } from "@/queries/pints";
import { useAuth } from "@/context/supabase-provider";
import { ActivityIndicator } from "react-native";
import { Text } from "./ui/text";

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

	if (loading) return <ActivityIndicator />;
	if (hasUploaded) return null;

	return (
		<Button
			className="w-full my-4 text-black"
			size="default"
			onPress={() => router.push("/(protected)/show-pint")}
		>
			<Text>Adicionar Pint</Text>
		</Button>
	);
}
