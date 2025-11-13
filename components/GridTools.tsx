import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

interface EditTool {
    id: string;
    name: string;
    icon: string;
    category?: 'basic' | 'effects' | 'adjust' | 'grid';
}

interface GridEditToolsProps {
    onToolSelect?: (toolId: string) => void;
    onGridToggle?: (isVisible: boolean) => void;
    onDiagonalGridToggle?: (isVisible: boolean) => void;
    onLabelToggle?: (isVisible: boolean) => void;
    onOpenModal?: (toolId: string) => void;
    isGridVisible?: boolean;
    isDiagonalGridVisible?: boolean;
    isLabelVisible?: boolean;
}

const GridEditTools: React.FC<GridEditToolsProps> = ({
    onToolSelect,
    onGridToggle,
    onDiagonalGridToggle,
    onLabelToggle,
    onOpenModal,
    isGridVisible = false,
    isDiagonalGridVisible = false,
    isLabelVisible = false,
}) => {
    const [activeTool, setActiveTool] = useState<string | null>(null);

    // Get lock state from redux
    const isLocked = useSelector((state: any) => state.imageEdit.isLocked);

    const editTools: EditTool[] = [
        { id: 'frame', name: 'Frame', icon: 'apps', category: 'effects' },
        { id: 'stroke', name: 'Stroke', icon: 'border-color', category: 'effects' },
        { id: 'fx', name: 'Effects', icon: 'auto-fix-high', category: 'effects' },
        { id: 'sharpen', name: 'Sharpen', icon: 'tune', category: 'effects' },
    ];

    // Handle Grid Toggle
    const handleGridToggle = (value: boolean) => {
        if (isLocked) return; // Do nothing if locked
        onGridToggle?.(value);
        onToolSelect?.('grid');
        if (!value && !isDiagonalGridVisible && isLabelVisible) {
            onLabelToggle?.(false);
        }
    };

    // Handle Diagonal Grid Toggle
    const handleDiagonalGridToggle = (value: boolean) => {
        if (isLocked) return; // Do nothing if locked

        onDiagonalGridToggle?.(value);
        onToolSelect?.('diagonal');
        if (!value && !isGridVisible && isLabelVisible) {
            onLabelToggle?.(false);
        }
    };

    // Handle Label Toggle
    const handleLabelToggle = (value: boolean) => {
        if (isLocked) return;  // Do nothing if locked

        if (isGridVisible || isDiagonalGridVisible) {
            onLabelToggle?.(value);
            onToolSelect?.('label');
        }
    };

    // Handle Tool Press
    const handleToolPress = (toolId: string) => {
        if (isLocked) return; // Do nothing if locked

        setActiveTool(prev => (prev === toolId ? null : toolId));
        onToolSelect?.(toolId);
        if (['frame', 'stroke', 'fx', 'sharpen'].includes(toolId)) {
            onOpenModal?.(toolId);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.toolsContainer}
            >
                {/* Grid Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <Switch
                        value={isGridVisible}
                        onValueChange={handleGridToggle}
                        trackColor={{ false: '#555', true: '#00FF00' }}
                        thumbColor={isGridVisible ? '#00FF00' : '#ccc'}
                        style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                        disabled={isLocked}
                    />
                    <Text style={[styles.toggleLabel, isLocked && { color: '#555' }]}>Grid</Text>
                </View>

                {/* Diagonal Grid Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <Switch
                        value={isDiagonalGridVisible}
                        onValueChange={handleDiagonalGridToggle}
                        trackColor={{ false: '#555', true: '#FFA000' }}
                        thumbColor={isDiagonalGridVisible ? '#FFA000' : '#ccc'}
                        style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                        disabled={isLocked}
                    />
                    <Text style={[styles.toggleLabel, isLocked && { color: '#555' }]}>Diagonal</Text>
                </View>

                {/* Label Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <Switch
                        value={isLabelVisible}
                        onValueChange={handleLabelToggle}
                        trackColor={{ false: '#555', true: '#007AFF' }}
                        thumbColor={isLabelVisible ? '#007AFF' : '#ccc'}
                        style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                        disabled={isLocked || !(isGridVisible || isDiagonalGridVisible)}
                    />
                    <Text
                        style={[
                            styles.toggleLabel,
                            (!(isGridVisible || isDiagonalGridVisible) || isLocked) && { color: '#888' }
                        ]}
                    >
                        Label
                    </Text>
                </View>

                {/* Other Tools */}
                {editTools.map((tool) => (
                    <Pressable
                        key={tool.id}
                        style={styles.toolButton}
                        onPress={() => handleToolPress(tool.id)}
                        disabled={isLocked}
                    >
                        <View
                            style={[
                                styles.toolIconContainer,
                                activeTool === tool.id && styles.glowingRing,
                                isLocked && { opacity: 0.4 }
                            ]}
                        >
                            <MaterialIcons
                                name={tool.icon as any}
                                size={24}
                                color={activeTool === tool.id ? '#007AFF' : '#FFFFFF'}
                            />
                        </View>
                        <Text
                            style={[
                                styles.toolLabel,
                                activeTool === tool.id && styles.toolLabelActive,
                                isLocked && { color: '#888' }
                            ]}
                        >
                            {tool.name}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

export default GridEditTools;

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    toolsContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        gap: 12,
    },
    toggleContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 7,
        minWidth: 48,
    },
    toggleLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    toolButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        minWidth: 48,
    },
    toolIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginBottom: 2,
    },
    glowingRing: {
        width: 48,
        height: 48,
        borderRadius: 9999,
        borderWidth: 1.5,
        borderColor: '#00B2FF',
        backgroundColor: 'transparent',

        // Outer Glow
        shadowColor: '#00B2FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 15,
        elevation: 25,
    },
    toolLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#8E8E93',
        textAlign: 'center',
    },
    toolLabelActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
