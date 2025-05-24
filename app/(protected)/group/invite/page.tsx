"use client";

import { useState, useEffect } from "react";
import {
	View,
	TextInput,
	Pressable,
	ScrollView,
	Alert,
	Share,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	getGroupById,
	getGroupMembers,
	type Group,
	type GroupMemberWithProfile,
} from "@/queries/groups";
import { sendGroupInviteByUsername, createInviteLink } from "@/queries/invites";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

export default function GroupInvitePage() {
	const { session } = useAuth();
	const { id: groupId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();

	const [group, setGroup] = useState<Group | null>(null);
	const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [inviteLink, setInviteLink] = useState("");
	const [loadingData, setLoadingData] = useState(true);

	useEffect(() => {
		if (groupId) {
			loadGroupData();
			generateInviteLink();
		}
	}, [groupId]);

	const loadGroupData = async () => {
		try {
			const [groupData, membersData] = await Promise.all([
				getGroupById(groupId!),
				getGroupMembers(groupId!),
			]);

			setGroup(groupData);
			setMembers(membersData);
		} catch (error) {
			console.error("Error loading group data:", error);
			Alert.alert("Error", "Failed to load group data");
		} finally {
			setLoadingData(false);
		}
	};

	const generateInviteLink = async () => {
		try {
			const link = await createInviteLink(groupId!);
			setInviteLink(link);
		} catch (error) {
			console.error("Error generating invite link:", error);
		}
	};

	const handleInviteByUsername = async () => {
		if (!username.trim()) {
			Alert.alert("Error", "Digite um nome de usuário");
			return;
		}

		setLoading(true);
		try {
			await sendGroupInviteByUsername(
				groupId!,
				username.trim(),
				session?.user?.id!,
			);
			Alert.alert("Sucesso", `Convite enviado para @${username}`);
			setUsername("");
		} catch (error: any) {
			console.error("Error sending invite:", error);
			Alert.alert("Error", error.message || "Falha ao enviar convite");
		} finally {
			setLoading(false);
		}
	};

	const copyInviteLink = async () => {
		try {
			await Clipboard.setStringAsync(inviteLink);
			Alert.alert(
				"Copiado!",
				"Link de convite copiado para área de transferência",
			);
		} catch (error) {
			Alert.alert("Error", "Falha ao copiar link");
		}
	};

	const shareInviteLink = async () => {
		try {
			await Share.share({
				message: `Junte-se ao grupo "${group?.name}" no BeerBro! ${inviteLink}`,
				title: `Convite para ${group?.name}`,
			});
		} catch (error) {
			console.error("Error sharing:", error);
		}
	};

	if (loadingData) {
		return (
			<View className="flex-1 bg-neutral-950 justify-center items-center">
				<Text className="text-white text-lg">Carregando...</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-neutral-950">
			{/* Header */}
			<View className="pt-16 pb-6 px-6 border-b border-neutral-800">
				<Pressable onPress={() => router.back()} className="mb-4">
					<Ionicons name="arrow-back" size={24} color="white" />
				</Pressable>

				<Text className="text-2xl font-bold text-white">Convidar Bros</Text>
				<Text className="text-neutral-400 mt-1">{group?.name}</Text>
			</View>

			<ScrollView className="flex-1 px-6">
				{/* Invite Link Section */}
				<View className="mt-6 space-y-4">
					<Text className="text-white font-semibold text-lg">
						Link de Convite
					</Text>

					<View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
						<Text className="text-neutral-400 text-sm mb-3">
							Compartilhe este link para convidar seus bros
						</Text>

						<View className="bg-neutral-800 rounded-xl p-3 mb-4">
							<Text className="text-neutral-300 text-sm" numberOfLines={2}>
								{inviteLink}
							</Text>
						</View>

						<View className="flex-row space-x-3">
							<Pressable
								className="flex-1 bg-yellow-400 p-3 rounded-xl flex-row items-center justify-center active:bg-yellow-500"
								onPress={copyInviteLink}
							>
								<Ionicons name="copy-outline" size={18} color="black" />
								<Text className="text-black font-semibold ml-2">Copiar</Text>
							</Pressable>

							<Pressable
								className="flex-1 bg-neutral-700 p-3 rounded-xl flex-row items-center justify-center active:bg-neutral-600"
								onPress={shareInviteLink}
							>
								<Ionicons name="share-outline" size={18} color="white" />
								<Text className="text-white font-semibold ml-2">
									Compartilhar
								</Text>
							</Pressable>
						</View>
					</View>
				</View>

				{/* Invite by Username */}
				<View className="mt-8 space-y-4">
					<Text className="text-white font-semibold text-lg">
						Convidar por Username
					</Text>

					<View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
						<View className="flex-row space-x-3">
							<View className="flex-1 bg-neutral-800 rounded-xl">
								<TextInput
									className="text-white text-base p-3"
									placeholder="@username"
									placeholderTextColor="#737373"
									value={username}
									onChangeText={setUsername}
									autoCapitalize="none"
								/>
							</View>

							<Pressable
								className={`px-6 py-3 rounded-xl items-center justify-center ${
									loading || !username.trim()
										? "bg-neutral-700"
										: "bg-yellow-400 active:bg-yellow-500"
								}`}
								onPress={handleInviteByUsername}
								disabled={loading || !username.trim()}
							>
								<Text
									className={`font-semibold ${loading || !username.trim() ? "text-neutral-400" : "text-black"}`}
								>
									{loading ? "..." : "Enviar"}
								</Text>
							</Pressable>
						</View>
					</View>
				</View>

				{/* Group Members */}
				<View className="mt-8 mb-8 space-y-4">
					<View className="flex-row items-center justify-between">
						<Text className="text-white font-semibold text-lg">
							Membros do Grupo
						</Text>
						<View className="bg-neutral-800 px-3 py-1 rounded-full">
							<Text className="text-neutral-300 text-sm">{members.length}</Text>
						</View>
					</View>

					<View className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
						{members.map((member, index) => (
							<View key={member.id}>
								<View className="flex-row items-center p-4">
									{/* Avatar */}
									<View className="w-12 h-12 bg-neutral-700 rounded-full items-center justify-center mr-3">
										{member.profiles.avatar_url ? (
											<Text className="text-white text-lg">
												{member.profiles.username.charAt(0).toUpperCase()}
											</Text>
										) : (
											<Text className="text-white text-lg">
												{member.profiles.username.charAt(0).toUpperCase()}
											</Text>
										)}
									</View>

									{/* User Info */}
									<View className="flex-1">
										<Text className="text-white font-medium">
											@{member.profiles.username}
										</Text>
										<Text className="text-neutral-400 text-sm">
											{member.role === "admin" ? "Admin" : "Membro"}
										</Text>
									</View>

									{/* Points */}
									{member.points !== undefined && (
										<View className="bg-yellow-400 px-3 py-1 rounded-full">
											<Text className="text-black font-semibold text-sm">
												{member.points} pts
											</Text>
										</View>
									)}

									{/* Admin Badge */}
									{member.role === "admin" && (
										<View className="ml-2">
											<Ionicons name="star" size={16} color="#FBBF24" />
										</View>
									)}
								</View>

								{index < members.length - 1 && (
									<View className="h-px bg-neutral-800 mx-4" />
								)}
							</View>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
