import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    resetAllEdits,
    setPaperPresetType,
    type PaperPreset
} from '../app/store/slices/imageEditSlice';
import { setImage, setImageError, setImageLoading } from '../app/store/slices/imageSlice';
import type { RootState } from '../app/store/store';


// ========================================
// TYPE DEFINITIONS & CONSTANTS
// ========================================


export type AspectRatio = {
    label: string;
    preset: PaperPreset;
    description: string;
    cmWidth: number;
    cmHeight: number;
};


// A0 to A5 presets + Custom option
const ASPECT_RATIOS: AspectRatio[] = [
    {
        label: "A0",
        preset: "A0",
        description: "84.1×118.9 cm • Large Poster",
        cmWidth: 84.1,
        cmHeight: 118.9
    },
    {
        label: "A1",
        preset: "A1",
        description: "59.4×84.1 cm • Poster",
        cmWidth: 59.4,
        cmHeight: 84.1
    },
    {
        label: "A2",
        preset: "A2",
        description: "42.0×59.4 cm • Medium Poster",
        cmWidth: 42.0,
        cmHeight: 59.4
    },
    {
        label: "A3",
        preset: "A3",
        description: "29.7×42.0 cm • Small Poster",
        cmWidth: 29.7,
        cmHeight: 42.0
    },
    {
        label: "A4",
        preset: "A4",
        description: "21.0×29.7 cm • Standard Document",
        cmWidth: 21.0,
        cmHeight: 29.7
    },
    {
        label: "A5",
        preset: "A5",
        description: "14.8×21.0 cm • Small Document",
        cmWidth: 14.8,
        cmHeight: 21.0
    },
    {
        label: "Custom",
        preset: "CUSTOM",
        description: "Set your own dimensions",
        cmWidth: 21.0,
        cmHeight: 29.7
    },
];


