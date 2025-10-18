import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    resetAllEdits,
    setCustomHeight,
    setCustomUnit,
    setCustomWidth,
    setOriginalImageRatio,
    setRatioPreset,
    type CustomUnit,
    type RatioPreset
} from '../app/store/slices/imageEditSlice';
import { setImage, setImageError, setImageLoading } from '../app/store/slices/imageSlice';
import type { RootState } from '../app/store/store';

// ========================================
// TYPE DEFINITIONS & CONSTANTS
// ========================================

export type AspectRatio = {
    label: string;
    value: [number, number] | null;
    preset: RatioPreset;
    description: string;
    unit: 'mm' | 'ratio';
    mmWidth?: number;
    mmHeight?: number;
};

const ASPECT_RATIOS: AspectRatio[] = [
    {
        label: "1:1",
        value: [1, 1],
        preset: "SQUARE",
        description: "Square • Social media",
        unit: 'mm',
        mmWidth: 300,
        mmHeight: 300
    },
    {
        label: "A0",
        value: [841, 1189],
        preset: "A0",
        description: "841×1189mm • Poster",
        unit: 'mm',
        mmWidth: 841,
        mmHeight: 1189
    },
    {
        label: "A1",
        value: [594, 841],
        preset: "A1",
        description: "594×841mm • Large Poster",
        unit: 'mm',
        mmWidth: 594,
        mmHeight: 841
    },
    {
        label: "A2",
        value: [420, 594],
        preset: "A2",
        description: "420×594mm • Medium Poster",
        unit: 'mm',
        mmWidth: 420,
        mmHeight: 594
    },
    {
        label: "A3",
        value: [297, 420],
        preset: "A3",
        description: "297×420mm • Small Poster",
        unit: 'mm',
        mmWidth: 297,
        mmHeight: 420
    },
    {
        label: "A4",
        value: [210, 297],
        preset: "A4",
        description: "210×297mm • Standard Document",
        unit: 'mm',
        mmWidth: 210,
        mmHeight: 297
    },
    {
        label: "A5",
        value: [148, 210],
        preset: "A5",
        description: "148×210mm • Small Document",
        unit: 'mm',
        mmWidth: 148,
        mmHeight: 210
    },
    {
        label: "16:9",
        value: [16, 9],
        preset: "RATIO_16_9",
        description: "Widescreen • Photo",
        unit: 'mm',
        mmWidth: 508,
        mmHeight: 286
    },
    {
        label: "4:3",
        value: [4, 3],
        preset: "RATIO_4_3",
        description: "Traditional • Photo",
        unit: 'mm',
        mmWidth: 270,
        mmHeight: 203
    },
    {
        label: "3:2",
        value: [3, 2],
        preset: "RATIO_3_2",
        description: "35mm film • DSLR",
        unit: 'mm',
        mmWidth: 397,
        mmHeight: 265
    },
    {
        label: "Custom",
        value: null,
        preset: "CUSTOM",
        description: "Set your own dimensions",
        unit: 'mm'
    },
];

const UNITS: { value: CustomUnit; label: string }[] = [
    { value: "mm", label: "mm" },
    { value: "cm", label: "cm" },
    { value: "m", label: "m" },
    { value: "inch", label: "inch" },
    { value: "ft", label: "ft" },
];

