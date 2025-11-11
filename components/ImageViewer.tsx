import React, { useEffect, useState } from "react";
import { StyleSheet, View, Dimensions, Image as RNImage, Text } from "react-native";
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

    // Animated values for pan and zoom
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

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
                    { tintColor: '#888888', opacity: 0.8 }
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
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[styles.imageContainer, animatedStyle]}>
                                <Image
                                    source={{ uri: currentImage }}
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
