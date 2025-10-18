// import React, { useEffect, useRef, useState, useMemo } from "react";
// import {
//     View,
//     Text,
//     Modal,
//     Pressable,
//     StyleSheet,
//     Dimensions,
//     PanResponder,
//     GestureResponderEvent,
//     PanResponderGestureState,
//     Alert,
//     Platform,
//     ScrollView,
// } from "react-native";
// import { Image as ExpoImage } from "expo-image";
// import { useSelector, useDispatch } from "react-redux";
// import { RootState } from "../app/store/store";
// import * as ImageManipulator from "expo-image-manipulator";
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { RatioPreset } from "../app/store/slices/imageEditSlice";



// // redux actions:
// import {
//     rotateLeft,
//     rotateRight,
//     toggleFlipHorizontal,
//     toggleFlipVertical,
//     setCropRect,
//     setEditedUri,
//     setRatioPreset,
//     resetCropRect,
// } from "../app/store/slices/imageEditSlice";

// const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
// const PREVIEW_MAX_W = SCREEN_W * 0.95;
// const PREVIEW_MAX_H = SCREEN_H * 0.65; // Reduced to accommodate toolbar

// // Aspect ratio presets
// const ASPECT_RATIOS: { label: string; value: number | null; preset: RatioPreset }[] = [
//     { label: "Original", value: null, preset: "ORIGINAL" },
//     { label: "A4", value: 210 / 297, preset: "A4" },
//     { label: "A3", value: 297 / 420, preset: "A3" },
//     { label: "A2", value: 420 / 594, preset: "A2" },
//     { label: "A1", value: 594 / 841, preset: "A1" },
//     { label: "Square", value: 1, preset: "SQUARE" },
//     { label: "16:9", value: 16 / 9, preset: "RATIO_16_9" },
//     { label: "4:3", value: 4 / 3, preset: "RATIO_4_3" },
// ];


// type Props = {
//     isVisible: boolean;
//     imageUri?: string | null;
//     onModalClose: () => void;
// };

// export default function AfterImageUploadModal({ isVisible, imageUri, onModalClose }: Props) {
//     const dispatch = useDispatch();
//     const globalImageUri = useSelector((s: RootState) => s.image.currentImage);
//     const imageToEdit = imageUri || globalImageUri;
//     const editState = useSelector((s: RootState) => s.imageEdit);

//     // UI States
//     const [showRatioDropdown, setShowRatioDropdown] = useState(false);
//     const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
//     const [scale, setScale] = useState(1);
//     const [panX, setPanX] = useState(0);
//     const [panY, setPanY] = useState(0);

//     // Image dimensions
//     const [displayW, setDisplayW] = useState<number>(PREVIEW_MAX_W);
//     const [displayH, setDisplayH] = useState<number>(PREVIEW_MAX_H);
//     const [naturalW, setNaturalW] = useState<number | null>(null);
//     const [naturalH, setNaturalH] = useState<number | null>(null);

//     // Working rect (normalized), synced with Redux
//     const workingRectRef = useRef(editState.cropRect);
//     const initialRectRef = useRef(editState.cropRect);

//     useEffect(() => {
//         workingRectRef.current = editState.cropRect;
//         initialRectRef.current = editState.cropRect;
//     }, [isVisible, editState.cropRect]);

//     // When modal opens, reset crop box
//     useEffect(() => {
//         if (!imageToEdit) return;

//         const presetRatio = selectedRatio.value || (naturalW && naturalH ? naturalW / naturalH : 1);
//         let widthNorm = 0.8;
//         let heightNorm = widthNorm / presetRatio;
//         if (heightNorm > 0.9) {
//             heightNorm = 0.9;
//             widthNorm = heightNorm * presetRatio;
//         }
//         const x = (1 - widthNorm) / 2;
//         const y = (1 - heightNorm) / 2;
//         const initial = { x, y, width: widthNorm, height: heightNorm };

//         dispatch(resetCropRect());
//         dispatch(setCropRect(initial));
//     }, [imageToEdit, isVisible, selectedRatio, naturalW, naturalH]);

//     // Image zoom and pan responder
//     const imagePanResponder = useMemo(() =>
//         PanResponder.create({
//             onStartShouldSetPanResponder: () => true,
//             onMoveShouldSetPanResponder: () => true,
//             onPanResponderMove: (_evt, gesture) => {
//                 setPanX(panX + gesture.dx);
//                 setPanY(panY + gesture.dy);
//             },
//         }),
//         [panX, panY]
//     );

