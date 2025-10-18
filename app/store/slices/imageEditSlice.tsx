import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Supported real-world units for grid and custom ratio overlays
export type CustomUnit = "mm" | "cm" | "m" | "inch" | "ft";

export type RatioPreset =
    | "ORIGINAL"
    | "SQUARE"
    | "A0"
    | "A1"
    | "A2"
    | "A3"
    | "A4"
    | "A5"
    | "RATIO_16_9"
    | "RATIO_4_3"
    | "RATIO_3_2"
    | "CUSTOM";

export type LabelStyle = "NONE" | "ROW" | "COL" | "BOTH";
export type ImageEffect = "none" | "grayscale" | "sepia" | "contrast" | "brightness";

interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FlipState {
    horizontal: boolean;
    vertical: boolean;
}

// Central edit state for editing session
interface ImageEditState {
    ratioPreset: RatioPreset;
    ratioValue: number | null;
    rotateDeg: number;
    flip: FlipState;
    cropRect: CropRect;
    editedUri: string | null;
    originalImageRatio: number | null;
    isAdvancedEditingEnabled: boolean;

    // Custom ratio/paper dimensions, real-units for this overlay
    customWidth: number | null;
    customHeight: number | null;
    customUnit: CustomUnit;

    // Grid/overlay options
    isGridVisible: boolean;
    gridRows: number;
    gridCols: number;
    cellSize: number; // In real-units, always mm for internal base (may be converted for display)
    strokeColor: string;
    strokeWidth: number; // Always in mm
    showLabels: boolean;
    labelStyle: LabelStyle;
    imageEffect: ImageEffect;

    // NEW: Grid cell dimensions (width x height in real units)
    gridCellWidth: number;  // Default: 20 (2 cm in mm)
    gridCellHeight: number; // Default: 20 (2 cm in mm)
    gridCellUnit: CustomUnit; // Default: "mm" (internally stored in mm)
    gridMode: "default" | "advanced"; // Track which mode user selected
}

const RATIO_PRESETS = {
    SQUARE: 1.0,
    A0: 841 / 1189,
    A1: 594 / 841,
    A2: 420 / 594,
    A3: 297 / 420,
    A4: 210 / 297,
    A5: 148 / 210,
    RATIO_16_9: 16 / 9,
    RATIO_4_3: 4 / 3,
    RATIO_3_2: 3 / 2,
} as const;

const initialCrop: CropRect = { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };

const initialState: ImageEditState = {
    ratioPreset: "SQUARE",
    ratioValue: RATIO_PRESETS.SQUARE,
    rotateDeg: 0,
    flip: { horizontal: false, vertical: false },
    cropRect: initialCrop,
    editedUri: null,
    originalImageRatio: null,
    isAdvancedEditingEnabled: false,

    customWidth: null,
    customHeight: null,
    customUnit: "mm",

    isGridVisible: false,
    gridRows: 3,
    gridCols: 3,
    cellSize: 50, // base cell size in mm
    strokeColor: "#808080",
    strokeWidth: 1, // in mm
    showLabels: false,
    labelStyle: "NONE",
    imageEffect: "none",

    // NEW: Grid cell dimensions
    gridCellWidth: 20,  // 2 cm = 20 mm
    gridCellHeight: 20, // 2 cm = 20 mm
    gridCellUnit: "mm",
    gridMode: "default",
};

// Helpers
function validateCropRect(rect: CropRect): CropRect {
    return {
        x: Math.max(0, Math.min(1, rect.x)),
        y: Math.max(0, Math.min(1, rect.y)),
        width: Math.max(0.1, Math.min(1, rect.width)),
        height: Math.max(0.1, Math.min(1, rect.height)),
    };
}

function normalizeRotation(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
}

