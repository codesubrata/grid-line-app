import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    Pressable,
    Dimensions,
    StatusBar,
} from 'react-native';
import ImageViewer from './ImageViewer'; // Import your ImageViewer component

interface ExpandedImageModalProps {
    visible: boolean;
    onClose: () => void;
}

const ExpandedImageModal: React.FC<ExpandedImageModalProps> = ({ visible, onClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <StatusBar hidden={visible} />
            <View style={styles.modalOverlay}>

                {/* Modal Content */}
                <View style={styles.modalContent}>
                    {/* Top Controls */}
                    <View style={styles.topControls}>
                        {/* Expand/Collapse Button */}
                        <Pressable
                            style={styles.expandButton}
                            onPress={onClose}
                            android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 25 }}
                        >
                            <MaterialIcons name="fullscreen-exit" size={28} color="#007AFF" />
                        </Pressable>
                    </View>

                    {/* ImageViewer Component - Full Screen Height */}
                    <View style={styles.imageViewerContainer}>
                        <ImageViewer />
                    </View>

                    {/* Bottom Controls Bar */}
                    <View style={styles.bottomControls}>
                        <Pressable
                            style={styles.controlButton}
                            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                        >
                            <MaterialIcons name="zoom-in" size={24} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            style={styles.controlButton}
                            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                        >
                            <MaterialIcons name="zoom-out" size={24} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            style={styles.controlButton}
                            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                        >
                            <MaterialIcons name="rotate-right" size={24} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            style={styles.controlButton}
                            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                        >
                            <MaterialIcons name="fit-screen" size={24} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            style={styles.controlButton}
                            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20 }}
                        >
                            <MaterialIcons name="share" size={24} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ExpandedImageModal;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 1)', // Solid black background
        justifyContent: 'center',
        alignItems: 'center',

    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        zIndex: 10,



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

    // ImageViewer Container
    imageViewerContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
        zIndex: 10,
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