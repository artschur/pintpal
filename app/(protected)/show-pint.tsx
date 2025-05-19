import {
	CameraMode,
	CameraType,
	CameraView,
	useCameraPermissions,
} from "expo-camera";
import { useRef, useState, useEffect } from "react";
import {
	StyleSheet,
	Pressable,
	View,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { CreatePost } from "@/queries/pints";
import { useAuth } from "@/context/supabase-provider";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import * as Location from "expo-location";

const DRINK_TYPES = [
	"Beer 🍺",
	"Wine 🍷",
	"Vodka 🥃",
	"Whiskey 🥃",
	"Gin 🍸",
	"Tequila 🥃",
];

export default function ShowPint() {
	const { session } = useAuth();
	const router = useRouter();
	const [permission, requestPermission] = useCameraPermissions();
	const ref = useRef<CameraView>(null);
	const [backImage, setBackImage] = useState<string | null>(null);
	const [frontImage, setFrontImage] = useState<string | null>(null);
	const [facing, setFacing] = useState<CameraType>("back");
	const [location, setLocation] = useState<string>("");
	const [quantity, setQuantity] = useState(1);
	const [drinkType, setDrinkType] = useState(DRINK_TYPES[0]);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status === "granted") {
				const location = await Location.getCurrentPositionAsync({});
				const [address] = await Location.reverseGeocodeAsync({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});
				if (address) {
					setLocation(`${address.street || ""}, ${address.city || ""}`);
				}
			}
		})();
	}, []);

	const takePicture = async () => {
		const photo = await ref.current?.takePictureAsync();
		if (facing === "back") {
			setBackImage(photo?.uri ?? null);
			setFacing("front");
		} else {
			setFrontImage(photo?.uri ?? null);
		}
	};

	const toggleFacing = () => {
		setFacing((prev) => (prev === "back" ? "front" : "back"));
	};

	const handleShare = async () => {
		if (!backImage || !frontImage || !location || !session?.user?.id) return;
		setUploading(true);

		try {
			const post = await CreatePost({
				userId: session.user.id,
				description: `${quantity}x ${drinkType}`,
				location,
				imageUrl: `${backImage},${frontImage}`,
			});

			if (post) {
				router.back();
			}
		} catch (error) {
			console.error("Error sharing pint:", error);
		} finally {
			setUploading(false);
		}
	};

	if (!permission) {
		return null;
	}

	if (!permission.granted) {
		return (
			<View style={styles.container}>
				<Text style={styles.cameraText}>
					We need your permission to use the camera
				</Text>
				<Pressable style={styles.permissionButton} onPress={requestPermission}>
					<Text style={styles.permissionButtonText}>Grant Permission</Text>
				</Pressable>
			</View>
		);
	}

	if (!frontImage || !backImage) {
		return (
			<View style={styles.container}>
				<CameraView
					style={styles.camera}
					ref={ref}
					mode="picture"
					facing={facing}
				/>
				{/* UI elements moved outside CameraView */}
				<View className="absolute bottom-0 left-0 w-full p-4">
					<View style={styles.shutterContainer}>
						<Pressable onPress={toggleFacing}>
							<FontAwesome6 name="rotate-left" size={32} color="white" />
						</Pressable>
						<Pressable onPress={takePicture}>
							{({ pressed }) => (
								<View
									style={[
										styles.shutterBtn,
										{
											opacity: pressed ? 0.5 : 1,
										},
									]}
								>
									<View style={styles.shutterBtnInner} />
								</View>
							)}
						</Pressable>
						<View style={{ width: 32 }} />
					</View>
					<Text style={styles.cameraText}>
						Take your {facing === "back" ? "drink" : "selfie"} photo
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.previewContainer}>
				<Image source={{ uri: backImage }} style={styles.mainPreview} />
				<View style={styles.selfiePreview}>
					<Image source={{ uri: frontImage }} style={styles.selfieImage} />
				</View>
			</View>

			<View style={styles.controls}>
				<View style={styles.locationBar}>
					<MaterialIcons
						name="location-on"
						size={20}
						color={colors.dark.accent}
					/>
					<Text style={styles.locationText}>{location}</Text>
				</View>

				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<View style={styles.pickerContainer}>
						<Picker
							selectedValue={quantity}
							onValueChange={setQuantity}
							style={styles.picker}
						>
							{[...Array(10)].map((_, i) => (
								<Picker.Item
									key={i + 1}
									label={`${i + 1}`}
									value={i + 1}
									color={colors.dark.foreground}
								/>
							))}
						</Picker>
					</View>

					<View style={styles.pickerContainer}>
						<Picker
							selectedValue={drinkType}
							onValueChange={setDrinkType}
							style={styles.picker}
						>
							{DRINK_TYPES.map((drink) => (
								<Picker.Item
									key={drink}
									label={drink}
									value={drink}
									color={colors.dark.foreground}
								/>
							))}
						</Picker>
					</View>
				</ScrollView>

				<Pressable
					style={[styles.shareButton, uploading && { opacity: 0.7 }]}
					onPress={handleShare}
					disabled={uploading}
				>
					{uploading ? (
						<ActivityIndicator color={colors.dark.background} />
					) : (
						<Text style={styles.shareButtonText}>Share Pint</Text>
					)}
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.dark.background,
	},
	camera: {
		flex: 1,
		width: "100%",
	},
	shutterContainer: {
		position: "absolute",
		bottom: 44,
		left: 0,
		width: "100%",
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 30,
	},
	shutterBtn: {
		backgroundColor: "transparent",
		borderWidth: 5,
		borderColor: "white",
		width: 85,
		height: 85,
		borderRadius: 45,
		alignItems: "center",
		justifyContent: "center",
	},
	shutterBtnInner: {
		width: 70,
		height: 70,
		borderRadius: 50,
		backgroundColor: "white",
	},
	cameraText: {
		position: "absolute",
		bottom: 150,
		width: "100%",
		textAlign: "center",
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	captureButton: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	captureButtonInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: colors.dark.foreground,
	},
	previewContainer: {
		flex: 1,
		position: "relative",
	},
	mainPreview: {
		flex: 1,
		width: "100%",
	},
	selfiePreview: {
		position: "absolute",
		top: 20,
		right: 20,
		width: 100,
		height: 100,
		borderRadius: 8,
		overflow: "hidden",
		borderWidth: 2,
		borderColor: colors.dark.background,
	},
	selfieImage: {
		width: "100%",
		height: "100%",
	},
	controls: {
		padding: 20,
		paddingBottom: 40,
	},
	locationBar: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.dark.card,
		padding: 10,
		borderRadius: 8,
		marginBottom: 20,
	},
	locationText: {
		color: colors.dark.foreground,
		marginLeft: 10,
	},
	pickerContainer: {
		backgroundColor: colors.dark.card,
		borderRadius: 12,
		marginRight: 10,
		overflow: "hidden",
		width: 120,
	},
	picker: {
		width: 120,
		backgroundColor: colors.dark.card,
	},
	shareButton: {
		backgroundColor: colors.dark.accent,
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 20,
	},
	shareButtonText: {
		color: colors.dark.background,
		fontSize: 16,
		fontWeight: "bold",
	},
	permissionButton: {
		backgroundColor: colors.dark.accent,
		padding: 12,
		borderRadius: 8,
		marginTop: 20,
	},
	permissionButtonText: {
		color: colors.dark.background,
		fontSize: 16,
		textAlign: "center",
	},
});
