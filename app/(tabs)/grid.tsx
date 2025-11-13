import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Dimensions, Modal, Alert, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import {
  setGridVisibility,
  setDiagonalGridVisibility,
  setShowLabels,
  setLabelStyle,
  selectPaperSize,
  resetAllEdits,
  setPaperPresetType,
} from "../store/slices/imageEditSlice";
import {
  setImage,
  setImageLoading,
  setImageError,
  clearImage,
} from "../store/slices/imageSlice";
import {
  selectSelectedProject,
  clearSelectedProject,
  updateProject
} from "../store/slices/historySlice";
import { getProject } from "../../app/services/Storage";
import GridTabHeaderArea from "../../components/GridTabHeaderArea";
import GridEditTools from "../../components/GridTools";
import SpecificGridToolEdit from "../../components/SpecificGridToolEdit";
import ImageViewer from "../../components/ImageViewer";
import { TabWrapper } from "@/components/TabWrapper";
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get("window");
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;

// Fixed height allocations
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.08;
const BOTTOM_HEIGHT = SCREEN_HEIGHT * 0.10;
const AVAILABLE_IMAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - BOTTOM_HEIGHT;
const AVAILABLE_IMAGE_WIDTH = SCREEN_WIDTH;

export default function Grid() {
  const dispatch = useDispatch();
  const imageViewerRef = useRef<View>(null);

  // Redux state selectors
  const gridState = useSelector((state: RootState) => ({
    isGridVisible: state.imageEdit.isGridVisible,
    isDiagonalGridVisible: state.imageEdit.isDiagonalGridVisible,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    imageEffect: state.imageEdit.imageEffect,
    gridCellWidth: state.imageEdit.gridCellWidth,
    gridCellHeight: state.imageEdit.gridCellHeight,
    gridMode: state.imageEdit.gridMode,
    paperPresetType: state.imageEdit.paperPresetType,
  }));

  // Image data
  const imageData = useSelector((state: RootState) => ({
    currentImage: state.image.currentImage,
    width: state.image.width,
    height: state.image.height,
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    paperPresetType: state.image.paperPresetType,
    isCustomPaper: state.image.paperPresetType === "CUSTOM",
    source: state.image.source,
  }));

  // Selected project from history
  const selectedProject = useSelector((state: RootState) =>
    selectSelectedProject(state)
  );

  // Get paper size info
  const paperSize = useSelector((state: RootState) => selectPaperSize(state));

  // Modal management state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Capture the current image with grid and edits
  const captureImageWithGrid = async (): Promise<string | null> => {
    try {
      if (!imageViewerRef.current) {
        Alert.alert('Error', 'Cannot capture image at this time');
        return null;
      }

      if (!imageData.currentImage) {
        Alert.alert('No Image', 'Please select an image first');
        return null;
      }

      // Capture the image section with high quality
      const uri = await captureRef(imageViewerRef.current, {
        format: 'jpg',
        quality: 1.0, // Maximum quality
        result: 'tmpfile',
        width: AVAILABLE_IMAGE_WIDTH * 2, // High resolution
        height: AVAILABLE_IMAGE_HEIGHT * 2,
      });

      console.log('📸 Image captured successfully:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Failed to capture image:', error);
      Alert.alert('Capture Failed', 'Could not capture the image. Please try again.');
      return null;
    }
  };

  // Load selected project when it changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectIntoEditor(selectedProject);
    }
  }, [selectedProject]);

  // Load project data into the editor
  const loadProjectIntoEditor = async (project: any) => {
    try {
      setIsLoadingProject(true);
      dispatch(setImageLoading(true));

      console.log('🔄 Loading project into editor:', project.id);

      // Reset all edits first to ensure clean state
      dispatch(resetAllEdits());

      // Load the full project data from storage
      const fullProject = await getProject(project.id);
      if (!fullProject) {
        throw new Error('Project data not found in storage');
      }

      // Set image data
      dispatch(setImage({
        uri: fullProject.imageUri,
        source: fullProject.imageData?.source || 'gallery',
        width: fullProject.imageData?.width,
        height: fullProject.imageData?.height,
        unit: 'px',
        realWorldWidth: fullProject.realWorldWidth,
        realWorldHeight: fullProject.realWorldHeight,
        realWorldUnit: 'cm',
        paperPresetType: fullProject.paperPreset,
        presetWidth: fullProject.realWorldWidth,
        presetHeight: fullProject.realWorldHeight,
        presetUnit: 'cm',
        format: fullProject.imageData?.format,
        mimeType: fullProject.imageData?.mimeType,
        fileSize: fullProject.imageData?.fileSize,
        fileName: fullProject.imageData?.fileName,
      }));

      // Set paper preset
      dispatch(setPaperPresetType(fullProject.paperPreset));

      // Set edit state if available
      if (fullProject.editState) {
        console.log('📝 Loading edit state:', fullProject.editState);
      }

      console.log('✅ Project loaded successfully:', fullProject.name);

    } catch (error) {
      console.error('❌ Failed to load project:', error);
      Alert.alert(
        'Error Loading Project',
        'Failed to load the selected project. Please try again.',
        [{ text: 'OK' }]
      );
      // Clear the selected project on error
      dispatch(clearSelectedProject());
    } finally {
      setIsLoadingProject(false);
      dispatch(setImageLoading(false));
    }
  };

  // Save current state back to project
  const saveCurrentProject = async () => {
    if (!selectedProject) return;

    try {
      const fullProject = await getProject(selectedProject.id);
      if (!fullProject) return;

      // Update project with current state
      const updatedProject = {
        ...fullProject,
        updatedAt: new Date().toISOString(),
        editState: {
          strokeWidth: gridState.strokeWidth,
          strokeColor: gridState.strokeColor,
          showLabels: gridState.showLabels,
          labelStyle: gridState.labelStyle,
          imageEffect: gridState.imageEffect,
          gridMode: gridState.gridMode,
          gridCellWidth: gridState.gridCellWidth,
          gridCellHeight: gridState.gridCellHeight,
        }
      };

      // Import and use updateProject
      const { updateProject } = await import('../../app/store/slices/historySlice.js');
      dispatch(updateProject(updatedProject));

      console.log('💾 Project changes saved:', selectedProject.id);
    } catch (error) {
      console.error('❌ Failed to save project:', error);
    }
  };

  // Header handlers
  const handleBack = () => {
    console.log("Back pressed");
    // Save changes before going back
    saveCurrentProject();
    // Clear selected project when going back
    dispatch(clearSelectedProject());
  };

  const handleHome = () => {
    console.log("Home pressed");
    // Save changes before going home
    saveCurrentProject();
    // Clear selected project
    dispatch(clearSelectedProject());
  };

  const handleExpandToggle = (expanded: boolean) => {
    console.log("Expand toggle:", expanded);
  };

  // Grid and label toggle handlers
  const handleGridToggle = (isVisible: boolean) => {
    dispatch(setGridVisibility(isVisible));
    if (!isVisible && !gridState.isDiagonalGridVisible && gridState.showLabels) {
      dispatch(setShowLabels(false));
    }
    // Auto-save when grid settings change
    saveCurrentProject();
  };

  const handleDiagonalGridToggle = (isVisible: boolean) => {
    dispatch(setDiagonalGridVisibility(isVisible));
    if (!isVisible && !gridState.isGridVisible && gridState.showLabels) {
      dispatch(setShowLabels(false));
    }
    // Auto-save when grid settings change
    saveCurrentProject();
  };

  const handleLabelToggle = (isVisible: boolean) => {
    if (gridState.isGridVisible || gridState.isDiagonalGridVisible) {
      dispatch(setShowLabels(isVisible));
      if (!isVisible) {
        dispatch(setLabelStyle("NONE"));
      } else {
        if (gridState.labelStyle === "NONE") {
          dispatch(setLabelStyle("BOTH"));
        }
      }
    }
    // Auto-save when label settings change
    saveCurrentProject();
  };

  // Tool selection handler
  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
  };

  // Modal handlers
  const handleOpenModal = (toolId: string) => {
    setSelectedTool(toolId);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedTool(null);
    // Save when closing tool modal (settings were likely changed)
    saveCurrentProject();
  };

  // Clear project when component unmounts
  useEffect(() => {
    return () => {
      // Save changes when leaving the Grid tab
      saveCurrentProject();
    };
  }, []);

  return (
    <TabWrapper>
      <View style={styles.container}>
        {/* Floating Header Area */}
        <View style={[styles.headerSection, { height: HEADER_HEIGHT }]}>
          <GridTabHeaderArea
            onBack={handleBack}
            onHome={handleHome}
            onExpandToggle={handleExpandToggle}
            onCaptureRequest={captureImageWithGrid} // NEW: Added capture functionality
          />
        </View>

        {/* Content - Image Preview fills space between header and bottom */}
        <View
          ref={imageViewerRef} // NEW: Added ref for capturing
          style={[
            styles.imageSection,
            {
              top: HEADER_HEIGHT,
              bottom: BOTTOM_HEIGHT,
              height: AVAILABLE_IMAGE_HEIGHT,
              width: AVAILABLE_IMAGE_WIDTH,
            }
          ]}
        >
          {isLoadingProject ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading Project...</Text>
            </View>
          ) : (
            <ImageViewer
              maxWidth={AVAILABLE_IMAGE_WIDTH}
              maxHeight={AVAILABLE_IMAGE_HEIGHT}
            />
          )}
        </View>

        {/* Floating Bottom Tools Area */}
        <View style={[styles.bottomSection, { height: BOTTOM_HEIGHT }]}>
          <GridEditTools
            onToolSelect={handleToolSelect}
            onGridToggle={handleGridToggle}
            onDiagonalGridToggle={handleDiagonalGridToggle}
            onLabelToggle={handleLabelToggle}
            onOpenModal={handleOpenModal}
            isGridVisible={gridState.isGridVisible}
            isDiagonalGridVisible={gridState.isDiagonalGridVisible}
            isLabelVisible={gridState.showLabels}
          />
        </View>

        {/* Modal for Specific Tool Editing */}
        <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <SpecificGridToolEdit selectedTool={selectedTool} isVisible={isModalVisible} onClose={handleCloseModal} />
            </View>
          </View>
        </Modal>
      </View>
    </TabWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  headerSection: {
    position: "absolute",
    top: 0,
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1000,
  },
  imageSection: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "transparent",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});