import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BackHeaderProps {
	title?: string;
	subtitle?: string;
	rightElement?: React.ReactNode;
	onBackPress?: () => void;
}

export function BackHeader({
	title,
	subtitle,
	rightElement,
	onBackPress,
}: BackHeaderProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const handleBackPress = () => {
		if (onBackPress) {
			onBackPress();
		} else {
			router.back();
		}
	};

	return (
		<View
			className="bg-neutral-950 w-full border-b border-neutral-800 px-6 pb-4"
			style={{ paddingTop: insets.top + 16 }}
		>
			<View className="flex-row items-center justify-between">
				<Pressable
					onPress={handleBackPress}
					className="flex-row items-center active:opacity-70"
				>
					<Ionicons name="arrow-back" size={24} color="white" />
				</Pressable>

				<View className="flex-1 mx-4">
					{title && (
						<Text className="text-white text-lg font-semibold text-center">
							{title}
						</Text>
					)}
					{subtitle && (
						<Text className="text-neutral-400 text-sm text-center mt-1">
							{subtitle}
						</Text>
					)}
				</View>

				<View className="w-6">{rightElement}</View>
			</View>
		</View>
	);
}
