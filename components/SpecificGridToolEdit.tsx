import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    StyleSheet, Text, View, ScrollView,
    Pressable, TextInput, Dimensions, Modal,
    PanResponder
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
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EFFECT_OPTIONS = [
    { id: "none", label: "Normal", description: "Original image colors" },
    { id: "grayscale", label: "Black & White", description: "Convert to grayscale" },
];

const STROKE_WIDTH_MIN = 1;
const STROKE_WIDTH_MAX = 5;

const PREDEFINED_COLORS = [
    // Primary Colors
    '#000000', '#FFFFFF', '#8E8E93', '#48484A',
    // Red/Pink
    '#FF3B30', '#FF2D92', '#FF375F', '#FF6B6B',
    // Orange/Yellow
    '#FF9500', '#FFCC00', '#FFD60A', '#FF9F0A',
    // Green
    '#34C759', '#32D74B', '#30D158', '#4CD964',
    // Blue
    '#007AFF', '#5AC8FA', '#64D2FF', '#0A84FF',
    // Purple
    '#AF52DE', '#BF5AF2', '#DA70D6', '#9C68E3',
    // Grayscale
    '#1C1C1E', '#2C2C2E', '#3A3A3C', '#636366'
];

// Color conversion utilities
const ColorUtils = {
    hexToRgb: (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },

    rgbToHex: (r: number, g: number, b: number) => {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    rgbToHsv: (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    },

    hsvToRgb: (h: number, s: number, v: number) => {
        s /= 100;
        v /= 100;
        const i = Math.floor(h / 60);
        const f = h / 60 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        let r = 0, g = 0, b = 0;
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },

    rgbToHsl: (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    rgbToCmyk: (r: number, g: number, b: number) => {
        if (r === 0 && g === 0 && b === 0) {
            return { c: 0, m: 0, y: 0, k: 100 };
        }

        r /= 255; g /= 255; b /= 255;
        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k);
        const m = (1 - g - k) / (1 - k);
        const y = (1 - b - k) / (1 - k);

        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }
};

// Interactive Gradient Color Picker Component
interface GradientColorPickerProps {
    hue: number;
    saturation: number;
    value: number;
    onColorChange: (s: number, v: number) => void;
}

const GradientColorPicker: React.FC<GradientColorPickerProps> = ({
    hue,
    saturation,
    value,
    onColorChange
}) => {
    const pickerSize = SCREEN_WIDTH - 80;
    const [pickerPosition, setPickerPosition] = useState({
        x: (saturation / 100) * pickerSize,
        y: ((100 - value) / 100) * pickerSize
    });

    useEffect(() => {
        setPickerPosition({
            x: (saturation / 100) * pickerSize,
            y: ((100 - value) / 100) * pickerSize
        });
    }, [saturation, value, pickerSize]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
            },
            onPanResponderMove: (evt) => {
                handleTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
            },
        })
    ).current;

    const handleTouch = (x: number, y: number) => {
        const clampedX = Math.max(0, Math.min(x, pickerSize));
        const clampedY = Math.max(0, Math.min(y, pickerSize));

        setPickerPosition({ x: clampedX, y: clampedY });

        const newSaturation = (clampedX / pickerSize) * 100;
        const newValue = ((pickerSize - clampedY) / pickerSize) * 100;

        onColorChange(newSaturation, newValue);
    };

    // Generate the base color for the gradient
    const baseColor = ColorUtils.hsvToRgb(hue, 100, 100);
    const baseHex = ColorUtils.rgbToHex(baseColor.r, baseColor.g, baseColor.b);

    return (
        <View style={styles.gradientPickerContainer}>
            <View
                style={[styles.gradientPicker, { width: pickerSize, height: pickerSize }]}
                {...panResponder.panHandlers}
            >
                {/* Base color layer */}
                <View
                    style={[
                        styles.gradientLayer,
                        { backgroundColor: baseHex }
                    ]}
                />
                {/* White gradient overlay (horizontal) */}
                <LinearGradient
                    colors={['#FFFFFF', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientLayer}
                />
                {/* Black gradient overlay (vertical) */}
                <LinearGradient
                    colors={['transparent', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradientLayer}
                />
                {/* Picker indicator */}
                <View
                    style={[
                        styles.pickerIndicator,
                        {
                            left: pickerPosition.x - 12,
                            top: pickerPosition.y - 12,
                        }
                    ]}
                />
            </View>
        </View>
    );
};

// Hue Slider Component
interface HueSliderProps {
    hue: number;
    onHueChange: (hue: number) => void;
}

const HueSlider: React.FC<HueSliderProps> = ({ hue, onHueChange }) => {
    const sliderWidth = SCREEN_WIDTH - 80;
    const [sliderPosition, setSliderPosition] = useState((hue / 360) * sliderWidth);

    useEffect(() => {
        setSliderPosition((hue / 360) * sliderWidth);
    }, [hue, sliderWidth]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                handleTouch(evt.nativeEvent.locationX);
            },
            onPanResponderMove: (evt) => {
                handleTouch(evt.nativeEvent.locationX);
            },
        })
    ).current;

    const handleTouch = (x: number) => {
        const clampedX = Math.max(0, Math.min(x, sliderWidth));
        setSliderPosition(clampedX);

        const newHue = (clampedX / sliderWidth) * 360;
        onHueChange(newHue);
    };

    return (
        <View style={styles.hueSliderContainer}>
            <View
                style={[styles.hueSliderTrack, { width: sliderWidth }]}
                {...panResponder.panHandlers}
            >
                <LinearGradient
                    colors={[
                        '#FF0000', // red
                        '#FFFF00', // yellow
                        '#00FF00', // green
                        '#00FFFF', // cyan
                        '#0000FF', // blue
                        '#FF00FF', // magenta
                        '#FF0000'  // back to red
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.hueGradient}
                />
                <View
                    style={[
                        styles.hueIndicator,
                        {
                            left: sliderPosition - 10,
                        }
                    ]}
                />
            </View>
        </View>
    );
};

