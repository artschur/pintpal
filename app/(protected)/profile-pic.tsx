import { View } from "react-native";
import { ProfilePicUploader } from "@/components/profile-puc-uploader";
import { useAuth } from "@/context/supabase-provider";
import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";

export default function ProfilePicScreen() {
	const { session } = useAuth();
	const { colorScheme } = useColorScheme();

	if (!session?.user?.id) return <Text>Você precisa estar logado.</Text>;

	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor,
			}}
		>
			<Text style={{ fontSize: 20, marginBottom: 16, color: textColor }}>
				Alterar foto de perfil
			</Text>
			<ProfilePicUploader
				userId={session.user.id}
				onUploaded={() => alert("Foto de perfil atualizada!")}
			/>
		</View>
	);
}
