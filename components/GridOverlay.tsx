import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';

interface GridOverlayProps {
  containerWidth: number;
  containerHeight: number;
  visible?: boolean;
}

const GridOverlay: React.FC<GridOverlayProps> = ({
  containerWidth,
  containerHeight,
  visible = true,
}) => {
  // Get grid configuration from Redux
  const gridConfig = useSelector((state: RootState) => ({
    isVisible: state.imageEdit.isGridVisible,
    rows: state.imageEdit.gridRows,
    cols: state.imageEdit.gridCols,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    gridMode: state.imageEdit.gridMode,
    gridCellWidth: state.imageEdit.gridCellWidth,
    gridCellHeight: state.imageEdit.gridCellHeight,
    
  }));

  console.log(
    `🧮 Container Size: ${containerWidth} x ${containerHeight} | Grid Cell: ${gridConfig.gridCellWidth} x ${gridConfig.gridCellHeight}`
  );


  // Don't render if grid is not visible or component is hidden
  if (!visible || !gridConfig.isVisible || containerWidth <= 0 || containerHeight <= 0) {
    return null;
  }

  // Calculate cell dimensions based on current grid settings
  const cellWidth = containerWidth / gridConfig.cols;
  const cellHeight = containerHeight / gridConfig.rows;

  // Generate vertical lines (columns) - excluding outer borders
  const verticalLines = [];
  for (let i = 1; i < gridConfig.cols; i++) {
    const leftPosition = cellWidth * i - gridConfig.strokeWidth / 2;
    verticalLines.push(
      <View
        key={`vertical-${i}`}
        style={[
          styles.verticalLine,
          {
            left: leftPosition,
            width: gridConfig.strokeWidth,
            height: containerHeight,
            backgroundColor: gridConfig.strokeColor,
          }
        ]}
      />
    );
  }

  // Generate horizontal lines (rows) - excluding outer borders
  const horizontalLines = [];
  for (let i = 1; i < gridConfig.rows; i++) {
    const topPosition = cellHeight * i - gridConfig.strokeWidth / 2;
    horizontalLines.push(
      <View
        key={`horizontal-${i}`}
        style={[
          styles.horizontalLine,
          {
            top: topPosition,
            height: gridConfig.strokeWidth,
            width: containerWidth,
            backgroundColor: gridConfig.strokeColor,
          }
        ]}
      />
    );
  }

  // Generate labels for top row and left column only
  const renderLabels = () => {
    if (!gridConfig.showLabels || gridConfig.labelStyle === 'NONE') {
      return null;
    }

    const labels = [];

    // Top row labels (columns) - positioned at top center of each cell
    if (gridConfig.labelStyle === 'COL' || gridConfig.labelStyle === 'BOTH') {
      for (let col = 0; col < gridConfig.cols; col++) {
        labels.push(
          <View
            key={`top-label-${col}`}
            style={[
              styles.topLabel,
              {
                left: col * cellWidth + cellWidth / 2 - 12, // Horizontally centered in cell
                top: 5, // Positioned at the top with small margin
              }
            ]}
          >
            <Text style={styles.labelText}>{col + 1}</Text>
          </View>
        );
      }
    }

    // Left column labels (rows) - positioned at middle left of each cell
    if (gridConfig.labelStyle === 'ROW' || gridConfig.labelStyle === 'BOTH') {
      for (let row = 0; row < gridConfig.rows; row++) {
        labels.push(
          <View
            key={`left-label-${row}`}
            style={[
              styles.leftLabel,
              {
                left: 5, // Positioned at the left with small margin
                top: row * cellHeight + cellHeight / 2 - 12, // Vertically centered in cell
              }
            ]}
          >
            <Text style={styles.labelText}>{row + 1}</Text>
          </View>
        );
      }
    }

    return labels;
  };

  // Show grid info for debugging (optional - can be removed in production)
  const renderGridInfo = () => {
    if (gridConfig.gridMode === "advanced") {
      const widthCm = (gridConfig.gridCellWidth / 10).toFixed(1);
      const heightCm = (gridConfig.gridCellHeight / 10).toFixed(1);
      return (
        <View style={styles.gridInfo}>
          <Text style={styles.gridInfoText}>
            {gridConfig.rows}×{gridConfig.cols} ({widthCm}×{heightCm}cm)
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View
      style={[
        styles.gridContainer,
        {
          width: containerWidth,
          height: containerHeight,
          // Add border on all four sides
          borderWidth: gridConfig.strokeWidth,
          borderColor: gridConfig.strokeColor,
        }
      ]}
      pointerEvents="none" // Allow touch events to pass through to the image below
    >
      {/* Render vertical lines */}
      {verticalLines}

      {/* Render horizontal lines */}
      {horizontalLines}

      {/* Render labels if enabled */}
      {renderLabels()}

      {/* Render grid info (optional) */}
      {renderGridInfo()}
    </View>
  );
};

export default GridOverlay;

const styles = StyleSheet.create({
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10, // Ensure grid appears above image
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
  },
  // Top row labels - positioned at top center of each column
  topLabel: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Left column labels - positioned at middle left of each row
  leftLabel: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  labelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  // Grid info display (optional)
  gridInfo: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gridInfoText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
