import { useState } from "react";
import { View, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { uploadProfilePic } from "@/queries/profilepics";

export function ProfilePicUploader({
	userId,
	onUploaded,
}: {
	userId: string;
	onUploaded: (url: string) => void;
}) {
	const [uploading, setUploading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

	const handlePick = async () => {
		setUploading(true);
		const { avatarUrl: url, error } = await uploadProfilePic(userId);
		setUploading(false);
		if (error) {
			alert("Erro ao enviar imagem.");
			return;
		}
		setAvatarUrl(url ?? null);
		onUploaded(url ?? "");
	};

	return (
		<View style={{ alignItems: "center", marginVertical: 16 }}>
			<TouchableOpacity onPress={handlePick} disabled={uploading}>
				{avatarUrl ? (
					<Image
						source={{ uri: avatarUrl }}
						style={{ width: 80, height: 80, borderRadius: 40 }}
					/>
				) : (
					<View
						style={{
							width: 80,
							height: 80,
							borderRadius: 40,
							backgroundColor: "#eee",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{uploading ? <ActivityIndicator /> : <Text>Adicionar Foto</Text>}
					</View>
				)}
			</TouchableOpacity>
			<Text style={{ marginTop: 8 }}>
				Toque para escolher uma foto de perfil
			</Text>
		</View>
	);
}
