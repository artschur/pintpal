// components/group-view.tsx
"use client";

import React, { useEffect, useState } from "react";
import { View, ScrollView, Image, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import {
	getGroupMembers,
	type GroupWithMembers,
	type GroupMemberWithProfile,
	getGroupById, // Import getGroupById
} from "@/queries/groups";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Props {
	groupId: string;
}

export default function GroupView({ groupId }: Props) {
	const { session } = useAuth();
	const [group, setGroup] = useState<GroupWithMembers | null>(null);
	const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchGroupDetails = async () => {
			if (!groupId) return;

			try {
				// Fetch group data and members in parallel
				const [groupData, groupMembers] = await Promise.all([
					getGroupById(groupId), // Use getGroupById
					getGroupMembers(groupId),
				]);

				// Combine group data with members to form GroupWithMembers
				setGroup({
					...groupData,
					members: groupMembers,
				});
				setMembers(groupMembers);
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

	if (loading) {
		return (
			<View className="flex-1 justify-center items-center bg-neutral-900">
				<ActivityIndicator size="large" color="#FFCA28" />
				<Text className="text-yellow-500 mt-2">Loading group details...</Text>
			</View>
		);
	}

	if (!members || members.length === 0) {
		return (
			<View className="flex-1 justify-center items-center bg-neutral-900">
				<Text className="text-yellow-500">
					Group not found or has no members.
				</Text>
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-neutral-900 p-4 pt-16">
			{/* Group Header */}
			<View className="mt-6 mb-6">
				<Text className="text-2xl font-bold text-neutral-100 mb-2">
					{group?.name}
				</Text>
				<Text className="text-base text-neutral-300 opacity-80">
					{group?.description}
				</Text>
			</View>

			{/* Leaderboard */}
			<View className="mb-6">
				<Text className="text-xl font-bold text-neutral-100 mb-4">
					Leaderboard
				</Text>
				{sortedMembers.map((member, index) => (
					<View
						key={member.id}
						className="bg-neutral-800 p-4 rounded-xl mb-3 flex-row items-center"
					>
						<Text className="text-lg text-neutral-100 mr-2">{index + 1}.</Text>
						<Image
							source={{ uri: member.profiles.avatar_url }}
							className="w-10 h-10 rounded-full mr-2"
						/>
						<Text className="text-base text-neutral-100 flex-1">
							{member.profiles.username}
						</Text>
						<Text className="text-sm text-neutral-300">
							{member.points || 0} Points
						</Text>
					</View>
				))}
			</View>
		</ScrollView>
	);
}
