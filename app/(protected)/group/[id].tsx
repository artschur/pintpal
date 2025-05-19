// app/group/[id].tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import GroupView from "@/components/group-view";
import { useLocalSearchParams } from "expo-router";

export default function GroupDetailsPage() {
	const { id } = useLocalSearchParams();

	if (!id || typeof id !== "string") {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>Invalid group ID.</Text>
			</View>
		);
	}

	return <GroupView groupId={id} />;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#1a1b1e",
	},
	errorText: {
		color: "#FFCA28",
		fontSize: 16,
		textAlign: "center",
	},
});
