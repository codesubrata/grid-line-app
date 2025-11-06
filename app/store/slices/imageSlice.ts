import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Image } from "react-native";


// Import the default image from assets
const DefaultImage = require("@/assets/images/background-image.png");


// Define dimension unit type - keeping px for internal use, but real-world is cm only
type DimensionUnit = "px" | "cm";


// Paper size types - A0 to A5 presets + CUSTOM
type PaperPreset = "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "CUSTOM";


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


    // Real-world/paper data for accurate overlays (always in cm)
    realWorldWidth?: number;
    realWorldHeight?: number;
    realWorldUnit: "cm"; // Always cm now
    paperPresetType?: PaperPreset;


    // Preset for UI display (always in cm)
    presetWidth?: number;
    presetHeight?: number;
    presetUnit: "cm"; // Always cm now


    // MIME type for reference
    mimeType?: string;
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


// Simplified conversion - only px to cm and cm to px
function convertDimensionUnit(value: number, fromUnit: DimensionUnit, toUnit: DimensionUnit): number {
    if (fromUnit === toUnit) return value;


    // Conversion factors (96 DPI standard)
    const CM_TO_PX = 37.795275591;


    if (fromUnit === 'px' && toUnit === 'cm') {
        return value / CM_TO_PX;
    } else if (fromUnit === 'cm' && toUnit === 'px') {
        return value * CM_TO_PX;
    }


    return value;
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
    realWorldUnit: "cm",
    paperPresetType: undefined,
    presetWidth: undefined,
    presetHeight: undefined,
    presetUnit: "cm",
    mimeType: undefined,
};


interface SetImagePayload {
    uri: string;
    source: "camera" | "gallery";


    width?: number;
    height?: number;
    unit?: DimensionUnit;


    // Real-world correspondence (always in cm)
    realWorldWidth?: number;
    realWorldHeight?: number;
    realWorldUnit?: "cm";
    paperPresetType?: PaperPreset; // Now includes "CUSTOM"


    presetWidth?: number;
    presetHeight?: number;
    presetUnit?: "cm";


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
                realWorldUnit = "cm",
                paperPresetType,
                presetWidth,
                presetHeight,
                presetUnit = "cm",
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
            state.mimeType = mimeType;


            state.realWorldWidth = realWorldWidth;
            state.realWorldHeight = realWorldHeight;
            state.realWorldUnit = "cm"; // Always cm
            state.paperPresetType = paperPresetType; // Can be A0-A5 or CUSTOM


            state.presetWidth = presetWidth ?? realWorldWidth;
            state.presetHeight = presetHeight ?? realWorldHeight;
            state.presetUnit = "cm"; // Always cm
        },


        setImageMetadata: (
            state,
            action: PayloadAction<{
                width?: number;
                height?: number;
                unit?: DimensionUnit;
                realWorldWidth?: number;
                realWorldHeight?: number;
                paperPresetType?: PaperPreset;
                presetWidth?: number;
                presetHeight?: number;
                format?: string;
                fileSize?: number;
                fileName?: string;
                mimeType?: string;
            }>
        ) => {
            const {
                width, height, unit,
                realWorldWidth, realWorldHeight, paperPresetType,
                presetWidth, presetHeight,
                format, fileSize, fileName, mimeType
            } = action.payload;


            if (width !== undefined) state.width = width;
            if (height !== undefined) state.height = height;
            if (unit !== undefined) state.unit = unit;
            if (format !== undefined) state.format = format;
            if (fileSize !== undefined) state.fileSize = fileSize;
            if (fileName !== undefined) state.fileName = fileName;
            if (mimeType !== undefined) state.mimeType = mimeType;


            if (realWorldWidth !== undefined) state.realWorldWidth = realWorldWidth;
            if (realWorldHeight !== undefined) state.realWorldHeight = realWorldHeight;
            if (paperPresetType !== undefined) state.paperPresetType = paperPresetType;


            if (presetWidth !== undefined) state.presetWidth = presetWidth;
            if (presetHeight !== undefined) state.presetHeight = presetHeight;


            if (state.width && state.height) {
                state.aspectRatio = state.width / state.height;
            }
        },


        setPresetDimensions: (
            state,
            action: PayloadAction<{
                presetWidth?: number;
                presetHeight?: number;
                paperPresetType?: PaperPreset;
            }>
        ) => {
            const { presetWidth, presetHeight, paperPresetType } = action.payload;
            if (presetWidth !== undefined) state.presetWidth = presetWidth;
            if (presetHeight !== undefined) state.presetHeight = presetHeight;
            if (paperPresetType !== undefined) state.paperPresetType = paperPresetType;
        },


        updateRealWorldDimensions: (
            state,
            action: PayloadAction<{
                realWorldWidth?: number;
                realWorldHeight?: number;
                paperPresetType?: PaperPreset;
            }>
        ) => {
            const { realWorldWidth, realWorldHeight, paperPresetType } = action.payload;
            if (realWorldWidth !== undefined) state.realWorldWidth = realWorldWidth;
            if (realWorldHeight !== undefined) state.realWorldHeight = realWorldHeight;
            if (paperPresetType !== undefined) state.paperPresetType = paperPresetType;

            // Also update preset if real-world changes
            if (realWorldWidth !== undefined) state.presetWidth = realWorldWidth;
            if (realWorldHeight !== undefined) state.presetHeight = realWorldHeight;
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
            state.mimeType = undefined;
            state.realWorldWidth = undefined;
            state.realWorldHeight = undefined;
            state.realWorldUnit = "cm";
            state.paperPresetType = undefined;
            state.presetWidth = undefined;
            state.presetHeight = undefined;
            state.presetUnit = "cm";
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
                state.mimeType = undefined;
                state.realWorldWidth = undefined;
                state.realWorldHeight = undefined;
                state.realWorldUnit = "cm";
                state.paperPresetType = undefined;
                state.presetWidth = undefined;
                state.presetHeight = undefined;
                state.presetUnit = "cm";
            }
        },


        replaceImage: (
            state,
            action: PayloadAction<SetImagePayload>
        ) => {
            imageSlice.caseReducers.setImage(state, action);
        },
    },
});