//     // Helper functions
//     const normalizedToDisplayRect = useMemo(
//         () => (r: { x: number; y: number; width: number; height: number }) => ({
//             x: r.x * displayW,
//             y: r.y * displayH,
//             width: r.width * displayW,
//             height: r.height * displayH,
//         }),
//         [displayW, displayH]
//     );

//     function normalizedToOriginalRect(r: {
//         x: number;
//         y: number;
//         width: number;
//         height: number;
//     }) {
//         if (!naturalW || !naturalH) return null;
//         const scaleX = naturalW / displayW;
//         const scaleY = naturalH / displayH;
//         const x = Math.round(r.x * displayW * scaleX);
//         const y = Math.round(r.y * displayH * scaleY);
//         const w = Math.round(r.width * displayW * scaleX);
//         const h = Math.round(r.height * displayH * scaleY);
//         return { x, y, w, h };
//     }

//     // Crop area drag responder
//     const dragResponder = useMemo(() =>
//         PanResponder.create({
//             onStartShouldSetPanResponder: () => true,
//             onMoveShouldSetPanResponder: () => true,
//             onPanResponderGrant: () => {
//                 initialRectRef.current = { ...workingRectRef.current };
//             },
//             onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
//                 const dx = gesture.dx / displayW;
//                 const dy = gesture.dy / displayH;
//                 const initial = initialRectRef.current;
//                 let r = { ...initial };
//                 r.x = Math.max(0, Math.min(1 - r.width, initial.x + dx));
//                 r.y = Math.max(0, Math.min(1 - r.height, initial.y + dy));
//                 workingRectRef.current = r;
//                 dispatch(setCropRect(r));
//             },
//         }),
//         [displayW, displayH]
//     );

//     // Corner resize responder factory
//     function makeCornerResponder(corner: "br" | "bl" | "tr" | "tl") {
//         return PanResponder.create({
//             onStartShouldSetPanResponder: () => true,
//             onMoveShouldSetPanResponder: () => true,
//             onPanResponderGrant: () => {
//                 initialRectRef.current = { ...workingRectRef.current };
//             },
//             onPanResponderMove: (_evt, gesture) => {
//                 const dx = gesture.dx / displayW;
//                 const dy = gesture.dy / displayH;
//                 const initial = initialRectRef.current;
//                 let r = { ...initial };
//                 const ratio = selectedRatio.value || r.width / r.height || 1;

//                 let signX = corner === "br" || corner === "tr" ? 1 : -1;
//                 let signY = corner === "br" || corner === "bl" ? 1 : -1;
//                 let deltaW = signX * dx;
//                 let newWidth = r.width + deltaW;
//                 let newHeight = selectedRatio.value ? newWidth / ratio : r.height + signY * dy;

//                 if (selectedRatio.value) {
//                     const altHeight = r.height + signY * dy;
//                     const altWidth = altHeight * ratio;
//                     if (Math.abs(altHeight - newHeight) > Math.abs(altWidth - newWidth)) {
//                         newWidth = altWidth;
//                         newHeight = altHeight;
//                     }
//                 }

//                 newWidth = Math.max(0.1, Math.min(1, newWidth));
//                 newHeight = Math.max(0.1, Math.min(1, newHeight));

//                 let newX = r.x;
//                 let newY = r.y;
//                 if (signX < 0) newX = r.x + (r.width - newWidth);
//                 if (signY < 0) newY = r.y + (r.height - newHeight);

//                 newX = Math.max(0, Math.min(1 - newWidth, newX));
//                 newY = Math.max(0, Math.min(1 - newHeight, newY));

//                 const updated = { x: newX, y: newY, width: newWidth, height: newHeight };
//                 workingRectRef.current = updated;
//                 dispatch(setCropRect(updated));
//             },
//         });
//     }

//     const brResponder = useMemo(() => makeCornerResponder("br"), [displayW, displayH, selectedRatio]);
//     const blResponder = useMemo(() => makeCornerResponder("bl"), [displayW, displayH, selectedRatio]);
//     const trResponder = useMemo(() => makeCornerResponder("tr"), [displayW, displayH, selectedRatio]);
//     const tlResponder = useMemo(() => makeCornerResponder("tl"), [displayW, displayH, selectedRatio]);

