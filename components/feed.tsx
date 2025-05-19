// components/Feed.tsx
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { GetAllPints } from "@/queries/pints";
import { PintPost } from "./post";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/colors";
import { getUserGroups } from "@/queries/groups";
import { supabase } from "@/config/supabase";

export function Feed() {
	const [posts, setPosts] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(true);

	const fetchPosts = async () => {
		const data = await GetAllPints();
		setPosts(data || []);
		setLoading(false);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchPosts();
		setRefreshing(false);
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Loading posts...</Text>
			</View>
		);
	}
	return (
		<FlatList
			data={posts}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => {
				const [backImage, frontImage] = item.image_url.split(",");
				return (
					<PintPost
						frontImage={frontImage}
						backImage={backImage}
						username={item.user?.username || "Unknown"}
						location={item.location}
						timestamp={new Date(item.created_at).toLocaleString()}
						description={item.description}
					/>
				);
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={handleRefresh}
					tintColor={colors.dark.foreground}
				/>
			}
			contentContainerStyle={{
				padding: 16,
			}}
			style={{
				backgroundColor: colors.dark.background,
				flex: 1,
			}}
		/>
	);
}
