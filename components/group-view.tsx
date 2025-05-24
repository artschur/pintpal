"use client";

import React, { useEffect, useState } from "react";
import {
	View,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
	Dimensions,
	FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import {
	getGroupMembers,
	type GroupWithMembers,
	type GroupMemberWithProfile,
	getGroupById,
} from "@/queries/groups";
import { GetGroupPints } from "@/queries/pints";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

interface Props {
	groupId: string;
}

interface GroupPost {
	id: string;
	user_id: string;
	description: string;
	location: string;
	image_url: string;
	created_at: string;
	profiles: {
		username: string;
		avatar_url: string;
	};
}

const { width } = Dimensions.get("window");
const imageSize = (width - 60) / 3; // 3 images per row with padding

export default function GroupView({ groupId }: Props) {
	const { session } = useAuth();
	const [group, setGroup] = useState<GroupWithMembers | null>(null);
	const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
	const [posts, setPosts] = useState<GroupPost[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchGroupDetails = async () => {
			if (!groupId) return;

			try {
				// Fetch group data, members, and posts in parallel
				const [groupData, groupMembers, groupPosts] = await Promise.all([
					getGroupById(groupId),
					getGroupMembers(groupId),
					GetGroupPints(groupId),
				]);

				setGroup({
					...groupData,
					members: groupMembers,
				});
				setMembers(groupMembers);
				setPosts(groupPosts);
			} catch (error) {
				console.error("Error fetching group details:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchGroupDetails();
	}, [groupId]);

	// Sort members by points for leaderboard
	const sortedMembers = [...members].sort(
		(a, b) => (b.points || 0) - (a.points || 0),
	);

	const renderPostImage = ({ item }: { item: GroupPost }) => {
		const images = item.image_url.split(",");
		const mainImage = images[0]; // Use the first image (drink photo)

		return (
			<TouchableOpacity
				style={{ width: imageSize, height: imageSize, margin: 5 }}
			>
				<Image
					source={{ uri: mainImage }}
					style={{
						width: "100%",
						height: "100%",
						borderRadius: 12,
					}}
					contentFit="cover"
				/>
				{/* User avatar overlay */}
				<View
					style={{
						position: "absolute",
						bottom: 8,
						right: 8,
						width: 24,
						height: 24,
						borderRadius: 12,
						backgroundColor: "#000",
						borderWidth: 2,
						borderColor: "white",
						overflow: "hidden",
					}}
				>
					{item.profiles?.avatar_url ? (
						<Image
							source={{ uri: item.profiles.avatar_url }}
							style={{ width: "100%", height: "100%" }}
							contentFit="cover"
						/>
					) : (
						<View
							style={{
								width: "100%",
								height: "100%",
								backgroundColor: "#374151",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
								{item.profiles?.username?.charAt(0).toUpperCase() || "U"}
							</Text>
						</View>
					)}
				</View>
			</TouchableOpacity>
		);
	};

	const renderLeaderboardItem = (
		member: GroupMemberWithProfile,
		index: number,
	) => {
		const isTopThree = index < 3;
		const medals = ["🥇", "🥈", "🥉"];

		return (
			<BlurView
				key={member.id}
				intensity={20}
				tint="dark"
				style={{
					borderRadius: 16,
					overflow: "hidden",
					marginBottom: 12,
					borderWidth: isTopThree ? 2 : 1,
					borderColor: isTopThree ? "#FBBF24" : "rgba(255, 255, 255, 0.1)",
				}}
			>
				<View
					style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
				>
					{/* Rank */}
					<View
						style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: isTopThree ? "#FBBF24" : "#374151",
							justifyContent: "center",
							alignItems: "center",
							marginRight: 12,
						}}
					>
						{isTopThree ? (
							<Text style={{ fontSize: 20 }}>{medals[index]}</Text>
						) : (
							<Text
								style={{
									color: "white",
									fontWeight: "700",
									fontSize: 16,
								}}
							>
								{index + 1}
							</Text>
						)}
					</View>

					{/* Avatar */}
					<View
						style={{
							width: 50,
							height: 50,
							borderRadius: 25,
							overflow: "hidden",
							marginRight: 12,
							borderWidth: 2,
							borderColor: isTopThree ? "#FBBF24" : "#374151",
						}}
					>
						{member.profiles.avatar_url ? (
							<Image
								source={{ uri: member.profiles.avatar_url }}
								style={{ width: "100%", height: "100%" }}
								contentFit="cover"
							/>
						) : (
							<View
								style={{
									width: "100%",
									height: "100%",
									backgroundColor: "#374151",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Text
									style={{ color: "white", fontSize: 18, fontWeight: "600" }}
								>
									{member.profiles.username.charAt(0).toUpperCase()}
								</Text>
							</View>
						)}
					</View>

					{/* User Info */}
					<View style={{ flex: 1 }}>
						<Text
							style={{
								color: "white",
								fontSize: 16,
								fontWeight: "600",
								marginBottom: 2,
							}}
						>
							@{member.profiles.username}
						</Text>
						<Text style={{ color: "#9CA3AF", fontSize: 12 }}>
							{member.role === "admin" ? "Admin" : "Membro"}
						</Text>
					</View>

					{/* Points */}
					<View
						style={{
							backgroundColor: "#FBBF24",
							paddingHorizontal: 12,
							paddingVertical: 6,
							borderRadius: 20,
							alignItems: "center",
						}}
					>
						<Text
							style={{
								color: "black",
								fontWeight: "700",
								fontSize: 14,
							}}
						>
							{member.points || 0}
						</Text>
						<Text
							style={{
								color: "black",
								fontSize: 10,
								fontWeight: "500",
							}}
						>
							pts
						</Text>
					</View>

					{/* Admin Badge */}
					{member.role === "admin" && (
						<View style={{ marginLeft: 8 }}>
							<MaterialIcons name="star" size={20} color="#FBBF24" />
						</View>
					)}
				</View>
			</BlurView>
		);
	};

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#0A0A0A",
				}}
			>
				<ActivityIndicator size="large" color="#FBBF24" />
				<Text style={{ color: "#FBBF24", marginTop: 16, fontSize: 16 }}>
					Carregando grupo...
				</Text>
			</View>
		);
	}

	if (!group || members.length === 0) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#0A0A0A",
					padding: 20,
				}}
			>
				<MaterialIcons name="error" size={48} color="#EF4444" />
				<Text style={{ color: "#EF4444", fontSize: 18, marginTop: 16 }}>
					Grupo não encontrado
				</Text>
			</View>
		);
	}

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
			{/* Group Header */}
			<BlurView
				intensity={20}
				tint="dark"
				style={{
					margin: 20,
					marginTop: 40,
					borderRadius: 20,
					overflow: "hidden",
					borderWidth: 1,
					borderColor: "rgba(255, 255, 255, 0.1)",
				}}
			>
				<View style={{ padding: 20, alignItems: "center" }}>
					{/* Group Icon */}
					<View
						style={{
							width: 80,
							height: 80,
							borderRadius: 20,
							backgroundColor: "#FBBF24",
							justifyContent: "center",
							alignItems: "center",
							marginBottom: 16,
						}}
					>
						<Text style={{ fontSize: 40 }}>🍻</Text>
					</View>

					{/* Group Name */}
					<Text
						style={{
							color: "white",
							fontSize: 24,
							fontWeight: "700",
							textAlign: "center",
							marginBottom: 8,
						}}
					>
						{group.name}
					</Text>

					{/* Member Count */}
					<View
						style={{
							backgroundColor: "rgba(251, 191, 36, 0.2)",
							borderWidth: 1,
							borderColor: "rgba(251, 191, 36, 0.3)",
							borderRadius: 20,
							paddingHorizontal: 12,
							paddingVertical: 6,
							marginBottom: 12,
						}}
					>
						<Text style={{ color: "#FBBF24", fontSize: 14, fontWeight: "600" }}>
							{members.length} membros
						</Text>
					</View>

					{/* Description */}
					{group.description && (
						<Text
							style={{
								color: "#D1D5DB",
								fontSize: 14,
								textAlign: "center",
								lineHeight: 20,
							}}
						>
							{group.description}
						</Text>
					)}
				</View>
			</BlurView>

			{/* Photos Grid */}
			{posts.length > 0 && (
				<View style={{ marginHorizontal: 20, marginBottom: 20 }}>
					<Text
						style={{
							color: "white",
							fontSize: 20,
							fontWeight: "700",
							marginBottom: 16,
						}}
					>
						📸 Fotos do Grupo
					</Text>
					<FlatList
						data={posts}
						renderItem={renderPostImage}
						numColumns={3}
						scrollEnabled={false}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingBottom: 10 }}
					/>
				</View>
			)}

			{/* Leaderboard */}
			<View style={{ marginHorizontal: 20, marginBottom: 40 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<Text
						style={{
							color: "white",
							fontSize: 20,
							fontWeight: "700",
							flex: 1,
						}}
					>
						🏆 Leaderboard
					</Text>
					<View
						style={{
							backgroundColor: "#374151",
							paddingHorizontal: 8,
							paddingVertical: 4,
							borderRadius: 12,
						}}
					>
						<Text style={{ color: "#D1D5DB", fontSize: 12 }}>
							{members.length} bros
						</Text>
					</View>
				</View>

				{sortedMembers.map((member, index) =>
					renderLeaderboardItem(member, index),
				)}
			</View>
		</ScrollView>
	);
}
