import { router } from "expo-router";
import { View, Image, ScrollView } from "react-native";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";

export default function Home() {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchUser() {
			const { data } = await supabase.auth.getUser();
			setUser(data.user);
			setLoading(false);
		}
		fetchUser();
	}, []);

	const todayDate = new Date().toLocaleDateString("pt-BR", { weekday: "long" });

	return (
		<ScrollView className="flex-1 bg-background py-32 px-8">
			<View className="items-start justify-between flex-col gap-y-4">
				<H1 className="">{todayDate}, um ótimo dia para beber.</H1>

				<Button
					className="w-full my-4"
					variant="default"
					size="default"
					onPress={() => router.push("/(protected)/add-friends")}
				>
					<Text>Adicionar Amigos</Text>
				</Button>
			</View>
		</ScrollView>
	);
}
