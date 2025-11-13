import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Dimensions, Image as RNImage, Text, Platform } from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { RootState } from '@/app/store/store';
import GridOverlay from './GridOverlay';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageViewerProps {
    maxWidth?: number;
    maxHeight?: number;
}

// Custom image processing utility functions
const ImageProcessor = {
    // Convert image to grayscale using different algorithms
    applyGrayscale: async (imageUri: string, method: 'luminance' | 'average' | 'desaturation' = 'luminance'): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                // For React Native, we'll use a canvas-based approach
                // In a real implementation, you might want to use react-native-canvas or similar
                // This is a simplified version that applies CSS filters where available

                // Since we can't directly manipulate pixels in React Native without additional libraries,
                // we'll use the expo-image-manipulator for actual pixel manipulation
                // For now, we'll use CSS filters for display and provide the utility for when you implement native processing

                // This would be the pixel manipulation logic if using a canvas:
                /*
                const image = new Image();
                image.crossOrigin = 'anonymous';
                image.src = imageUri;
                
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    
                    ctx.drawImage(image, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const red = data[i];
                        const green = data[i + 1];
                        const blue = data[i + 2];
                        
                        let gray;
                        
                        switch (method) {
                            case 'luminance':
                                // Photometric/digital ITU-R recommendation (most accurate)
                                gray = 0.299 * red + 0.587 * green + 0.114 * blue;
                                break;
                            case 'average':
                                // Simple average
                                gray = (red + green + blue) / 3;
                                break;
                            case 'desaturation':
                                // Desaturation method
                                gray = (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;
                                break;
                            default:
                                gray = 0.299 * red + 0.587 * green + 0.114 * blue;
                        }
                        
                        data[i] = gray;     // red
                        data[i + 1] = gray; // green
                        data[i + 2] = gray; // blue
                        // alpha channel (data[i + 3]) remains unchanged
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL());
                };
                
                image.onerror = reject;
                */

                // For React Native, we return the original URI and handle display through filters
                // In a production app, you'd use react-native-image-manipulator or similar
                resolve(imageUri);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Apply different grayscale intensities
    applyGrayscaleWithIntensity: async (imageUri: string, intensity: number): Promise<string> => {
        // Similar to above but with intensity control (0-1)
        // 0 = original, 1 = full grayscale
        return ImageProcessor.applyGrayscale(imageUri, 'luminance');
    }
};