//     // Action handlers
//     const handleRatioSelect = (ratio: typeof ASPECT_RATIOS[0]) => {
//         setSelectedRatio(ratio);
//         setShowRatioDropdown(false);
//         if (ratio.value !== null) {
//             dispatch(setRatioPreset({ preset: ratio.preset, ratio: ratio.value }));
//         } else {
//             dispatch(setRatioPreset({ preset: "ORIGINAL", ratio: naturalW && naturalH ? naturalW / naturalH : 1 }));
//         }
//     };

//     const handleRotate = () => {
//         dispatch(rotateRight());
//     };

//     const handleFlipHorizontal = () => {
//         dispatch(toggleFlipHorizontal());
//     };

//     const handleFlipVertical = () => {
//         dispatch(toggleFlipVertical());
//     };

//     const handleZoom = (zoomIn: boolean) => {
//         const newScale = zoomIn ? Math.min(scale * 1.2, 3) : Math.max(scale * 0.8, 0.5);
//         setScale(newScale);
//     };

//     const resetZoomAndPan = () => {
//         setScale(1);
//         setPanX(0);
//         setPanY(0);
//     };

//     const handleCrop = async () => {
//         try {
//             const r = workingRectRef.current || editState.cropRect;
//             const originalRect = normalizedToOriginalRect(r);
//             if (!originalRect || !imageToEdit) {
//                 Alert.alert("Crop failed", "Could not determine crop area.");
//                 return;
//             }

//             const actions: ImageManipulator.Action[] = [
//                 {
//                     crop: {
//                         originX: originalRect.x,
//                         originY: originalRect.y,
//                         width: originalRect.w,
//                         height: originalRect.h,
//                     }
//                 }
//             ];

//             if (editState.rotateDeg) {
//                 actions.push({ rotate: editState.rotateDeg });
//             }

//             if (editState.flip.horizontal) {
//                 actions.push({ flip: ImageManipulator.FlipType.Horizontal });
//             }
//             if (editState.flip.vertical) {
//                 actions.push({ flip: ImageManipulator.FlipType.Vertical });
//             }

//             const result = await ImageManipulator.manipulateAsync(
//                 imageToEdit,
//                 actions,
//                 { compress: 1, format: ImageManipulator.SaveFormat.PNG }
//             );

//             if (result && result.uri) {
//                 dispatch(setEditedUri(result.uri));
//                 onModalClose();
//             } else {
//                 Alert.alert("Error", "Failed to process image.");
//             }
//         } catch (err: any) {
//             console.warn(err);
//             Alert.alert("Error", err?.message || "Something went wrong while processing the image.");
//         }
//     };

//     if (!imageToEdit) {
//         return null;
//     }

//     const currentCrop = editState.cropRect;
//     const displayCrop = normalizedToDisplayRect(currentCrop);

//     return (
//         <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={onModalClose}>
//             <View style={styles.modalContainer}>
//                 {/* Header with back button */}
//                 <View style={styles.header}>
//                     <Pressable onPress={onModalClose} style={styles.backButton}>
//                         <Ionicons name="arrow-back" size={24} color="#fff" />
//                     </Pressable>
//                     <Text style={styles.headerTitle}>Edit Image</Text>
//                     <View style={styles.headerSpacer} />
//                 </View>

//                 {/* Top Toolbar */}
//                 <View style={styles.toolbar}>
//                     {/* Aspect Ratio Dropdown */}
//                     <View style={styles.dropdownContainer}>
//                         <Pressable
//                             style={styles.dropdownButton}
//                             onPress={() => setShowRatioDropdown(!showRatioDropdown)}
//                         >
//                             <Text style={styles.dropdownText}>{selectedRatio.label}</Text>
//                             <MaterialIcons
//                                 name={showRatioDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
//                                 size={20}
//                                 color="#fff"
//                             />
//                         </Pressable>
//                         {showRatioDropdown && (
//                             <View style={styles.dropdown}>
//                                 <ScrollView style={styles.dropdownScroll}>
//                                     {ASPECT_RATIOS.map((ratio, index) => (
//                                         <Pressable
//                                             key={index}
//                                             style={[
//                                                 styles.dropdownItem,
//                                                 selectedRatio.preset === ratio.preset && styles.dropdownItemSelected
//                                             ]}
//                                             onPress={() => handleRatioSelect(ratio)}
//                                         >
//                                             <Text style={[
//                                                 styles.dropdownItemText,
//                                                 selectedRatio.preset === ratio.preset && styles.dropdownItemTextSelected
//                                             ]}>
//                                                 {ratio.label}
//                                             </Text>
//                                         </Pressable>
//                                     ))}
//                                 </ScrollView>
//                             </View>
//                         )}
//                     </View>

