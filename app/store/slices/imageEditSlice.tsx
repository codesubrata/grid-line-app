import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Only cm for real-world units
export type CustomUnit = "cm";

// Paper presets now include CUSTOM
export type PaperPreset = "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "CUSTOM";

export type LabelStyle = "NONE" | "ROW" | "COL" | "BOTH";
export type ImageEffect = "none" | "grayscale";

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
    paperPresetType?: PaperPreset; // Can now be A0-A5 or CUSTOM
    rotateDeg: number;
    flip: FlipState;
    cropRect: CropRect;
    editedUri: string | null;
    isAdvancedEditingEnabled: boolean;

    // Custom paper dimensions in cm (for CUSTOM preset)
    customWidth: number | null;
    customHeight: number | null;

    // Grid/overlay options
    isGridVisible: boolean;
    isDiagonalGridVisible: boolean; // NEW: diagonal grid visibility
    strokeColor: string;
    strokeWidth: number; // in mm (keep for stroke precision)
    showLabels: boolean;
    labelStyle: LabelStyle;
    imageEffect: ImageEffect;

    // Grid cell dimensions (in cm)
    gridCellWidth: number;  // Default: 2 cm
    gridCellHeight: number; // Default: 2 cm
    gridMode: "default" | "advanced";
}

// Paper preset sizes in cm (A0 to A5)
const PAPER_SIZES_CM: Record<Exclude<PaperPreset, "CUSTOM">, { width: number; height: number }> = {
    A0: { width: 84.1, height: 118.9 },
    A1: { width: 59.4, height: 84.1 },
    A2: { width: 42.0, height: 59.4 },
    A3: { width: 29.7, height: 42.0 },
    A4: { width: 21.0, height: 29.7 },
    A5: { width: 14.8, height: 21.0 },
};

const initialCrop: CropRect = { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };

