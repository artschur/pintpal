import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, Beer, User } from "lucide-react-native";

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
						borderTopWidth: 0, // Removes top border
						elevation: 0, // Removes shadow on Android
						shadowOpacity: 0, // Removes shadow on iOS
					},
					tabBarActiveTintColor:
						colorScheme === "dark"
							? colors.dark.foreground
							: colors.light.foreground,
					tabBarShowLabel: false,
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Home",
						tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
					}}
				/>
				<Tabs.Screen
					name="add-pint"
					options={{
						title: "Add Pint",
						tabBarIcon: ({ color, size }) => <Beer size={size} color={color} />,
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: "Settings",
						tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
					}}
				/>
			</Tabs>
		</View>
	);
}
