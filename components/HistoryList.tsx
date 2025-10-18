import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import HistoryCard, { ProjectData } from './HistoryCard';

// Sample static data for demonstration
const SAMPLE_PROJECTS: ProjectData[] = [
  {
    id: '1',
    title: 'Product Photo Shoot',
    imageUri: 'https://picsum.photos/400/600?random=1',
    lastEdited: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    ratioPreset: 'A4',
    thumbnail: 'https://picsum.photos/200/300?random=1'
  },
  {
    id: '2',
    title: 'Social Media Banner',
    imageUri: 'https://picsum.photos/400/400?random=2',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    ratioPreset: 'Square',
    thumbnail: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: '3',
    title: 'Presentation Cover',
    imageUri: 'https://picsum.photos/600/400?random=3',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    ratioPreset: '16:9',
    thumbnail: 'https://picsum.photos/300/200?random=3'
  },
  {
    id: '4',
    title: 'Magazine Layout',
    imageUri: 'https://picsum.photos/400/600?random=4',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    ratioPreset: 'A3',
    thumbnail: 'https://picsum.photos/200/300?random=4'
  },
  {
    id: '5',
    title: 'Website Hero Image',
    imageUri: 'https://picsum.photos/800/400?random=5',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    ratioPreset: '16:9',
    thumbnail: 'https://picsum.photos/400/200?random=5'
  },
  {
    id: '6',
    title: 'Instagram Story',
    imageUri: 'https://picsum.photos/400/700?random=6',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
    ratioPreset: 'Custom',
    thumbnail: 'https://picsum.photos/200/350?random=6'
  },
  {
    id: '7',
    title: 'Business Card Design',
    imageUri: 'https://picsum.photos/600/400?random=7',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 1 month ago
    ratioPreset: 'A5',
    thumbnail: 'https://picsum.photos/300/200?random=7'
  },
  {
    id: '8',
    title: 'Poster Campaign',
    imageUri: 'https://picsum.photos/400/800?random=8',
    lastEdited: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 1.5 months ago
    ratioPreset: 'A1',
    thumbnail: 'https://picsum.photos/200/400?random=8'
  }
];

type ViewMode = 'list' | 'grid';

const HistoryList: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [projects, setProjects] = useState<ProjectData[]>(SAMPLE_PROJECTS);

  // Handle project selection
  const handleProjectPress = (project: ProjectData) => {
    Alert.alert(
      'Open Project',
      `Would you like to open "${project.title}" for editing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => console.log('Opening project:', project.id) }
      ]
    );
  };

  // Handle project deletion
  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project?.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setProjects(prevProjects =>
              prevProjects.filter(p => p.id !== projectId)
            );
          }
        }
      ]
    );
  };

  // Handle more options
  const handleMoreOptions = (project: ProjectData) => {
    Alert.alert(
      'Project Options',
      `Options for "${project.title}"`,
      [
        { text: 'Duplicate', onPress: () => console.log('Duplicate:', project.id) },
        { text: 'Rename', onPress: () => console.log('Rename:', project.id) },
        { text: 'Share', onPress: () => console.log('Share:', project.id) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Render header with view mode toggle
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleSection}>
        <Text style={styles.headerTitle}>Your Projects</Text>
        <Text style={styles.headerSubtitle}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive
          ]}
          onPress={() => setViewMode('list')}
          android_ripple={{ color: 'rgba(0, 122, 255, 0.2)', radius: 20 }}
        >
          <MaterialIcons
            name="view-list"
            size={20}
            color={viewMode === 'list' ? '#007AFF' : '#8E8E93'}
          />
        </Pressable>

        <Pressable
          style={[
            styles.toggleButton,
            viewMode === 'grid' && styles.toggleButtonActive
          ]}
          onPress={() => setViewMode('grid')}
          android_ripple={{ color: 'rgba(0, 122, 255, 0.2)', radius: 20 }}
        >
          <MaterialIcons
            name="view-module"
            size={20}
            color={viewMode === 'grid' ? '#007AFF' : '#8E8E93'}
          />
        </Pressable>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name="photo-library" size={64} color="#48484A" />
      <Text style={styles.emptyStateTitle}>No Projects Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create your first project by tapping the + button
      </Text>
    </View>
  );

  // Render project item
  const renderProjectItem = ({ item }: { item: ProjectData }) => (
    <HistoryCard
      project={item}
      viewMode={viewMode}
      onPress={handleProjectPress}
      onDelete={handleDeleteProject}
      onMoreOptions={handleMoreOptions}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {projects.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when switching modes
          contentContainerStyle={[
            styles.listContainer,
            viewMode === 'grid' && styles.gridContainer
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={
            viewMode === 'list'
              ? () => <View style={styles.listSeparator} />
              : undefined
          }
        />
      )}
    </SafeAreaView>
  );
};

export default HistoryList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 36,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  listContainer: {
    paddingVertical: 8,
  },
  gridContainer: {
    paddingHorizontal: 8,
  },
  listSeparator: {
    height: 8,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
