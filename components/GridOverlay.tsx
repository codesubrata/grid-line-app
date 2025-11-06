import { StyleSheet, Text, View } from 'react-native';
import React, { useMemo } from 'react';
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
  // Get image real-world dimensions (always in cm)
  const imageData = useSelector((state: RootState) => ({
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
  }));

  // Get grid configuration
  const gridConfig = useSelector((state: RootState) => ({
    isVisible: state.imageEdit.isGridVisible,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    gridMode: state.imageEdit.gridMode,
    gridCellWidth: state.imageEdit.gridCellWidth,   // in cm
    gridCellHeight: state.imageEdit.gridCellHeight, // in cm
  }));

  const gridCalculation = useMemo(() => {
    if (
      !imageData.realWorldWidth ||
      !imageData.realWorldHeight ||
      imageData.realWorldWidth <= 0 ||
      imageData.realWorldHeight <= 0 ||
      containerWidth <= 0 ||
      containerHeight <= 0 ||
      gridConfig.gridCellWidth <= 0 ||
      gridConfig.gridCellHeight <= 0
    ) {
      return {
        rows: 0,
        cols: 0,
        cellWidthPx: 0,
        cellHeightPx: 0,
        remainingWidthPx: 0,
        remainingHeightPx: 0,
        totalGridWidthPx: 0,
        totalGridHeightPx: 0,
        fullImageWidthPx: 0,
        fullImageHeightPx: 0,
      };
    }

    // All dimensions are in cm
    const imageWidthCm = imageData.realWorldWidth;
    const imageHeightCm = imageData.realWorldHeight;

    // Calculate how many full cells fit
    const cols = Math.floor(imageWidthCm / gridConfig.gridCellWidth);
    const rows = Math.floor(imageHeightCm / gridConfig.gridCellHeight);

    const totalGridWidthCm = cols * gridConfig.gridCellWidth;
    const totalGridHeightCm = rows * gridConfig.gridCellHeight;

    const remainingWidthCm = imageWidthCm - totalGridWidthCm;
    const remainingHeightCm = imageHeightCm - totalGridHeightCm;

    // Convert to pixels for rendering
    const pxPerCmWidth = containerWidth / imageWidthCm;
    const pxPerCmHeight = containerHeight / imageHeightCm;

    const cellWidthPx = gridConfig.gridCellWidth * pxPerCmWidth;
    const cellHeightPx = gridConfig.gridCellHeight * pxPerCmHeight;

    const totalGridWidthPx = totalGridWidthCm * pxPerCmWidth;
    const totalGridHeightPx = totalGridHeightCm * pxPerCmHeight;

    const remainingWidthPx = remainingWidthCm * pxPerCmWidth;
    const remainingHeightPx = remainingHeightCm * pxPerCmHeight;

    // Full image dimensions in pixels (including remaining space)
    const fullImageWidthPx = totalGridWidthPx + remainingWidthPx;
    const fullImageHeightPx = totalGridHeightPx + remainingHeightPx;

    return {
      rows: Math.max(0, rows),
      cols: Math.max(0, cols),
      cellWidthPx,
      cellHeightPx,
      remainingWidthPx,
      remainingHeightPx,
      totalGridWidthPx,
      totalGridHeightPx,
      fullImageWidthPx,
      fullImageHeightPx,
    };
  }, [
    imageData.realWorldWidth,
    imageData.realWorldHeight,
    containerWidth,
    containerHeight,
    gridConfig.gridCellWidth,
    gridConfig.gridCellHeight,
  ]);

  if (
    !visible ||
    !gridConfig.isVisible ||
    gridCalculation.rows === 0 ||
    gridCalculation.cols === 0
  ) {
    return null;
  }

  const verticalLines = useMemo(() => {
    const lines = [];

    // Regular grid lines (full cells)
    for (let i = 1; i <= gridCalculation.cols; i++) {
      const leftPosition =
        gridCalculation.cellWidthPx * i - gridConfig.strokeWidth / 2;
      lines.push(
        <View
          key={`vertical-${i}`}
          style={[
            styles.verticalLine,
            {
              left: leftPosition,
              width: gridConfig.strokeWidth,
              height: gridCalculation.fullImageHeightPx,
              backgroundColor: gridConfig.strokeColor,
            },
          ]}
        />
      );
    }

    return lines;
  }, [
    gridCalculation.cols,
    gridCalculation.cellWidthPx,
    gridCalculation.fullImageHeightPx,
    gridConfig.strokeWidth,
    gridConfig.strokeColor,
  ]);

  const horizontalLines = useMemo(() => {
    const lines = [];

    // Regular grid lines (full cells)
    for (let i = 1; i <= gridCalculation.rows; i++) {
      const topPosition =
        gridCalculation.cellHeightPx * i - gridConfig.strokeWidth / 2;
      lines.push(
        <View
          key={`horizontal-${i}`}
          style={[
            styles.horizontalLine,
            {
              top: topPosition,
              height: gridConfig.strokeWidth,
              width: gridCalculation.fullImageWidthPx,
              backgroundColor: gridConfig.strokeColor,
            },
          ]}
        />
      );
    }

    return lines;
  }, [
    gridCalculation.rows,
    gridCalculation.cellHeightPx,
    gridCalculation.fullImageWidthPx,
    gridConfig.strokeWidth,
    gridConfig.strokeColor,
  ]);

  const renderLabels = useMemo(() => {
    if (!gridConfig.showLabels || gridConfig.labelStyle === 'NONE') {
      return null;
    }

    const labels = [];

    // Top row column labels (inside first row cells)
    if (gridConfig.labelStyle === 'COL' || gridConfig.labelStyle === 'BOTH') {
      for (let col = 0; col < gridCalculation.cols; col++) {
        labels.push(
          <View
            key={`top-label-${col}`}
            style={[
              styles.topLabel,
              {
                left: col * gridCalculation.cellWidthPx,
                top: 0,
                width: gridCalculation.cellWidthPx,
                height: gridCalculation.cellHeightPx,
              },
            ]}
          >
            <Text style={styles.labelText}>{col + 1}</Text>
          </View>
        );
      }
    }

    // Left column row labels (inside first column cells)
    if (gridConfig.labelStyle === 'ROW' || gridConfig.labelStyle === 'BOTH') {
      for (let row = 0; row < gridCalculation.rows; row++) {
        labels.push(
          <View
            key={`left-label-${row}`}
            style={[
              styles.leftLabel,
              {
                left: 0,
                top: row * gridCalculation.cellHeightPx,
                width: gridCalculation.cellWidthPx,
                height: gridCalculation.cellHeightPx,
              },
            ]}
          >
            <Text style={styles.labelText}>{row + 1}</Text>
          </View>
        );
      }
    }

    return labels;
  }, [
    gridConfig.showLabels,
    gridConfig.labelStyle,
    gridCalculation.cols,
    gridCalculation.rows,
    gridCalculation.cellWidthPx,
    gridCalculation.cellHeightPx,
  ]);

  return (
    <View
      style={[
        styles.gridContainer,
        {
          width: containerWidth,
          height: containerHeight,
        },
      ]}
      pointerEvents="none"
    >
      {/* Render vertical lines */}
      {verticalLines}

      {/* Render horizontal lines */}
      {horizontalLines}

      {/* Render labels INSIDE grid cells */}
      {renderLabels}

      {/* Grid border outline (full image including remaining space) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: gridCalculation.fullImageWidthPx,
          height: gridCalculation.fullImageHeightPx,
          borderWidth: gridConfig.strokeWidth,
          borderColor: gridConfig.strokeColor,
        }}
        pointerEvents="none"
      />

      {/* Partial/Remaining area visual indicator (optional subtle overlay) */}
      {gridCalculation.remainingWidthPx > 0 && (
        <View
          style={{
            position: 'absolute',
            left: gridCalculation.totalGridWidthPx,
            top: 0,
            width: gridCalculation.remainingWidthPx,
            height: gridCalculation.fullImageHeightPx,
            backgroundColor: 'rgba(255, 165, 0, 0.05)',
            borderLeftWidth: gridConfig.strokeWidth,
            borderLeftColor: 'rgba(255, 165, 0, 0.3)',
          }}
          pointerEvents="none"
        />
      )}

      {gridCalculation.remainingHeightPx > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: gridCalculation.totalGridHeightPx,
            width: gridCalculation.totalGridWidthPx,
            height: gridCalculation.remainingHeightPx,
            backgroundColor: 'rgba(255, 165, 0, 0.05)',
            borderTopWidth: gridConfig.strokeWidth,
            borderTopColor: 'rgba(255, 165, 0, 0.3)',
          }}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

export default GridOverlay;

const styles = StyleSheet.create({
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  verticalLine: {
    position: 'absolute',
  },
  horizontalLine: {
    position: 'absolute',
  },
  topLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  leftLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  labelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
