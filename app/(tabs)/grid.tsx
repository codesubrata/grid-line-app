import React, { useState, useEffect } from "react";
import { StyleSheet, View, Dimensions, Modal } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import {
  setGridVisibility,
  setDiagonalGridVisibility,
  setShowLabels,
  setLabelStyle,
  selectPaperSize,
} from "../store/slices/imageEditSlice";
import GridTabHeaderArea from "../../components/GridTabHeaderArea";
import GridEditTools from "../../components/GridTools";
import SpecificGridToolEdit from "../../components/SpecificGridToolEdit";
import ImageViewer from "../../components/ImageViewer";
import { TabWrapper } from "@/components/TabWrapper";

const { width, height } = Dimensions.get("window");
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;

// Fixed height allocations
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.08; // 8% for header
const BOTTOM_HEIGHT = SCREEN_HEIGHT * 0.10; // 10% for bottom bar
const IMAGE_AREA_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - BOTTOM_HEIGHT; // 82% for image area

export default function Grid() {
  const dispatch = useDispatch();

  // Redux state selectors, including diagonal grid visibility
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
    width: state.image.width,
    height: state.image.height,
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
    paperPresetType: state.image.paperPresetType,
    isCustomPaper: state.image.paperPresetType === "CUSTOM",
  }));

  // Get paper size info
  const paperSize = useSelector((state: RootState) => selectPaperSize(state));

  // Modal management state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Log grid info for debugging
  useEffect(() => {
    if (imageData.realWorldWidth && imageData.realWorldHeight) {
      console.log("📋 Grid Configuration:", {
        paperPreset: gridState.paperPresetType,
        paperDimensions: `${paperSize.width}×${paperSize.height} cm`,
        isCustom: imageData.isCustomPaper,
        cellSize: `${gridState.gridCellWidth}×${gridState.gridCellHeight} cm`,
        gridMode: gridState.gridMode,
        gridVisible: gridState.isGridVisible,
        diagonalGridVisible: gridState.isDiagonalGridVisible,
        labelsVisible: gridState.showLabels,
      });
    }
  }, [
    gridState.paperPresetType,
    gridState.gridCellWidth,
    gridState.gridCellHeight,
    gridState.gridMode,
    gridState.isGridVisible,
    gridState.isDiagonalGridVisible,
    gridState.showLabels,
    imageData.realWorldWidth,
    imageData.realWorldHeight,
    imageData.isCustomPaper,
    paperSize.width,
    paperSize.height,
  ]);

  // Header handlers
  const handleBack = () => {
    console.log("Back pressed");
    // Implement navigation back logic here
  };

  const handleHome = () => {
    console.log("Home pressed");
    // Implement navigation to home logic here
  };

  const handleExport = () => {
    const exportData = {
      paper: {
        preset: gridState.paperPresetType,
        width: paperSize.width,
        height: paperSize.height,
        unit: "cm",
        isCustom: imageData.isCustomPaper,
      },
      grid: {
        cellWidth: gridState.gridCellWidth,
        cellHeight: gridState.gridCellHeight,
        mode: gridState.gridMode,
      },
      visualization: {
        gridVisible: gridState.isGridVisible,
        diagonalGridVisible: gridState.isDiagonalGridVisible,
        labelsVisible: gridState.showLabels,
        labelStyle: gridState.labelStyle,
        strokeColor: gridState.strokeColor,
        strokeWidth: gridState.strokeWidth,
      },
      image: {
        width: imageData.width,
        height: imageData.height,
        realWorldWidth: imageData.realWorldWidth,
        realWorldHeight: imageData.realWorldHeight,
      },
    };

    console.log("📤 Exporting with configuration:", exportData);
    // Implement export logic here with complete configuration
  };

  const handleExpandToggle = (expanded: boolean) => {
    console.log("Expand toggle:", expanded);
    // Implement expand/collapse logic here if needed
  };

  // Grid and label toggle handlers
  const handleGridToggle = (isVisible: boolean) => {
    dispatch(setGridVisibility(isVisible));
    console.log("Grid visibility toggled:", isVisible);
    if (!isVisible && !gridState.isDiagonalGridVisible && gridState.showLabels) {
      dispatch(setShowLabels(false));
      console.log("Labels disabled because both grids are off");
    }
  };

  const handleDiagonalGridToggle = (isVisible: boolean) => {
    dispatch(setDiagonalGridVisibility(isVisible));
    console.log("Diagonal grid visibility toggled:", isVisible);
    if (!isVisible && !gridState.isGridVisible && gridState.showLabels) {
      dispatch(setShowLabels(false));
      console.log("Labels disabled because both grids are off");
    }
  };

  const handleLabelToggle = (isVisible: boolean) => {
    // Allow toggling label only if grid or diagonal grid is enabled
    if (gridState.isGridVisible || gridState.isDiagonalGridVisible) {
      dispatch(setShowLabels(isVisible));
      if (!isVisible) {
        dispatch(setLabelStyle("NONE"));
        console.log("Labels hidden, style set to NONE");
      } else {
        if (gridState.labelStyle === "NONE") {
          dispatch(setLabelStyle("BOTH"));
          console.log("Labels shown, style set to BOTH");
        } else {
          console.log("Labels shown with existing style:", gridState.labelStyle);
        }
      }
    }
  };

  // Tool selection handler
  const handleToolSelect = (toolId: string) => {
    console.log("Tool selected:", toolId);
    setSelectedTool(toolId);
  };

  // Modal handlers
  const handleOpenModal = (toolId: string) => {
    console.log("Opening modal for tool:", toolId);
    setSelectedTool(toolId);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    console.log("Closing modal");
    setIsModalVisible(false);
    setSelectedTool(null);
  };

  return (
    <TabWrapper>
      <View style={styles.container}>
        {/* 1. Fixed Header Area - 8% */}
        <View style={[styles.headerSection, { height: HEADER_HEIGHT }]}>
          <GridTabHeaderArea
            onBack={handleBack}
            onHome={handleHome}
            onExport={handleExport}
            onExpandToggle={handleExpandToggle}
          />
        </View>

        {/* 2. Image Preview Area - 82% (ImageViewer Component) */}
        <View style={[styles.imageSection, { height: IMAGE_AREA_HEIGHT }]}>
          <ImageViewer />
        </View>

        {/* 3. Fixed Bottom Tools Area - 10% */}
        <View style={[styles.bottomSection, { height: BOTTOM_HEIGHT }]}>
          <GridEditTools
            onToolSelect={handleToolSelect}
            onGridToggle={handleGridToggle}
            onDiagonalGridToggle={handleDiagonalGridToggle}  // Added diagonal toggle prop
            onLabelToggle={handleLabelToggle}
            onOpenModal={handleOpenModal}
            isGridVisible={gridState.isGridVisible}
            isDiagonalGridVisible={gridState.isDiagonalGridVisible}  // Added diagonal prop
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
  // Header Section - Fixed 8%
  headerSection: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  // Image Section - 82% (ImageViewer takes full available space)
  imageSection: {
    flex: 1,
    width: "100%",
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  // Bottom Section - Fixed 10%
  bottomSection: {
    width: "100%",
    backgroundColor: "#1C1C1E",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
