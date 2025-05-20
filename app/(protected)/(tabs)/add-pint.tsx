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
	Modal,
	ScrollView,
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
	const [showQuantityPicker, setShowQuantityPicker] = useState(false);
	const [showTypePicker, setShowTypePicker] = useState(false);
	const [showGroupPicker, setShowGroupPicker] = useState(false);

	const resetState = () => {
		setBackImage(null);
		setFrontImage(null);
		setFacing("back");
		setQuantity(1);
		setDrinkType(DRINK_TYPES[0]);
		setUploading(false);
		setSelectedGroupId(null);
		setShowQuantityPicker(false);
		setShowTypePicker(false);
		setShowGroupPicker(false);
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
				if (userGroups.length > 0) {
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
	}, []);

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

			if (!selectedGroupId) {
				return Alert.alert(
					"Group Required",
					"Please select a group to share your pint.",
					[{ text: "OK", onPress: () => {} }],
				);
			}

			const post = await CreatePost({
				userId: session.user.id,
				description: `${quantity}x ${drinkType}`,
				location,
				imageUrl: `${backImageUrl},${frontImageUrl}`,
				groupId: selectedGroupId,
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

	// Render iOS-style wheel picker
	const renderWheelPicker = (
		items: string[] | number[],
		selectedItem: string | number,
		onSelect: (item: any) => void,
		onClose: () => void,
	) => {
		return (
			<Modal
				animationType="slide"
				transparent={true}
				visible={true}
				onRequestClose={onClose}
			>
				<View style={styles.modalOverlay}>
					<BlurView intensity={80} tint="dark" style={styles.pickerContainer}>
						<View style={styles.pickerHeader}>
							<TouchableOpacity onPress={onClose}>
								<Text style={styles.pickerCancel}>Cancelar</Text>
							</TouchableOpacity>

							<TouchableOpacity onPress={onClose}>
								<Text style={styles.pickerDone}>Confirmar</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.pickerWheel}>
							<View style={styles.pickerSelection} />
							<ScrollView
								showsVerticalScrollIndicator={false}
								contentContainerStyle={styles.pickerScrollContent}
								snapToInterval={50}
								decelerationRate="fast"
							>
								{items.map((item) => (
									<TouchableOpacity
										key={item.toString()}
										style={[
											styles.pickerItem,
											selectedItem === item && styles.pickerItemSelected,
										]}
										onPress={() => {
											onSelect(item);
											onClose();
										}}
									>
										<Text
											style={[
												styles.pickerItemText,
												selectedItem === item && styles.pickerItemTextSelected,
											]}
										>
											{item.toString()}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						</View>
					</BlurView>
				</View>
			</Modal>
		);
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
					onPress={() => setShowGroupPicker(true)}
				>
					<BlurView
						intensity={30}
						tint="dark"
						style={styles.groupSelectorBlur}
						className="ml-6 "
					>
						<View style={styles.groupSelector}>
							<MaterialIcons name="group" size={18} color="#FFCA28" />
							<Text style={styles.groupSelectorText} numberOfLines={1}>
								{selectedGroup ? selectedGroup.name : "Select Group"}
							</Text>
						</View>
					</BlurView>
				</TouchableOpacity>

				{/* Camera Controls */}
				<View style={styles.cameraControls}>
					<TouchableOpacity
						style={styles.iconButton}
						onPress={toggleFacing}
						className=""
					>
						<BlurView
							intensity={50}
							tint="dark"
							style={styles.iconButtonBlur}
							className=""
						>
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

				{/* Group Picker Modal */}
				{showGroupPicker &&
					userGroups.length > 0 &&
					renderWheelPicker(
						userGroups.map((g) => g.name),
						selectedGroup?.name || "",
						(name) => {
							const group = userGroups.find((g) => g.name === name);
							if (group) {
								setSelectedGroup(group);
								setSelectedGroupId(group.id);
							}
						},
						() => setShowGroupPicker(false),
					)}
			</View>
		);
	}

	return (
		<View style={styles.container}>
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

			{/* Bottom Controls */}
			<BlurView intensity={40} tint="dark" style={styles.bottomControls}>
				{/* Group Selector */}
				<TouchableOpacity
					style={styles.controlRow}
					onPress={() => setShowGroupPicker(true)}
				>
					<View style={styles.controlLabelContainer}>
						<MaterialIcons name="group" size={18} color="#FFCA28" />
						<Text style={styles.controlLabel}>Group</Text>
					</View>
					<View style={styles.controlValue}>
						<Text style={styles.controlValueText} numberOfLines={1}>
							{selectedGroup ? selectedGroup.name : "Select Group"}
						</Text>
						<MaterialIcons name="chevron-right" size={20} color="white" />
					</View>
				</TouchableOpacity>

				{/* Quantity Selector */}
				<TouchableOpacity
					style={styles.controlRow}
					onPress={() => setShowQuantityPicker(true)}
				>
					<View style={styles.controlLabelContainer}>
						<MaterialIcons
							name="format-list-numbered"
							size={18}
							color="#FFCA28"
						/>
						<Text style={styles.controlLabel}>Quantity</Text>
					</View>
					<View style={styles.controlValue}>
						<Text style={styles.controlValueText}>{quantity}</Text>
						<MaterialIcons name="chevron-right" size={20} color="white" />
					</View>
				</TouchableOpacity>

				{/* Drink Type Selector */}
				<TouchableOpacity
					style={styles.controlRow}
					onPress={() => setShowTypePicker(true)}
				>
					<View style={styles.controlLabelContainer}>
						<MaterialIcons name="local-bar" size={18} color="#FFCA28" />
						<Text style={styles.controlLabel}>Type</Text>
					</View>
					<View style={styles.controlValue}>
						<Text style={styles.controlValueText}>{drinkType}</Text>
						<MaterialIcons name="chevron-right" size={20} color="white" />
					</View>
				</TouchableOpacity>

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

			{/* Pickers */}
			{showQuantityPicker &&
				renderWheelPicker(
					[...Array(10)].map((_, i) => i + 1),
					quantity,
					(value) => setQuantity(value),
					() => setShowQuantityPicker(false),
				)}

			{showTypePicker &&
				renderWheelPicker(
					DRINK_TYPES,
					drinkType,
					(value) => setDrinkType(value),
					() => setShowTypePicker(false),
				)}

			{showGroupPicker &&
				userGroups.length > 0 &&
				renderWheelPicker(
					userGroups.map((g) => g.name),
					selectedGroup?.name || "",
					(name) => {
						const group = userGroups.find((g) => g.name === name);
						if (group) {
							setSelectedGroup(group);
							setSelectedGroupId(group.id);
						}
					},
					() => setShowGroupPicker(false),
				)}
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
	controlRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
		paddingVertical: 8,
	},
	controlLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	controlLabel: {
		color: "white",
		fontSize: 16,
		fontWeight: "500",
		marginLeft: 8,
	},
	controlValue: {
		flexDirection: "row",
		alignItems: "center",
	},
	controlValueText: {
		color: "rgba(255, 255, 255, 0.8)",
		fontSize: 16,
		marginRight: 4,
		maxWidth: 150,
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
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	pickerContainer: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		overflow: "hidden",
	},
	pickerHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	pickerCancel: {
		color: "#FFCA28",
		fontSize: 16,
	},
	pickerDone: {
		color: "#FFCA28",
		fontSize: 16,
		fontWeight: "600",
	},
	pickerWheel: {
		height: 220,
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
	},
	pickerSelection: {
		position: "absolute",
		height: 50,
		left: 0,
		right: 0,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	pickerScrollContent: {
		paddingVertical: 85,
	},
	pickerItem: {
		height: 50,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	pickerItemSelected: {
		// No additional styling needed as the selection bar shows the selected item
	},
	pickerItemText: {
		color: "rgba(255, 255, 255, 0.6)",
		fontSize: 20,
	},
	pickerItemTextSelected: {
		color: "white",
		fontSize: 22,
		fontWeight: "500",
	},
});