type Props = {
    isSelectRatioModalVisible: boolean;
    onClose: () => void;
    onAdvancedCrop?: (uri: string) => void;
    onImageSelected?: () => void; // NEW: Callback when image is selected to redirect/navigate
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ========================================
// UTILITY FUNCTIONS
// ========================================

const extractImageFormat = (uri: string, mimeType?: string): string => {
    if (mimeType) {
        const formatFromMime = mimeType.split('/')[1]?.toLowerCase();
        if (formatFromMime) {
            switch (formatFromMime) {
                case 'jpeg': return 'jpg';
                case 'png':
                case 'webp':
                case 'gif':
                case 'bmp': return formatFromMime;
                default: return formatFromMime;
            }
        }
    }
    try {
        const extension = uri.split('.').pop()?.toLowerCase();
        if (extension && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(extension)) {
            return extension === 'jpeg' ? 'jpg' : extension;
        }
    } catch (error) {
        console.warn('Failed to extract format from URI:', error);
    }
    return 'unknown';
};

const extractFileName = (uri: string): string => {
    try {
        const pathParts = uri.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return fileName?.split('?')[0] || 'unknown';
    } catch (error) {
        console.warn('Failed to extract filename from URI:', error);
        return 'unknown';
    }
};

const validateImageFile = (
    uri: string,
    fileSize?: number,
    mimeType?: string
): { isValid: boolean; error?: string } => {
    if (!uri) {
        return { isValid: false, error: "Invalid file URI" };
    }
    if (fileSize && fileSize > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `File size too large. Maximum allowed is ${Math.round(
                MAX_FILE_SIZE / (1024 * 1024)
            )}MB`,
        };
    }
    if (mimeType) {
        const fileType = mimeType.toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
            return {
                isValid: false,
                error: `Invalid file type ${fileType}. Only JPEG, PNG, and WebP images are allowed`,
            };
        }
    }
    return { isValid: true };
};

// ========================================
// MAIN COMPONENT
// ========================================

