// components/CreateGroupPage.tsx
"use client";

import React, { useState } from "react";
import {
	View,
	TextInput,
	Pressable,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import { createGroup } from "@/queries/groups";
import { useRouter } from "expo-router";

export default function CreateGroupPage() {
	const { session } = useAuth();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async () => {
		if (!name) {
			Alert.alert("Error", "Group name is required.");
			return;
		}

		setLoading(true);
		try {
			if (!session?.user?.id) {
				throw new Error("User not authenticated");
			}
			const newGroup = await createGroup({
				name,
				description,
				created_by: session.user.id,
			});

			Alert.alert("Success", "Group created successfully!");
			router.push(`/group/${newGroup.id}`); // Redirect to the new group's page
		} catch (error: any) {
			console.error("Error creating group:", error);
			Alert.alert("Error", error.message || "Failed to create group.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create a New Group</Text>
			<TextInput
				style={styles.input}
				placeholder="Group Name"
				placeholderTextColor="#888"
				value={name}
				onChangeText={setName}
			/>
			<TextInput
				style={styles.input}
				placeholder="Description (optional)"
				placeholderTextColor="#888"
				value={description}
				onChangeText={setDescription}
				multiline
			/>
			<Pressable style={styles.button} onPress={handleSubmit}>
				{loading ? (
					<ActivityIndicator color="#FFFFFF" />
				) : (
					<Text style={styles.buttonText}>Create Group</Text>
				)}
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1b1e",
		padding: 24,
		justifyContent: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 24,
		textAlign: "center",
	},
	input: {
		backgroundColor: "#2c2e33",
		color: "#FFFFFF",
		fontSize: 16,
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
	},
	button: {
		backgroundColor: "#228be6",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "bold",
	},
});