//                     {/* Action Buttons */}
//                     <View style={styles.actionButtons}>
//                         <Pressable style={styles.actionButton} onPress={handleRotate}>
//                             <Ionicons name="refresh" size={20} color="#fff" />
//                         </Pressable>

//                         <Pressable style={styles.actionButton} onPress={handleFlipHorizontal}>
//                             <MaterialIcons name="flip" size={20} color="#fff" />
//                         </Pressable>

//                         <Pressable style={styles.actionButton} onPress={handleFlipVertical}>
//                             <MaterialIcons name="flip" size={20} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />
//                         </Pressable>

//                         <Pressable style={styles.actionButton} onPress={() => handleZoom(true)}>
//                             <Ionicons name="add" size={20} color="#fff" />
//                         </Pressable>

//                         <Pressable style={styles.actionButton} onPress={() => handleZoom(false)}>
//                             <Ionicons name="remove" size={20} color="#fff" />
//                         </Pressable>

//                         <Pressable style={styles.actionButton} onPress={resetZoomAndPan}>
//                             <MaterialIcons name="center-focus-strong" size={20} color="#fff" />
//                         </Pressable>
//                     </View>
//                 </View>

//                 {/* Image Preview Area */}
//                 <View style={styles.previewContainer}>
//                     <View style={[styles.previewBox, { width: displayW, height: displayH }]}>
//                         <View style={[
//                             styles.imageContainer,
//                             {
//                                 transform: [
//                                     { translateX: panX },
//                                     { translateY: panY },
//                                     { scale: scale }
//                                 ]
//                             }
//                         ]} {...imagePanResponder.panHandlers}>
//                             <ExpoImage
//                                 source={{ uri: imageToEdit }}
//                                 style={{ width: displayW, height: displayH }}
//                                 contentFit="contain"
//                                 onLoad={(event) => {
//                                     const { width: w, height: h } = event.source;
//                                     setNaturalW(w);
//                                     setNaturalH(h);

//                                     const imageAspect = w / h;
//                                     let finalW = PREVIEW_MAX_W;
//                                     let finalH = finalW / imageAspect;
//                                     if (finalH > PREVIEW_MAX_H) {
//                                         finalH = PREVIEW_MAX_H;
//                                         finalW = finalH * imageAspect;
//                                     }

//                                     setDisplayW(finalW);
//                                     setDisplayH(finalH);
//                                 }}
//                             />
//                         </View>

//                         {/* Grid Overlay */}
//                         <View style={styles.gridOverlay} pointerEvents="none">
//                             {/* Horizontal grid lines */}
//                             {[1, 2].map(i => (
//                                 <View
//                                     key={`h${i}`}
//                                     style={[
//                                         styles.gridLine,
//                                         styles.horizontalLine,
//                                         { top: `${(i * 100) / 3}%` }
//                                     ]}
//                                 />
//                             ))}
//                             {/* Vertical grid lines */}
//                             {[1, 2].map(i => (
//                                 <View
//                                     key={`v${i}`}
//                                     style={[
//                                         styles.gridLine,
//                                         styles.verticalLine,
//                                         { left: `${(i * 100) / 3}%` }
//                                     ]}
//                                 />
//                             ))}
//                         </View>

//                         {/* Crop Overlay */}
//                         <View
//                             style={[
//                                 styles.cropOverlay,
//                                 {
//                                     left: displayCrop.x,
//                                     top: displayCrop.y,
//                                     width: displayCrop.width,
//                                     height: displayCrop.height,
//                                 },
//                             ]}
//                             pointerEvents="box-none"
//                         >
//                             {/* Crop area drag handle */}
//                             <View style={styles.cropInner} {...dragResponder.panHandlers} />

//                             {/* Corner handles */}
//                             <View style={[styles.corner, styles.tl]} {...tlResponder.panHandlers} />
//                             <View style={[styles.corner, styles.tr]} {...trResponder.panHandlers} />
//                             <View style={[styles.corner, styles.bl]} {...blResponder.panHandlers} />
//                             <View style={[styles.corner, styles.br]} {...brResponder.panHandlers} />
//                         </View>
//                     </View>
//                 </View>

