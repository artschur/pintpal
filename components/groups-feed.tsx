"use client";

import { useEffect, useState, useCallback } from "react";
import {
	View,
	ScrollView,
	RefreshControl,
	Pressable,
	Image,
	ActivityIndicator,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import {
	getUserGroupsWithMembers,
	getAllGroupsWithMembers,
	type GroupWithMembers,
} from "@/queries/groups";
import { Group } from "./group";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export const dayBasedMessages = {
	domingo: [
		"domingo, o dia em que até jesus beberia.",
		"domingo, seu fígado pediu pra avisar que não é indestrutível.",
		"domingo, o único dia em que 'tomar café da manhã' pode incluir vodka.",
		"domingo, porque amanhã é segunda, e isso já é motivo suficiente.",
		"domingo, o dia oficial do 'eu não ia beber, mas...'",
		"domingo, ressaca? que ressaca? isso é só o aquecimento.",
	],
	"segunda-feira": [
		"segunda, o dia que o álcool foi inventado pra suportar.",
		"segunda, quando até seu café pede uma dose de whisky.",
		"segunda, o dia perfeito para começar a beber... às 8 da manhã.",
		"segunda, porque sobriedade é superestimada.",
		"segunda, o único dia em que 'é 5 da tarde em algum lugar' começa às 9 da manhã.",
		"nada como uma ressaca para esquecer que é segunda.",
	],
	"terça-feira": [
		"terça, o dia em que seu fígado ainda está processando o fim de semana.",
		"terça, quando 'só uma cervejinha' vira terapia de grupo.",
		"terça, o dia perfeito para descobrir novos drinks. por necessidade.",
		"terça, porque dois dias sóbrio já é demais.",
		"terça, seu corpo diz água, seu coração diz vodka.",
		"terça, o dia em que 'moderação' vira palavrão.",
	],
	"quarta-feita": [
		"quarta, o dia em que seu fígado pergunta 'sério mesmo?'",
		"quarta, metade da semana, dobro da vontade de beber.",
		"quarta, o dia oficial do 'só um drink para aguentar até sexta'.",
		"quarta, quando a garrafa te entende melhor que seu terapeuta.",
		"quarta, porque três dias sem bebida seria um recorde desnecessário.",
		"quarta, o dia em que 'happy hour' começa depois do almoço.",
	],
	"quinta-feira": [
		"quinta, sexta júnior. seu fígado já está aquecendo.",
		"quinta, o dia em que 'só uma' é a maior mentira que você conta.",
		"quinta, oficialmente, o início do fim (do seu fígado).",
		"quinta, porque esperar até sexta é coisa de amador.",
		"quinta, quando seu corpo pede água mas sua alma grita tequila.",
		"quinta, o dia em que 'beber com moderação' vira piada interna.",
	],
	"sexta-feira": [
		"sexta, seu fígado já ligou pedindo férias.",
		"sexta, o dia em que 'só vou tomar uma' é a piada do século.",
		"sexta, quando seu corpo já sabe que vai se arrepender, mas sua mente diz 'foda-se'.",
		"sexta, porque cinco dias sóbrio é castigo demais.",
		"sexta, o dia em que até seu uber já sabe seu endereço de bar favorito.",
		"sexta, seu corpo: 'por favor, não'. você: 'observe.'",
	],
	sábado: [
		"sábado, o dia em que seu fígado oficialmente desiste de você.",
		"sábado, criando histórias que você vai negar ter vivido.",
		"sábado, quando 'só mais uma' significa 'me carregue para casa'.",
		"sábado, seu corpo implora por água, mas sua alma exige tequila.",
		"sábado, o dia em que suas decisões são diretamente proporcionais ao seu nível de álcool.",
		"sábado, porque domingo é o dia de se arrepender, não hoje.",
	],
};

function getRandomMessage(day: string): string {
	const messages = dayBasedMessages[day as keyof typeof dayBasedMessages] || [
		"Aproveite o dia!",
	];
	return messages[Math.floor(Math.random() * messages.length)];
}

export default function GroupFeed() {
	const { session } = useAuth();
	const [userGroups, setUserGroups] = useState<GroupWithMembers[]>([]);
	const [discoverGroups, setDiscoverGroups] = useState<GroupWithMembers[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [dayMessage, setDayMessage] = useState("");
	const [pagination, setPagination] = useState({
		hasMore: false,
		total: 0,
		offset: 0,
	});
	const router = useRouter();

	const PAGE_SIZE = 5; // Number of groups to load per page

	const fetchUserGroups = async () => {
		if (!session?.user.id) return;
		try {
			const groups = await getUserGroupsWithMembers(session.user.id);
			setUserGroups(groups);
		} catch (error) {
			console.error("Error fetching user groups:", error);
		}
	};

	const fetchDiscoverGroups = async (offset = 0, reset = false) => {
		try {
			const result = await getAllGroupsWithMembers({
				limit: PAGE_SIZE,
				offset,
				onlyActiveInvites: true, // Only show groups accepting invites
				orderBy: "member_count",
				ascending: false, // Most popular first
			});

			if (reset) {
				setDiscoverGroups(result.groups);
			} else {
				setDiscoverGroups((prev) => [...prev, ...result.groups]);
			}

			setPagination({
				hasMore: result.hasMore,
				total: result.total,
				offset: offset + PAGE_SIZE,
			});
		} catch (error) {
			console.error("Error fetching discover groups:", error);
		}
	};

	const fetchAllData = async () => {
		setLoading(true);
		try {
			await Promise.all([fetchUserGroups(), fetchDiscoverGroups(0, true)]);
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const loadMoreGroups = async () => {
		if (loadingMore || !pagination.hasMore) return;

		setLoadingMore(true);
		try {
			await fetchDiscoverGroups(pagination.offset, false);
		} catch (error) {
			console.error("Error loading more groups:", error);
		} finally {
			setLoadingMore(false);
		}
	};

	useEffect(() => {
		if (session?.user?.id) {
			fetchAllData();
		}

		const today = new Date();
		const dayOfWeek = today.toLocaleDateString("pt-BR", { weekday: "long" });
		setDayMessage(getRandomMessage(dayOfWeek));
	}, [session?.user?.id]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		setPagination({ hasMore: false, total: 0, offset: 0 });
		fetchAllData();
	}, []);

	const handleGroupPress = (group: GroupWithMembers) => {
		router.push(`/(protected)/group/${group.id}`);
	};

	const handleJoinGroup = (group: GroupWithMembers) => {
		// Navigate to invite handler if group has invite token
		if (group.invite_token) {
			router.push(`/invite/${group.invite_token}`);
		}
	};

	if (!session?.user?.id) {
		return (
			<View className="flex-1 items-center justify-center bg-neutral-950">
				<Text className="text-white text-base text-center">
					Please log in to view your groups.
				</Text>
			</View>
		);
	}

	if (loading) {
		return (
			<View className="flex-1 items-center justify-center bg-neutral-950">
				<ActivityIndicator size="large" color="#FFCA28" />
				<Text className="text-white text-base mt-4">Carregando grupos...</Text>
			</View>
		);
	}

	return (
		<ScrollView
			className="flex-1 bg-neutral-950"
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}
		>
			{/* Day-Based Message */}
			<View className="px-4 pt-4">
				<Text className="text-white text-xl font-bold">{dayMessage}</Text>
			</View>

			{/* User's Groups Section - 2 Column Grid */}
			<View className="px-4 mb-6 mt-4">
				<View className="flex-row items-center justify-between mb-4">
					<View className="flex-row items-center">
						<Text className="text-white text-xl font-bold ml-2">
							🍻 seus bros
						</Text>
					</View>
					<Pressable onPress={() => router.push("/(protected)/create-group")}>
						<Text className="text-yellow-400">Criar grupo</Text>
					</Pressable>
				</View>

				{userGroups.length === 0 ? (
					<BlurView
						intensity={20}
						tint="dark"
						className="rounded-xl p-6 items-center justify-center h-36 border border-neutral-800"
					>
						<MaterialIcons name="group-add" size={32} color="#FFCA28" />
						<Text className="text-white text-base mt-2 text-center">
							Você ainda não tem grupos.
						</Text>
					</BlurView>
				) : (
					<View className="flex-row flex-wrap justify-between">
						{userGroups.map((group) => (
							<View key={group.id} className="mb-3 w-[48.5%]">
								<Group
									group={group}
									variant="grid"
									onPress={handleGroupPress}
								/>
							</View>
						))}
					</View>
				)}
			</View>

			{/* Discover Groups Section - Full Width Widgets */}
			<View className="px-4 mb-6">
				<View className="flex-row items-center justify-between mb-4">
					<View className="flex-row items-center">
						<Text className="text-white text-xl font-bold ml-2">
							🌎 descobrir bros
						</Text>
					</View>
					<Text className="text-neutral-400 text-sm">
						{pagination.total} grupos
					</Text>
				</View>

				{discoverGroups.length === 0 ? (
					<BlurView
						intensity={20}
						tint="dark"
						className="rounded-xl p-6 items-center justify-center h-36 border border-neutral-800"
					>
						<MaterialIcons name="search" size={32} color="#FFCA28" />
						<Text className="text-white text-base mt-2 text-center">
							Sem grupos por enquanto.
						</Text>
					</BlurView>
				) : (
					<View className="space-y-4">
						{discoverGroups.map((group) => (
							<Pressable
								key={group.id}
								className="overflow-hidden rounded-xl border border-neutral-800 mb-4"
								onPress={() => handleGroupPress(group)}
							>
								<BlurView intensity={20} tint="dark" className="p-4 rounded-xl">
									<View className="flex-row mb-4">
										{group.members.slice(0, 5).map((member, index) => (
											<View
												key={index}
												className="mr-[-12px]"
												style={{ zIndex: 10 - index }}
											>
												<View className="w-9 h-9 bg-neutral-700 rounded-full border-2 border-neutral-950 items-center justify-center">
													<Text className="text-white text-sm">
														{member.profiles.username.charAt(0).toUpperCase()}
													</Text>
												</View>
											</View>
										))}
										{group.members.length > 5 && (
											<View
												className="w-9 h-9 rounded-full bg-neutral-600 justify-center items-center border-2 border-neutral-950"
												style={{ zIndex: 1 }}
											>
												<Text className="text-white text-xs font-bold">
													+{group.members.length - 5}
												</Text>
											</View>
										)}
									</View>
									<View className="flex-row justify-between items-center mb-3">
										<Text className="text-white text-lg font-bold">
											{group.name}
										</Text>
										<View className="flex-row items-center bg-yellow-400 px-2 py-1 rounded-full">
											<MaterialIcons name="people" size={16} color="#000" />
											<Text className="text-black text-xs ml-1 font-semibold">
												{group.members.length}/{group.member_limit}
											</Text>
										</View>
									</View>

									{group.description && (
										<Text
											className="text-neutral-400 text-sm mb-3"
											numberOfLines={2}
										>
											{group.description}
										</Text>
									)}

									<View className="flex-row justify-between items-center">
										<Pressable
											className="bg-yellow-400 py-2 px-4 rounded-lg flex-1 mr-3"
											onPress={(e) => {
												e.stopPropagation();
												handleJoinGroup(group);
											}}
										>
											<Text className="font-semibold text-black text-center">
												Entrar no grupo
											</Text>
										</Pressable>

										<Pressable className="w-10 h-10 rounded-full bg-neutral-700 justify-center items-center">
											<MaterialIcons
												name="arrow-forward"
												size={20}
												color="white"
											/>
										</Pressable>
									</View>
								</BlurView>
							</Pressable>
						))}

						{/* Load More Button */}
						{pagination.hasMore && (
							<Pressable
								className="bg-neutral-800 p-4 rounded-xl items-center"
								onPress={loadMoreGroups}
								disabled={loadingMore}
							>
								{loadingMore ? (
									<ActivityIndicator size="small" color="#FFCA28" />
								) : (
									<Text className="text-yellow-400 font-semibold">
										Carregar mais grupos
									</Text>
								)}
							</Pressable>
						)}
					</View>
				)}
			</View>
		</ScrollView>
	);
}