const initialState: ImageEditState = {
    paperPresetType: "A4",
    rotateDeg: 0,
    flip: { horizontal: false, vertical: false },
    cropRect: initialCrop,
    editedUri: null,
    isAdvancedEditingEnabled: false,

    customWidth: null,
    customHeight: null,

    isGridVisible: false,
    isDiagonalGridVisible: false, // NEW: diagonal grid default off
    strokeColor: "#808080",
    strokeWidth: 1, // in mm
    showLabels: false,
    labelStyle: "NONE",
    imageEffect: "none",

    // Grid cell dimensions - default 2x2 cm
    gridCellWidth: 2,
    gridCellHeight: 2,
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

// Validate custom dimensions
function validateCustomDimensions(width: number | null, height: number | null): boolean {
    if (width === null || height === null) return false;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
    if (width <= 0 || height <= 0) return false;
    return true;
}

const slice = createSlice({
    name: "imageEdit",
    initialState,
    reducers: {
        setPaperPresetType(state, action: PayloadAction<PaperPreset>) {
            state.paperPresetType = action.payload;

            // If switching away from custom, clear custom dimensions
            if (action.payload !== "CUSTOM") {
                state.customWidth = null;
                state.customHeight = null;
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

        setCustomDimensions(state, action: PayloadAction<{ width: number; height: number }>) {
            const { width, height } = action.payload;

            if (validateCustomDimensions(width, height)) {
                state.customWidth = width;
                state.customHeight = height;
                // Automatically set preset to CUSTOM when custom dimensions are set
                state.paperPresetType = "CUSTOM";
            }
        },

        setCustomWidth(state, action: PayloadAction<number>) {
            const width = action.payload;
            if (width > 0 && Number.isFinite(width)) {
                state.customWidth = width;
                // Only update to CUSTOM if we have valid height too
                if (state.customHeight !== null && state.customHeight > 0) {
                    state.paperPresetType = "CUSTOM";
                }
            }
        },

        setCustomHeight(state, action: PayloadAction<number>) {
            const height = action.payload;
            if (height > 0 && Number.isFinite(height)) {
                state.customHeight = height;
                // Only update to CUSTOM if we have valid width too
                if (state.customWidth !== null && state.customWidth > 0) {
                    state.paperPresetType = "CUSTOM";
                }
            }
        },

        clearCustomDimensions(state) {
            state.customWidth = null;
            state.customHeight = null;
            // Revert to A4 if was custom
            if (state.paperPresetType === "CUSTOM") {
                state.paperPresetType = "A4";
            }
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
            state.cropRect = { ...initialCrop };
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

        // Grid reducers
        setGridVisibility(state, action: PayloadAction<boolean>) {
            state.isGridVisible = action.payload;
            // If grid is disabled and diagonal also off, hide labels
            if (!state.isGridVisible && !state.isDiagonalGridVisible && state.showLabels) {
                state.showLabels = false;
            }
        },

        // NEW: Diagonal grid reducers
        setDiagonalGridVisibility(state, action: PayloadAction<boolean>) {
            state.isDiagonalGridVisible = action.payload;
            // If diagonal grid is disabled and grid also off, hide labels
            if (!state.isDiagonalGridVisible && !state.isGridVisible && state.showLabels) {
                state.showLabels = false;
            }
        },

        toggleDiagonalGridVisibility(state) {
            state.isDiagonalGridVisible = !state.isDiagonalGridVisible;
            // If both grids off, hide labels
            if (!state.isDiagonalGridVisible && !state.isGridVisible && state.showLabels) {
                state.showLabels = false;
            }
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

        resetGridSettings(state) {
            state.isGridVisible = false;
            state.isDiagonalGridVisible = false;
            state.strokeColor = "#808080";
            state.strokeWidth = 1;
            state.showLabels = false;
            state.labelStyle = "NONE";
            state.imageEffect = "none";
            state.gridCellWidth = 2;
            state.gridCellHeight = 2;
            state.gridMode = "default";
        },

        toggleGridVisibility(state) {
            state.isGridVisible = !state.isGridVisible;
            // If both grids off, hide labels
            if (!state.isGridVisible && !state.isDiagonalGridVisible && state.showLabels) {
                state.showLabels = false;
            }
        },

        setGridConfiguration(state, action: PayloadAction<{
            strokeColor?: string;
            strokeWidth?: number;
            showLabels?: boolean;
            labelStyle?: LabelStyle;
        }>) {
            const { strokeColor, strokeWidth, showLabels, labelStyle } = action.payload;
            if (strokeColor !== undefined) state.strokeColor = strokeColor;
            if (strokeWidth !== undefined) state.strokeWidth = Math.max(0.1, strokeWidth);
            if (showLabels !== undefined) state.showLabels = showLabels;
            if (labelStyle !== undefined) state.labelStyle = labelStyle;
        },

        // Grid cell dimension reducers (cm only)
        setGridMode(state, action: PayloadAction<"default" | "advanced">) {
            state.gridMode = action.payload;
            if (action.payload === "default") {
                state.gridCellWidth = 2;  // 2 cm
                state.gridCellHeight = 2; // 2 cm
            }
        },

        setGridCellWidth(state, action: PayloadAction<number>) {
            const width = action.payload;
            if (width > 0 && Number.isFinite(width)) {
                state.gridCellWidth = width;
                state.gridMode = "advanced";
            }
        },

        setGridCellHeight(state, action: PayloadAction<number>) {
            const height = action.payload;
            if (height > 0 && Number.isFinite(height)) {
                state.gridCellHeight = height;
                state.gridMode = "advanced";
            }
        },

        setGridCellDimensions(state, action: PayloadAction<{ width: number; height: number }>) {
            const { width, height } = action.payload;
            if (width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)) {
                state.gridCellWidth = width;
                state.gridCellHeight = height;
                state.gridMode = "advanced";
            }
        },
    },
});

// Selectors
export const selectEditState = (state: { imageEdit: ImageEditState }) => state.imageEdit;

export const selectGridOptions = (state: { imageEdit: ImageEditState }) => ({
    isGridVisible: state.imageEdit.isGridVisible,
    isDiagonalGridVisible: state.imageEdit.isDiagonalGridVisible, // NEW
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    imageEffect: state.imageEdit.imageEffect,
});

export const selectGridConfiguration = (state: { imageEdit: ImageEditState }) => ({
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    isVisible: state.imageEdit.isGridVisible,
    isDiagonalVisible: state.imageEdit.isDiagonalGridVisible, // NEW
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
});

export const selectCustomDimensions = (state: { imageEdit: ImageEditState }) => ({
    width: state.imageEdit.customWidth,
    height: state.imageEdit.customHeight,
    unit: "cm" as const,
    isValid: validateCustomDimensions(state.imageEdit.customWidth, state.imageEdit.customHeight),
});

export const selectGridWithCalculations = (state: { imageEdit: ImageEditState }) => {
    const gridState = state.imageEdit;
    return {
        ...selectGridConfiguration(state),
        cellWidth: gridState.gridCellWidth,
        cellHeight: gridState.gridCellHeight,
        mode: gridState.gridMode,
    };
};

// Grid cell dimension selectors (cm only)
export const selectGridCellDimensions = (state: { imageEdit: ImageEditState }) => ({
    width: state.imageEdit.gridCellWidth,
    height: state.imageEdit.gridCellHeight,
    unit: "cm" as const,
    mode: state.imageEdit.gridMode,
});

export const selectPaperPreset = (state: { imageEdit: ImageEditState }) => ({
    preset: state.imageEdit.paperPresetType,
    isCustom: state.imageEdit.paperPresetType === "CUSTOM",
    customWidth: state.imageEdit.customWidth,
    customHeight: state.imageEdit.customHeight,
});

export const selectPaperSize = (state: { imageEdit: ImageEditState }) => {
    const preset = state.imageEdit.paperPresetType;

    if (preset === "CUSTOM") {
        return {
            width: state.imageEdit.customWidth,
            height: state.imageEdit.customHeight,
            preset: "CUSTOM" as const,
            isValid: validateCustomDimensions(state.imageEdit.customWidth, state.imageEdit.customHeight),
        };
    }

    if (preset && preset in PAPER_SIZES_CM) {
        const size = PAPER_SIZES_CM[preset as Exclude<PaperPreset, "CUSTOM">];
        return {
            width: size.width,
            height: size.height,
            preset,
            isValid: true,
        };
    }

    // Default to A4
    return {
        width: PAPER_SIZES_CM.A4.width,
        height: PAPER_SIZES_CM.A4.height,
        preset: "A4" as const,
        isValid: true,
    };
};

export const selectIsCustomPaper = (state: { imageEdit: ImageEditState }) =>
    state.imageEdit.paperPresetType === "CUSTOM";

export const selectHasValidCustomPaper = (state: { imageEdit: ImageEditState }) =>
    state.imageEdit.paperPresetType === "CUSTOM" &&
    validateCustomDimensions(state.imageEdit.customWidth, state.imageEdit.customHeight);

// Export actions
export const {
    setPaperPresetType,
    setAdvancedEditingMode,
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
    clearCustomDimensions,
    setGridVisibility,
    setDiagonalGridVisibility, // NEW
    toggleDiagonalGridVisibility, // NEW
    setStrokeColor,
    setStrokeWidth,
    setShowLabels,
    setLabelStyle,
    setImageEffect,
    resetGridSettings,
    toggleGridVisibility,
    setGridConfiguration,
    setGridMode,
    setGridCellDimensions,
    setGridCellWidth,
    setGridCellHeight,
} = slice.actions;

// Export paper sizes and types
export { PAPER_SIZES_CM };
export default slice.reducer;