//                 {/* Bottom Action Bar */}
//                 <View style={styles.bottomBar}>
//                     <Pressable style={styles.cancelButton} onPress={onModalClose}>
//                         <Text style={styles.cancelText}>Cancel</Text>
//                     </Pressable>

//                     <Pressable style={styles.cropButton} onPress={handleCrop}>
//                         <Text style={styles.cropButtonText}>CROP</Text>
//                     </Pressable>
//                 </View>
//             </View>
//         </Modal>
//     );
// }

// const styles = StyleSheet.create({
//     modalContainer: {
//         flex: 1,
//         backgroundColor: "#000",
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 16,
//         paddingTop: Platform.OS === 'ios' ? 44 : 24,
//         paddingBottom: 16,
//         backgroundColor: '#000',
//     },
//     backButton: {
//         padding: 8,
//     },
//     headerTitle: {
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: '600',
//     },
//     headerSpacer: {
//         width: 40,
//     },
//     toolbar: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: '#111',
//         borderBottomWidth: 1,
//         borderBottomColor: '#333',
//     },
//     dropdownContainer: {
//         position: 'relative',
//         zIndex: 1000,
//     },
//     dropdownButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#333',
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderRadius: 6,
//         minWidth: 100,
//     },
//     dropdownText: {
//         color: '#fff',
//         fontSize: 14,
//         marginRight: 8,
//     },
//     dropdown: {
//         position: 'absolute',
//         top: 40,
//         left: 0,
//         right: 0,
//         backgroundColor: '#333',
//         borderRadius: 6,
//         maxHeight: 200,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.8,
//         shadowRadius: 4,
//         elevation: 5,
//     },
//     dropdownScroll: {
//         maxHeight: 200,
//     },
//     dropdownItem: {
//         paddingHorizontal: 12,
//         paddingVertical: 10,
//         borderBottomWidth: 1,
//         borderBottomColor: '#444',
//     },
//     dropdownItemSelected: {
//         backgroundColor: '#007AFF',
//     },
//     dropdownItemText: {
//         color: '#fff',
//         fontSize: 14,
//     },
//     dropdownItemTextSelected: {
//         fontWeight: '600',
//     },
//     actionButtons: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     actionButton: {
//         padding: 10,
//         marginLeft: 8,
//         backgroundColor: '#333',
//         borderRadius: 6,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     previewContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#000',
//     },
//     previewBox: {
//         position: 'relative',
//         backgroundColor: '#111',
//         overflow: 'hidden',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     imageContainer: {
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     gridOverlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//     },
//     gridLine: {
//         position: 'absolute',
//         backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     },
//     horizontalLine: {
//         left: 0,
//         right: 0,
//         height: 1,
//     },
//     verticalLine: {
//         top: 0,
//         bottom: 0,
//         width: 1,
//     },
//     cropOverlay: {
//         position: 'absolute',
//         borderColor: '#fff',
//         borderWidth: 2,
//     },
//     cropInner: {
//         flex: 1,
//         backgroundColor: 'transparent',
//     },
//     corner: {
//         position: 'absolute',
//         width: 24,
//         height: 24,
//         backgroundColor: '#fff',
//         borderRadius: 12,
//         borderWidth: 2,
//         borderColor: '#000',
//     },
//     tl: { left: -12, top: -12 },
//     tr: { right: -12, top: -12 },
//     bl: { left: -12, bottom: -12 },
//     br: { right: -12, bottom: -12 },
//     bottomBar: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 20,
//         paddingVertical: 16,
//         backgroundColor: '#111',
//         borderTopWidth: 1,
//         borderTopColor: '#333',
//     },
//     cancelButton: {
//         paddingHorizontal: 20,
//         paddingVertical: 12,
//     },
//     cancelText: {
//         color: '#fff',
//         fontSize: 16,
//     },
//     cropButton: {
//         backgroundColor: '#fff',
//         paddingHorizontal: 32,
//         paddingVertical: 12,
//         borderRadius: 25,
//     },
//     cropButtonText: {
//         color: '#000',
//         fontSize: 16,
//         fontWeight: '600',
//     },
// });


// as of now we don't need this  feature