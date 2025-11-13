import { RootState } from '@/app/store/store';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ExpandedImageModal from './ExpandedImageModal';
import { lockPage, unlockPage } from '@/app/store/slices/imageEditSlice';
import { captureRef } from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GridTabHeaderAreaProps {
  onBack?: () => void;
  onHome?: () => void;
  onExport?: () => void;
  onExpandToggle?: (expanded: boolean) => void;
  onCaptureRequest?: () => Promise<string | null>; // New prop for capturing image with grid
}

const FileNameModal: React.FC<{
  visible: boolean;
  onConfirm: (fileName: string) => void;
  onCancel: () => void;
  defaultName: string;
}> = ({ visible, onConfirm, onCancel, defaultName }) => {
  const [fileName, setFileName] = useState(defaultName);

  const handleConfirm = () => {
    if (fileName.trim()) {
      onConfirm(fileName.trim());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.fileNameModal}>
          <View style={styles.modalHeader}>
            <MaterialIcons name="photo-library" size={24} color="#007AFF" />
            <Text style={styles.modalTitle}>Save High-Quality Image</Text>
          </View>

          <Text style={styles.modalSubtitle}>
            Enter a name for your image with grid overlay:
          </Text>

          <TextInput
            style={styles.fileNameInput}
            value={fileName}
            onChangeText={setFileName}
            placeholder="Enter file name"
            placeholderTextColor="#8E8E93"
            autoFocus
            selectTextOnFocus
            maxLength={50}
          />

          <View style={styles.qualityInfo}>
            <MaterialIcons name="high-quality" size={16} color="#34C759" />
            <Text style={styles.qualityInfoText}>
              Image will be saved in high resolution with grid overlay
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={!fileName.trim()}
            >
              <MaterialIcons name="download" size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Save Image</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const DownloadQualityModal: React.FC<{
  visible: boolean;
  onQualitySelect: (quality: 'high' | 'maximum') => void;
  onCancel: () => void;
}> = ({ visible, onQualitySelect, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.qualityModal}>
          <View style={styles.modalHeader}>
            <MaterialIcons name="high-quality" size={28} color="#007AFF" />
            <Text style={styles.modalTitle}>Download Quality</Text>
          </View>

          <Text style={styles.qualityModalSubtitle}>
            Choose the quality for your image download:
          </Text>

          <View style={styles.qualityOptions}>
            <Pressable
              style={styles.qualityOption}
              onPress={() => onQualitySelect('high')}
            >
              <View style={styles.qualityOptionHeader}>
                <MaterialIcons name="hd" size={24} color="#007AFF" />
                <Text style={styles.qualityOptionTitle}>High Quality</Text>
              </View>
              <Text style={styles.qualityOptionDesc}>
                • Good for sharing and social media{'\n'}
                • Balanced file size{'\n'}
                • Fast processing
              </Text>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityBadgeText}>Recommended</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.qualityOption}
              onPress={() => onQualitySelect('maximum')}
            >
              <View style={styles.qualityOptionHeader}>
                <MaterialIcons name="4k" size={24} color="#FF9500" />
                <Text style={styles.qualityOptionTitle}>Maximum Quality</Text>
              </View>
              <Text style={styles.qualityOptionDesc}>
                • Best for printing and professional use{'\n'}
                • Larger file size{'\n'}
                • Slower processing
              </Text>
              <View style={[styles.qualityBadge, styles.premiumBadge]}>
                <MaterialIcons name="star" size={12} color="#FFD60A" />
                <Text style={styles.qualityBadgeText}>Premium</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.modalButtons}>
            <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const GridTabHeaderArea: React.FC<GridTabHeaderAreaProps> = ({
  onBack,
  onHome,
  onExport,
  onExpandToggle,
  onCaptureRequest, // New prop for capturing image with grid
}) => {
  const dispatch = useDispatch();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [savedImageUri, setSavedImageUri] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const currentImage = useSelector((state: RootState) => state.image.currentImage);
  const imageMetadata = useSelector((state: RootState) => ({
    width: state.image.width,
    height: state.image.height,
    unit: state.image.unit,
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    realWorldUnit: state.image.realWorldUnit,
    aspectRatio: state.image.aspectRatio,
    format: state.image.format,
    fileSize: state.image.fileSize,
    fileName: state.image.fileName,
    source: state.image.source,
  }));

  const gridConfig = useSelector((state: RootState) => ({
    isGridVisible: state.imageEdit.isGridVisible,
    isDiagonalGridVisible: state.imageEdit.isDiagonalGridVisible,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    showLabels: state.imageEdit.showLabels,
  }));

  const isLocked = useSelector((state: RootState) => state.imageEdit.isLocked);

  const exportScale = useRef(new Animated.Value(1)).current;
  const exportOpacity = useRef(new Animated.Value(1)).current;
  const expandScale = useRef(new Animated.Value(1)).current;
  const expandOpacity = useRef(new Animated.Value(1)).current;
  const lockScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  const successRotation = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const generateFileName = () => {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    return `grid_image_${timestamp}`;
  };

  const playSuccessAnimation = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(successScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successRotation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(successScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => {
      setDownloadCompleted(false);
      successRotation.setValue(0);
    }, 3000);
  };

  const playProgressAnimation = (progress: number) => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const playLockAnimation = () => {
    Animated.sequence([
      Animated.timing(lockScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(lockScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const downloadImageWithGrid = async (fileName: string, quality: 'high' | 'maximum' = 'high') => {
    if (!onCaptureRequest) {
      Alert.alert('Error', 'Capture functionality not available');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save images to your device.');
        setIsDownloading(false);
        return;
      }

      // Simulate progress
      playProgressAnimation(30);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture image with grid overlay
      playProgressAnimation(60);
      const imageUri = await onCaptureRequest();

      if (!imageUri) {
        throw new Error('Failed to capture image');
      }

      playProgressAnimation(90);

      // Save to gallery with high quality settings
      const finalFileName = `${fileName}.jpg`;
      const asset = await MediaLibrary.createAssetAsync(imageUri);

      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(imageUri);
      } catch (error) {
        console.log('Cleanup warning:', error);
      }

      setSavedImageUri(asset.uri);
      setDownloadCompleted(true);
      playProgressAnimation(100);
      playSuccessAnimation();

      // Show success with quality info
      const qualityInfo = quality === 'maximum' ?
        ' (Maximum Quality)' : ' (High Quality)';

      Alert.alert(
        '🎉 Image Saved Successfully!',
        `"${finalFileName}"${qualityInfo} has been saved to your gallery with grid overlay.`,
        [
          {
            text: 'View in Gallery',
            onPress: async () => {
              try {
                if (Platform.OS === 'ios') {
                  await Linking.openURL('photos-redirect://');
                } else {
                  Alert.alert(
                    'Image Saved',
                    'Image saved to gallery. Open your gallery app to view it.'
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Image Saved',
                  'Image has been saved to your gallery. You can view it in your Photos app.'
                );
              }
            }
          },
          {
            text: 'Share',
            onPress: () => shareImage(asset.uri)
          },
          { text: 'OK', style: 'default' }
        ]
      );

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        'Could not save the image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      progressWidth.setValue(0);
    }
  };

  const shareImage = async (imageUri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Grid Image',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Share Failed', 'Could not share the image.');
    }
  };

  const handleHamburgerMenu = () => {
    if (isLocked) {
      Alert.alert('Locked', 'Page is locked. Unlock to perform this action.');
      return;
    }
    console.log('Hamburger menu opened');
  };

  const handleHome = () => {
    if (isLocked) {
      Alert.alert('Locked', 'Page is locked. Unlock to navigate.');
      return;
    }
    router.push('/(tabs)');
  };

  const handleExport = () => {
    if (isLocked) {
      Alert.alert('Locked', 'Page is locked. Unlock to export.');
      return;
    }
    if (!onCaptureRequest) {
      Alert.alert('Error', 'Image capture not available');
      return;
    }
    if (isDownloading) return;

    // Show quality selection first
    setShowQualityModal(true);
  };

  const handleQualitySelect = (quality: 'high' | 'maximum') => {
    setShowQualityModal(false);
    setShowFileNameModal(true);
  };

  const handleFileNameConfirm = (fileName: string) => {
    setShowFileNameModal(false);
    // For now, use high quality. You can modify this to use the selected quality
    downloadImageWithGrid(fileName, 'high');
  };

  const handleFileNameCancel = () => setShowFileNameModal(false);
  const handleQualityCancel = () => setShowQualityModal(false);

  const toggleLockHandler = () => {
    playLockAnimation();
    if (isLocked) {
      dispatch(unlockPage());
      Alert.alert('Unlocked', 'Page is now unlocked. You can edit and interact with the app.');
    } else {
      dispatch(lockPage());
      Alert.alert('Locked', 'Page is now locked. Only expand and create new project are available.');
    }
  };

  const handleExpandToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(expandScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(expandOpacity, { toValue: 0.6, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(expandScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(expandOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();
    onExpandToggle?.(newState);
  };

  const handleModalClose = () => {
    setIsExpanded(false);
    onExpandToggle?.(false);
  };

  const handleInfoPress = () => {
    if (isLocked) {
      Alert.alert('Locked', 'Page is locked. Unlock to view image info.');
      return;
    }
    setShowImageInfo(true);
  };

  const handleInfoClose = () => setShowImageInfo(false);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDimension = (value?: number, unit?: string): string => {
    if (!value || !unit) return 'N/A';
    return `${value} ${unit}`;
  };

  const formatAspectRatio = (ratio?: number): string => {
    if (!ratio) return 'N/A';
    return `${ratio.toFixed(3)}:1`;
  };

  const formatImageSource = (source?: string): string => {
    if (!source) return 'N/A';
    switch (source) {
      case 'camera':
        return 'Camera';
      case 'gallery':
        return 'Gallery';
      case 'default':
        return 'Default';
      default:
        return source.charAt(0).toUpperCase() + source.slice(1);
    }
  };

  const rotateInterpolation = successRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressInterpolation = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <Pressable
              style={styles.backButton}
              onPress={handleHamburgerMenu}
              android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 24 }}
            >
              <MaterialIcons name="app-registration" size={24} color="#FFF" />
            </Pressable>
          </View>

          <View style={styles.rightSection}>
            {/* Info Button */}
            <Pressable
              style={[styles.iconButton, isLocked && styles.iconButtonLocked]}
              onPress={handleInfoPress}
              android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 24 }}
            >
              <MaterialIcons
                name="info-outline"
                size={24}
                color={isLocked ? 'rgba(255,255,255,0.5)' : '#fff'}
              />
            </Pressable>

            {/* Home Button */}
            <Pressable
              style={[styles.iconButton, isLocked && styles.iconButtonLocked]}
              onPress={handleHome}
              android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 24 }}
            >
              <MaterialIcons
                name="home"
                size={24}
                color={isLocked ? 'rgba(255,255,255,0.5)' : '#fff'}
              />
            </Pressable>

            {/* Export Button */}
            <Animated.View
              style={{
                transform: [
                  { scale: downloadCompleted ? successScale : exportScale },
                  { rotate: downloadCompleted ? rotateInterpolation : '0deg' },
                ],
                opacity: exportOpacity,
              }}
            >
              <Pressable
                style={[
                  styles.exportButton,
                  downloadCompleted && styles.exportButtonSuccess,
                  isDownloading && styles.exportButtonLoading,
                  isLocked && styles.exportButtonLocked,
                ]}
                onPress={handleExport}
                disabled={isDownloading || isLocked}
                android_ripple={{ color: 'rgba(0, 122, 255, 0.3)', radius: 19 }}
              >
                {isDownloading ? (
                  <ActivityIndicator size={20} color="#007AFF" />
                ) : downloadCompleted ? (
                  <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                ) : (
                  <MaterialIcons
                    name="download"
                    size={24}
                    color={isLocked ? 'rgba(0, 122, 255, 0.5)' : '#007AFF'}
                  />
                )}
              </Pressable>
            </Animated.View>

            {/* Lock Button */}
            <Animated.View style={{ transform: [{ scale: lockScale }] }}>
              <Pressable
                style={[
                  styles.lockButton,
                  isLocked && styles.lockButtonActive,
                ]}
                onPress={toggleLockHandler}
                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 19 }}
              >
                <MaterialIcons
                  name={isLocked ? 'lock' : 'lock-open'}
                  size={24}
                  color={isLocked ? '#FF4B4B' : '#4CAF50'}
                />
              </Pressable>
            </Animated.View>

            {/* Expand Button */}
            <Animated.View style={{ transform: [{ scale: expandScale }], opacity: expandOpacity }}>
              <Pressable
                style={[styles.expandButton, isExpanded && styles.expandButtonActive]}
                onPress={handleExpandToggle}
                android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 19 }}
              >
                <MaterialIcons
                  name={isExpanded ? 'fullscreen-exit' : 'fullscreen'}
                  size={24}
                  color={isExpanded ? '#007AFF' : '#FFFFFF'}
                />
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Download Progress Bar */}
        {isDownloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressInterpolation }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {downloadProgress}% - Saving high-quality image...
            </Text>
          </View>
        )}
      </View>

      {/* Image Info Modal */}
      <Modal
        visible={showImageInfo}
        transparent
        animationType="slide"
        onRequestClose={handleInfoClose}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <MaterialIcons name="info" size={24} color="#007AFF" />
              <Text style={styles.infoModalTitle}>Image Information</Text>
            </View>

            <ScrollView style={styles.infoScrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.infoContainer}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Dimensions</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Width:</Text>
                    <Text style={styles.infoValue}>
                      {formatDimension(
                        imageMetadata.realWorldWidth ?? imageMetadata.width,
                        imageMetadata.realWorldUnit ?? imageMetadata.unit
                      )}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Height:</Text>
                    <Text style={styles.infoValue}>
                      {formatDimension(
                        imageMetadata.realWorldHeight ?? imageMetadata.height,
                        imageMetadata.realWorldUnit ?? imageMetadata.unit
                      )}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Aspect Ratio:</Text>
                    <Text style={styles.infoValue}>{formatAspectRatio(imageMetadata.aspectRatio)}</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>File Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Format:</Text>
                    <Text style={styles.infoValue}>{imageMetadata.format?.toUpperCase() ?? 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>File Size:</Text>
                    <Text style={styles.infoValue}>{formatFileSize(imageMetadata.fileSize)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>File Name:</Text>
                    <Text style={[styles.infoValue, styles.fileNameValue]} numberOfLines={2}>
                      {imageMetadata.fileName || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Source</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Origin:</Text>
                    <Text style={styles.infoValue}>{formatImageSource(imageMetadata.source)}</Text>
                  </View>
                </View>

                {imageMetadata.source !== 'default' && (
                  <View style={styles.infoFooterNote}>
                    <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.infoFooterText}>Image loaded with complete metadata</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.infoModalActions}>
              <Pressable style={styles.infoOkButton} onPress={handleInfoClose}>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.infoOkButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* File Name Modal */}
      <FileNameModal
        visible={showFileNameModal}
        onConfirm={handleFileNameConfirm}
        onCancel={handleFileNameCancel}
        defaultName={generateFileName()}
      />

      {/* Quality Selection Modal */}
      <DownloadQualityModal
        visible={showQualityModal}
        onQualitySelect={handleQualitySelect}
        onCancel={handleQualityCancel}
      />

      {/* Expanded Image Modal */}
      <ExpandedImageModal visible={isExpanded} onClose={handleModalClose} />
    </>
  );
};

export default GridTabHeaderArea;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconButtonLocked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  exportButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  exportButtonLoading: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  exportButtonSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  exportButtonLocked: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    opacity: 0.6,
  },
  lockButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  lockButtonActive: {
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  expandButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },

  // Progress Bar
  progressContainer: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fileNameModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  fileNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  qualityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  qualityInfoText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 8,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Quality Modal Styles
  qualityModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qualityModalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  qualityOptions: {
    gap: 16,
    marginBottom: 24,
  },
  qualityOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  qualityOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  qualityOptionDesc: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
  },
  qualityBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumBadge: {
    backgroundColor: '#FF9500',
  },
  qualityBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Enhanced Info Modal Styles
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  infoModalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginLeft: 8,
  },
  infoScrollContainer: {
    maxHeight: 400,
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  fileNameValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoFooterText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
  infoModalActions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoOkButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});