type Props = {
    isSelectRatioModalVisible: boolean;
    onClose: () => void;
    onAdvancedCrop?: (uri: string) => void;
    onImageSelected?: () => void;
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


const validateCustomDimensions = (
    width: string,
    height: string
): { isValid: boolean; error?: string } => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h)) {
        return { isValid: false, error: "Please enter valid numbers for width and height" };
    }

    if (w <= 0 || h <= 0) {
        return { isValid: false, error: "Width and height must be greater than 0" };
    }

    if (w > 1000 || h > 1000) {
        return { isValid: false, error: "Dimensions cannot exceed 1000 cm" };
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
    const [showPaperPicker, setShowPaperPicker] = useState<boolean>(false);
    const [customWidth, setCustomWidth] = useState<string>('21.0');
    const [customHeight, setCustomHeight] = useState<string>('29.7');
    const [customDimensionError, setCustomDimensionError] = useState<string>('');


    const dispatch = useDispatch();


    const selectedPreset = useSelector((state: RootState) => state.imageEdit.paperPresetType);
    const selectedPaper = ASPECT_RATIOS.find(paper => paper.preset === selectedPreset);


    // ========================================
    // EFFECT HOOKS
    // ========================================


    useEffect(() => {
        if (!isSelectRatioModalVisible) {
            setIsLoading(false);
            setIsImageSourceModalVisible(false);
            setShowPaperPicker(false);
            setCustomDimensionError('');
        }
    }, [isSelectRatioModalVisible]);


    // ========================================
    // EVENT HANDLERS
    // ========================================


    const handlePaperChange = (preset: PaperPreset) => {
        setCustomDimensionError('');
        dispatch(setPaperPresetType(preset));
        setShowPaperPicker(false);
    };


    const isContinueEnabled = () => {
        if (!selectedPaper) return false;

        // If custom selected, validate dimensions
        if (selectedPreset === "CUSTOM") {
            const validation = validateCustomDimensions(customWidth, customHeight);
            return validation.isValid;
        }

        return true;
    };


    const getSelectedPaperDisplayText = () => {
        if (selectedPaper) {
            if (selectedPreset === "CUSTOM") {
                const w = parseFloat(customWidth) || 21.0;
                const h = parseFloat(customHeight) || 29.7;
                return `Custom (${w}×${h} cm)`;
            }
            return `${selectedPaper.label} (${selectedPaper.cmWidth}×${selectedPaper.cmHeight} cm)`;
        }
        return 'Select Paper Size';
    };


    const getAspectRatioForPicker = (): [number, number] => {
        if (selectedPreset === "CUSTOM") {
            const w = parseFloat(customWidth) || 21.0;
            const h = parseFloat(customHeight) || 29.7;
            return [w, h];
        }
        if (selectedPaper) {
            return [selectedPaper.cmWidth, selectedPaper.cmHeight];
        }
        return [21.0, 29.7]; // Default A4
    };


    const handleCustomWidthChange = (text: string) => {
        setCustomWidth(text);
        setCustomDimensionError('');
    };


    const handleCustomHeightChange = (text: string) => {
        setCustomHeight(text);
        setCustomDimensionError('');
    };


    // ========================================
    // IMAGE PICKING & PROCESSING
    // ========================================


    const pickImage = async (source: 'camera' | 'gallery') => {
        if (!isContinueEnabled()) {
            Alert.alert('Error', 'Please select a paper size or set valid custom dimensions');
            return;
        }

        // Validate custom dimensions if needed
        if (selectedPreset === "CUSTOM") {
            const validation = validateCustomDimensions(customWidth, customHeight);
            if (!validation.isValid) {
                setCustomDimensionError(validation.error || 'Invalid dimensions');
                Alert.alert('Invalid Dimensions', validation.error || 'Please enter valid dimensions');
                return;
            }
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
                    aspect: aspectRatio,
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
                    aspect: aspectRatio,
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

                // Reset store to default values
                dispatch(resetAllEdits());

                // Set real-world dimensions
                let realWorldWidth: number;
                let realWorldHeight: number;

                if (selectedPreset === "CUSTOM") {
                    realWorldWidth = parseFloat(customWidth) || 21.0;
                    realWorldHeight = parseFloat(customHeight) || 29.7;
                } else {
                    realWorldWidth = selectedPaper?.cmWidth || 21.0;
                    realWorldHeight = selectedPaper?.cmHeight || 29.7;
                }

                // Dispatch image with complete metadata
                dispatch(setImage({
                    uri: asset.uri,
                    source: source,

                    width: asset.width,
                    height: asset.height,
                    unit: 'px',

                    realWorldWidth: realWorldWidth,
                    realWorldHeight: realWorldHeight,
                    realWorldUnit: 'cm',
                    paperPresetType: selectedPreset,

                    presetWidth: realWorldWidth,
                    presetHeight: realWorldHeight,
                    presetUnit: 'cm',

                    format: extractImageFormat(asset.uri, asset.mimeType),
                    mimeType: asset.mimeType,
                    fileSize: asset.fileSize,
                    fileName: extractFileName(asset.uri || asset.fileName || 'unknown'),
                }));

                if (onImageSelected) {
                    onImageSelected();
                }

                // Optional: trigger advanced crop for non-A4 sizes
                const needsAdvancedCrop = onAdvancedCrop && selectedPaper?.preset !== 'A4';

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
    // RENDER METHODS
    // ========================================


    return (
        <View>
            {/* PAPER SIZE SELECTION MODAL */}
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
                            <Text style={styles.headerTitle}>Select Paper Size</Text>
                            <Text style={styles.headerSubtitle}>New Project</Text>
                            <Pressable onPress={handleCloseSelectRatioModal} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </Pressable>
                        </View>


                        <ScrollView keyboardShouldPersistTaps="handled">
                            {/* Paper Size Picker Section */}
                            <View style={styles.pickerContainer}>
                                <Text style={styles.label}>Paper Size (cm)</Text>

                                <Pressable
                                    style={styles.pickerButton}
                                    onPress={() => setShowPaperPicker(!showPaperPicker)}
                                >
                                    <View style={styles.pickerButtonContent}>
                                        <Text style={styles.pickerButtonText}>
                                            {getSelectedPaperDisplayText()}
                                        </Text>
                                        <MaterialIcons
                                            name={showPaperPicker ? "expand-less" : "expand-more"}
                                            size={24}
                                            color="#007AFF"
                                        />
                                    </View>
                                </Pressable>

                                {showPaperPicker && (
                                    <View style={styles.dropdownContainer}>
                                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                            {ASPECT_RATIOS.map((paper) => (
                                                <Pressable
                                                    key={paper.preset}
                                                    style={[
                                                        styles.dropdownItem,
                                                        selectedPreset === paper.preset && styles.dropdownItemSelected
                                                    ]}
                                                    onPress={() => handlePaperChange(paper.preset)}
                                                >
                                                    <View style={styles.dropdownItemContent}>
                                                        <Text style={[
                                                            styles.dropdownItemLabel,
                                                            selectedPreset === paper.preset && styles.dropdownItemLabelSelected
                                                        ]}>
                                                            {paper.label}
                                                        </Text>
                                                        <Text style={[
                                                            styles.dropdownItemDesc,
                                                            selectedPreset === paper.preset && styles.dropdownItemDescSelected
                                                        ]}>
                                                            {paper.description}
                                                        </Text>
                                                    </View>
                                                    {selectedPreset === paper.preset && (
                                                        <MaterialIcons name="check" size={20} color="#007AFF" />
                                                    )}
                                                </Pressable>
                                            ))}
                                        </ScrollView>

                                        {/* Custom input fields for custom selection */}
                                        {selectedPreset === "CUSTOM" && (
                                            <View style={styles.customInputFields}>
                                                <Text style={styles.customInputsLabel}>Enter Custom Dimensions</Text>

                                                <View style={styles.customInputRow}>
                                                    <Text style={styles.customInputLabel}>Width (cm):</Text>
                                                    <TextInput
                                                        style={styles.customInput}
                                                        keyboardType="decimal-pad"
                                                        value={customWidth}
                                                        onChangeText={handleCustomWidthChange}
                                                        placeholder="Width"
                                                        maxLength={8}
                                                        placeholderTextColor="#888"
                                                    />
                                                </View>

                                                <View style={styles.customInputRow}>
                                                    <Text style={styles.customInputLabel}>Height (cm):</Text>
                                                    <TextInput
                                                        style={styles.customInput}
                                                        keyboardType="decimal-pad"
                                                        value={customHeight}
                                                        onChangeText={handleCustomHeightChange}
                                                        placeholder="Height"
                                                        maxLength={8}
                                                        placeholderTextColor="#888"
                                                    />
                                                </View>

                                                {customDimensionError ? (
                                                    <View style={styles.errorContainer}>
                                                        <MaterialIcons name="error" size={16} color="#FF3B30" />
                                                        <Text style={styles.errorText}>{customDimensionError}</Text>
                                                    </View>
                                                ) : null}

                                                <Text style={styles.customInputHint}>
                                                    • Max dimensions: 1000×1000 cm
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Selected paper display */}
                        {selectedPaper && (
                            <View style={styles.selectedRatioDisplay}>
                                <MaterialIcons name="check-circle" size={20} color="#007AFF" />
                                <View style={styles.selectedRatioTextContainer}>
                                    <Text style={styles.selectedRatioText}>
                                        Selected: {selectedPaper.label}
                                    </Text>
                                    <Text style={styles.selectedRatioDesc}>
                                        {selectedPreset === "CUSTOM"
                                            ? `${parseFloat(customWidth) || 21.0}×${parseFloat(customHeight) || 29.7} cm`
                                            : selectedPaper.description
                                        }
                                    </Text>
                                </View>
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
                                Choose Your Paper Size for Image Grid Overlay
                            </Text>
                            <Text style={styles.infoText}>
                                All sizes in centimeters (cm)
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
                                    {selectedPaper
                                        ? (selectedPreset === "CUSTOM"
                                            ? `Custom: ${parseFloat(customWidth) || 21.0}×${parseFloat(customHeight) || 29.7} cm`
                                            : `${selectedPaper.label}: ${selectedPaper.cmWidth}×${selectedPaper.cmHeight} cm`
                                        )
                                        : 'No paper size selected'
                                    }
                                </Text>
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
        // position: 'relative',
        marginTop: 4,
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 8,
        backgroundColor: "#2c2c2e",
        maxHeight: 350,
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
    customInputFields: {
        // position: 'absolute',
        // top: 0,
        // left: 0,
        // right: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#444',
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    customInputsLabel: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    customInputLabel: {
        width: 90,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    customInput: {
        flex: 1,
        height: 38,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
        color: '#fff',
        fontSize: 16,
        backgroundColor: "#2c2c2e",
        paddingHorizontal: 12,
    },
    customInputHint: {
        color: '#888',
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 8,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
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
    selectedRatioTextContainer: {
        marginLeft: 8,
        flex: 1,
    },
    selectedRatioText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedRatioDesc: {
        color: '#007AFF',
        fontSize: 12,
        marginTop: 2,
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