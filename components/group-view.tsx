"use client";

import React, { useEffect, useState } from "react";
import {
	View,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
	Dimensions,
	FlatList,
	Modal,
	StatusBar,
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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { renderLeaderboardItem } from "./leaderboard-item";

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

const { width, height } = Dimensions.get("window");
const imageSize = (width - 60) / 3; // 3 images per row with padding

export default function GroupView({ groupId }: Props) {
	const { session } = useAuth();
	const [group, setGroup] = useState<GroupWithMembers | null>(null);
	const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
	const [posts, setPosts] = useState<GroupPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPost, setSelectedPost] = useState<GroupPost | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
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

	const openImageModal = (post: GroupPost) => {
		setSelectedPost(post);
		setModalVisible(true);
	};

	const closeImageModal = () => {
		setModalVisible(false);
		setSelectedPost(null);
	};

	const renderPostImage = ({ item }: { item: GroupPost }) => {
		const images = item.image_url.split(",");
		const mainImage = images[0]; // Use the first image (drink photo)

		return (
			<TouchableOpacity
				style={{ width: imageSize, height: imageSize, margin: 5 }}
				onPress={() => openImageModal(item)}
				activeOpacity={0.8}
				className="border border-neutral-800 rounded-xl"
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

	const renderImageModal = () => {
		if (!selectedPost) return null;

		const images = selectedPost.image_url.split(",");
		const drinkImage = images[0];
		const selfieImage = images[1];

		return (
			<Modal
				visible={modalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={closeImageModal}
			>
				<StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.95)",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					{/* Close Button */}
					<TouchableOpacity
						style={{
							position: "absolute",
							top: 60,
							right: 20,
							zIndex: 10,
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: "rgba(0,0,0,0.6)",
							justifyContent: "center",
							alignItems: "center",
						}}
						onPress={closeImageModal}
					>
						<Ionicons name="close" size={24} color="white" />
					</TouchableOpacity>

					{/* Main Image */}
					<View
						style={{
							width: width - 40,
							height: height * 0.6,
							borderRadius: 16,
							overflow: "hidden",
						}}
					>
						<Image
							source={{ uri: drinkImage }}
							style={{ width: "100%", height: "100%" }}
							contentFit="contain"
						/>
					</View>

					{/* Selfie Image (if exists) */}
					{selfieImage && (
						<View
							style={{
								position: "absolute",
								top: 100,
								right: 40,
								width: 120,
								height: 120,
								borderRadius: 16,
								overflow: "hidden",
								borderWidth: 3,
								borderColor: "white",
							}}
						>
							<Image
								source={{ uri: selfieImage }}
								style={{ width: "100%", height: "100%" }}
								contentFit="cover"
							/>
						</View>
					)}

					{/* Post Info */}
					<BlurView
						intensity={80}
						tint="dark"
						style={{
							position: "absolute",
							bottom: 60,
							left: 20,
							right: 20,
							borderRadius: 20,
							overflow: "hidden",
						}}
					>
						<View style={{ padding: 20 }}>
							{/* User Info */}
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginBottom: 12,
								}}
							>
								<View
									style={{
										width: 40,
										height: 40,
										borderRadius: 20,
										overflow: "hidden",
										marginRight: 12,
										backgroundColor: "#374151",
									}}
								>
									{selectedPost.profiles?.avatar_url ? (
										<Image
											source={{ uri: selectedPost.profiles.avatar_url }}
											style={{ width: "100%", height: "100%" }}
											contentFit="cover"
										/>
									) : (
										<View
											style={{
												width: "100%",
												height: "100%",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											<Text
												style={{
													color: "white",
													fontSize: 16,
													fontWeight: "600",
												}}
											>
												{selectedPost.profiles?.username
													?.charAt(0)
													.toUpperCase() || "U"}
											</Text>
										</View>
									)}
								</View>
								<View>
									<Text
										style={{
											color: "white",
											fontSize: 16,
											fontWeight: "600",
										}}
									>
										@{selectedPost.profiles?.username}
									</Text>
									<Text style={{ color: "#9CA3AF", fontSize: 12 }}>
										{new Date(selectedPost.created_at).toLocaleDateString(
											"pt-BR",
											{
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											},
										)}
									</Text>
								</View>
							</View>

							{/* Description */}
							<Text
								style={{
									color: "white",
									fontSize: 16,
									marginBottom: 8,
									fontWeight: "500",
								}}
							>
								{selectedPost.description}
							</Text>

							{/* Location */}
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
								}}
							>
								<MaterialIcons name="location-on" size={16} color="#FBBF24" />
								<Text
									style={{
										color: "#9CA3AF",
										fontSize: 14,
										marginLeft: 4,
									}}
								>
									{selectedPost.location}
								</Text>
							</View>
						</View>
					</BlurView>
				</View>
			</Modal>
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
		<>
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
							<Text
								style={{ color: "#FBBF24", fontSize: 14, fontWeight: "600" }}
							>
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
							className="bg-neutral-900 border border-neutral-800"
							style={{
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

			{/* Image Modal */}
			{renderImageModal()}
		</>
	);
}
