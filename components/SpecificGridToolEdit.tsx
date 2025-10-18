import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, Dimensions, ScrollView,
    Pressable, TextInput
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store/store';
import { DimensionUnit } from '../app/store/slices/imageSlice';
import {
    setGridRows, setGridCols, setCellSize, setStrokeWidth, setStrokeColor,
    setShowLabels, setLabelStyle, setImageEffect,
    // NEW imports
    setGridMode, setGridCellDimensions, setGridCellWidth, setGridCellHeight,
    calculateGridFromCellSize, selectGridCellDimensionsInUnit,
    type CustomUnit
} from '../app/store/slices/imageEditSlice';

const { height: screenHeight } = Dimensions.get('window');

const LENGTH_UNITS = [
    { label: "mm", multiplier: 1 },
    { label: "cm", multiplier: 10 },
    { label: "m", multiplier: 1000 },
    { label: "inch", multiplier: 25.4 },
    { label: "ft", multiplier: 304.8 },
];

const EFFECT_OPTIONS = [
    { id: "none", label: "Normal" },
    { id: "grayscale", label: "Black & White" },
];

// Helper function to convert DimensionUnit to CustomUnit
function dimensionUnitToCustomUnit(unit?: DimensionUnit): CustomUnit {
    if (!unit) return "mm"; // default fallback
    if (unit === "px") return "mm"; // map pixels to mm for grid usage
    return unit as CustomUnit;
}

// Helper function to safely convert realWorldUnit to CustomUnit
function safeConvertToCustomUnit(unit?: DimensionUnit): CustomUnit | undefined {
    if (!unit) return undefined;
    if (unit === "px") return "mm"; // Convert px to mm for grid calculations
    return unit as CustomUnit;
}

const effectReduxValue = (id: string) => {
    switch (id) {
        case "none":
            return "none";
        case "grayscale":
            return "grayscale";
        default:
            return "none";
    }
};

interface SpecificGridToolEditProps {
    selectedTool?: string | null;
    isVisible?: boolean;
    onClose?: () => void;
}