// Selectors
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
export const selectImageMimeType = (state: { image: ImageState }) => state.image.mimeType;


// Real-world paper dimensions (always in cm)
export const selectPaperSize = (state: { image: ImageState }) => ({
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    realWorldUnit: state.image.realWorldUnit,
    paperPresetType: state.image.paperPresetType,
    isCustom: state.image.paperPresetType === "CUSTOM",
});


// Preset dimensions (always in cm)
export const selectImagePresetWidth = (state: { image: ImageState }) => state.image.presetWidth;
export const selectImagePresetHeight = (state: { image: ImageState }) => state.image.presetHeight;
export const selectImagePresetUnit = (state: { image: ImageState }) => state.image.presetUnit;


export const selectFormattedWidth = (state: { image: ImageState }) =>
    formatDimension(state.image.width, state.image.unit);


export const selectFormattedHeight = (state: { image: ImageState }) =>
    formatDimension(state.image.height, state.image.unit);


export const selectFormattedPresetWidth = (state: { image: ImageState }) =>
    formatDimension(state.image.presetWidth, "cm");


export const selectFormattedPresetHeight = (state: { image: ImageState }) =>
    formatDimension(state.image.presetHeight, "cm");


export const selectFormattedRealWorldWidth = (state: { image: ImageState }) =>
    formatDimension(state.image.realWorldWidth, "cm");


export const selectFormattedRealWorldHeight = (state: { image: ImageState }) =>
    formatDimension(state.image.realWorldHeight, "cm");


export const selectFormattedDimensions = (state: { image: ImageState }) => ({
    width: formatDimension(state.image.width, state.image.unit),
    height: formatDimension(state.image.height, state.image.unit),
    widthRaw: state.image.width,
    heightRaw: state.image.height,
    unit: state.image.unit,
    realWorldWidth: formatDimension(state.image.realWorldWidth, "cm"),
    realWorldHeight: formatDimension(state.image.realWorldHeight, "cm"),
    realWorldUnit: "cm",
    presetWidth: formatDimension(state.image.presetWidth, "cm"),
    presetHeight: formatDimension(state.image.presetHeight, "cm"),
    presetWidthRaw: state.image.presetWidth,
    presetHeightRaw: state.image.presetHeight,
    presetUnit: "cm",
    paperPresetType: state.image.paperPresetType,
    isCustom: state.image.paperPresetType === "CUSTOM",
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
    mimeType: state.image.mimeType,
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
    isCustomPaper: state.image.paperPresetType === "CUSTOM",
    presetWidth: state.image.presetWidth,
    presetHeight: state.image.presetHeight,
    presetUnit: state.image.presetUnit,
    aspectRatio: state.image.aspectRatio,
    format: state.image.format,
    fileSize: state.image.fileSize,
    fileName: state.image.fileName,
    mimeType: state.image.mimeType,
    formattedWidth: formatDimension(state.image.width, state.image.unit),
    formattedHeight: formatDimension(state.image.height, state.image.unit),
    formattedPresetWidth: formatDimension(state.image.presetWidth, "cm"),
    formattedPresetHeight: formatDimension(state.image.presetHeight, "cm"),
    formattedRealWorldWidth: formatDimension(state.image.realWorldWidth, "cm"),
    formattedRealWorldHeight: formatDimension(state.image.realWorldHeight, "cm"),
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
    setPresetDimensions,
    updateRealWorldDimensions,
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
export { isValidUri, extractImageFormat, extractFileName, convertDimensionUnit, formatDimension }