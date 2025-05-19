// app/(protected)/(tabs)/index.tsx
import { View, SafeAreaView } from "react-native";
import { Feed } from "@/components/feed";
import { colors } from "@/constants/colors";
import { AddPintButton } from "@/components/add-pint";

export default function Home() {
	return (
		<View style={{ flex: 1, backgroundColor: colors.dark.background }}>
			<SafeAreaView style={{ flex: 1 }}>
				{/* Container for AddPintButton */}
				<View
					style={{
						paddingHorizontal: 16,
						paddingTop: 8,
						backgroundColor: colors.dark.background,
						zIndex: 1, // Ensure button stays on top
					}}
				>
					<AddPintButton />
				</View>

				{/* Feed container */}
				<View style={{ flex: 1 }}>
					<Feed />
				</View>
			</SafeAreaView>
		</View>
	);
}