const ImageSourceOptions = ({
    isSelectRatioModalVisible,
    onClose,
    onAdvancedCrop,
    onImageSelected
}: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isImageSourceModalVisible, setIsImageSourceModalVisible] = useState<boolean>(false);
    const [showRatioPicker, setShowRatioPicker] = useState<boolean>(false);
    const [showUnitPicker, setShowUnitPicker] = useState<boolean>(false);

    const [customWidthInput, setCustomWidthInput] = useState<string>('');
    const [customHeightInput, setCustomHeightInput] = useState<string>('');

    const dispatch = useDispatch();

    const selectedPreset = useSelector((state: RootState) => state.imageEdit.ratioPreset);
    const customWidth = useSelector((state: RootState) => state.imageEdit.customWidth);
    const customHeight = useSelector((state: RootState) => state.imageEdit.customHeight);
    const customUnit = useSelector((state: RootState) => state.imageEdit.customUnit);
    const ratioValue = useSelector((state: RootState) => state.imageEdit.ratioValue);

    const selectedRatio = ASPECT_RATIOS.find(ratio => ratio.preset === selectedPreset);

    // ========================================
    // EFFECT HOOKS - MODIFIED BEHAVIOR
    // ========================================

    // REMOVED: Auto-reset on modal open - only reset when image is actually selected
    // useEffect(() => {
    //     if (isSelectRatioModalVisible) {
    //         dispatch(resetAllEdits());
    //         setCustomWidthInput('');
    //         setCustomHeightInput('');
    //     }
    // }, [isSelectRatioModalVisible, dispatch]);

    useEffect(() => {
        if (typeof customWidth === "number" && customWidth !== null) {
            setCustomWidthInput(customWidth.toString());
        } else {
            setCustomWidthInput("");
        }
        if (typeof customHeight === "number" && customHeight !== null) {
            setCustomHeightInput(customHeight.toString());
        } else {
            setCustomHeightInput("");
        }
    }, [customWidth, customHeight]);

    useEffect(() => {
        if (!isSelectRatioModalVisible) {
            setIsLoading(false);
            setIsImageSourceModalVisible(false);
            setShowRatioPicker(false);
            setShowUnitPicker(false);
        }
    }, [isSelectRatioModalVisible]);

    // ========================================
    // EVENT HANDLERS
    // ========================================

    const handleRatioChange = (preset: RatioPreset) => {
        dispatch(setRatioPreset({ preset }));
        setShowRatioPicker(false);
    };

    const handleCustomWidthChange = (text: string) => {
        setCustomWidthInput(text);
        const value = parseFloat(text);
        if (!isNaN(value) && value > 0) {
            dispatch(setCustomWidth(value));
        }
    };

    const handleCustomHeightChange = (text: string) => {
        setCustomHeightInput(text);
        const value = parseFloat(text);
        if (!isNaN(value) && value > 0) {
            dispatch(setCustomHeight(value));
        }
    };

    const handleUnitChange = (unit: CustomUnit) => {
        dispatch(setCustomUnit(unit));
        setShowUnitPicker(false);
    };

    const isContinueEnabled = () => {
        if (selectedPreset === "CUSTOM") {
            return customWidth && customHeight && customWidth > 0 && customHeight > 0;
        }
        return selectedRatio !== undefined;
    };

    const getAspectRatioForPicker = () => {
        if (selectedPreset === "CUSTOM" && ratioValue) {
            if (ratioValue >= 1) {
                return [ratioValue, 1];
            } else {
                return [1, 1 / ratioValue];
            }
        }
        return selectedRatio?.value || [1, 1];
    };

    // ========================================
    // IMAGE PICKING & PROCESSING - UPDATED WITH STORE RESET
    // ========================================

    const pickImage = async (source: 'camera' | 'gallery') => {
        if (!isContinueEnabled()) {
            Alert.alert('Error', 'Please select or configure an aspect ratio first');
            return;
        }

        try {
            setIsLoading(true);
            dispatch(setImageLoading(true));

            let result;
            const aspectRatio = getAspectRatioForPicker();

            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert(
                        'Permission Required',
                        'Camera access is needed to take photos.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
                        ]
                    );
                    return;
                }

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: aspectRatio as [number, number],
                    quality: 0.9,
                    allowsMultipleSelection: false,
                });
            } else {
                const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
                if (!mediaLibraryPermission.granted) {
                    Alert.alert(
                        'Permission Required',
                        'Gallery access is needed to select photos.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Settings', onPress: () => MediaLibrary.requestPermissionsAsync() }
                        ]
                    );
                    return;
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: aspectRatio as [number, number],
                    quality: 0.9,
                    allowsMultipleSelection: false,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                const validation = validateImageFile(asset.uri, asset.fileSize, asset.mimeType);
                if (!validation.isValid) {
                    Alert.alert('Invalid Image', validation.error || 'Please select a valid image');
                    dispatch(setImageError(validation.error || 'Invalid image'));
                    return;
                }

                // ========================================
                // NEW: RESET STORE TO DEFAULT VALUES WHEN IMAGE IS SELECTED
                // ========================================
                // This resets the imageEdit state to defaults - triggered only when image is picked
                dispatch(resetAllEdits());

                // Determine real-world dimensions and paper type for accurate grid overlay
                let realWorldWidth: number | undefined = undefined;
                let realWorldHeight: number | undefined = undefined;
                let realWorldUnit: CustomUnit | undefined = undefined;
                let paperPresetType: string | undefined = undefined;

                let presetWidth: number | undefined = undefined;
                let presetHeight: number | undefined = undefined;
                let presetUnit: CustomUnit | undefined = undefined;

                if (selectedRatio) {
                    if (selectedRatio.unit === 'mm' && selectedRatio.mmWidth && selectedRatio.mmHeight) {
                        // Paper sizes - store real-world dimensions for grid calculation
                        realWorldWidth = selectedRatio.mmWidth;
                        realWorldHeight = selectedRatio.mmHeight;
                        realWorldUnit = 'mm' as CustomUnit;
                        paperPresetType = selectedRatio.preset as string;

                        // Also set as preset dimensions for UI display
                        presetWidth = selectedRatio.mmWidth;
                        presetHeight = selectedRatio.mmHeight;
                        presetUnit = 'mm' as CustomUnit;
                    } else {
                        // Ratio-based presets - no real dimensions, just ratio
                        realWorldWidth = undefined;
                        realWorldHeight = undefined;
                        realWorldUnit = undefined;
                        paperPresetType = selectedRatio.preset as string;

                        presetWidth = undefined;
                        presetHeight = undefined;
                        presetUnit = undefined;
                    }
                }

                // For CUSTOM preset, use user's input values
                if (selectedPreset === "CUSTOM" && customWidth && customHeight) {
                    realWorldWidth = customWidth;
                    realWorldHeight = customHeight;
                    realWorldUnit = customUnit;
                    paperPresetType = "CUSTOM";

                    presetWidth = customWidth;
                    presetHeight = customHeight;
                    presetUnit = customUnit;
                }

                // Dispatch image with complete metadata including real-world dimensions
                dispatch(setImage({
                    uri: asset.uri,
                    source: source,

                    // Internal dimensions (actual from image picker - always in pixels)
                    width: asset.width,
                    height: asset.height,
                    unit: 'px' as const,

                    // Real-world paper dimensions for grid calculation
                    realWorldWidth: realWorldWidth,
                    realWorldHeight: realWorldHeight,
                    realWorldUnit: realWorldUnit,
                    paperPresetType: paperPresetType as any,

                    // Preset dimensions (for UI display)
                    presetWidth: presetWidth,
                    presetHeight: presetHeight,
                    presetUnit: presetUnit,

                    // File metadata
                    format: extractImageFormat(asset.uri, asset.mimeType),
                    mimeType: asset.mimeType,
                    fileSize: asset.fileSize,
                    fileName: extractFileName(asset.uri || asset.fileName || 'unknown'),
                }));

                // Set original image ratio for editing
                if (asset.width && asset.height) {
                    dispatch(setOriginalImageRatio(asset.width / asset.height));
                }

                // ========================================
                // NEW: TRIGGER NAVIGATION/REDIRECT
                // ========================================
                // Call the callback to redirect to next page/tab
                if (onImageSelected) {
                    onImageSelected();
                }

                // Check if advanced cropping is needed
                const needsAdvancedCrop = onAdvancedCrop && !['SQUARE'].includes(selectedPreset);

                if (needsAdvancedCrop) {
                    onAdvancedCrop(asset.uri);
                } else {
                    onClose();
                }
            }
        } catch (error: any) {
            console.error(`${source} picker error:`, error);
            const errorMessage = error?.message || `Failed to access ${source}`;
            Alert.alert(`${source.charAt(0).toUpperCase() + source.slice(1)} Error`, errorMessage);
            dispatch(setImageError(errorMessage));
        } finally {
            setIsLoading(false);
            dispatch(setImageLoading(false));
        }
    };

    const handlePickCamera = () => pickImage('camera');
    const handlePickGallery = () => pickImage('gallery');

    const handleOpenImageSourceModal = () => {
        if (isContinueEnabled()) {
            setIsImageSourceModalVisible(true);
        }
    };

    const handleCloseSelectRatioModal = () => {
        if (!isLoading) {
            onClose();
        }
    };

    const handleCloseImageSourceModal = () => {
        if (!isLoading) {
            setIsImageSourceModalVisible(false);
        }
    };

    // ========================================
    // DISPLAY HELPERS
    // ========================================

    const getSelectedRatioDisplayText = () => {
        if (selectedPreset === "CUSTOM") {
            if (customWidth && customHeight) {
                return `Custom (${customWidth}×${customHeight}${customUnit})`;
            }
            return "Custom - Set dimensions";
        }
        if (selectedRatio) {
            if (selectedRatio.unit === 'mm' && selectedRatio.mmWidth && selectedRatio.mmHeight) {
                return `${selectedRatio.label} (${selectedRatio.mmWidth}×${selectedRatio.mmHeight}mm)`;
            } else {
                return `${selectedRatio.label} - ${selectedRatio.description}`;
            }
        }
        return 'Select Ratio';
    };

    // ========================================
    // RENDER METHODS
    // ========================================

    return (
        <View>
            {/* RATIO SELECTION MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isSelectRatioModalVisible}
                onRequestClose={handleCloseSelectRatioModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.headerTitle}>Select Aspect Ratio</Text>
                            <Text style={styles.headerSubtitle}>New Project</Text>
                            <Pressable onPress={handleCloseSelectRatioModal} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </Pressable>
                        </View>

                        {/* Ratio Picker Section */}
                        <View style={styles.pickerContainer}>
                            <Text style={styles.label}>Aspect Ratio</Text>

                            <Pressable
                                style={styles.pickerButton}
                                onPress={() => setShowRatioPicker(!showRatioPicker)}
                            >
                                <View style={styles.pickerButtonContent}>
                                    <Text style={styles.pickerButtonText}>
                                        {getSelectedRatioDisplayText()}
                                    </Text>
                                    <MaterialIcons
                                        name={showRatioPicker ? "expand-less" : "expand-more"}
                                        size={24}
                                        color="#007AFF"
                                    />
                                </View>
                            </Pressable>

                            {showRatioPicker && (
                                <View style={styles.dropdownContainer}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <Pressable
                                                key={ratio.preset}
                                                style={[
                                                    styles.dropdownItem,
                                                    selectedPreset === ratio.preset && styles.dropdownItemSelected
                                                ]}
                                                onPress={() => handleRatioChange(ratio.preset)}
                                            >
                                                <View style={styles.dropdownItemContent}>
                                                    <Text style={[
                                                        styles.dropdownItemLabel,
                                                        selectedPreset === ratio.preset && styles.dropdownItemLabelSelected
                                                    ]}>
                                                        {ratio.label}
                                                    </Text>
                                                    <Text style={[
                                                        styles.dropdownItemDesc,
                                                        selectedPreset === ratio.preset && styles.dropdownItemDescSelected
                                                    ]}>
                                                        {ratio.description}
                                                        {ratio.unit === 'mm' && ratio.mmWidth && ratio.mmHeight &&
                                                            ` • ${ratio.mmWidth}×${ratio.mmHeight}mm`
                                                        }
                                                    </Text>
                                                </View>
                                                {selectedPreset === ratio.preset && (
                                                    <MaterialIcons name="check" size={20} color="#007AFF" />
                                                )}
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Custom Dimensions Input */}
                        {selectedPreset === "CUSTOM" && (
                            <View style={styles.customDimensionsContainer}>
                                <Text style={styles.customLabel}>Custom Dimensions</Text>

                                <View style={styles.dimensionsRow}>
                                    <Text style={styles.sizeLabel}>Size:</Text>

                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            style={styles.dimensionInput}
                                            value={customWidthInput}
                                            onChangeText={handleCustomWidthChange}
                                            placeholder="Width"
                                            placeholderTextColor="#888"
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <Text style={styles.xText}>×</Text>

                                    <View style={styles.inputGroup}>
                                        <TextInput
                                            style={styles.dimensionInput}
                                            value={customHeightInput}
                                            onChangeText={handleCustomHeightChange}
                                            placeholder="Height"
                                            placeholderTextColor="#888"
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <Pressable
                                        style={styles.unitButton}
                                        onPress={() => setShowUnitPicker(!showUnitPicker)}
                                    >
                                        <Text style={styles.unitButtonText}>{customUnit}</Text>
                                        <MaterialIcons
                                            name={showUnitPicker ? "expand-less" : "expand-more"}
                                            size={16}
                                            color="#007AFF"
                                        />
                                    </Pressable>
                                </View>

                                {showUnitPicker && (
                                    <View style={styles.unitDropdown}>
                                        <ScrollView style={styles.unitScrollView} nestedScrollEnabled>
                                            {UNITS.map((unit) => (
                                                <Pressable
                                                    key={unit.value}
                                                    style={[
                                                        styles.unitItem,
                                                        customUnit === unit.value && styles.unitItemSelected
                                                    ]}
                                                    onPress={() => handleUnitChange(unit.value)}
                                                >
                                                    <Text style={[
                                                        styles.unitItemText,
                                                        customUnit === unit.value && styles.unitItemTextSelected
                                                    ]}>
                                                        {unit.label}
                                                    </Text>
                                                    {customUnit === unit.value && (
                                                        <MaterialIcons name="check" size={16} color="#007AFF" />
                                                    )}
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {customWidth && customHeight && (
                                    <View style={styles.calculatedRatioContainer}>
                                        <Text style={styles.calculatedRatioLabel}>Calculated Ratio:</Text>
                                        <Text style={styles.calculatedRatioValue}>
                                            {(customWidth / customHeight).toFixed(3)}:1
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Selected ratio display for non-custom ratios */}
                        {selectedRatio && selectedPreset !== "CUSTOM" && (
                            <View style={styles.selectedRatioDisplay}>
                                <MaterialIcons name="check" size={20} color="#007AFF" />
                                <Text style={styles.selectedRatioText}>
                                    Selected: {selectedRatio.label}
                                </Text>
                                <Text style={styles.selectedRatioDesc}>
                                    {selectedRatio.description}
                                </Text>
                            </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.actionContainer}>
                            <Pressable
                                style={[
                                    styles.openButton,
                                    !isContinueEnabled() && styles.openButtonDisabled
                                ]}
                                onPress={handleOpenImageSourceModal}
                                disabled={!isContinueEnabled()}
                            >
                                <Text style={[
                                    styles.openButtonText,
                                    !isContinueEnabled() && styles.openButtonTextDisabled
                                ]}>
                                    Continue
                                </Text>
                                <MaterialIcons
                                    name="arrow-forward"
                                    size={20}
                                    color={!isContinueEnabled() ? "#666" : "#000"}
                                />
                            </Pressable>
                        </View>

                        {/* Info footer */}
                        <View style={styles.infoFooter}>
                            <Text style={styles.infoText}>
                                Choose Your Preferred Aspect Ratio for Image Cropping
                            </Text>
                            <Text style={styles.infoText}>
                                Paper sizes are shown in millimeters (mm)
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* IMAGE SOURCE SELECTION MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isImageSourceModalVisible}
                onRequestClose={handleCloseImageSourceModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.uploadModalContent}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Select Image Source</Text>
                            <Pressable onPress={handleCloseImageSourceModal} disabled={isLoading}>
                                <MaterialIcons
                                    name="close"
                                    color={isLoading ? "#666" : "#fff"}
                                    size={22}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.ratioDisplayContainer}>
                            <View style={styles.ratioDisplay}>
                                <MaterialIcons name="crop" size={20} color="#007AFF" />
                                <Text style={styles.ratioDisplayText}>
                                    {selectedPreset === "CUSTOM" && customWidth && customHeight
                                        ? `Custom: ${customWidth}×${customHeight}${customUnit}`
                                        : selectedRatio?.unit === 'mm' && selectedRatio?.mmWidth && selectedRatio?.mmHeight
                                            ? `${selectedRatio?.label}: ${selectedRatio.mmWidth}×${selectedRatio.mmHeight}mm`
                                            : `Crop: ${selectedRatio?.label || 'Unknown'}`
                                    }
                                </Text>
                                {ratioValue && (
                                    <Text style={styles.ratioDisplayDescription}>
                                        Ratio: {ratioValue.toFixed(3)}:1
                                    </Text>
                                )}
                            </View>
                        </View>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading...</Text>
                            </View>
                        ) : (
                            <View style={styles.uploadOptions}>
                                <Pressable
                                    style={styles.sourceOptionButton}
                                    onPress={handlePickCamera}
                                    disabled={isLoading}
                                >
                                    <MaterialIcons name="photo-camera" size={28} color="#007AFF" />
                                    <Text style={styles.sourceOptionText}>Camera</Text>
                                    <Text style={styles.sourceOptionSubtext}>Take a photo</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.sourceOptionButton}
                                    onPress={handlePickGallery}
                                    disabled={isLoading}
                                >
                                    <MaterialIcons name="photo-library" size={28} color="#007AFF" />
                                    <Text style={styles.sourceOptionText}>Gallery</Text>
                                    <Text style={styles.sourceOptionSubtext}>Choose from device</Text>
                                </Pressable>
                            </View>
                        )}

                        <View style={styles.infoContainer}>
                            <Text style={styles.infoText}>
                                Built-in editing available • Max size: {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB
                            </Text>
                            <Text style={styles.infoText}>
                                Supported formats: JPEG, PNG, WebP
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ImageSourceOptions;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        maxHeight: '90%',
        width: '100%',
        backgroundColor: '#1a1d21',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#2a2d31',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3d41',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    headerSubtitle: {
        color: '#007AFF',
        fontSize: 12,
        fontWeight: '500',
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    closeButton: {
        padding: 4,
    },
    pickerContainer: {
        padding: 20,
        backgroundColor: "#1c1c1e",
        marginHorizontal: 16,
        marginVertical: 16,
        borderRadius: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 12,
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 8,
        backgroundColor: "#2c2c2e",
        overflow: "hidden",
    },
    pickerButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    pickerButtonText: {
        color: "#fff",
        fontSize: 16,
        flex: 1,
    },
    dropdownContainer: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 8,
        backgroundColor: "#2c2c2e",
        maxHeight: 300,
    },
    dropdownScroll: {
        maxHeight: 280,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    dropdownItemContent: {
        flex: 1,
    },
    dropdownItemLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownItemLabelSelected: {
        color: '#007AFF',
    },
    dropdownItemDesc: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 2,
    },
    dropdownItemDescSelected: {
        color: '#007AFF',
        opacity: 0.8,
    },
    customDimensionsContainer: {
        padding: 20,
        backgroundColor: "#1c1c1e",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#007AFF",
    },
    customLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#007AFF",
        marginBottom: 12,
    },
    dimensionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sizeLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    inputGroup: {
        flex: 1,
        marginHorizontal: 8,
    },
    dimensionInput: {
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 6,
        backgroundColor: "#2c2c2e",
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        textAlign: 'center',
    },
    xText: {
        color: '#fff',
        fontSize: 16,
        marginHorizontal: 8,
    },
    unitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 6,
        backgroundColor: "#2c2c2e",
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 60,
    },
    unitButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    unitDropdown: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 6,
        backgroundColor: "#2c2c2e",
        maxHeight: 120,
    },
    unitScrollView: {
        maxHeight: 100,
    },
    unitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    unitItemSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    unitItemText: {
        color: '#fff',
        fontSize: 14,
    },
    unitItemTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    calculatedRatioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#444',
    },
    calculatedRatioLabel: {
        color: '#aaa',
        fontSize: 12,
        marginRight: 8,
    },
    calculatedRatioValue: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    selectedRatioDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderTopWidth: 1,
        borderTopColor: '#3a3d41',
    },
    selectedRatioText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    selectedRatioDesc: {
        color: '#007AFF',
        fontSize: 12,
        marginLeft: 8,
        opacity: 0.8,
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingVertical: 13,
        borderTopWidth: 1,
        borderTopColor: '#3a3d41',
    },
    openButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    openButtonDisabled: {
        backgroundColor: '#333',
    },
    openButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    openButtonTextDisabled: {
        color: '#666',
    },
    infoFooter: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#2a2d31',
    },
    infoText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
        paddingBottom: 5,
    },
    uploadModalContent: {
        minHeight: '40%',
        width: '100%',
        backgroundColor: '#25292e',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
    },
    titleContainer: {
        height: 55,
        backgroundColor: '#464C55',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    ratioDisplayContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#464C55',
    },
    ratioDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    ratioDisplayText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    ratioDisplayDescription: {
        color: '#007AFF',
        fontSize: 12,
        marginLeft: 8,
        opacity: 0.8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    uploadOptions: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    sourceOptionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        paddingHorizontal: 16,
        borderRadius: 16,
        minWidth: 120,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    sourceOptionText: {
        marginTop: 2,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    sourceOptionSubtext: {
        color: '#aaa',
        fontSize: 9,
        textAlign: 'center',
    },
    infoContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#464C55',
    },
});