// Modern color picker modal with interactive gradient
interface ColorPickerModalProps {
    visible: boolean;
    currentColor: string;
    onColorSelect: (color: string) => void;
    onClose: () => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    visible,
    currentColor,
    onColorSelect,
    onClose
}) => {
    const rgb = ColorUtils.hexToRgb(currentColor);
    const hsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);

    const [hue, setHue] = useState(hsv.h);
    const [saturation, setSaturation] = useState(hsv.s);
    const [value, setValue] = useState(hsv.v);
    const [customColorInput, setCustomColorInput] = useState(currentColor);

    useEffect(() => {
        if (visible) {
            const rgb = ColorUtils.hexToRgb(currentColor);
            const hsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHue(hsv.h);
            setSaturation(hsv.s);
            setValue(hsv.v);
            setCustomColorInput(currentColor);
        }
    }, [visible, currentColor]);

    const selectedColor = useMemo(() => {
        const rgb = ColorUtils.hsvToRgb(hue, saturation, value);
        return ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
    }, [hue, saturation, value]);

    const handleGradientChange = (s: number, v: number) => {
        setSaturation(s);
        setValue(v);
        const rgb = ColorUtils.hsvToRgb(hue, s, v);
        const hex = ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
        setCustomColorInput(hex);
    };

    const handleHueChange = (h: number) => {
        setHue(h);
        const rgb = ColorUtils.hsvToRgb(h, saturation, value);
        const hex = ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
        setCustomColorInput(hex);
    };

    const handlePresetColorSelect = (color: string) => {
        onColorSelect(color);
        const rgb = ColorUtils.hexToRgb(color);
        const hsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setValue(hsv.v);
        setCustomColorInput(color);
    };

    const handleCustomColorSubmit = () => {
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColorInput)) {
            let formattedColor = customColorInput;
            if (!formattedColor.startsWith('#')) {
                formattedColor = '#' + formattedColor;
            }
            if (formattedColor.length === 4) {
                formattedColor = '#' + formattedColor[1] + formattedColor[1] +
                    formattedColor[2] + formattedColor[2] +
                    formattedColor[3] + formattedColor[3];
            }
            const finalColor = formattedColor.toUpperCase();
            onColorSelect(finalColor);

            const rgb = ColorUtils.hexToRgb(finalColor);
            const hsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
            setHue(hsv.h);
            setSaturation(hsv.s);
            setValue(hsv.v);
        }
    };

    // Calculate color values for display
    const colorValues = useMemo(() => {
        const rgb = ColorUtils.hexToRgb(selectedColor.replace('#', ''));
        const hsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
        const hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const cmyk = ColorUtils.rgbToCmyk(rgb.r, rgb.g, rgb.b);

        return {
            hex: selectedColor,
            rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
            cmyk: `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`,
            hsv: `${hsv.h}°, ${hsv.s}%, ${hsv.v}%`,
            hsl: `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`
        };
    }, [selectedColor]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.colorPickerContainer}>
                    {/* Header */}
                    <View style={styles.colorPickerHeader}>
                        <Text style={styles.colorPickerTitle}>Colour picker</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="open-in-new" size={24} color="#8E8E93" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.colorPickerContent} showsVerticalScrollIndicator={false}>
                        {/* Interactive Gradient Picker */}
                        <GradientColorPicker
                            hue={hue}
                            saturation={saturation}
                            value={value}
                            onColorChange={handleGradientChange}
                        />

                        {/* Hue Slider */}
                        <HueSlider hue={hue} onHueChange={handleHueChange} />

                        {/* HEX Display and Input */}
                        <View style={styles.hexInputSection}>
                            <View style={styles.hexInputRow}>
                                <TextInput
                                    style={styles.hexInput}
                                    value={customColorInput}
                                    onChangeText={setCustomColorInput}
                                    placeholder="#FFFFFF"
                                    placeholderTextColor="#8E8E93"
                                    maxLength={7}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                />
                                <Pressable
                                    style={styles.hexConfirmButton}
                                    onPress={handleCustomColorSubmit}
                                >
                                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Color Information Table */}
                        <View style={styles.colorInfoGrid}>
                            <View style={styles.colorInfoBox}>
                                <Text style={styles.colorInfoLabel}>RGB</Text>
                                <Text style={styles.colorInfoValue}>{colorValues.rgb}</Text>
                            </View>
                            <View style={styles.colorInfoBox}>
                                <Text style={styles.colorInfoLabel}>CMYK</Text>
                                <Text style={styles.colorInfoValue}>{colorValues.cmyk}</Text>
                            </View>
                            <View style={styles.colorInfoBox}>
                                <Text style={styles.colorInfoLabel}>HSV</Text>
                                <Text style={styles.colorInfoValue}>{colorValues.hsv}</Text>
                            </View>
                            <View style={styles.colorInfoBox}>
                                <Text style={styles.colorInfoLabel}>HSL</Text>
                                <Text style={styles.colorInfoValue}>{colorValues.hsl}</Text>
                            </View>
                        </View>

                        {/* Preset Colors */}
                        <View style={styles.presetColorsSection}>
                            <Text style={styles.presetColorsLabel}>Preset Colors</Text>
                            <View style={styles.presetColorsGrid}>
                                {PREDEFINED_COLORS.map((color) => (
                                    <Pressable
                                        key={color}
                                        style={[
                                            styles.presetColorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.presetColorSelected
                                        ]}
                                        onPress={() => handlePresetColorSelect(color)}
                                    >
                                        {selectedColor === color && (
                                            <MaterialIcons
                                                name="check"
                                                size={18}
                                                color={color === '#FFFFFF' || color === '#FFCC00' || color === '#FFD60A' ? '#000000' : '#FFFFFF'}
                                            />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Apply Button */}
                        <View style={styles.applyButtonContainer}>
                            <Pressable style={styles.applyButton} onPress={() => onColorSelect(selectedColor)}>
                                <Text style={styles.applyButtonText}>Apply Color</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

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
    const [showColorPicker, setShowColorPicker] = useState(false);

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

    const handleColorSelect = (color: string) => {
        dispatch(setStrokeColor(color));
        setShowColorPicker(false);
    };

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

            {/* Stroke Width Control */}
            <View style={styles.strokeWidthSection}>
                <Text style={styles.sectionTitle}>Stroke Width</Text>
                <View style={styles.strokeWidthControls}>
                    <Text style={styles.strokeWidthLabel}>Width:</Text>
                    <View style={styles.strokeWidthInputRow}>
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
                </View>

                {/* Stroke Preview */}
                <View style={styles.strokePreviewContainer}>
                    <Text style={styles.previewLabel}>Preview</Text>
                    <View style={styles.strokePreviewWrapper}>
                        <View
                            style={[
                                styles.strokePreviewLine,
                                {
                                    height: parseFloat(strokeWidthInput) * 2 || 2,
                                    backgroundColor: gridConfig.strokeColor,
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* Color Picker Section */}
            <View style={styles.colorPickerSection}>
                <Text style={styles.sectionTitle}>Stroke Color</Text>

                {/* Quick Color Selection */}
                <View style={styles.quickColorsSection}>
                    <View style={styles.quickColorsRow}>
                        {/* Color Picker Icon */}
                        <Pressable
                            style={styles.colorPickerIcon}
                            onPress={() => setShowColorPicker(true)}
                        >
                            <MaterialIcons name="colorize" size={31} color="#007AFF" />
                        </Pressable>

                        {/* Scrollable Preset Colors */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.presetColorsScroll}
                        >
                            <View style={styles.presetColorsContainer}>
                                {PREDEFINED_COLORS.map((color) => (
                                    <Pressable
                                        key={color}
                                        style={[
                                            styles.quickColorOption,
                                            { backgroundColor: color },
                                            gridConfig.strokeColor === color && styles.quickColorSelected
                                        ]}
                                        onPress={() => dispatch(setStrokeColor(color))}
                                    >
                                        {gridConfig.strokeColor === color && (
                                            <MaterialIcons
                                                name="check"
                                                size={16}
                                                color={color === '#FFFFFF' ? '#000000' : '#FFFFFF'}
                                            />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Current Color Display */}
                <View style={styles.currentColorDisplay}>
                    <View
                        style={[
                            styles.currentColorBadge,
                            { backgroundColor: gridConfig.strokeColor }
                        ]}
                    />
                    <Text style={styles.currentColorHex}>{gridConfig.strokeColor}</Text>
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
        <>
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

            {/* Color Picker Modal */}
            <ColorPickerModal
                visible={showColorPicker}
                currentColor={gridConfig.strokeColor}
                onColorSelect={handleColorSelect}
                onClose={() => setShowColorPicker(false)}
            />
        </>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
    },

    // Stroke Settings Styles
    strokeWidthSection: {
        marginBottom: 24,
    },
    strokeWidthControls: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 16,
    },
    strokeWidthLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    strokeWidthInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    strokeWidthInput: {
        width: 70,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: '#2c2c2e',
        textAlign: 'center',
        marginRight: 8,
    },
    strokeWidthInputUnit: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
    },
    strokePreviewContainer: {
        marginTop: 16,
    },
    previewLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    strokePreviewWrapper: {
        backgroundColor: '#2c2c2e',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    strokePreviewLine: {
        width: '100%',
        borderRadius: 4,
        minHeight: 2,
    },

    // Color Picker Section
    colorPickerSection: {
        marginBottom: 16,
    },
    quickColorsSection: {
        marginBottom: 16,
    },
    quickColorsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    colorPickerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    presetColorsScroll: {
        flex: 1,
    },
    presetColorsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 4,
    },
    quickColorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickColorSelected: {
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },
    currentColorDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 8,
    },
    currentColorBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 12,
    },
    currentColorHex: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Color Picker Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    colorPickerContainer: {
        backgroundColor: '#1a1d21',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flex: 0.92,
        paddingBottom: 20,
    },
    colorPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    colorPickerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    colorPickerContent: {
        flex: 1,
    },

    // Gradient Picker Styles
    gradientPickerContainer: {
        padding: 20,
        alignItems: 'center',
    },
    gradientPicker: {
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    pickerIndicator: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        backgroundColor: 'transparent',
    },

    // Hue Slider Styles
    hueSliderContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
    },
    hueSliderTrack: {
        height: 11,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
    },
    hueGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    hueIndicator: {
        position: 'absolute',
        top: 0,
        width: 10,
        height: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        backgroundColor: 'transparent',
    },

    // HEX Input Section
    hexInputSection: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    hexInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        paddingLeft: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    hexInput: {
        flex: 1,
        height: 48,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    hexConfirmButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C759',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },

    // Color Info Grid
    colorInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 20,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    colorInfoBox: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    colorInfoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    colorInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Preset Colors Section
    presetColorsSection: {
        padding: 20,
    },
    presetColorsLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    presetColorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    presetColorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetColorSelected: {
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },

    // Apply Button
    applyButtonContainer: {
        padding: 20,
        paddingTop: 10,
    },

    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Rest of existing styles
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