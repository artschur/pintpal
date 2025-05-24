import { Redirect, Stack, usePathname } from "expo-router";
import { useAuth } from "@/context/supabase-provider";
import { BackHeader } from "@/components/back-header";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function ProtectedLayout() {
	const { initialized, session } = useAuth();
	const pathname = usePathname(); // Add this import from expo-router

	if (!initialized) {
		return null;
	}

	// Allow invite pages even without session
	const isGroupInvitePage = pathname?.includes("/group/invite/");

	if (!session && !isGroupInvitePage) {
		console.log("No session, redirecting to welcome");
		return <Redirect href="/welcome" />;
	}
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(tabs)" />

			{/* Group Details */}
			<Stack.Screen
				name="group/[id]"
				options={{
					headerShown: true,
					header: () => <BackHeader title="Grupo" />,
				}}
			/>

			{/* Group Invite Page */}
			<Stack.Screen
				name="group/invite/[id]/invite"
				options={{
					headerShown: true,
					header: () => <BackHeader title="Convidar Bros" />,
				}}
			/>

			{/* Create Group */}
			<Stack.Screen
				name="create-group"
				options={{
					headerShown: true,
					header: () => <BackHeader title="Criar Grupo" />,
				}}
			/>

			{/* Add Friends */}
			<Stack.Screen
				name="add-friends"
				options={{
					headerShown: true,
					header: () => <BackHeader title="Adicionar Amigos" />,
				}}
			/>

			{/* Profile Picture */}
			<Stack.Screen
				name="profile-pic"
				options={{
					headerShown: true,
					header: () => <BackHeader title="Foto de Perfil" />,
				}}
			/>

			<Stack.Screen name="modal" options={{ presentation: "modal" }} />
		</Stack>
	);
}
