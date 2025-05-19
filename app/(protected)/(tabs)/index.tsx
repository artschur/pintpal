// app/(protected)/(tabs)/index.tsx
import { View } from "react-native";
import { Feed } from "@/components/feed";
import { colors } from "@/constants/colors";
import { AddPintButton } from "@/components/add-pint";

export default function Home() {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: colors.dark.background,
			}}
		>
			<AddPintButton />
			<Feed />
		</View>
	);
}