function adjustCropRectToRatio(currentRect: CropRect, targetRatio: number | null): CropRect {
    if (!targetRatio || targetRatio <= 0) {
        return currentRect;
    }
    let { x, y, width, height } = currentRect;
    const currentRatio = width / height;
    if (Math.abs(currentRatio - targetRatio) < 0.001) {
        return currentRect;
    }
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    if (targetRatio > currentRatio) {
        const newWidth = Math.min(height * targetRatio, 1);
        width = newWidth;
        if (width >= 1) {
            height = width / targetRatio;
        }
    } else {
        const newHeight = Math.min(width / targetRatio, 1);
        height = newHeight;
        if (height >= 1) {
            width = height * targetRatio;
        }
    }
    x = Math.max(0, Math.min(1 - width, centerX - width / 2));
    y = Math.max(0, Math.min(1 - height, centerY - height / 2));
    return validateCropRect({ x, y, width, height });
}

// Calculate cell size in mm (for internal calibration of square-like grid, not used directly when user chooses advanced custom units)
function calculateCellSize(imageWidth: number, imageHeight: number, gridRows: number, gridCols: number): number {
    if (!imageWidth || !imageHeight || gridRows <= 0 || gridCols <= 0) return 50;
    const cellWidth = imageWidth / gridCols;
    const cellHeight = imageHeight / gridRows;
    return Math.min(cellWidth, cellHeight);
}

// Unified conversion for supported units (mm is used as base for grid logic)
function convertDimensionUnit(value: number, fromUnit: CustomUnit, toUnit: CustomUnit): number {
    if (fromUnit === toUnit) return value;
    const toMm: Record<CustomUnit, number> = {
        mm: 1,
        cm: 10,
        m: 1000,
        inch: 25.4,
        ft: 304.8,
    };
    const valueInMm = value * toMm[fromUnit];
    return valueInMm / toMm[toUnit];
}