const ImageViewer: React.FC<ImageViewerProps> = ({
    maxWidth = SCREEN_WIDTH,
    maxHeight = SCREEN_HEIGHT
}) => {
    const currentImage = useSelector((state: RootState) => state.image.currentImage);
    const imageEffect = useSelector((state: RootState) => state.imageEdit.imageEffect);
    const isGridVisible = useSelector((state: RootState) => state.imageEdit.isGridVisible);
    const isLocked = useSelector((state: RootState) => state.imageEdit.isLocked);

    const [imageStyle, setImageStyle] = useState({
        width: 0,
        height: 0
    });

    const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Animated values for pan and zoom
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Process image when effect or current image changes
    useEffect(() => {
        let isMounted = true;

        const processImage = async () => {
            if (!currentImage) {
                setProcessedImageUri(null);
                return;
            }

            if (imageEffect === 'grayscale') {
                setIsProcessing(true);
                try {
                    const processedUri = await ImageProcessor.applyGrayscale(currentImage, 'luminance');
                    if (isMounted) {
                        setProcessedImageUri(processedUri);
                    }
                } catch (error) {
                    console.warn("Failed to process image:", error);
                    if (isMounted) {
                        setProcessedImageUri(currentImage); // Fallback to original
                    }
                } finally {
                    if (isMounted) {
                        setIsProcessing(false);
                    }
                }
            } else {
                setProcessedImageUri(null);
            }
        };

        processImage();

        return () => {
            isMounted = false;
        };
    }, [currentImage, imageEffect]);

    useEffect(() => {
        let isMounted = true;
        if (currentImage) {
            RNImage.getSize(
                currentImage,
                (imageWidth, imageHeight) => {
                    if (!isMounted) return;

                    const imageAspectRatio = imageWidth / imageHeight;
                    const availableAspectRatio = maxWidth / maxHeight;

                    let finalWidth: number;
                    let finalHeight: number;

                    // Intelligent scaling logic
                    if (imageAspectRatio > availableAspectRatio) {
                        finalWidth = maxWidth;
                        finalHeight = maxWidth / imageAspectRatio;
                    } else {
                        finalHeight = maxHeight;
                        finalWidth = maxHeight * imageAspectRatio;
                    }

                    if (finalWidth > maxWidth) {
                        finalWidth = maxWidth;
                        finalHeight = finalWidth / imageAspectRatio;
                    }

                    if (finalHeight > maxHeight) {
                        finalHeight = maxHeight;
                        finalWidth = finalHeight * imageAspectRatio;
                    }

                    console.log("📐 Image Scaling:", {
                        original: `${imageWidth}×${imageHeight}`,
                        scaled: `${finalWidth.toFixed(0)}×${finalHeight.toFixed(0)}`,
                        available: `${maxWidth}×${maxHeight}`,
                        imageRatio: imageAspectRatio.toFixed(2),
                        availableRatio: availableAspectRatio.toFixed(2),
                        strategy: imageAspectRatio > availableAspectRatio ? "fit-width" : "fit-height"
                    });

                    setImageStyle({
                        width: finalWidth,
                        height: finalHeight,
                    });
                },
                (error) => {
                    if (!isMounted) return;
                    console.warn("Failed to get image size:", error);
                    setImageStyle({ width: 300, height: 300 });
                }
            );
        }

        return () => {
            isMounted = false;
        };
    }, [currentImage, maxWidth, maxHeight]);

    // Pinch gesture for zoom, disabled when locked
    const pinchGesture = Gesture.Pinch()
        .enabled(!isLocked)
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withSpring(1);
            } else if (scale.value > 5) {
                scale.value = withSpring(5);
            }
            savedScale.value = scale.value;
        });

    // Pan gesture for dragging, disabled when locked
    const panGesture = Gesture.Pan()
        .enabled(!isLocked)
        .onUpdate((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    // Double tap gesture for zoom in/out, disabled when locked
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .enabled(!isLocked)
        .onEnd(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                scale.value = withTiming(2);
                savedScale.value = 2;
            }
        });

    const composedGesture = Gesture.Simultaneous(
        Gesture.Race(doubleTapGesture, pinchGesture),
        panGesture
    );

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    const getImageStyle = () => {
        const baseStyle = [styles.image, imageStyle];

        switch (imageEffect) {
            case 'grayscale':
                return [
                    ...baseStyle,
                    styles.grayscaleFilter,
                    { filter: 'grayscale(100%)' } // CSS filter for web fallback
                ];
            default:
                return baseStyle;
        }
    };

    const getImageSource = () => {
        // Use processed image if available and effect is applied
        if (imageEffect === 'grayscale' && processedImageUri) {
            return { uri: processedImageUri };
        }
        return { uri: currentImage };
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageSection}>
                <View style={styles.imageWrapper}>
                    {currentImage ? (
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[styles.imageContainer, animatedStyle]}>
                                {isProcessing && (
                                    <View style={styles.processingOverlay}>
                                        <Text style={styles.processingText}>Processing...</Text>
                                    </View>
                                )}
                                <Image
                                    source={getImageSource()}
                                    style={getImageStyle()}
                                    contentFit="contain"
                                    transition={200}
                                />

                                {isGridVisible && imageStyle.width > 0 && imageStyle.height > 0 && (
                                    <GridOverlay
                                        containerWidth={imageStyle.width}
                                        containerHeight={imageStyle.height}
                                        visible={true}
                                    />
                                )}
                            </Animated.View>
                        </GestureDetector>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <View style={styles.placeholder}>
                                <Text style={styles.placeholderText}>No Image Selected</Text>
                                <Text style={styles.placeholderSubtext}>
                                    Go to Home tab to select an image
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ImageViewer;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },

    imageSection: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        backgroundColor: "transparent",
    },

    imageWrapper: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },

    imageContainer: {
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },

    image: {
        backgroundColor: "transparent",
    },

    grayscaleFilter: {
        // React Native doesn't support CSS filters directly
        // We rely on the processed image or platform-specific implementations
        // For web, the CSS filter will work
        // For native, you might need to use a different approach
    },

    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 8,
    },

    processingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    placeholderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },

    placeholder: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderStyle: "dashed",
    },

    placeholderText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#8E8E93",
        marginBottom: 8,
        textAlign: "center",
    },

    placeholderSubtext: {
        fontSize: 14,
        color: "#48484A",
        textAlign: "center",
        lineHeight: 20,
    },

    gridOverlay: {
        position: "absolute",
        backgroundColor: "transparent",
        borderRadius: 8,
    },

    editOverlay: {
        position: "absolute",
        backgroundColor: "transparent",
        borderRadius: 8,
    },
});

// Export the image processor for use in other components
export { ImageProcessor };