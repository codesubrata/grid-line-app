import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Image } from "react-native";

// Import the default image from assets
const DefaultImage = require("@/assets/images/background-image.png");

// Define dimension unit type
type DimensionUnit = "px" | "mm" | "cm" | "m" | "inch" | "ft";

// These paper size types are for preset support if you want to expand
type PaperPreset = "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "custom";

interface ImageState {
    currentImage: string;
    source: "camera" | "gallery" | "default";
    isLoading: boolean;
    error: string | null;

    // Internal dimensions (as imported, always in px)
    width?: number;
    height?: number;
    unit: DimensionUnit;
    aspectRatio?: number;
    format?: string;
    fileSize?: number;
    fileName?: string;

    // Real-world/paper data for accurate overlays:
    // These must be set by the user/preset after image load if not from a scanner!
    realWorldWidth?: number; // e.g. 210 for A4, in real units
    realWorldHeight?: number;
    realWorldUnit?: DimensionUnit; // "mm", "cm", etc.
    paperPresetType?: PaperPreset; // Optional for paper preset recall

    // Preset for UI display (can be real world dimensions or user's chosen overlay area)
    presetWidth?: number;
    presetHeight?: number;
    presetUnit: DimensionUnit;
}

// Utility function to extract format from URI or MIME type
function extractImageFormat(uri: string, mimeType?: string): string {
    if (mimeType) {
        const formatFromMime = mimeType.split('/')[1]?.toLowerCase();
        if (formatFromMime) {
            switch (formatFromMime) {
                case 'jpeg':
                    return 'jpg';
                case 'png':
                case 'webp':
                case 'gif':
                case 'bmp':
                    return formatFromMime;
                default:
                    return formatFromMime;
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
}

// Utility function to extract filename from URI
function extractFileName(uri: string): string {
    try {
        const pathParts = uri.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return fileName?.split('?')[0] || 'unknown';
    } catch (error) {
        console.warn('Failed to extract filename from URI:', error);
        return 'unknown';
    }
}

// Utility function to convert between dimension units (NOTE: This ignores DPI, used only for UI)
function convertDimensionUnit(value: number, fromUnit: DimensionUnit, toUnit: DimensionUnit): number {
    if (fromUnit === toUnit) return value;
    const toPixels: Record<DimensionUnit, number> = {
        px: 1,
        mm: 3.7795275591, // 96 DPI standard
        cm: 37.795275591,
        m: 3779.5275591,
        inch: 96,
        ft: 1152,
    };
    const pixels = value * toPixels[fromUnit];
    return pixels / toPixels[toUnit];
}

// Utility function to get formatted dimension string
function formatDimension(value?: number, unit?: DimensionUnit): string {
    if (value === undefined || unit === undefined) return 'N/A';
    return `${value.toFixed(unit === 'px' ? 0 : 2)} ${unit}`;
}

// Utility functions
function isValidUri(uri: string): boolean {
    if (!uri || typeof uri !== 'string') return false;
    const uriPattern = /^(https?:\/\/|file:\/\/|data:|\/|\.\/)/;
    return uriPattern.test(uri) || uri.startsWith('ph://') || uri.startsWith('content://');
}

function getDefaultImageUri(): string {
    try {
        const resolved = Image.resolveAssetSource(DefaultImage);
        if (resolved && resolved.uri && typeof resolved.uri === 'string') {
            return resolved.uri;
        }
        throw new Error('Failed to resolve asset URI');
    } catch (error) {
        console.warn('Failed to resolve default image asset:', error);
        try {
            const altPaths = [
                require("../../assets/images/background-image.png"),
                require("../../../assets/images/background-image.png"),
            ];
            for (const altPath of altPaths) {
                try {
                    const resolved = Image.resolveAssetSource(altPath);
                    if (resolved && resolved.uri) {
                        return resolved.uri;
                    }
                } catch (e) { }
            }
        } catch (e) { }
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
}

let defaultImageUri: string | null = null;
function getOrInitDefaultUri(): string {
    if (defaultImageUri === null) {
        defaultImageUri = getDefaultImageUri();
    }
    return defaultImageUri;
}

const initialState: ImageState = {
    currentImage: getOrInitDefaultUri(),
    source: "default",
    isLoading: false,
    error: null,
    width: undefined,
    height: undefined,
    unit: "px",
    aspectRatio: undefined,
    format: undefined,
    fileSize: undefined,
    fileName: undefined,
    realWorldWidth: undefined,
    realWorldHeight: undefined,
    realWorldUnit: undefined,
    paperPresetType: undefined,
    presetWidth: undefined,
    presetHeight: undefined,
    presetUnit: "px"
};

interface SetImagePayload {
    uri: string;
    source: "camera" | "gallery";

    width?: number;
    height?: number;
    unit?: DimensionUnit;

    // These are for real-world correspondence
    realWorldWidth?: number;
    realWorldHeight?: number;
    realWorldUnit?: DimensionUnit;
    paperPresetType?: PaperPreset;

    presetWidth?: number;
    presetHeight?: number;
    presetUnit?: DimensionUnit;

    // Other metadata
    format?: string;
    mimeType?: string;
    fileSize?: number;
    fileName?: string;
}

const imageSlice = createSlice({
    name: "image",
    initialState,
    reducers: {
        setImage: (
            state,
            action: PayloadAction<SetImagePayload>
        ) => {
            const {
                uri,
                source,
                width,
                height,
                unit = "px",
                format,
                mimeType,
                fileSize,
                fileName,
                realWorldWidth,
                realWorldHeight,
                realWorldUnit,
                paperPresetType,
                presetWidth,
                presetHeight,
                presetUnit = "px",
            } = action.payload;

            if (!isValidUri(uri)) {
                state.error = "Invalid image URI provided";
                return;
            }

            state.currentImage = uri;
            state.source = source;
            state.error = null;
            state.isLoading = false;

            state.width = width;
            state.height = height;
            state.unit = unit;
            state.aspectRatio = width && height ? width / height : undefined;
            state.format = format || extractImageFormat(uri, mimeType);
            state.fileSize = fileSize;
            state.fileName = fileName || extractFileName(uri);

            state.realWorldWidth = realWorldWidth;
            state.realWorldHeight = realWorldHeight;
            state.realWorldUnit = realWorldUnit;
            state.paperPresetType = paperPresetType;

            state.presetWidth = presetWidth ?? width;
            state.presetHeight = presetHeight ?? height;
            state.presetUnit = presetUnit;
        },

        setImageMetadata: (
            state,
            action: PayloadAction<{
                width?: number;
                height?: number;
                unit?: DimensionUnit;
                realWorldWidth?: number;
                realWorldHeight?: number;
                realWorldUnit?: DimensionUnit;
                paperPresetType?: PaperPreset;
                presetWidth?: number;
                presetHeight?: number;
                presetUnit?: DimensionUnit;
                format?: string;
                fileSize?: number;
                fileName?: string;
            }>
        ) => {
            const {
                width, height, unit,
                realWorldWidth, realWorldHeight, realWorldUnit, paperPresetType,
                presetWidth, presetHeight, presetUnit,
                format, fileSize, fileName
            } = action.payload;

            if (width !== undefined) state.width = width;
            if (height !== undefined) state.height = height;
            if (unit !== undefined) state.unit = unit;
            if (format !== undefined) state.format = format;
            if (fileSize !== undefined) state.fileSize = fileSize;
            if (fileName !== undefined) state.fileName = fileName;

            if (realWorldWidth !== undefined) state.realWorldWidth = realWorldWidth;
            if (realWorldHeight !== undefined) state.realWorldHeight = realWorldHeight;
            if (realWorldUnit !== undefined) state.realWorldUnit = realWorldUnit;
            if (paperPresetType !== undefined) state.paperPresetType = paperPresetType;

            if (presetWidth !== undefined) state.presetWidth = presetWidth;
            if (presetHeight !== undefined) state.presetHeight = presetHeight;
            if (presetUnit !== undefined) state.presetUnit = presetUnit;

            if (state.width && state.height) {
                state.aspectRatio = state.width / state.height;
            }
        },

        setDimensionUnits: (
            state,
            action: PayloadAction<{ unit?: DimensionUnit; presetUnit?: DimensionUnit }>
        ) => {
            const { unit, presetUnit } = action.payload;
            if (unit !== undefined) state.unit = unit;
            if (presetUnit !== undefined) state.presetUnit = presetUnit;
        },

        convertDimensions: (
            state,
            action: PayloadAction<{ toUnit: DimensionUnit; convertPreset?: boolean }>
        ) => {
            const { toUnit, convertPreset = false } = action.payload;
            if (state.width !== undefined && state.unit !== toUnit) {
                state.width = convertDimensionUnit(state.width, state.unit, toUnit);
            }
            if (state.height !== undefined && state.unit !== toUnit) {
                state.height = convertDimensionUnit(state.height, state.unit, toUnit);
            }
            state.unit = toUnit;
            if (convertPreset) {
                if (state.presetWidth !== undefined && state.presetUnit !== toUnit) {
                    state.presetWidth = convertDimensionUnit(state.presetWidth, state.presetUnit, toUnit);
                }
                if (state.presetHeight !== undefined && state.presetUnit !== toUnit) {
                    state.presetHeight = convertDimensionUnit(state.presetHeight, state.presetUnit, toUnit);
                }
                state.presetUnit = toUnit;
            }
        },

        setPresetDimensions: (
            state,
            action: PayloadAction<{
                presetWidth?: number;
                presetHeight?: number;
                presetUnit?: DimensionUnit;
            }>
        ) => {
            const { presetWidth, presetHeight, presetUnit } = action.payload;
            if (presetWidth !== undefined) state.presetWidth = presetWidth;
            if (presetHeight !== undefined) state.presetHeight = presetHeight;
            if (presetUnit !== undefined) state.presetUnit = presetUnit;
        },

        setImageLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setImageError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        clearImage: (state) => {
            state.currentImage = getOrInitDefaultUri();
            state.source = "default";
            state.isLoading = false;
            state.error = null;
            state.width = undefined;
            state.height = undefined;
            state.unit = "px";
            state.aspectRatio = undefined;
            state.format = undefined;
            state.fileSize = undefined;
            state.fileName = undefined;
            state.realWorldWidth = undefined;
            state.realWorldHeight = undefined;
            state.realWorldUnit = undefined;
            state.paperPresetType = undefined;
            state.presetWidth = undefined;
            state.presetHeight = undefined;
            state.presetUnit = "px";
        },

        clearImageError: (state) => {
            state.error = null;
        },

        retryDefaultImage: (state) => {
            try {
                defaultImageUri = null;
                const newUri = getOrInitDefaultUri();
                if (state.source === "default") {
                    state.currentImage = newUri;
                }
                state.error = null;
            } catch (error) {
                state.error = "Failed to load default image";
            }
        },

        validateCurrentImage: (state) => {
            if (!isValidUri(state.currentImage)) {
                state.error = "Current image URI is invalid";
                state.currentImage = getOrInitDefaultUri();
                state.source = "default";
                state.width = undefined;
                state.height = undefined;
                state.unit = "px";
                state.aspectRatio = undefined;
                state.format = undefined;
                state.fileSize = undefined;
                state.fileName = undefined;
                state.realWorldWidth = undefined;
                state.realWorldHeight = undefined;
                state.realWorldUnit = undefined;
                state.paperPresetType = undefined;
                state.presetWidth = undefined;
                state.presetHeight = undefined;
                state.presetUnit = "px";
            }
        },

        replaceImage: (
            state,
            action: PayloadAction<SetImagePayload>
        ) => {
            // identical to setImage
            imageSlice.caseReducers.setImage(state, action);
        },
    },
});

// Selectors (same as before, but extended with real-world info)
export const selectCurrentImage = (state: { image: ImageState }) => state.image.currentImage;
export const selectImageSource = (state: { image: ImageState }) => state.image.source;
export const selectImageLoading = (state: { image: ImageState }) => state.image.isLoading;
export const selectImageError = (state: { image: ImageState }) => state.image.error;
export const selectImageWidth = (state: { image: ImageState }) => state.image.width;
export const selectImageHeight = (state: { image: ImageState }) => state.image.height;
export const selectImageUnit = (state: { image: ImageState }) => state.image.unit;
export const selectImageAspectRatio = (state: { image: ImageState }) => state.image.aspectRatio;
export const selectImageFormat = (state: { image: ImageState }) => state.image.format;
export const selectImageFileSize = (state: { image: ImageState }) => state.image.fileSize;
export const selectImageFileName = (state: { image: ImageState }) => state.image.fileName;

// Real-world paper dimensions
export const selectPaperSize = (state: { image: ImageState }) => ({
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    realWorldUnit: state.image.realWorldUnit,
    paperPresetType: state.image.paperPresetType,
});

// Preset dimensions (for UI display)
export const selectImagePresetWidth = (state: { image: ImageState }) => state.image.presetWidth;
export const selectImagePresetHeight = (state: { image: ImageState }) => state.image.presetHeight;
export const selectImagePresetUnit = (state: { image: ImageState }) => state.image.presetUnit;

export const selectFormattedWidth = (state: { image: ImageState }) =>
    formatDimension(state.image.width, state.image.unit);

export const selectFormattedHeight = (state: { image: ImageState }) =>
    formatDimension(state.image.height, state.image.unit);

export const selectFormattedPresetWidth = (state: { image: ImageState }) =>
    formatDimension(state.image.presetWidth, state.image.presetUnit);

export const selectFormattedPresetHeight = (state: { image: ImageState }) =>
    formatDimension(state.image.presetHeight, state.image.presetUnit);

export const selectFormattedDimensions = (state: { image: ImageState }) => ({
    width: formatDimension(state.image.width, state.image.unit),
    height: formatDimension(state.image.height, state.image.unit),
    widthRaw: state.image.width,
    heightRaw: state.image.height,
    unit: state.image.unit,
    realWorldWidth: formatDimension(state.image.realWorldWidth, state.image.realWorldUnit),
    realWorldHeight: formatDimension(state.image.realWorldHeight, state.image.realWorldUnit),
    realWorldUnit: state.image.realWorldUnit,
    presetWidth: formatDimension(state.image.presetWidth, state.image.presetUnit),
    presetHeight: formatDimension(state.image.presetHeight, state.image.presetUnit),
    presetWidthRaw: state.image.presetWidth,
    presetHeightRaw: state.image.presetHeight,
    presetUnit: state.image.presetUnit,
});

export const selectHasValidImage = (state: { image: ImageState }) =>
    isValidUri(state.image.currentImage) && !state.image.error;
export const selectHasUserImage = (state: { image: ImageState }) =>
    state.image.source === "camera" || state.image.source === "gallery";

export const selectImageMetadata = (state: { image: ImageState }) => ({
    width: state.image.width,
    height: state.image.height,
    unit: state.image.unit,
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    realWorldUnit: state.image.realWorldUnit,
    paperPresetType: state.image.paperPresetType,
    presetWidth: state.image.presetWidth,
    presetHeight: state.image.presetHeight,
    presetUnit: state.image.presetUnit,
    aspectRatio: state.image.aspectRatio,
    format: state.image.format,
    fileSize: state.image.fileSize,
    fileName: state.image.fileName,
});

export const selectImageWithMeta = (state: { image: ImageState }) => ({
    uri: state.image.currentImage,
    source: state.image.source,
    isDefault: state.image.source === "default",
    isLoading: state.image.isLoading,
    hasError: !!state.image.error,
    width: state.image.width,
    height: state.image.height,
    unit: state.image.unit,
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    realWorldUnit: state.image.realWorldUnit,
    paperPresetType: state.image.paperPresetType,
    presetWidth: state.image.presetWidth,
    presetHeight: state.image.presetHeight,
    presetUnit: state.image.presetUnit,
    aspectRatio: state.image.aspectRatio,
    format: state.image.format,
    fileSize: state.image.fileSize,
    fileName: state.image.fileName,
    formattedWidth: formatDimension(state.image.width, state.image.unit),
    formattedHeight: formatDimension(state.image.height, state.image.unit),
    formattedPresetWidth: formatDimension(state.image.presetWidth, state.image.presetUnit),
    formattedPresetHeight: formatDimension(state.image.presetHeight, state.image.presetUnit),
    formattedRealWorldWidth: formatDimension(state.image.realWorldWidth, state.image.realWorldUnit),
    formattedRealWorldHeight: formatDimension(state.image.realWorldHeight, state.image.realWorldUnit),
});

export const checkDefaultImageAvailable = (): boolean => {
    try {
        const uri = getOrInitDefaultUri();
        return isValidUri(uri);
    } catch {
        return false;
    }
};

export const {
    setImage,
    setImageMetadata,
    setDimensionUnits,
    convertDimensions,
    setPresetDimensions,
    setImageLoading,
    setImageError,
    clearImage,
    clearImageError,
    retryDefaultImage,
    validateCurrentImage,
    replaceImage,
} = imageSlice.actions;

export default imageSlice.reducer;

// Type exports for use in components
export type { ImageState, SetImagePayload, DimensionUnit, PaperPreset };
export { isValidUri, extractImageFormat, extractFileName, convertDimensionUnit, formatDimension };
