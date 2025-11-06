import React, { useEffect, useState, useMemo } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    Pressable, TextInput
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store/store';
import {
    setStrokeWidth, setStrokeColor,
    setShowLabels, setLabelStyle, setImageEffect,
    setGridMode, setGridCellWidth, setGridCellHeight,
    selectGridCellDimensions, selectPaperSize,
} from '../app/store/slices/imageEditSlice';

const EFFECT_OPTIONS = [
    { id: "none", label: "Normal", description: "Original image colors" },
    { id: "grayscale", label: "Black & White", description: "Convert to grayscale" },
];

const STROKE_WIDTH_MIN = 1;
const STROKE_WIDTH_MAX = 5;

const PREDEFINED_COLORS = [
    '#FFFFFF', '#000000', '#8E8E93', '#34C759',
    '#007AFF', '#FF3B30', '#FF9500', '#FFCC00',
    '#AF52DE', '#FF2D92', '#5AC8FA', '#32D74B',
    '#A2845E', '#FF5AC2', '#00B8E6', '#FFB84D'
];

const effectReduxValue = (id: string) => {
    switch (id) {
        case "none": return "none";
        case "grayscale": return "grayscale";
        default: return "none";
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

    const gridConfig = useSelector((state: RootState) => ({
        strokeWidth: state.imageEdit.strokeWidth,
        strokeColor: state.imageEdit.strokeColor,
        showLabels: state.imageEdit.showLabels,
        labelStyle: state.imageEdit.labelStyle,
        imageEffect: state.imageEdit.imageEffect,
    }));

    const imageData = useSelector((state: RootState) => ({
        realWorldWidth: state.image.realWorldWidth,
        realWorldHeight: state.image.realWorldHeight,
    }));

    const gridCellDims = useSelector((state: RootState) =>
        selectGridCellDimensions(state)
    );

    const paperSize = useSelector((state: RootState) =>
        selectPaperSize(state)
    );

    const [widthInput, setWidthInput] = useState('');
    const [heightInput, setHeightInput] = useState('');
    const [strokeWidthInput, setStrokeWidthInput] = useState(gridConfig.strokeWidth.toFixed(1));

    useEffect(() => {
        setWidthInput(gridCellDims.width.toFixed(2));
        setHeightInput(gridCellDims.height.toFixed(2));
    }, [gridCellDims.width, gridCellDims.height]);

    useEffect(() => {
        setStrokeWidthInput(gridConfig.strokeWidth.toFixed(1));
    }, [gridConfig.strokeWidth]);

    const calculatedGrid = useMemo(() => {
        if (!imageData.realWorldWidth || !imageData.realWorldHeight || !paperSize.width || !paperSize.height) {
            return { rows: 0, cols: 0 };
        }
        const cols = Math.floor(paperSize.width / gridCellDims.width);
        const rows = Math.floor(paperSize.height / gridCellDims.height);
        return { rows: Math.max(0, rows), cols: Math.max(0, cols) };
    }, [
        gridCellDims.width,
        gridCellDims.height,
        imageData.realWorldWidth,
        imageData.realWorldHeight,
        paperSize.width,
        paperSize.height,
    ]);

    if (!isVisible || !selectedTool) return null;

    const handleClose = () => {
        onClose?.();
    };

    const handleApply = () => {
        handleClose();
    };

    const handleModeChange = (mode: "default" | "advanced") => {
        dispatch(setGridMode(mode));
        if (mode === "default") {
            setWidthInput("2.00");
            setHeightInput("2.00");
        }
    };

    const handleWidthChange = (text: string) => {
        setWidthInput(text);
        const value = parseFloat(text);
        if (!isNaN(value) && value > 0) {
            dispatch(setGridCellWidth(value));
        }
    };

    const handleHeightChange = (text: string) => {
        setHeightInput(text);
        const value = parseFloat(text);
        if (!isNaN(value) && value > 0) {
            dispatch(setGridCellHeight(value));
        }
    };

    const handleStrokeWidthInput = (text: string) => {
        const clean = text.replace(/[^0-9.]/g, '').replace(/^(\d*\.\d{0,1}).*$/, '$1');
        setStrokeWidthInput(clean);
        let val = parseFloat(clean);
        if (isNaN(val)) val = STROKE_WIDTH_MIN;
        if (val < STROKE_WIDTH_MIN) val = STROKE_WIDTH_MIN;
        if (val > STROKE_WIDTH_MAX) val = STROKE_WIDTH_MAX;
        dispatch(setStrokeWidth(val));
    };

    const renderStrokeSettings = () => (
        <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Stroke Settings</Text>
            <View style={styles.strokeWidthInputRow}>
                <Text style={styles.inputLabel}>Stroke Width (mm)</Text>
                <TextInput
                    style={styles.strokeWidthInput}
                    keyboardType="decimal-pad"
                    value={strokeWidthInput}
                    onChangeText={handleStrokeWidthInput}
                    maxLength={4}
                    placeholder="1.0"
                    placeholderTextColor="#888"
                />
                <Text style={styles.strokeWidthInputUnit}>mm</Text>
            </View>
            <View style={styles.strokePreviewContainer}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View
                    style={[
                        styles.strokePreview,
                        {
                            height: parseFloat(strokeWidthInput) * 2 || 2,
                            backgroundColor: gridConfig.strokeColor,
                        }
                    ]}
                />
            </View>
            <View style={styles.optionSection}>
                <Text style={styles.sectionTitle}>Stroke Color</Text>
                <View style={styles.colorGrid}>
                    {PREDEFINED_COLORS.map((color) => (
                        <Pressable
                            key={color}
                            style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                gridConfig.strokeColor === color && styles.colorOptionSelected
                            ]}
                            onPress={() => dispatch(setStrokeColor(color))}
                        >
                            {gridConfig.strokeColor === color && (
                                <MaterialIcons name="check" size={20} color={color === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
                            )}
                        </Pressable>
                    ))}
                </View>
                <View style={styles.customColorInfo}>
                    <MaterialIcons name="info" size={16} color="#007AFF" />
                    <Text style={styles.customColorInfoText}>
                        Current color: {gridConfig.strokeColor}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderFrameSettings = () => (
        <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Frame Settings</Text>

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

                    {calculatedGrid.rows > 0 && calculatedGrid.cols > 0 && (
                        <View style={styles.gridPreview}>
                            <Text style={styles.gridPreviewText}>
                                Grid: {calculatedGrid.rows}×{calculatedGrid.cols} cells
                            </Text>
                            <Text style={styles.gridPreviewSubtext}>
                                Total: {calculatedGrid.rows * calculatedGrid.cols} cells
                            </Text>
                        </View>
                    )}

                    {paperSize && (
                        <View style={styles.paperInfoContainer}>
                            <Text style={styles.paperInfoLabel}>
                                Paper: {paperSize.preset}
                            </Text>
                            <Text style={styles.paperInfoValue}>
                                {paperSize.width}×{paperSize.height} cm
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {gridCellDims.mode === 'advanced' && (
                <View style={styles.customInputContainer}>
                    <Text style={styles.customLabel}>Custom Cell Dimensions (cm)</Text>
                    <View style={styles.dimensionsRow}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabelSmall}>Width</Text>
                            <TextInput
                                style={styles.dimensionInput}
                                placeholder="Width"
                                keyboardType="decimal-pad"
                                value={widthInput}
                                onChangeText={handleWidthChange}
                                maxLength={8}
                                placeholderTextColor="#888"
                            />
                        </View>
                        <Text style={styles.xText}>×</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabelSmall}>Height</Text>
                            <TextInput
                                style={styles.dimensionInput}
                                placeholder="Height"
                                keyboardType="decimal-pad"
                                value={heightInput}
                                onChangeText={handleHeightChange}
                                maxLength={8}
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.unitDisplay}>
                            <Text style={styles.unitDisplayText}>cm</Text>
                        </View>
                    </View>

                    {calculatedGrid.rows > 0 && calculatedGrid.cols > 0 && (
                        <View style={styles.gridPreview}>
                            <Text style={styles.gridPreviewText}>
                                Grid: {calculatedGrid.rows}×{calculatedGrid.cols} cells
                            </Text>
                            <Text style={styles.gridPreviewSubtext}>
                                Total: {calculatedGrid.rows * calculatedGrid.cols} cells
                            </Text>
                            <Text style={styles.gridPreviewSubtext}>
                                Cell: {widthInput}×{heightInput} cm
                            </Text>
                        </View>
                    )}

                    {paperSize && (
                        <View style={styles.paperInfoContainer}>
                            <Text style={styles.paperInfoLabel}>
                                Paper: {paperSize.preset}
                            </Text>
                            <Text style={styles.paperInfoValue}>
                                {paperSize.width}×{paperSize.height} cm
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {(!paperSize.isValid || !imageData.realWorldWidth || !imageData.realWorldHeight) && (
                <View style={styles.warningContainer}>
                    <MaterialIcons name="warning" size={20} color="#FF9500" />
                    <Text style={styles.warningText}>
                        Paper dimensions not set. Grid calculation unavailable.
                    </Text>
                </View>
            )}
        </View>
    );

    const renderToolContent = () => {
        switch (selectedTool) {
            case 'frame': return renderFrameSettings();
            case 'stroke': return renderStrokeSettings();
            case 'fx': return (
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
            default: return (
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
    effectsSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 20,
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
        marginBottom: 12,
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
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 8,
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
    inputGroup: {
        flex: 1,
        marginHorizontal: 4,
    },
    inputLabelSmall: {
        color: '#AAA',
        fontSize: 12,
        marginBottom: 4,
        textAlign: 'center',
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
        fontSize: 18,
        marginHorizontal: 8,
        marginBottom: 10,
    },
    unitDisplay: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#2c2c2e",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#444",
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 50,
    },
    unitDisplayText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
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
        marginTop: 2,
    },
    paperInfoContainer: {
        marginTop: 12,
        padding: 10,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.3)',
    },
    paperInfoLabel: {
        color: '#34C759',
        fontSize: 12,
        fontWeight: '500',
    },
    paperInfoValue: {
        color: '#34C759',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 149, 0, 0.3)',
        marginTop: 12,
    },
    warningText: {
        color: '#FF9500',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
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
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionSelected: {
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },
    customColorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 6,
        gap: 8,
    },
    customColorInfoText: {
        color: '#007AFF',
        fontSize: 12,
        flex: 1,
    },
    strokePreviewContainer: {
        marginTop: 16,
    },
    previewLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    strokePreview: {
        width: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
        minHeight: 2,
    },
    strokeWidthInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 16,
        backgroundColor: 'rgba(0, 122, 255, 0.04)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    strokeWidthInput: {
        width: 54,
        height: 38,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        backgroundColor: '#2c2c2e',
        textAlign: 'center',
        marginHorizontal: 7,
    },
    strokeWidthInputUnit: {
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '500',
    },


    effectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 8,
    },
    effectCardSelected: {
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
        borderColor: 'rgba(52, 199, 89, 0.5)',
    },
    effectRadioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#8E8E93',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    effectRadioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    effectRadioInnerSelected: {
        backgroundColor: '#34C759',
    },
    effectRadioDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
    },
    effectTextContainer: {
        flex: 1,
    },
    effectLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    effectLabelSelected: {
        color: '#34C759',
    },
    effectDescription: {
        fontSize: 12,
        color: '#8E8E93',
    },
    effectIcon: {
        paddingHorizontal: 8,
    },
    effectIconSelected: {
        color: '#34C759',
    },
    effectInfoBox: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.3)',
        marginTop: 20,
        gap: 8,
    },
    effectInfoText: {
        flex: 1,
        fontSize: 12,
        color: '#007AFF',
        lineHeight: 16,
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
