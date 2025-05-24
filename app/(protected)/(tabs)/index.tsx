// app/(protected)/(tabs)/index.tsx
import { View, SafeAreaView } from "react-native";
import { Feed } from "@/components/feed";
import { colors } from "@/constants/colors";
import { AddPintButton } from "@/components/add-pint";
import { useEffect } from "react";
import GroupFeed from "@/components/groups-feed";

export default function Home() {
	return (
		<View
			style={{ flex: 1, backgroundColor: colors.dark.background }}
			className="px-3"
		>
			<SafeAreaView style={{ flex: 1 }}>
				{/* Container for AddPintButton */}

				{/* Feed container */}
				<View style={{ flex: 1 }}>
					<GroupFeed />
				</View>
				<View className="w-full mb-6">
					<AddPintButton />
				</View>
			</SafeAreaView>
		</View>
	);
}
