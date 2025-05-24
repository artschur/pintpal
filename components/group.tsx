import { View, Pressable, Image } from "react-native";
import { Text } from "@/components/ui/text";
import { MaterialIcons } from "@expo/vector-icons";
import type { GroupWithMembers } from "@/queries/groups";
import { BlurView } from "expo-blur";

interface GroupProps {
	group: GroupWithMembers;
	variant: "grid" | "horizontal";
	onPress: (group: GroupWithMembers) => void;
	showJoinButton?: boolean;
	onJoin?: (group: GroupWithMembers) => void;
}

export const Group = ({
	group,
	variant,
	onPress,
	showJoinButton = false,
	onJoin,
}: GroupProps) => {
	const totalPoints = group.members.reduce(
		(acc, member) => acc + (member.points || 0),
		0,
	);

	return (
		<Pressable
			className={`overflow-hidden border border-neutral-800 rounded-xl h-40 ${variant === "grid" ? "w-full" : "w-[200px] mr-3"}`}
			onPress={() => onPress(group)}
		>
			<BlurView
				intensity={50}
				tint="dark"
				className="p-4 rounded-xl h-full flex flex-col justify-between"
			>
				<View className="flex-row mb-3 justify-center">
					{group.members.slice(0, 3).map((member, index) => (
						<Image
							key={index}
							source={{ uri: member.profiles.avatar_url }}
							className={`w-8 h-8 rounded-full border-2 border-dark-background ${index > 0 ? "-ml-2" : ""}`}
						/>
					))}
					{group.members.length > 3 && (
						<View className="w-8 h-8 rounded-full bg-opacity-20 bg-white justify-center items-center -ml-2 border-2 border-dark-background">
							<Text className="text-white text-xs font-bold">
								+{group.members.length - 3}
							</Text>
						</View>
					)}
				</View>

				<Text className="text-white text-base font-bold text-center">
					{group.name}
				</Text>

				{group.description && (
					<Text
						className="text-white text-sm opacity-70 text-center mt-1"
						numberOfLines={variant === "horizontal" ? 2 : 3}
					>
						{group.description}
					</Text>
				)}

				{variant === "grid" && (
					<View className="flex-row justify-between mt-2">
						<View className="flex-row items-center">
							<MaterialIcons name="star" size={14} color="#FFCA28" />
							<Text className="text-white text-xs ml-1">{totalPoints}</Text>
						</View>
						<View className="flex-row items-center">
							<MaterialIcons name="people" size={14} color="#FFFFFF" />
							<Text className="text-white text-xs ml-1">
								{group.members.length}
							</Text>
						</View>
					</View>
				)}

				{showJoinButton && (
					<Pressable
						className="mt-3 py-2 px-4 bg-yellow-400 rounded-lg items-center"
						onPress={(e) => {
							e.stopPropagation();
							onJoin?.(group);
						}}
					>
						<Text className="text-black font-bold">Join</Text>
					</Pressable>
				)}
			</BlurView>
		</Pressable>
	);
};
