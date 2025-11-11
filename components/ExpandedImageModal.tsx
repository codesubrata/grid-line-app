import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    Pressable,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ImageViewer from './ImageViewer';
import { lockPage, unlockPage } from '@/app/store/slices/imageEditSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface ExpandedImageModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ExpandedImageModal: React.FC<ExpandedImageModalProps> = ({ visible, onClose }) => {
    const dispatch = useDispatch();
    const isLocked = useSelector((state: any) => state.imageEdit.isLocked);

    const toggleLock = () => {
        if (isLocked) {
            dispatch(unlockPage());
            Alert.alert('Unlocked', 'Page is now unlocked.');
        } else {
            dispatch(lockPage());
            Alert.alert('Locked', 'Page is now locked. Pan/zoom and other actions are disabled except expand and create new project.');
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <StatusBar hidden={visible} />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.topControls}>
                            {/* Lock Toggle Button */}
                            <Pressable
                                style={[styles.lockButton, isLocked ? styles.locked : styles.unlocked]}
                                onPress={toggleLock}
                                android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 25 }}
                            >
                                <MaterialIcons
                                    name={isLocked ? 'lock' : 'lock-open'}
                                    size={28}
                                    color={isLocked ? '#FF4B4B' : '#4CAF50'}
                                />
                            </Pressable>

                            {/* Expand/Collapse Button */}
                            <Pressable
                                style={styles.expandButton}
                                onPress={onClose}
                                android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 25 }}
                            >
                                <MaterialIcons name="fullscreen-exit" size={28} color="#007AFF" />
                            </Pressable>
                        </View>

                        <View style={[styles.imageViewerContainer, {
                            top: 0,
                            left: 0,
                            width: screenWidth,
                            height: screenHeight,
                        }]}>
                            {/* Pass maxWidth and maxHeight to ImageViewer */}
                            <ImageViewer maxWidth={screenWidth} maxHeight={screenHeight} />
                        </View>


                        <View style={styles.bottomControls}>
                            <Pressable
                                style={styles.controlButton}
                                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                                disabled={isLocked}
                            >
                                <MaterialIcons name="zoom-in" size={24} color={isLocked ? '#888' : '#FFFFFF'} />
                            </Pressable>

                            <Pressable
                                style={styles.controlButton}
                                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                                disabled={isLocked}
                            >
                                <MaterialIcons name="zoom-out" size={24} color={isLocked ? '#888' : '#FFFFFF'} />
                            </Pressable>

                            <Pressable
                                style={styles.controlButton}
                                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                                disabled={isLocked}
                            >
                                <MaterialIcons name="rotate-right" size={24} color={isLocked ? '#888' : '#FFFFFF'} />
                            </Pressable>

                            <Pressable
                                style={styles.controlButton}
                                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                                disabled={isLocked}
                            >
                                <MaterialIcons name="fit-screen" size={24} color={isLocked ? '#888' : '#FFFFFF'} />
                            </Pressable>

                            <Pressable
                                style={styles.controlButton}
                                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                                disabled={isLocked}
                            >
                                <MaterialIcons name="share" size={24} color={isLocked ? '#888' : '#FFFFFF'} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default ExpandedImageModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: screenWidth,
        height: screenHeight,
        position: 'relative',
        flex: 1,
    },
    topControls: {
        position: 'absolute',
        top: 50,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10, // Higher zIndex
        gap: 10,
    },
    expandButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    lockButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    locked: {
        backgroundColor: 'rgba(255, 75, 75, 0.2)',
        borderColor: 'rgba(255, 75, 75, 0.5)',
    },
    unlocked: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 0.5)',
    },
    imageViewerContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0, // This ensures it takes full space
        zIndex: 1, // Lower zIndex than controls but still touchable
    },
    bottomControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        paddingHorizontal: 20,
        zIndex: 10, // Higher zIndex
    },
    controlButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});
