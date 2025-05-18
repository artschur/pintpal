import { useState } from "react";
import {
	View,
	TextInput,
	FlatList,
	TouchableOpacity,
	Image,
	Text,
} from "react-native";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";

export default function AddFriends() {
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const handleSearch = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("profiles") // Make sure you have a 'profiles' table with username and avatar_url
			.select("id, username, avatar_url")
			.ilike("username", `%${search}%`);
		if (!error && data) setResults(data);
		setLoading(false);
	};

	const handleAddFriend = (userId: string) => {
		// Implement your friend-adding logic here
		alert(`Friend request sent to user ID: ${userId}`);
	};

	return (
		<View className="min-w-full min-h-full flex-col bg-background py-32 px-16  ">
			<H1>Adicionar Amigos</H1>
			<View className="flex-row  justify-end items-center my-4">
				<TextInput
					className="flex-1 border rounded px-3 py-2 mr-2"
					placeholder="Buscar por nome de usuário"
					value={search}
					onChangeText={setSearch}
					autoCapitalize="none"
				/>
				<Button onPress={handleSearch} disabled={loading}>
					<Text>Buscar</Text>
				</Button>
			</View>
			<FlatList
				data={results}
				keyExtractor={(item) => item.id}
				numColumns={3}
				renderItem={({ item }) => (
					<View className="items-center m-2">
						<Image
							source={{
								uri:
									item.avatar_url ||
									"https://ui-avatars.com/api/?name=" + item.username,
							}}
							style={{
								width: 64,
								height: 64,
								borderRadius: 32,
								marginBottom: 8,
							}}
						/>
						<Text>{item.username}</Text>
						<TouchableOpacity onPress={() => handleAddFriend(item.id)}>
							<Text style={{ color: "#007bff" }}>Adicionar</Text>
						</TouchableOpacity>
					</View>
				)}
				// ListEmptyComponent={!loading && <Text>Nenhum usuário encontrado.</Text>}
			/>
		</View>
	);
}
