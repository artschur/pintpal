import { useEffect, useState } from "react";
import { View, ActivityIndicator, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/supabase-provider";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getGroupByToken, joinGroupViaInvite } from "@/queries/invites";
import { getGroupMembers, type GroupMemberWithProfile } from "@/queries/groups";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "@/components/image";
import { BackHeader } from "@/components/back-header";

export default function InviteHandler() {
	const { token } = useLocalSearchParams<{ token: string }>();
	const { session } = useAuth();
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [group, setGroup] = useState<any>(null);
	const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loadingGroup, setLoadingGroup] = useState(true);

	useEffect(() => {
		if (token) {
			loadGroupAndMembers();
		}
	}, [token]);

	const loadGroupAndMembers = async () => {
		setLoadingGroup(true);
		try {
			const groupData = await getGroupByToken(token!);
			setGroup(groupData);

			// Load group members
			const membersData = await getGroupMembers(groupData.id);
			setMembers(membersData);
		} catch (err: any) {
			if (err.message === "Você já é membro deste grupo") {
				return router.push(`/(protected)/group/${err.groupId}`);
			}
			setError(err.message);
		} finally {
			setLoadingGroup(false);
		}
	};

	const handleJoin = async () => {
		if (!session || !token) return;

		setLoading(true);
		try {
			const joinedGroup = await joinGroupViaInvite(token, session.user.id);
			Toast.show({
				type: "success",
				text1: "Sucesso!",
				text2: `Você entrou no grupo "${joinedGroup.name}"`,
			});
			router.push(`/(protected)/group/${joinedGroup.id}`);
		} catch (err: any) {
			Toast.show({
				type: "error",
				text1: "Erro",
				text2: err.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = () => {
		router.push(`/welcome?redirectTo=/invite/${token}`);
	};

	// Show loading while fetching group data
	if (loadingGroup) {
		return (
			<View className="flex-1 justify-center items-center bg-neutral-950">
				<ActivityIndicator size="large" color="#FFCA28" />
				<Text className="text-white mt-4 text-lg">Carregando convite...</Text>
			</View>
		);
	}

	// Show error if group not found or invite invalid
	if (error) {
		return (
			<View className="flex-1 justify-center items-center bg-neutral-950 p-6">
				<View className="bg-red-900/20 border border-red-500 rounded-2xl p-6 mb-6">
					<MaterialIcons
						name="error"
						size={48}
						color="#EF4444"
						className="self-center mb-4"
					/>
					<Text className="text-red-400 text-lg text-center font-semibold mb-2">
						Convite Inválido
					</Text>
					<Text className="text-red-300 text-center">{error}</Text>
				</View>
				<Button
					onPress={() => router.push("/welcome")}
					className="bg-neutral-800 border border-neutral-700"
				>
					<Text className="text-white">Voltar ao Início</Text>
				</Button>
			</View>
		);
	}

	// Show group info and login prompt if not authenticated
	if (!session && group) {
		return (
			<ScrollView className="flex-1 bg-neutral-950">
				<View className="flex-1 justify-center items-center p-6 min-h-screen">
					{/* Group Card */}
					<BlurView
						intensity={20}
						tint="dark"
						className="w-full max-w-sm rounded-3xl overflow-hidden border border-neutral-800"
					>
						<View className="p-6">
							{/* Group Header */}
							<View className="items-center mb-6">
								<View className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl items-center justify-center mb-4">
									<Text className="text-3xl">🍻</Text>
								</View>
								<Text className="text-white text-2xl font-bold text-center mb-1">
									{group.name}
								</Text>
								<View className="bg-yellow-400/20 border border-yellow-400/30 rounded-full px-3 py-1">
									<Text className="text-yellow-400 text-sm font-medium">
										{group.memberCount}/{group.member_limit} membros
									</Text>
								</View>
							</View>

							{/* Description */}
							{group.description && (
								<View className="bg-neutral-800/50 rounded-xl p-4 mb-6">
									<Text className="text-neutral-300 text-center leading-5">
										{group.description}
									</Text>
								</View>
							)}

							{/* Members Avatars */}
							{members.length > 0 && (
								<View className="mb-6">
									<Text className="text-white font-semibold mb-3 text-center">
										Membros do Grupo
									</Text>
									<View className="flex-row justify-center items-center flex-wrap gap-2">
										{members.slice(0, 12).map((member, index) => (
											<View
												key={member.id}
												className="relative"
												style={{
													marginLeft: index > 0 ? -8 : 0,
													zIndex: members.length - index,
												}}
											>
												<View className="w-10 h-10 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-full border-2 border-neutral-950 items-center justify-center">
													<Text className="text-white text-sm font-medium">
														{member.profiles.username.charAt(0).toUpperCase()}
													</Text>
												</View>
											</View>
										))}
										{members.length > 12 && (
											<View className="w-10 h-10 bg-neutral-700 rounded-full border-2 border-neutral-950 items-center justify-center ml-2">
												<Text className="text-white text-xs font-bold">
													+{members.length - 12}
												</Text>
											</View>
										)}
									</View>
								</View>
							)}

							{/* Login Prompt */}
							<View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
								<MaterialIcons
									name="info"
									size={20}
									color="#3B82F6"
									className="self-center mb-2"
								/>
								<Text className="text-blue-300 text-center text-sm">
									Você precisa estar logado para entrar neste grupo
								</Text>
							</View>

							{/* Login Button */}
							<Button
								onPress={handleLogin}
								className="bg-gradient-to-r from-yellow-400 to-yellow-400 w-full"
							>
								<Text className="text-black font-semibold text-lg">
									Fazer Login
								</Text>
							</Button>
						</View>
					</BlurView>
				</View>
			</ScrollView>
		);
	}

	// Show group info and login prompt if not authenticated
	if (!session && group) {
		return (
			<View className="flex-1 bg-neutral-950">
				<BackHeader />
				<ScrollView className="flex-1">
					<View className="flex-1 justify-center items-center p-6 min-h-screen">
						{/* Group Card */}
						<BlurView
							intensity={20}
							tint="dark"
							className="w-full max-w-sm rounded-3xl overflow-hidden border border-neutral-800"
						>
							{/* ... rest of the content ... */}

							<View className="p-6">
								{/* Group Header */}
								<View className="items-center mb-6">
									<View className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl items-center justify-center mb-4">
										<Text className="text-3xl">🍻</Text>
									</View>
									<Text className="text-white text-2xl font-bold text-center mb-1">
										{group.name}
									</Text>
									<View className="bg-yellow-400/20 border border-yellow-400/30 rounded-full px-3 py-1">
										<Text className="text-yellow-400 text-sm font-medium">
											{group.memberCount}/{group.member_limit} membros
										</Text>
									</View>
								</View>

								{/* Description */}
								{group.description && (
									<View className="bg-neutral-800/50 rounded-xl p-4 mb-6">
										<Text className="text-neutral-300 text-center leading-5">
											{group.description}
										</Text>
									</View>
								)}

								{/* Members Avatars */}
								{members.length > 0 && (
									<View className="mb-6">
										<Text className="text-white font-semibold mb-3 text-center">
											Seus Futuros Bros
										</Text>
										<View className="flex-row justify-center items-center flex-wrap gap-1">
											{members.slice(0, 12).map((member, index) => (
												<View
													key={member.id}
													className="relative mb-2"
													style={{
														marginLeft: index > 0 && index < 6 ? -8 : 0,
														zIndex: members.length - index,
													}}
												>
													<View className="w-10 h-10 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-full border-2 border-neutral-950 items-center justify-center overflow-hidden">
														{member.profiles.avatar_url ? (
															<Image
																source={{ uri: member.profiles.avatar_url }}
																className="w-full h-full"
																style={{ borderRadius: 20 }}
															/>
														) : (
															<Text className="text-white text-sm font-medium">
																{member.profiles.username
																	.charAt(0)
																	.toUpperCase()}
															</Text>
														)}
													</View>
													{/* Show username on hover/press */}
													<View className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
														<Text className="text-neutral-400 text-xs text-center">
															{member.profiles.username.length > 6
																? `${member.profiles.username.substring(0, 6)}...`
																: member.profiles.username}
														</Text>
													</View>
												</View>
											))}
											{members.length > 12 && (
												<View className="w-10 h-10 bg-neutral-700 rounded-full border-2 border-neutral-950 items-center justify-center ml-2">
													<Text className="text-white text-xs font-bold">
														+{members.length - 12}
													</Text>
												</View>
											)}
										</View>
									</View>
								)}

								{/* Join Button */}
								<Button
									onPress={handleJoin}
									disabled={loading}
									className="bg-neutral-900 w-full mt-4 border border-neutral-800"
								>
									{loading ? (
										<ActivityIndicator color="# F000" />
									) : (
										<Text className="text-white font-semibold text-lg">
											Entrar no Grupo
										</Text>
									)}
								</Button>

								{/* Group Stats */}
								<View className="flex-row justify-center mt-4 space-x-4">
									<View className="items-center">
										<Text className="text-neutral-400 text-xs">Membros</Text>
										<Text className="text-white font-semibold">
											{group.memberCount}
										</Text>
									</View>
									<View className="items-center">
										<Text className="text-neutral-400 text-xs">Vagas</Text>
										<Text className="text-yellow-400 font-semibold">
											{group.member_limit - group.memberCount}
										</Text>
									</View>
								</View>
							</View>
						</BlurView>
					</View>
				</ScrollView>
			</View>
		);
	}

	return null;
}
