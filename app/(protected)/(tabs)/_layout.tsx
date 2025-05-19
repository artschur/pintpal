import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";

import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { ProtectedHeader } from "@/components/protected-header";

export default function TabsLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<View style={{ flex: 1 }}>
			<ProtectedHeader />
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarStyle: {
						backgroundColor:
							colorScheme === "dark"
								? colors.dark.background
								: colors.light.background,
					},
					tabBarActiveTintColor:
						colorScheme === "dark"
							? colors.dark.foreground
							: colors.light.foreground,
					tabBarShowLabel: false,
				}}
			>
				<Tabs.Screen name="index" options={{ title: "Home" }} />
				<Tabs.Screen name="settings" options={{ title: "Settings" }} />
				<Tabs.Screen name="add-pint" options={{ title: "Add Pint" }} />
			</Tabs>
		</View>
	);
}
