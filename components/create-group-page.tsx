"use client";

import React, { useState } from "react";
import {
	View,
	TextInput,
	Pressable,
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
		if (!name.trim()) {
			Alert.alert("Error", "Group name is required.");
			return;
		}

		setLoading(true);
		try {
			if (!session?.user?.id) {
				throw new Error("User not authenticated");
			}

			const newGroup = await createGroup({
				name: name.trim(),
				description: description.trim() || null,
				created_by: session.user.id,
			});

			// Navigate to invite page after successful creation
			router.push(`/group/${newGroup.id}/invite`);
		} catch (error: any) {
			console.error("Error creating group:", error);
			Alert.alert("Error", error.message || "Failed to create group.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 bg-neutral-950">
			{/* Header */}
			<View className="pt-16 pb-8 px-6">
				<Text className="text-3xl font-bold text-white text-center">
					Criar Grupo
				</Text>
				<Text className="text-neutral-400 text-center mt-2">
					Crie um grupo para seus bros
				</Text>
			</View>

			{/* Form */}
			<View className="flex-1 px-6">
				<View className="space-y-6">
					{/* Group Name Input */}
					<View className="space-y-2">
						<Text className="text-white font-medium text-base">
							Nome do Grupo
						</Text>
						<View className="bg-neutral-900 border border-neutral-800 rounded-2xl">
							<TextInput
								className="text-white text-base p-4"
								placeholder="Ex: Bros da Faculdade"
								placeholderTextColor="#737373"
								value={name}
								onChangeText={setName}
								maxLength={50}
							/>
						</View>
						<Text className="text-neutral-500 text-sm">
							{name.length}/50 caracteres
						</Text>
					</View>

					{/* Description Input */}
					<View className="space-y-2">
						<Text className="text-white font-medium text-base">Descrição</Text>
						<View className="bg-neutral-900 border border-neutral-800 rounded-2xl">
							<TextInput
								className="text-white text-base p-4 min-h-[100px]"
								placeholder="Descreva seu grupo (opcional)"
								placeholderTextColor="#737373"
								value={description}
								onChangeText={setDescription}
								multiline
								textAlignVertical="top"
								maxLength={200}
							/>
						</View>
						<Text className="text-neutral-500 text-sm">
							{description.length}/200 caracteres
						</Text>
					</View>
				</View>

				{/* Create Button */}
				<View className="mt-8 mb-8">
					<Pressable
						className={`p-4 rounded-2xl items-center ${
							loading || !name.trim()
								? "bg-neutral-800"
								: "bg-yellow-400 active:bg-yellow-400"
						}`}
						onPress={handleSubmit}
						disabled={loading || !name.trim()}
					>
						{loading ? (
							<View className="flex-row items-center space-x-2">
								<ActivityIndicator color="#000000" size="small" />
								<Text className="text-black text-lg font-semibold ml-2">
									Criando...
								</Text>
							</View>
						) : (
							<Text
								className={`text-lg font-semibold ${
									!name.trim() ? "text-neutral-500" : "text-black"
								}`}
							>
								Criar Grupo
							</Text>
						)}
					</Pressable>
				</View>

				{/* Info Card */}
				<View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
					<Text className="text-yellow-400 font-semibold text-sm mb-2">
						💡 Próximo passo
					</Text>
					<Text className="text-neutral-300 text-sm leading-5">
						Após criar o grupo, você poderá convidar seus bros para participar
						das sessões de drink!
					</Text>
				</View>
			</View>
		</View>
	);
}
