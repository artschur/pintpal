"use client";

import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { useRef, useState, useEffect } from "react";
import {
	StyleSheet,
	Pressable,
	View,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { AddPintToStorage, CreatePost } from "@/queries/pints";
import { useAuth } from "@/context/supabase-provider";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { getUserGroups, type Group } from "@/queries/groups";
import { BlurView } from "expo-blur";
import { Picker } from "@react-native-picker/picker";

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
	const [userGroups, setUserGroups] = useState<Group[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
	const [frontImage, setFrontImage] = useState<string | null>(null);
	const [facing, setFacing] = useState<CameraType>("back");
	const [location, setLocation] = useState<string>("");
	const [quantity, setQuantity] = useState(1);
	const [drinkType, setDrinkType] = useState(DRINK_TYPES[0]);
	const [uploading, setUploading] = useState(false);
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [loadingGroups, setLoadingGroups] = useState(true);
	const [showGroupPicker, setShowGroupPicker] = useState(false);

	const resetState = () => {
		setBackImage(null);
		setFrontImage(null);
		setFacing("back");
		setQuantity(1);
		setDrinkType(DRINK_TYPES[0]);
		setUploading(false);
		// Keep the selected group for convenience
	};

	const resetToCamera = () => {
		Alert.alert(
			"Começar de novo?",
			"Você perderá as fotos tiradas. Tem certeza?",
			[
				{
					text: "Cancelar",
					style: "cancel",
				},
				{
					text: "Sim, começar de novo",
					style: "destructive",
					onPress: resetState,
				},
			],
		);
	};

	useEffect(() => {
		(async () => {
			if (!session?.user?.id) {
				router.back();
				return;
			}
			const { status } = await Location.requestForegroundPermissionsAsync();
			const userGroups = await getUserGroups(session?.user.id);
			if (userGroups) {
				setUserGroups(userGroups);
				if (userGroups.length > 0 && !selectedGroupId) {
					setSelectedGroup(userGroups[0]);
					setSelectedGroupId(userGroups[0].id);
				}
			}
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
			setLoadingGroups(false);
		})();
	}, [selectedGroupId]);

	const takePicture = async () => {
		const photo = await ref.current?.takePictureAsync({
			base64: true,
			quality: 0.7,
		});

		if (photo) {
			const base64Image = `data:image/jpeg;base64,${photo.base64}`;
			if (facing === "back") {
				setBackImage(base64Image);
				setFacing("front");
			} else {
				setFrontImage(base64Image);
			}
		}
	};

	const toggleFacing = () => {
		setFacing((prev) => (prev === "back" ? "front" : "back"));
	};

	const handleShare = async () => {
		if (!backImage || !frontImage || !location || !session?.user?.id) return;

		if (!selectedGroupId) {
			return Alert.alert(
				"Group Required",
				"Please select a group to share your pint.",
				[{ text: "OK", onPress: () => {} }],
			);
		}

		setUploading(true);

		try {
			const { backImageUrl, frontImageUrl, error } = await AddPintToStorage({
				backImage,
				frontImage,
				user_id: session.user.id,
			});

			if (error) {
				console.error("Error uploading images:", error);
				return;
			}

			const post = await CreatePost({
				userId: session.user.id,
				description: `${quantity}x ${drinkType}`,
				location,
				imageUrl: `${backImageUrl},${frontImageUrl}`,
				groupId: selectedGroupId,
				points: quantity * 10,
			});

			if (post) {
				resetState();
				Alert.alert("Success", "Your pint was shared successfully!", [
					{
						text: "Take Another",
						onPress: () => {},
					},
				]);
			} else {
				console.error("Failed to create post");
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
				<Text style={styles.permissionText}>
					We need your permission to use the camera
				</Text>
				<Pressable style={styles.permissionButton} onPress={requestPermission}>
					<Text style={styles.permissionButtonText}>Grant Permission</Text>
				</Pressable>
			</View>
		);
	}

	if (loadingGroups) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color={colors.dark.foreground} />
				<Text style={styles.loadingText}>Loading Groups...</Text>
			</View>
		);
	}

	if (!frontImage || !backImage) {
		return (
			<View style={styles.container}>
				<CameraView style={styles.camera} ref={ref} facing={facing} />

				{/* Group Selector - Bottom left */}
				<TouchableOpacity
					style={styles.groupSelectorButton}
					onPress={() => {
						console.log(
							"Group button pressed, userGroups length:",
							userGroups.length,
						);
						if (userGroups.length > 1) {
							setShowGroupPicker(true);
						}
					}}
					activeOpacity={0.7}
				>
					<BlurView
						intensity={30}
						tint="dark"
						style={styles.groupSelectorBlur}
						className="ml-6"
					>
						<View style={styles.groupSelector}>
							<MaterialIcons name="group" size={18} color="#FFCA28" />
							<Text style={styles.groupSelectorText} numberOfLines={1}>
								{selectedGroup ? selectedGroup.name : "Select Group"}
							</Text>
							{userGroups.length > 1 && (
								<MaterialIcons
									name="keyboard-arrow-down"
									size={16}
									color="white"
									style={{ marginLeft: 4 }}
								/>
							)}
						</View>
					</BlurView>
				</TouchableOpacity>

				{/* Camera Controls */}
				<View style={styles.cameraControls}>
					<TouchableOpacity style={styles.iconButton} onPress={toggleFacing}>
						<BlurView intensity={50} tint="dark" style={styles.iconButtonBlur}>
							<Ionicons name="camera-reverse-outline" size={24} color="white" />
						</BlurView>
					</TouchableOpacity>

					<TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
						<View style={styles.shutterButtonInner} />
					</TouchableOpacity>

					<View style={styles.iconButton} />
				</View>

				{/* Camera Instructions */}
				<Text style={styles.cameraInstructions}>
					Tire sua foto do {facing === "back" ? "drink🍻" : "rosto🤳🏻"}
				</Text>

				{/* Group Picker Modal - NOW INSIDE CAMERA VIEW */}
				{showGroupPicker && (
					<View style={styles.modalOverlay}>
						<TouchableOpacity
							style={styles.modalBackdrop}
							onPress={() => setShowGroupPicker(false)}
							activeOpacity={1}
						>
							<TouchableOpacity
								activeOpacity={1}
								onPress={(e) => e.stopPropagation()}
							>
								<BlurView
									intensity={50}
									tint="dark"
									style={styles.modalContainer}
									className="border border-neutral-800"
								>
									<View style={styles.modalContent}>
										<Text style={styles.modalTitle}>Select Group</Text>
										<View style={styles.groupPickerContainer}>
											<Picker
												mode="dropdown"
												selectedValue={selectedGroupId}
												onValueChange={(value) => {
													setSelectedGroupId(value);
													const group = userGroups.find((g) => g.id === value);
													setSelectedGroup(group || null);
													setShowGroupPicker(false);
												}}
											>
												{userGroups.map((group) => (
													<Picker.Item
														key={group.id}
														label={group.name}
														value={group.id}
													/>
												))}
											</Picker>
										</View>
										<TouchableOpacity
											style={styles.modalCloseButton}
											className="bg-neutral-900  border border-neutral-800"
											onPress={() => setShowGroupPicker(false)}
										>
											<Text style={styles.modalCloseText}>Cancel</Text>
										</TouchableOpacity>
									</View>
								</BlurView>
							</TouchableOpacity>
						</TouchableOpacity>
					</View>
				)}
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Back Button */}
			<TouchableOpacity
				style={styles.backButton}
				onPress={resetToCamera}
				activeOpacity={0.8}
			>
				<Ionicons name="arrow-back" size={24} color="white" />
			</TouchableOpacity>

			{/* Main Image Preview */}
			<View style={styles.previewContainer}>
				<Image source={{ uri: backImage }} style={styles.mainPreview} />

				{/* Selfie Preview */}
				<View style={styles.selfiePreview}>
					<Image source={{ uri: frontImage }} style={styles.selfieImage} />
				</View>

				{/* Location Overlay - Rounded pill at top */}
				<BlurView intensity={40} tint="dark" style={styles.locationOverlay}>
					<MaterialIcons name="location-on" size={16} color="#FFCA28" />
					<Text style={styles.locationText} numberOfLines={1}>
						{location}
					</Text>
				</BlurView>
			</View>

			{/* Bottom Controls with Half-Width Pickers */}
			<BlurView intensity={40} tint="dark" style={styles.bottomControls}>
				{/* Half-Width Picker Controls */}
				<View style={styles.pickersRow}>
					{/* Quantity Picker */}
					<View style={styles.pickerContainer}>
						<Text style={styles.pickerLabel}>Quantity</Text>
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

					{/* Drink Type Picker */}
					<View style={styles.pickerContainer}>
						<Text style={styles.pickerLabel}>Type</Text>
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
				</View>

				{/* Share Button */}
				<TouchableOpacity
					style={styles.shareButton}
					onPress={handleShare}
					disabled={uploading}
				>
					{uploading ? (
						<ActivityIndicator color="#000" />
					) : (
						<Text style={styles.shareButtonText}>Adicionar Bebida 🍻</Text>
					)}
				</TouchableOpacity>
			</BlurView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
	camera: {
		flex: 1,
		width: "100%",
	},
	// Back Button Styles
	backButton: {
		position: "absolute",
		top: 60,
		left: 20,
		zIndex: 10000,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
	groupSelectorButton: {
		position: "absolute",
		bottom: 150,
		left: 115,
		zIndex: 10,
	},
	groupSelectorBlur: {
		borderRadius: 20,
		overflow: "hidden",
	},
	groupSelector: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	groupSelectorText: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
		marginLeft: 6,
		maxWidth: 120,
	},
	cameraControls: {
		position: "absolute",
		bottom: 50,
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 40,
	},
	iconButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	iconButtonBlur: {
		width: 48,
		height: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	shutterButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 4,
		borderColor: "white",
		alignItems: "center",
		justifyContent: "center",
	},
	shutterButtonInner: {
		width: 65,
		height: 65,
		borderRadius: 32.5,
		backgroundColor: "white",
	},
	cameraInstructions: {
		position: "absolute",
		bottom: 20,
		width: "100%",
		textAlign: "center",
		color: "white",
		fontSize: 16,
		fontWeight: "500",
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
		borderRadius: 12,
		overflow: "hidden",
		borderWidth: 2,
		borderColor: "white",
	},
	selfieImage: {
		width: "100%",
		height: "100%",
	},
	locationOverlay: {
		position: "absolute",
		top: 20,
		left: "50%",
		transform: [{ translateX: -100 }],
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		width: 200,
	},
	locationText: {
		color: "white",
		fontSize: 14,
		marginLeft: 6,
		flex: 1,
	},
	bottomControls: {
		padding: 20,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		overflow: "hidden",
	},
	// Updated picker styles for three-column layout
	pickersRow: {
		flexDirection: "row",
		marginBottom: 20,
		gap: 8,
	},
	pickerContainer: {
		backgroundColor: colors.dark.card,
		borderRadius: 12,
		overflow: "hidden",
		flex: 1,
	},
	pickerLabel: {
		color: "white",
		fontSize: 12,
		fontWeight: "600",
		paddingHorizontal: 12,
		paddingTop: 6,
		paddingBottom: 2,
	},
	picker: {
		backgroundColor: colors.dark.card,
		color: colors.dark.foreground,
		marginTop: -4,
	},
	shareButton: {
		backgroundColor: "#FFCA28",
		borderRadius: 16,
		paddingVertical: 14,
		alignItems: "center",
		marginTop: 8,
	},
	shareButtonText: {
		color: "#000",
		fontSize: 18,
		fontWeight: "600",
	},
	permissionText: {
		color: "white",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 20,
	},
	permissionButton: {
		backgroundColor: "#FFCA28",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 12,
	},
	permissionButtonText: {
		color: "#000",
		fontSize: 16,
		fontWeight: "600",
	},
	loadingText: {
		color: "white",
		fontSize: 18,
		marginTop: 20,
	},
	modalOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10000,
	},
	modalBackdrop: {
		flex: 1,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		borderRadius: 20,
		overflow: "hidden",
		margin: 40,
		width: 300,
	},
	modalContent: {
		padding: 20,
	},
	modalTitle: {
		color: "white",
		fontSize: 18,
		fontWeight: "600",
		textAlign: "center",
		marginBottom: 20,
	},
	groupPickerContainer: {
		backgroundColor: colors.dark.card,
		borderRadius: 12,
		overflow: "hidden",
		marginBottom: 20,
	},
	modalCloseButton: {
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
	},
	modalCloseText: {
		color: "white",
		fontSize: 16,
		fontWeight: "500",
	},
});