const SpecificGridToolEdit: React.FC<SpecificGridToolEditProps> = ({
    selectedTool,
    isVisible = false,
    onClose
}) => {
    const dispatch = useDispatch();

    // Get the image unit and safely convert it to CustomUnit for initial display unit
    const imageUnit = useSelector((state: RootState) => state.image.unit);
    const [displayUnit, setDisplayUnit] = useState<CustomUnit>(() => dimensionUnitToCustomUnit(imageUnit));
    const [showDropdown, setShowDropdown] = useState(false);

    // Get grid configuration from Redux
    const gridConfig = useSelector((state: RootState) => ({
        rows: state.imageEdit.gridRows,
        cols: state.imageEdit.gridCols,
        cellSize: state.imageEdit.cellSize,
        strokeWidth: state.imageEdit.strokeWidth,
        strokeColor: state.imageEdit.strokeColor,
        showLabels: state.imageEdit.showLabels,
        labelStyle: state.imageEdit.labelStyle,
        imageEffect: state.imageEdit.imageEffect,
    }));

    // Get image dimensions for auto-calculation with proper type conversion
    const imageData = useSelector((state: RootState) => ({
        width: state.image.width,
        height: state.image.height,
        realWorldWidth: state.image.realWorldWidth,
        realWorldHeight: state.image.realWorldHeight,
        realWorldUnit: safeConvertToCustomUnit(state.image.realWorldUnit),
    }));

    // Get grid cell dimensions in display unit
    const gridCellDims = useSelector((state: RootState) =>
        selectGridCellDimensionsInUnit(state, displayUnit)
    );

    const [widthInput, setWidthInput] = useState('');
    const [heightInput, setHeightInput] = useState('');

    // Update input fields when grid dimensions change or unit changes
    useEffect(() => {
        setWidthInput(gridCellDims.width.toFixed(2));
        setHeightInput(gridCellDims.height.toFixed(2));
    }, [gridCellDims.width, gridCellDims.height, displayUnit]);

    // Auto-calculate grid when cell dimensions or image changes
    useEffect(() => {
        if (imageData.width && imageData.height) {
            dispatch(calculateGridFromCellSize({
                imageWidth: imageData.width,
                imageHeight: imageData.height,
                realWorldWidth: imageData.realWorldWidth,
                realWorldHeight: imageData.realWorldHeight,
                realWorldUnit: imageData.realWorldUnit,
            }));
        }
    }, [
        gridCellDims.width,
        gridCellDims.height,
        imageData.width,
        imageData.height,
        imageData.realWorldWidth,
        imageData.realWorldHeight,
        dispatch
    ]);

    if (!isVisible || !selectedTool) return null;

    const handleClose = () => {
        setShowDropdown(false);
        onClose?.();
    };

    const handleApply = () => {
        handleClose();
    };

    const handleModeChange = (mode: "default" | "advanced") => {
        dispatch(setGridMode(mode));
        if (mode === "default") {
            setWidthInput("2.00"); // 2 cm default
            setHeightInput("2.00");
            setDisplayUnit("cm");
        }
    };

    const handleWidthChange = (text: string) => {
        setWidthInput(text);
        const value = parseFloat(text);
        if (!isNaN(value) && value > 0) {
            dispatch(setGridCellWidth({ width: value, unit: displayUnit }));
        }
    };

    const handleHeightChange = (text: string) => {
        setHeightInput(text);
        const value = parseFloat(text);
        if (!isNaN(value) && value > 0) {
            dispatch(setGridCellHeight({ height: value, unit: displayUnit }));
        }
    };

    const handleUnitChange = (unit: string) => {
        setDisplayUnit(unit as CustomUnit);
        setShowDropdown(false);
    };

    const renderFrameSettings = () => (
        <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Frame Settings</Text>

            {/* Mode Selection */}
            <View style={styles.pickerContainer}>
                <Text style={styles.label}>Grid Cell Size Mode</Text>
                <View style={styles.modeButtonsContainer}>
                    <Pressable
                        style={[
                            styles.modeButton,
                            gridCellDims.mode === 'default' && styles.modeButtonActive,
                        ]}
                        onPress={() => handleModeChange("default")}
                    >
                        <Text style={[
                            styles.modeButtonText,
                            gridCellDims.mode === 'default' && styles.modeButtonTextActive,
                        ]}>Default</Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.modeButton,
                            gridCellDims.mode === 'advanced' && styles.modeButtonActive,
                        ]}
                        onPress={() => handleModeChange("advanced")}
                    >
                        <Text style={[
                            styles.modeButtonText,
                            gridCellDims.mode === 'advanced' && styles.modeButtonTextActive,
                        ]}>Advanced</Text>
                    </Pressable>
                </View>
            </View>

            {/* Default Mode Display */}
            {gridCellDims.mode === 'default' && (
                <View style={styles.defaultSizeContainer}>
                    <View style={styles.defaultSizeDisplay}>
                        <MaterialIcons name="info" size={20} color="#007AFF" />
                        <View style={styles.defaultSizeTextContainer}>
                            <Text style={styles.defaultSizeText}>
                                Default cell size: 2×2 cm
                            </Text>
                            <Text style={styles.defaultSizeSubtext}>
                                Grid cells will be 2cm × 2cm squares
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Advanced Mode Input */}
            {gridCellDims.mode === 'advanced' && (
                <View style={styles.customInputContainer}>
                    <Text style={styles.customLabel}>Custom Cell Dimensions</Text>
                    <View style={styles.dimensionsRow}>
                        <Text style={styles.sizeLabel}>Size:</Text>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.dimensionInput}
                                placeholder="Width"
                                keyboardType="numeric"
                                value={widthInput}
                                onChangeText={handleWidthChange}
                                maxLength={8}
                                placeholderTextColor="#888"
                            />
                        </View>
                        <Text style={styles.xText}>×</Text>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.dimensionInput}
                                placeholder="Height"
                                keyboardType="numeric"
                                value={heightInput}
                                onChangeText={handleHeightChange}
                                maxLength={8}
                                placeholderTextColor="#888"
                            />
                        </View>
                        <Pressable
                            style={styles.unitButton}
                            onPress={() => setShowDropdown(!showDropdown)}
                        >
                            <Text style={styles.unitButtonText}>{displayUnit}</Text>
                            <MaterialIcons
                                name={showDropdown ? "expand-less" : "expand-more"}
                                size={16}
                                color="#007AFF"
                            />
                        </Pressable>
                    </View>

                    {/* Unit Dropdown */}
                    {showDropdown && (
                        <View style={styles.dropdownContainer}>
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                {LENGTH_UNITS.map(unit => (
                                    <Pressable
                                        key={unit.label}
                                        style={[
                                            styles.dropdownItem,
                                            displayUnit === unit.label && styles.dropdownItemSelected
                                        ]}
                                        onPress={() => handleUnitChange(unit.label)}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            displayUnit === unit.label && styles.dropdownItemTextSelected
                                        ]}>
                                            {unit.label}
                                        </Text>
                                        {displayUnit === unit.label && (
                                            <MaterialIcons name="check" size={16} color="#007AFF" />
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Grid Preview */}
                    <View style={styles.gridPreview}>
                        <Text style={styles.gridPreviewText}>
                            Grid: {gridConfig.rows}×{gridConfig.cols} cells
                        </Text>
                        <Text style={styles.gridPreviewSubtext}>
                            Total: {gridConfig.rows * gridConfig.cols} cells
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    const renderToolContent = () => {
        switch (selectedTool) {
            case 'frame':
                return renderFrameSettings();

            case 'stroke':
                return (
                    <View style={styles.toolContent}>
                        <Text style={styles.toolTitle}>Stroke Settings</Text>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Stroke Width (mm)</Text>
                            <TextInput
                                style={styles.numberInput}
                                keyboardType="numeric"
                                value={String(gridConfig.strokeWidth)}
                                onChangeText={v =>
                                    dispatch(setStrokeWidth(Math.max(0.5, parseFloat(v) || 0.5)))
                                }
                                maxLength={3}
                            />
                        </View>
                        <View style={styles.optionSection}>
                            <Text style={styles.sectionTitle}>Stroke Color</Text>
                            <View style={styles.colorGrid}>
                                {[
                                    '#FFFFFF', '#000000', '#8E8E93', '#34C759',
                                    '#007AFF', '#FF3B30', '#FF9500', '#FFCC00',
                                    '#AF52DE', '#FF2D92', '#5AC8FA', '#32D74B'
                                ].map((color) => (
                                    <Pressable
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            gridConfig.strokeColor === color && styles.colorOptionSelected
                                        ]}
                                        onPress={() => dispatch(setStrokeColor(color))}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 'fx':
                return (
                    <View style={styles.toolContent}>
                        <Text style={styles.toolTitle}>Effects</Text>
                        <View style={styles.effectOptionGroup}>
                            {EFFECT_OPTIONS.map(option => (
                                <Pressable
                                    key={option.id}
                                    style={[
                                        styles.effectRadioRow,
                                        effectReduxValue(option.id) === gridConfig.imageEffect && styles.effectRadioRowSelected,
                                    ]}
                                    onPress={() => dispatch(setImageEffect(effectReduxValue(option.id) as any))}
                                >
                                    <View style={[
                                        styles.radioOuter,
                                        effectReduxValue(option.id) === gridConfig.imageEffect && styles.radioOuterSelected,
                                    ]}>
                                        {effectReduxValue(option.id) === gridConfig.imageEffect && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.effectRadioLabel,
                                        effectReduxValue(option.id) === gridConfig.imageEffect && styles.effectRadioLabelSelected
                                    ]}>{option.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                );

            default:
                return (
                    <View style={styles.toolContent}>
                        <Text style={styles.toolTitle}>Select a Tool to Edit</Text>
                    </View>
                );
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                {renderToolContent()}
            </ScrollView>
            <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <MaterialIcons name="close" size={22} color="#FF3B30" />
                    <Text style={styles.cancelText}>Close</Text>
                </Pressable>
                <Pressable style={styles.applyButton} onPress={handleApply}>
                    <MaterialIcons name="check" size={22} color="#34C759" />
                    <Text style={styles.applyText}>Done</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default SpecificGridToolEdit;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a1d21',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        width: '100%',
        minHeight: 400,
    },
    scrollContainer: {
        flex: 1
    },
    toolContent: {
        padding: 20
    },
    toolTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center'
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputLabel: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    numberInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#2c2c2e',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#444',
        color: '#FFFFFF',
        paddingHorizontal: 12,
        fontSize: 16,
    },
    // Picker Container Styles
    pickerContainer: {
        padding: 16,
        backgroundColor: "#1c1c1e",
        marginBottom: 16,
        borderRadius: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 12,
    },
    modeButtonsContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 8,
        backgroundColor: "#2c2c2e",
        overflow: 'hidden',
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    modeButtonActive: {
        backgroundColor: '#007AFF',
    },
    modeButtonText: {
        color: '#AAA',
        fontSize: 16,
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    // Default Size Display
    defaultSizeContainer: {
        marginBottom: 16,
    },
    defaultSizeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    defaultSizeTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    defaultSizeText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    defaultSizeSubtext: {
        color: '#8E8E93',
        fontSize: 12,
    },
    // Custom Input Container
    customInputContainer: {
        padding: 16,
        backgroundColor: "#1c1c1e",
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
        marginBottom: 8,
    },
    sizeLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        minWidth: 35,
    },
    inputGroup: {
        flex: 1,
        marginHorizontal: 6,
    },
    dimensionInput: {
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 6,
        backgroundColor: "#2c2c2e",
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
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
        paddingVertical: 10,
        minWidth: 70,
    },
    unitButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    // Dropdown Styles
    dropdownContainer: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: "#444",
        borderRadius: 8,
        backgroundColor: "#2c2c2e",
        maxHeight: 200,
    },
    dropdownScroll: {
        maxHeight: 180,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    dropdownItemText: {
        color: '#fff',
        fontSize: 16,
    },
    dropdownItemTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    // Grid Preview
    gridPreview: {
        marginTop: 12,
        padding: 12,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 8,
        alignItems: 'center',
    },
    gridPreviewText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    gridPreviewSubtext: {
        color: '#8E8E93',
        fontSize: 12,
    },
    // Other sections
    optionSection: {
        marginTop: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    colorOptionSelected: {
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },
    effectOptionGroup: {
        marginVertical: 24,
        gap: 16
    },
    effectRadioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        marginBottom: 8,
    },
    effectRadioRowSelected: {
        backgroundColor: '#2526FF14',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#BBBBBB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: 'transparent',
    },
    radioOuterSelected: {
        borderColor: '#34C759',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
    },
    effectRadioLabel: {
        fontSize: 16,
        color: '#cccccc',
        fontWeight: '500',
    },
    effectRadioLabelSelected: {
        color: '#34C759',
        fontWeight: '700',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 16,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#2a2d31',
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    cancelText: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '500',
    },
    applyButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.3)',
    },
    applyText: {
        fontSize: 16,
        color: '#34C759',
        fontWeight: '600',
    },
});
