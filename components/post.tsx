import React, { useState } from "react";
import {
	View,
	Image,
	TouchableOpacity,
	Dimensions,
	Pressable,
} from "react-native";
import { Text } from "@/components/ui/text";
import { MaterialIcons, Feather, FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type PintPostProps = {
	frontImage: string;
	backImage: string;
	username: string;
	location: string;
	timestamp: string;
	description?: string;
	likes?: number;
	comments?: number;
};

export function PintPost({
	frontImage,
	backImage,
	username,
	location,
	timestamp,
	description,
	likes = 0,
	comments = 0,
}: PintPostProps) {
	const [expanded, setExpanded] = useState(false);
	const [liked, setLiked] = useState(false);

	return (
		<View className="bg-neutral-900 rounded-xl mb-4 overflow-hidden">
			{/* Header */}
			<View className="flex-row justify-between items-center px-4 pt-3 pb-2">
				<View className="flex-row items-center">
					<View className="w-8 h-8 rounded-full bg-neutral-700 mr-2 overflow-hidden">
						<Image source={{ uri: frontImage }} className="w-full h-full" />
					</View>
					<View>
						<Text className="text-white font-medium">{username}</Text>
						<Text className="text-neutral-400 text-xs">{timestamp}</Text>
					</View>
				</View>
				<TouchableOpacity className="p-1">
					<MaterialIcons name="more-horiz" size={24} color="#fff" />
				</TouchableOpacity>
			</View>

			{/* Images */}
			<TouchableOpacity
				className="w-full aspect-[4/5]"
				onPress={() => setExpanded(!expanded)}
				activeOpacity={0.95}
			>
				{/* Main image (beer) */}
				<Image
					source={{ uri: backImage }}
					className="w-full h-full"
					resizeMode="cover"
				/>

				{/* Selfie overlay */}
				<View
					className={`absolute ${expanded ? "inset-0" : "top-2 right-2 w-1/3 h-1/3"}
          rounded-lg overflow-hidden border-2 border-neutral-900 transition-all duration-300`}
				>
					<Image
						source={{ uri: frontImage }}
						className="w-full h-full"
						resizeMode="cover"
					/>
				</View>
			</TouchableOpacity>

			{/* Location */}
			<View className="px-4 py-2 flex-row justify-between items-center">
				<Feather name="map-pin" size={14} color="#ccc" />
				<Text className="text-neutral-300 text-sm ml-1">{location}</Text>
				{/* Description */}
				{description && (
					<View className="px-4">
						<Text className="text-white">{description}</Text>
					</View>
				)}
			</View>
		</View>
	);
}
