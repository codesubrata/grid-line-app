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
  // Redux selectors
  const imageData = useSelector((state: RootState) => ({
    realWorldWidth: state.image.realWorldWidth,
    realWorldHeight: state.image.realWorldHeight,
  }));

  const gridConfig = useSelector((state: RootState) => ({
    isVisible: state.imageEdit.isGridVisible,
    isDiagonalVisible: state.imageEdit.isDiagonalGridVisible,
    strokeColor: state.imageEdit.strokeColor,
    strokeWidth: state.imageEdit.strokeWidth,
    showLabels: state.imageEdit.showLabels,
    labelStyle: state.imageEdit.labelStyle,
    gridMode: state.imageEdit.gridMode,
    gridCellWidth: state.imageEdit.gridCellWidth,
    gridCellHeight: state.imageEdit.gridCellHeight,
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

    const imageWidthCm = imageData.realWorldWidth;
    const imageHeightCm = imageData.realWorldHeight;
    const cols = Math.floor(imageWidthCm / gridConfig.gridCellWidth);
    const rows = Math.floor(imageHeightCm / gridConfig.gridCellHeight);

    const totalGridWidthCm = cols * gridConfig.gridCellWidth;
    const totalGridHeightCm = rows * gridConfig.gridCellHeight;
    const remainingWidthCm = imageWidthCm - totalGridWidthCm;
    const remainingHeightCm = imageHeightCm - totalGridHeightCm;

    const pxPerCmWidth = containerWidth / imageWidthCm;
    const pxPerCmHeight = containerHeight / imageHeightCm;

    const cellWidthPx = gridConfig.gridCellWidth * pxPerCmWidth;
    const cellHeightPx = gridConfig.gridCellHeight * pxPerCmHeight;
    const totalGridWidthPx = totalGridWidthCm * pxPerCmWidth;
    const totalGridHeightPx = totalGridHeightCm * pxPerCmHeight;
    const remainingWidthPx = remainingWidthCm * pxPerCmWidth;
    const remainingHeightPx = remainingHeightCm * pxPerCmHeight;

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
    (!gridConfig.isVisible && !gridConfig.isDiagonalVisible) ||
    gridCalculation.rows === 0 ||
    gridCalculation.cols === 0
  ) {
    return null;
  }

  // Diagonal lines for ALL cells, including partial/incomplete
  const diagonalLines = useMemo(() => {
    if (!gridConfig.isDiagonalVisible) return [];

    const lines = [];
    const totalCols = gridCalculation.cols + (gridCalculation.remainingWidthPx > 0 ? 1 : 0);
    const totalRows = gridCalculation.rows + (gridCalculation.remainingHeightPx > 0 ? 1 : 0);

    // Use standard cell size for diagonals in ALL cells, even partial ones
    const standardDiagonalLength = Math.sqrt(
      gridCalculation.cellWidthPx ** 2 + gridCalculation.cellHeightPx ** 2
    );
    const positiveAngle = Math.atan(gridCalculation.cellHeightPx / gridCalculation.cellWidthPx) * (180 / Math.PI);

    // For every cell (including FIRST column and partial/incomplete cells), draw both diagonals (/ and \)
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellLeft = col * gridCalculation.cellWidthPx;
        const cellTop = row * gridCalculation.cellHeightPx;
        const cellRight = cellLeft + gridCalculation.cellWidthPx;
        const cellBottom = cellTop + gridCalculation.cellHeightPx;

        // Draw / from top-left to bottom-right
        lines.push(
          <View
            key={`diagonal-ltr-${row}-${col}`}
            style={[
              styles.diagonalLine,
              {
                left: cellLeft,
                top: cellTop,
                width: standardDiagonalLength,
                height: gridConfig.strokeWidth,
                backgroundColor: gridConfig.strokeColor,
                transform: [{ rotate: `${positiveAngle}deg` }],
              },
            ]}
          />
        );
        // Draw \ from bottom-left to top-right (start at cell's bottom-left corner)
        lines.push(
          <View
            key={`diagonal-rtl-${row}-${col}`}
            style={[
              styles.diagonalLine,
              {
                left: cellLeft,
                top: cellBottom - gridConfig.strokeWidth,
                width: standardDiagonalLength,
                height: gridConfig.strokeWidth,
                backgroundColor: gridConfig.strokeColor,
                transform: [{ rotate: `${-positiveAngle}deg` }],
              },
            ]}
          />
        );
      }
    }
    return lines;
  }, [
    gridConfig.isDiagonalVisible,
    gridCalculation.cellWidthPx,
    gridCalculation.cellHeightPx,
    gridCalculation.cols,
    gridCalculation.rows,
    gridCalculation.remainingWidthPx,
    gridCalculation.remainingHeightPx,
    gridConfig.strokeWidth,
    gridConfig.strokeColor,
  ]);

  // Regular grid lines (as before)
  const verticalLines = useMemo(() => {
    if (!gridConfig.isVisible) return [];
    const lines = [];
    for (let i = 1; i <= gridCalculation.cols; i++) {
      const leftPosition = gridCalculation.cellWidthPx * i - gridConfig.strokeWidth / 2;
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
    gridConfig.isVisible,
    gridCalculation.cols,
    gridCalculation.cellWidthPx,
    gridCalculation.fullImageHeightPx,
    gridConfig.strokeWidth,
    gridConfig.strokeColor,
  ]);

  const horizontalLines = useMemo(() => {
    if (!gridConfig.isVisible) return [];
    const lines = [];
    for (let i = 1; i <= gridCalculation.rows; i++) {
      const topPosition = gridCalculation.cellHeightPx * i - gridConfig.strokeWidth / 2;
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
    gridConfig.isVisible,
    gridCalculation.rows,
    gridCalculation.cellHeightPx,
    gridCalculation.fullImageWidthPx,
    gridConfig.strokeWidth,
    gridConfig.strokeColor,
  ]);

  // Labels show when either grid or diagonal grid is on
  const renderLabels = useMemo(() => {
    if (!gridConfig.showLabels || gridConfig.labelStyle === 'NONE') {
      return null;
    }
    const labels = [];
    const totalCols = gridCalculation.cols + (gridCalculation.remainingWidthPx > 0 ? 1 : 0);
    const totalRows = gridCalculation.rows + (gridCalculation.remainingHeightPx > 0 ? 1 : 0);
    if (gridConfig.labelStyle === 'COL' || gridConfig.labelStyle === 'BOTH') {
      for (let col = 0; col < totalCols; col++) {
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
    if (gridConfig.labelStyle === 'ROW' || gridConfig.labelStyle === 'BOTH') {
      for (let row = 0; row < totalRows; row++) {
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
    gridCalculation.cellWidthPx,
    gridCalculation.cellHeightPx,
    gridCalculation.cols,
    gridCalculation.rows,
    gridCalculation.remainingWidthPx,
    gridCalculation.remainingHeightPx,
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
      {/* Regular grid lines */}
      {gridConfig.isVisible && verticalLines}
      {gridConfig.isVisible && horizontalLines}

      {/* Diagonal grid lines: every cell gets BOTH diagonals */}
      {gridConfig.isDiagonalVisible && diagonalLines}

      {/* Labels: when grid/diagonal grid is on */}
      {(gridConfig.isVisible || gridConfig.isDiagonalVisible) && renderLabels}

      {/* Outline */}
      {(gridConfig.isVisible || gridConfig.isDiagonalVisible) && (
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
      )}

      {/* Partial/incomplete area indicator (for regular grid only) */}
      {gridConfig.isVisible && gridCalculation.remainingWidthPx > 0 && (
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
      {gridConfig.isVisible && gridCalculation.remainingHeightPx > 0 && (
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
    overflow: 'hidden',
  },
  verticalLine: {
    position: 'absolute',
  },
  horizontalLine: {
    position: 'absolute',
  },
  diagonalLine: {
    position: 'absolute',
    transformOrigin: '0 0',
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
