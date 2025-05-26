// app/(protected)/(tabs)/index.tsx
import { View, SafeAreaView } from "react-native";
import { colors } from "@/constants/colors";
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
			</SafeAreaView>
		</View>
	);
}