const slice = createSlice({
    name: "imageEdit",
    initialState,
    reducers: {
        setOriginalImageRatio(state, action: PayloadAction<number>) {
            state.originalImageRatio = action.payload;
            if (state.ratioPreset === "ORIGINAL") {
                state.ratioValue = action.payload;
                state.cropRect = adjustCropRectToRatio(state.cropRect, action.payload);
            }
        },
        setAdvancedEditingMode(state, action: PayloadAction<boolean>) {
            state.isAdvancedEditingEnabled = action.payload;
            if (!action.payload) {
                state.rotateDeg = 0;
                state.flip = { horizontal: false, vertical: false };
                state.cropRect = initialCrop;
            }
        },
        setCustomDimensions(state, action: PayloadAction<{ width: number; height: number; unit: CustomUnit }>) {
            state.customWidth = action.payload.width;
            state.customHeight = action.payload.height;
            state.customUnit = action.payload.unit;
            if (state.customWidth > 0 && state.customHeight > 0) {
                state.ratioPreset = "CUSTOM";
                state.ratioValue = state.customWidth / state.customHeight;
                state.cropRect = adjustCropRectToRatio(state.cropRect, state.ratioValue);
            }
        },
        setCustomWidth(state, action: PayloadAction<number>) {
            state.customWidth = action.payload;
            if (state.customWidth && state.customHeight && state.customWidth > 0 && state.customHeight > 0) {
                state.ratioValue = state.customWidth / state.customHeight;
            }
        },
        setCustomHeight(state, action: PayloadAction<number>) {
            state.customHeight = action.payload;
            if (state.customWidth && state.customHeight && state.customWidth > 0 && state.customHeight > 0) {
                state.ratioValue = state.customWidth / state.customHeight;
            }
        },
        setCustomUnit(state, action: PayloadAction<CustomUnit>) {
            state.customUnit = action.payload;
        },
        convertCustomDimensions(state, action: PayloadAction<{ toUnit: CustomUnit }>) {
            const { toUnit } = action.payload;
            if (state.customWidth !== null && state.customUnit !== toUnit) {
                state.customWidth = convertDimensionUnit(state.customWidth, state.customUnit, toUnit);
            }
            if (state.customHeight !== null && state.customUnit !== toUnit) {
                state.customHeight = convertDimensionUnit(state.customHeight, state.customUnit, toUnit);
            }
            state.customUnit = toUnit;
        },
        setRatioPreset(state, action: PayloadAction<{ preset: RatioPreset; ratio?: number }>) {
            const { preset, ratio } = action.payload;
            state.ratioPreset = preset;
            let newRatio: number | null = null;
            if (ratio !== undefined) {
                newRatio = ratio;
            } else if (preset === "ORIGINAL") {
                newRatio = state.originalImageRatio;
            } else if (preset === "CUSTOM") {
                if (state.customWidth && state.customHeight && state.customWidth > 0 && state.customHeight > 0) {
                    newRatio = state.customWidth / state.customHeight;
                } else {
                    newRatio = state.ratioValue;
                }
            } else if (preset in RATIO_PRESETS) {
                newRatio = RATIO_PRESETS[preset as keyof typeof RATIO_PRESETS];
            }
            state.ratioValue = newRatio;
            state.cropRect = adjustCropRectToRatio(state.cropRect, newRatio);
        },
        setRatioValue(state, action: PayloadAction<number | null>) {
            const ratio = action.payload;
            state.ratioValue = ratio && ratio > 0 ? ratio : null;
            state.ratioPreset = ratio ? "CUSTOM" : "ORIGINAL";
            state.cropRect = adjustCropRectToRatio(state.cropRect, ratio);
        },
        rotateLeft(state) {
            state.rotateDeg = normalizeRotation(state.rotateDeg - 90);
        },
        rotateRight(state) {
            state.rotateDeg = normalizeRotation(state.rotateDeg + 90);
        },
        setRotation(state, action: PayloadAction<number>) {
            state.rotateDeg = normalizeRotation(action.payload);
        },
        toggleFlipHorizontal(state) {
            state.flip.horizontal = !state.flip.horizontal;
        },
        toggleFlipVertical(state) {
            state.flip.vertical = !state.flip.vertical;
        },
        setFlip(state, action: PayloadAction<{ horizontal?: boolean; vertical?: boolean }>) {
            const { horizontal, vertical } = action.payload;
            if (horizontal !== undefined) state.flip.horizontal = horizontal;
            if (vertical !== undefined) state.flip.vertical = vertical;
        },
        setCropRect(state, action: PayloadAction<CropRect>) {
            const rect = validateCropRect(action.payload);
            if (rect.x + rect.width > 1) rect.x = Math.max(0, 1 - rect.width);
            if (rect.y + rect.height > 1) rect.y = Math.max(0, 1 - rect.height);
            state.cropRect = rect;
        },
        resetCropRect(state) {
            const ratio = state.ratioValue;
            let resetRect = { ...initialCrop };
            if (ratio && ratio > 0) resetRect = adjustCropRectToRatio(resetRect, ratio);
            state.cropRect = resetRect;
        },
        setEditedUri(state, action: PayloadAction<string>) {
            state.editedUri = action.payload;
        },
        clearEditedUri(state) {
            state.editedUri = null;
        },
        resetAllEdits(state) {
            Object.assign(state, initialState);
        },
        resetTransforms(state) {
            state.rotateDeg = 0;
            state.flip = { horizontal: false, vertical: false };
        },
        // 🧩 Enhanced grid reducers
        setGridVisibility(state, action: PayloadAction<boolean>) {
            state.isGridVisible = action.payload;
        },
        setGridRows(state, action: PayloadAction<number>) {
            state.gridRows = Math.max(1, action.payload);
        },
        setGridCols(state, action: PayloadAction<number>) {
            state.gridCols = Math.max(1, action.payload);
        },
        setCellSize(state, action: PayloadAction<number>) {
            state.cellSize = Math.max(1, action.payload);
        },
        setStrokeColor(state, action: PayloadAction<string>) {
            state.strokeColor = action.payload;
        },
        setStrokeWidth(state, action: PayloadAction<number>) {
            state.strokeWidth = Math.max(0.1, action.payload);
        },
        setShowLabels(state, action: PayloadAction<boolean>) {
            state.showLabels = action.payload;
        },
        setLabelStyle(state, action: PayloadAction<LabelStyle>) {
            state.labelStyle = action.payload;
        },
        setImageEffect(state, action: PayloadAction<ImageEffect>) {
            state.imageEffect = action.payload;
        },
        updateCellSizeFromImage(state, action: PayloadAction<{ width: number; height: number }>) {
            const { width, height } = action.payload;
            state.cellSize = calculateCellSize(width, height, state.gridRows, state.gridCols);
        },
        updateGridFromDimensions(state, action: PayloadAction<{
            imageWidth: number;
            imageHeight: number;
            presetWidth?: number;
            presetHeight?: number;
            presetUnit?: CustomUnit;
        }>) {
            const { imageWidth, imageHeight } = action.payload;
            state.cellSize = calculateCellSize(imageWidth, imageHeight, state.gridRows, state.gridCols);
        },
        resetGridSettings(state) {
            state.gridRows = 3;
            state.gridCols = 3;
            state.strokeColor = "#808080";
            state.strokeWidth = 1;
            state.showLabels = false;
            state.labelStyle = "NONE";
            state.imageEffect = "none";
            state.cellSize = 50;
            // Reset grid cell dimensions
            state.gridCellWidth = 20;  // 2 cm = 20 mm
            state.gridCellHeight = 20; // 2 cm = 20 mm
            state.gridCellUnit = "mm";
            state.gridMode = "default";
        },
        toggleGridVisibility(state) {
            state.isGridVisible = !state.isGridVisible;
        },
        setGridConfiguration(state, action: PayloadAction<{
            rows?: number;
            cols?: number;
            strokeColor?: string;
            strokeWidth?: number;
            showLabels?: boolean;
            labelStyle?: LabelStyle;
        }>) {
            const { rows, cols, strokeColor, strokeWidth, showLabels, labelStyle } = action.payload;
            if (rows !== undefined) state.gridRows = Math.max(1, rows);
            if (cols !== undefined) state.gridCols = Math.max(1, cols);
            if (strokeColor !== undefined) state.strokeColor = strokeColor;
            if (strokeWidth !== undefined) state.strokeWidth = Math.max(0.1, strokeWidth);
            if (showLabels !== undefined) state.showLabels = showLabels;
            if (labelStyle !== undefined) state.labelStyle = labelStyle;
        },

        // NEW: Grid cell dimension reducers
        setGridMode(state, action: PayloadAction<"default" | "advanced">) {
            state.gridMode = action.payload;
            if (action.payload === "default") {
                // Reset to default 2x2 cm
                state.gridCellWidth = 20;  // 2 cm in mm
                state.gridCellHeight = 20; // 2 cm in mm
                state.gridCellUnit = "mm";
            }
        },

        setGridCellDimensions(state, action: PayloadAction<{
            width: number;
            height: number;
            unit: CustomUnit;
        }>) {
            const { width, height, unit } = action.payload;

            // Convert to mm for internal storage
            state.gridCellWidth = convertDimensionUnit(width, unit, "mm");
            state.gridCellHeight = convertDimensionUnit(height, unit, "mm");
            state.gridCellUnit = "mm"; // Always store internally in mm

            state.gridMode = "advanced";
        },

        setGridCellWidth(state, action: PayloadAction<{
            width: number;
            unit: CustomUnit;
        }>) {
            const { width, unit } = action.payload;
            state.gridCellWidth = convertDimensionUnit(width, unit, "mm");
            state.gridMode = "advanced";
        },

        setGridCellHeight(state, action: PayloadAction<{
            height: number;
            unit: CustomUnit;
        }>) {
            const { height, unit } = action.payload;
            state.gridCellHeight = convertDimensionUnit(height, unit, "mm");
            state.gridMode = "advanced";
        },

        // Auto-calculate rows and columns based on image dimensions and cell size
        calculateGridFromCellSize(state, action: PayloadAction<{
            imageWidth: number;
            imageHeight: number;
            realWorldWidth?: number;
            realWorldHeight?: number;
            realWorldUnit?: CustomUnit;
        }>) {
            const {
                imageWidth,
                imageHeight,
                realWorldWidth,
                realWorldHeight,
                realWorldUnit = "mm"
            } = action.payload;

            // Use real-world dimensions if available, otherwise use pixel dimensions
            let imageWidthMm = realWorldWidth || imageWidth;
            let imageHeightMm = realWorldHeight || imageHeight;

            // Convert real-world dimensions to mm if needed
            if (realWorldUnit && realWorldUnit !== "mm") {
                imageWidthMm = convertDimensionUnit(imageWidthMm, realWorldUnit, "mm");
                imageHeightMm = convertDimensionUnit(imageHeightMm, realWorldUnit, "mm");
            }

            // Calculate rows and columns
            if (state.gridCellWidth > 0 && state.gridCellHeight > 0) {
                state.gridCols = Math.max(1, Math.floor(imageWidthMm / state.gridCellWidth));
                state.gridRows = Math.max(1, Math.floor(imageHeightMm / state.gridCellHeight));
            }
        },
    },
});

