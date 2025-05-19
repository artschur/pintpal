"use client";

import { useEffect, useState, useCallback } from "react";
import {
	View,
	ScrollView,
	RefreshControl,
	Pressable,
	Image,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import {
	getUserGroupsWithMembers,
	type GroupWithMembers,
} from "@/queries/groups";
import { Group } from "./group";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";

export const dayBasedMessages = {
	domingo: [
		"domingo: o dia em que até jesus beberia.",
		"domingo: seu fígado pediu pra avisar que não é indestrutível.",
		"domingo: o único dia em que 'tomar café da manhã' pode incluir vodka.",
		"domingo: porque amanhã é segunda, e isso já é motivo suficiente.",
		"domingo: o dia oficial do 'eu não ia beber, mas...'",
		"domingo: ressaca? que ressaca? isso é só o aquecimento.",
	],
	"segunda-feira": [
		"segunda: o dia que o álcool foi inventado pra suportar.",
		"segunda: quando até seu café pede uma dose de whisky.",
		"segunda: o dia perfeito para começar a beber... às 8 da manhã.",
		"segunda: porque sobriedade é superestimada.",
		"segunda: o único dia em que 'é 5 da tarde em algum lugar' começa às 9 da manhã.",
		"segunda: nada como uma ressaca para esquecer que é segunda.",
	],
	"terça-feira": [
		"terça: o dia em que seu fígado ainda está processando o fim de semana.",
		"terça: quando 'só uma cervejinha' vira terapia de grupo.",
		"terça: o dia perfeito para descobrir novos drinks. por necessidade.",
		"terça: porque dois dias sóbrio já é demais.",
		"terça: seu corpo diz água, seu coração diz vodka.",
		"terça: o dia em que 'moderação' vira palavrão.",
	],
	"quarta-feita": [
		"quarta: o dia em que seu fígado pergunta 'sério mesmo?'",
		"quarta: metade da semana, dobro da vontade de beber.",
		"quarta: o dia oficial do 'só um drink para aguentar até sexta'.",
		"quarta: quando a garrafa te entende melhor que seu terapeuta.",
		"quarta: porque três dias sem bebida seria um recorde desnecessário.",
		"quarta: o dia em que 'happy hour' começa depois do almoço.",
	],
	"quinta-feira": [
		"quinta: sexta júnior. seu fígado já está aquecendo.",
		"quinta: o dia em que 'só uma' é a maior mentira que você conta.",
		"quinta: oficialmente, o início do fim (do seu fígado).",
		"quinta: porque esperar até sexta é coisa de amador.",
		"quinta: quando seu corpo pede água mas sua alma grita tequila.",
		"quinta: o dia em que 'beber com moderação' vira piada interna.",
	],
	"sexta-feira": [
		"sexta: seu fígado já ligou pedindo férias.",
		"sexta: o dia em que 'só vou tomar uma' é a piada do século.",
		"sexta: quando seu corpo já sabe que vai se arrepender, mas sua mente diz 'foda-se'.",
		"sexta: porque cinco dias sóbrio é castigo demais.",
		"sexta: o dia em que até seu uber já sabe seu endereço de bar favorito.",
		"sexta: seu corpo: 'por favor, não'. você: 'observe.'",
	],
	sábado: [
		"sábado: o dia em que seu fígado oficialmente desiste de você.",
		"sábado: criando histórias que você vai negar ter vivido.",
		"sábado: quando 'só mais uma' significa 'me carregue para casa'.",
		"sábado: seu corpo implora por água, mas sua alma exige tequila.",
		"sábado: o dia em que suas decisões são diretamente proporcionais ao seu nível de álcool.",
		"sábado: porque domingo é o dia de se arrepender, não hoje.",
	],
};
function getRandomMessage(day: string): string {
	const messages = dayBasedMessages[day as keyof typeof dayBasedMessages] || [
		"mais uma desculpa para beber demais.",
	];
	return messages[Math.floor(Math.random() * messages.length)].toLowerCase();
}

export default function GroupFeed() {
	const { session } = useAuth();
	const [userGroups, setUserGroups] = useState<GroupWithMembers[]>([]);
	const [otherGroups, setOtherGroups] = useState<GroupWithMembers[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [dayMessage, setDayMessage] = useState("");

	const fetchGroups = async () => {
		if (!session?.user.id) {
			setLoading(false);
			return;
		}
		try {
			const groups: GroupWithMembers[] = await getUserGroupsWithMembers(
				session.user.id,
			);
			if (groups) {
				setUserGroups(groups);

				// For demo purposes - in a real app, you'd fetch these separately
				setOtherGroups(groups.map((g) => ({ ...g, id: `other-${g.id}` })));
			}
		} catch (error) {
			console.error("Error fetching groups:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (session?.user?.id) {
			fetchGroups();
		}

		const today = new Date();
		const dayOfWeek = today.toLocaleDateString("pt-BR", { weekday: "long" });
		console.log(dayOfWeek);
		setDayMessage(getRandomMessage(dayOfWeek));
	}, [session?.user?.id]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchGroups();
	}, []);

	const handleGroupPress = (group: GroupWithMembers) => {
		// Navigate to group details
		console.log("Group pressed:", group.name);
	};

	const handleJoinGroup = (group: GroupWithMembers) => {
		// Handle join group logic
		console.log("Join group:", group.name);
	};

	if (!session?.user?.id) {
		return (
			<View className="flex-1 items-center justify-center bg-dark-background">
				<Text className="text-white text-base text-center">
					Please log in to view your groups.
				</Text>
			</View>
		);
	}

	if (loading) {
		return (
			<View className="flex-1 items-center justify-center bg-dark-background">
				<View className="h-8 w-8 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
				<Text className="text-white text-base mt-4">Loading groups...</Text>
			</View>
		);
	}

	return (
		<ScrollView
			className="flex-1 bg-dark-background"
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}
		>
			{/* Day-Based Message */}
			<View className="px-4 py-4">
				<Text className="text-white text-3xl font-bold ">{dayMessage}</Text>
			</View>

			{/* User's Groups Section - 2 Column Grid */}
			<View className="px-4 mb-6 mt-4">
				<View className="flex-row items-center justify-between mb-4">
					<View className="flex-row items-center">
						<MaterialIcons name="group" size={24} color="#FFFFFF" />
						<Text className="text-white text-xl font-bold ml-2">Seus Bros</Text>
					</View>
					<Pressable>
						<Text className="text-yellow-500">See All</Text>
					</Pressable>
				</View>

				{userGroups.length === 0 ? (
					<BlurView
						intensity={20}
						tint="dark"
						className="rounded-xl p-6 items-center justify-center h-36"
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
						<MaterialIcons name="explore" size={24} color="#FFFFFF" />
						<Text className="text-white text-xl font-bold ml-2">
							Descobrir Grupos
						</Text>
					</View>
					<Pressable>
						<Text className="text-yellow-500">See All</Text>
					</Pressable>
				</View>

				{otherGroups.length === 0 ? (
					<BlurView
						intensity={20}
						tint="dark"
						className="rounded-xl p-6 items-center justify-center h-36"
					>
						<MaterialIcons name="search" size={32} color="#FFCA28" />
						<Text className="text-white text-base mt-2 text-center">
							No groups to discover right now
						</Text>
					</BlurView>
				) : (
					<View className="space-y-4">
						{otherGroups.map((group) => (
							<Pressable
								key={group.id}
								className="overflow-hidden rounded-xl"
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
												<Image
													source={{ uri: member.profiles.avatar_url }}
													className="w-9 h-9 rounded-full border-2 border-dark-background"
												/>
											</View>
										))}
										{group.members.length > 5 && (
											<View
												className="w-9 h-9 rounded-full bg-opacity-20 bg-white justify-center items-center border-2 border-dark-background"
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
										<View className="flex-row items-center bg-opacity-10 bg-neutral-200 px-2 py-1 rounded-full">
											<MaterialIcons name="people" size={16} color="#000" />
											<Text className="text-neutral-800 text-xs ml-1">
												{group.members.length}
											</Text>
										</View>
									</View>

									{group.description && (
										<Text
											className="text-white text-sm opacity-70 mb-3"
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
											<Text className="text-black font-bold text-center">
												Join Group
											</Text>
										</Pressable>

										<Pressable className="w-10 h-10 rounded-full bg-opacity-10 bg-neutral-200 justify-center items-center">
											<MaterialIcons
												name="arrow-forward"
												size={20}
												color="#000"
											/>
										</Pressable>
									</View>
								</BlurView>
							</Pressable>
						))}
					</View>
				)}
			</View>
		</ScrollView>
	);
}
