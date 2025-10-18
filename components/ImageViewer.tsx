import React, { useEffect, useState } from "react";
import { StyleSheet, View, Dimensions, Image as RNImage, Text } from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { RootState } from '@/app/store/store';
import GridOverlay from './GridOverlay'; // Import the GridOverlay component

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ImageViewer = () => {
    const currentImage = useSelector((state: RootState) => state.image.currentImage);

    // Get imageEffect from Redux state ('none' or 'grayscale' expected)
    const imageEffect = useSelector((state: RootState) => state.imageEdit.imageEffect);

    // Get grid visibility from Redux
    const isGridVisible = useSelector((state: RootState) => state.imageEdit.isGridVisible);

    // Image sizing state for centered display at actual size
    const [imageStyle, setImageStyle] = useState({
        width: 0,
        height: 0
    });

    useEffect(() => {
        let isMounted = true;
        if (currentImage) {
            RNImage.getSize(
                currentImage,
                (imageWidth, imageHeight) => {
                    if (!isMounted) return;

                    let finalWidth = imageWidth;
                    let finalHeight = imageHeight;

                    const maxWidth = SCREEN_WIDTH;
                    const maxHeight = SCREEN_HEIGHT;

                    if (finalWidth > maxWidth || finalHeight > maxHeight) {
                        const aspectRatio = imageWidth / imageHeight;
                        if (finalWidth > maxWidth) {
                            finalWidth = maxWidth;
                            finalHeight = finalWidth / aspectRatio;
                        }
                        if (finalHeight > maxHeight) {
                            finalHeight = maxHeight;
                            finalWidth = finalHeight * aspectRatio;
                        }
                    }

                    if (finalWidth < maxWidth) {
                        const aspectRatio = imageWidth / imageHeight;
                        finalWidth = maxWidth;
                        finalHeight = finalWidth / aspectRatio;
                    }

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
    }, [currentImage]);

    // Apply image effects through style filters
    const getImageStyle = () => {
        const baseStyle = [styles.image, imageStyle];

        // Apply effects based on Redux state
        switch (imageEffect) {
            case 'grayscale':
                return [
                    ...baseStyle,
                    { tintColor: '#888888', opacity: 0.8 } // Simple grayscale effect
                ];
            default:
                return baseStyle;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageSection}>
                <View style={styles.imageWrapper}>
                    {currentImage ? (
                        <View style={styles.imageContainer}>
                            {/* Main Image */}
                            <Image
                                source={{ uri: currentImage }}
                                style={getImageStyle()}
                                contentFit="contain"
                                transition={200}
                            />

                            {/* Grid Overlay - Positioned absolutely over the image */}
                            {isGridVisible && imageStyle.width > 0 && imageStyle.height > 0 && (
                                <GridOverlay
                                    containerWidth={imageStyle.width}
                                    containerHeight={imageStyle.height}
                                    visible={true}
                                />
                            )}
                        </View>
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

    // New container to hold both image and grid overlay
    imageContainer: {
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },

    image: {
        backgroundColor: "transparent",
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

    // Keep these for potential future use
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