export const selectEditState = (state: any) => state.imageEdit;
export const selectGridOptions = (state: any) => ({
    isGridVisible: state.imageEdit.isGridVisible,
    gridRows: state.imageEdit.gridRows,
    gridCols: state.imageEdit.gridCols,
    cellSize: state.imageEdit.cellSize,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    imageEffect: state.imageEdit.imageEffect,
});
export const selectGridConfiguration = (state: any) => ({
    rows: state.imageEdit.gridRows,
    cols: state.imageEdit.gridCols,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    isVisible: state.imageEdit.isGridVisible,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
});
export const selectCustomDimensions = (state: any) => ({
    width: state.imageEdit.customWidth,
    height: state.imageEdit.customHeight,
    unit: state.imageEdit.customUnit,
    ratio: state.imageEdit.customWidth && state.imageEdit.customHeight
        ? state.imageEdit.customWidth / state.imageEdit.customHeight
        : null,
});
export const selectCustomDimensionsFormatted = (state: any) => {
    const { customWidth, customHeight, customUnit } = state.imageEdit;
    return {
        width: customWidth !== null ? `${customWidth.toFixed(customUnit === 'px' ? 0 : 2)} ${customUnit}` : 'N/A',
        height: customHeight !== null ? `${customHeight.toFixed(customUnit === 'px' ? 0 : 2)} ${customUnit}` : 'N/A',
        unit: customUnit,
        dimensions: customWidth && customHeight ? `${customWidth}×${customHeight}${customUnit}` : 'N/A',
    };
};
export const selectGridWithCalculations = (state: any) => {
    const gridState = state.imageEdit;
    return {
        ...selectGridConfiguration(state),
        cellSize: gridState.cellSize,
        totalCells: gridState.gridRows * gridState.gridCols,
        aspectRatio: gridState.gridRows / gridState.gridCols,
    };
};

