import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

// Define the project data structure
export interface ProjectData {
    id: string;
    title: string;
    imageUri: string;
    lastEdited: Date;
    ratioPreset: string;
    thumbnail?: string; // Optional smaller preview image
}

interface HistoryCardProps {
    project: ProjectData;
    viewMode: 'list' | 'grid';
    onPress: (project: ProjectData) => void;
    onDelete: (projectId: string) => void;
    onMoreOptions: (project: ProjectData) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
    project,
    viewMode,
    onPress,
    onDelete,
    onMoreOptions
}) => {
    // Format the last edited date
    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
            }
            return hours === 1 ? '1h ago' : `${hours}h ago`;
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    if (viewMode === 'list') {
        return (
            <Pressable
                style={styles.listContainer}
                onPress={() => onPress(project)}
                android_ripple={{ color: 'rgba(0, 122, 255, 0.1)' }}
            >
                <View style={styles.listContent}>
                    {/* Image Preview */}
                    <View style={styles.listImageContainer}>
                        <Image
                            source={{ uri: project.thumbnail || project.imageUri }}
                            style={styles.listImage}
                            resizeMode="cover"
                        />
                        <View style={styles.listImageOverlay} />
                    </View>

                    {/* Content */}
                    <View style={styles.listTextContent}>
                        <View style={styles.listTitleContainer}>
                            <Text style={styles.listTitle} numberOfLines={1}>
                                {project.title}
                            </Text>
                            <Text style={styles.listRatio}>
                                {project.ratioPreset}
                            </Text>
                        </View>
                        <Text style={styles.listDate}>
                            Last edited • {formatDate(project.lastEdited)}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.listActions}>
                        <Pressable
                            style={styles.listActionButton}
                            onPress={() => onMoreOptions(project)}
                            android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', radius: 16 }}
                        >
                            <MaterialIcons name="more-vert" size={20} color="#fff" />
                        </Pressable>
                        <Pressable
                            style={[styles.listActionButton, styles.deleteButton]}
                            onPress={() => onDelete(project.id)}
                            android_ripple={{ color: 'rgba(255, 59, 48, 0.2)', radius: 16 }}
                        >
                            <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        );
    }

    // Grid View
    return (
        <Pressable
            style={styles.gridContainer}
            onPress={() => onPress(project)}
            android_ripple={{ color: 'rgba(0, 122, 255, 0.1)' }}
        >
            <View style={styles.gridContent}>
                {/* Image Preview */}
                <View style={styles.gridImageContainer}>
                    <Image
                        source={{ uri: project.thumbnail || project.imageUri }}
                        style={styles.gridImage}
                        resizeMode="cover"
                    />
                    <View style={styles.gridImageOverlay} />

                    {/* More Options Button */}
                    <Pressable
                        style={styles.gridMoreButton}
                        onPress={() => onMoreOptions(project)}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', radius: 12 }}
                    >
                        <MaterialIcons name="more-vert" size={16} color="#fff" />
                    </Pressable>

                    {/* Ratio Badge */}
                    <View style={styles.gridRatioBadge}>
                        <Text style={styles.gridRatioText}>
                            {project.ratioPreset}
                        </Text>
                    </View>
                </View>

                {/* Title and Date */}
                <View style={styles.gridTextContent}>
                    <Text style={styles.gridTitle} numberOfLines={1}>
                        {project.title}
                    </Text>
                    <Text style={styles.gridDate}>
                        {formatDate(project.lastEdited)}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

export default HistoryCard;

const styles = StyleSheet.create({
    // List View Styles
    listContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        marginVertical: 6,
        marginHorizontal: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    listContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    listImageContainer: {
        width: 60,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#2C2C2E',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    listImage: {
        width: '100%',
        height: '100%',
    },
    listImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    listTextContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    listTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
    },
    listRatio: {
        fontSize: 11,
        fontWeight: '500',
        color: '#007AFF',
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    listDate: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '400',
    },
    listActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listActionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    deleteButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },

    // Grid View Styles
    gridContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        margin: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        flex: 1,
        maxWidth: '47%', // For 2-column grid
    },
    gridContent: {
        padding: 0,
    },
    gridImageContainer: {
        aspectRatio: 0.707, // A4 ratio (width/height)
        backgroundColor: '#2C2C2E',
        position: 'relative',
        overflow: 'hidden',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    gridMoreButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    gridRatioBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0, 122, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    gridRatioText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    gridTextContent: {
        padding: 12,
    },
    gridTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    gridDate: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '400',
    },
});
