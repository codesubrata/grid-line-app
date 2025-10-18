import React, { useState } from "react";
import { StyleSheet, View, Dimensions, Modal } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import {
  setGridVisibility,
  setShowLabels,
  setLabelStyle,
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
const IMAGE_AREA_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - BOTTOM_HEIGHT; // 82% for image area (remaining space)

export default function Grid() {
  const dispatch = useDispatch();

  // Redux state selectors
  const gridState = useSelector((state: RootState) => ({
    isGridVisible: state.imageEdit.isGridVisible,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    gridRows: state.imageEdit.gridRows,
    gridCols: state.imageEdit.gridCols,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    cellSize: state.imageEdit.cellSize,
    imageEffect: state.imageEdit.imageEffect,
  }));

  // Modal management state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

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
    console.log("Exporting with grid config:", gridState);
    // Implement export logic here with current grid configuration
  };

  const handleExpandToggle = (expanded: boolean) => {
    console.log("Expand toggle:", expanded);
    // Implement expand/collapse logic here if needed
  };

  // Grid and label toggle handlers
  const handleGridToggle = (isVisible: boolean) => {
    dispatch(setGridVisibility(isVisible));
  };

  const handleLabelToggle = (isVisible: boolean) => {
    dispatch(setShowLabels(isVisible));
    if (!isVisible) {
      dispatch(setLabelStyle("NONE"));
    } else {
      // Set to default label style if not already set
      if (gridState.labelStyle === "NONE") {
        dispatch(setLabelStyle("BOTH"));
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
    setSelectedTool(toolId);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
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
          <ImageViewer

          />
        </View>

        {/* 3. Fixed Bottom Tools Area - 10% */}
        <View style={[styles.bottomSection, { height: BOTTOM_HEIGHT }]}>
          <GridEditTools
            onToolSelect={handleToolSelect}
            onGridToggle={handleGridToggle}
            onLabelToggle={handleLabelToggle}
            onOpenModal={handleOpenModal}
            isGridVisible={gridState.isGridVisible}
            isLabelVisible={gridState.showLabels}
          />
        </View>

        {/* Modal for Specific Tool Editing */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <SpecificGridToolEdit
                selectedTool={selectedTool}
                isVisible={isModalVisible}
                onClose={handleCloseModal}
              />
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
    height: '100%', // Ensure it takes full height of allocated space
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