// NEW: Grid cell dimension selectors
export const selectGridCellDimensions = (state: any) => ({
    width: state.imageEdit.gridCellWidth,
    height: state.imageEdit.gridCellHeight,
    unit: "mm", // Always mm internally
    mode: state.imageEdit.gridMode,
});

export const selectGridCellDimensionsInUnit = (state: any, unit: CustomUnit) => {
    const { gridCellWidth, gridCellHeight, gridMode } = state.imageEdit;
    return {
        width: convertDimensionUnit(gridCellWidth, "mm", unit),
        height: convertDimensionUnit(gridCellHeight, "mm", unit),
        unit: unit,
        mode: gridMode,
    };
};

export const {
    setOriginalImageRatio,
    setAdvancedEditingMode,
    setRatioPreset,
    setRatioValue,
    rotateLeft,
    rotateRight,
    setRotation,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setFlip,
    setCropRect,
    resetCropRect,
    setEditedUri,
    clearEditedUri,
    resetAllEdits,
    resetTransforms,
    setCustomDimensions,
    setCustomWidth,
    setCustomHeight,
    setCustomUnit,
    convertCustomDimensions,
    setGridVisibility,
    setGridRows,
    setGridCols,
    setCellSize,
    setStrokeColor,
    setStrokeWidth,
    setShowLabels,
    setLabelStyle,
    setImageEffect,
    updateCellSizeFromImage,
    updateGridFromDimensions,
    resetGridSettings,
    toggleGridVisibility,
    setGridConfiguration,
    // NEW exports
    setGridMode,
    setGridCellDimensions,
    setGridCellWidth,
    setGridCellHeight,
    calculateGridFromCellSize,
} = slice.actions;

export { RATIO_PRESETS, calculateCellSize, convertDimensionUnit };
export default slice.reducer;
