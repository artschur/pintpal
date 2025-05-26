import React from "react";
import { View, Text, Image } from "react-native";
import { GroupMemberWithProfile } from "@/queries/groups"; // Assuming GroupMemberWithProfile is declared in a types file

export function renderLeaderboardItem(
	member: GroupMemberWithProfile,
	index: number,
) {
	const isTopThree = index < 3;
	const rank = index + 1;

	return (
		<View
			key={member.id}
			className="flex-row items-center py-3 px-4 bg-neutral-900 border border-neutral-800 mb-2 rounded-xl"
		>
			{/* Rank */}
			<View
				className={`w-8 h-8 rounded-full justify-center items-center mr-3 ${
					isTopThree ? "bg-yellow-400" : "bg-neutral-700"
				}`}
			>
				<Text
					className={`font-semibold text-sm ${
						isTopThree ? "text-black" : "text-gray-400"
					}`}
				>
					{rank}
				</Text>
			</View>

			{/* Avatar */}
			<View className="w-10 h-10 rounded-full overflow-hidden mr-3">
				{member.profiles.avatar_url ? (
					<Image
						source={{ uri: member.profiles.avatar_url }}
						className="w-full h-full"
						resizeMode="cover"
					/>
				) : (
					<View className="w-full h-full bg-neutral-700 justify-center items-center">
						<Text className="text-white text-base font-semibold">
							{member.profiles.username.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}
			</View>

			{/* User Info */}
			<View className="flex-1">
				<Text className="text-white text-base font-medium">
					{member.profiles.username}
				</Text>
				{member.role === "admin" && (
					<Text className="text-yellow-400 text-xs font-medium mt-0.5">
						Admin
					</Text>
				)}
			</View>

			{/* Points */}
			<Text className="text-white text-base font-semibold">
				{member.points || 0}
			</Text>
		</View>
	);
}
