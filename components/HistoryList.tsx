import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
// Fix: Use dynamic import for React Navigation to handle ES module compatibility
let useNavigation: any;
try {
  // Try ES module import first
  useNavigation = require('@react-navigation/native').useNavigation;
} catch (error) {
  // Fallback to dynamic import if direct require fails
  import('@react-navigation/native').then(module => {
    useNavigation = module.useNavigation;
  }).catch(err => {
    console.warn('React Navigation not available:', err);
  });
}

import HistoryCard, { ProjectData } from './HistoryCard';
import { RootState } from '../app/store/store';
import { getProjectList, getProject, deleteProject } from '../app/services/Storage';
import { setProjects, setLoading, setError, selectProject } from '../app/store/slices/historySlice';

type ViewMode = 'list' | 'grid';

const HistoryList: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const dispatch = useDispatch();

  // Initialize navigation with fallback
  let navigation: any = null;
  try {
    navigation = useNavigation?.();
  } catch (error) {
    console.warn('Navigation not available:', error);
  }

  // Get projects from Redux store
  const { projects, isLoading, error } = useSelector((state: RootState) => state.project);

  // Load projects from storage on component mount
  useEffect(() => {
    loadProjectsFromStorage();
  }, []);

  const loadProjectsFromStorage = async () => {
    try {
      dispatch(setLoading(true));
      const storedProjects = await getProjectList();

      // Load full project details for each project
      const projectsWithDetails = await Promise.all(
        storedProjects.map(async (project) => {
          const fullProject = await getProject(project.id);
          return fullProject || project; // Fallback to summary if details not found
        })
      );

      dispatch(setProjects(projectsWithDetails.filter(Boolean))); // Remove any null projects
      dispatch(setError(null));
    } catch (err) {
      console.error('Failed to load projects:', err);
      dispatch(setError('Failed to load projects'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle project selection - NAVIGATES TO GRID TAB
  const handleProjectPress = (project: ProjectData) => {
    console.log('Selected project:', project.id);

    const selectedProject = projects.find(p => p.id === project.id);
    if (selectedProject) {
      dispatch(selectProject(project.id));

      // Navigate to Grid tab if navigation is available
      if (navigation) {
        navigation.navigate('Grid' as never);
        console.log('✅ Navigated to Grid tab with project:', project.title);
      } else {
        // Fallback: Show alert that navigation isn't available
        Alert.alert(
          'Project Selected',
          `"${project.title}" is ready for editing. Please switch to the Grid tab to continue.`,
          [{ text: 'OK' }]
        );
        console.log('ℹ️ Project selected, but navigation not available');
      }
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteProject(projectId);

              if (success) {
                // Reload projects from storage
                await loadProjectsFromStorage();
                console.log('🗑️ Project deleted:', projectId);
              } else {
                Alert.alert('Error', 'Failed to delete project');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
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
        {
          text: 'Duplicate',
          onPress: () => {
            console.log('Duplicate project:', project.id);
            Alert.alert('Coming Soon', 'Duplicate feature will be available in the next update.');
          }
        },
        {
          text: 'Rename',
          onPress: () => {
            console.log('Rename project:', project.id);
            Alert.alert('Coming Soon', 'Rename feature will be available in the next update.');
          }
        },
        {
          text: 'Share',
          onPress: () => {
            console.log('Share project:', project.id);
            Alert.alert('Coming Soon', 'Share feature will be available in the next update.');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Convert Redux Project to HistoryCard ProjectData
  const convertToProjectData = (project: any): ProjectData => {
    return {
      id: project.id,
      title: project.name || 'Untitled Project',
      imageUri: project.imageUri,
      lastEdited: new Date(project.updatedAt || project.createdAt),
      paperPreset: project.paperPreset || 'A4',
      thumbnail: project.thumbnailUri,
      realWorldWidth: project.realWorldWidth,
      realWorldHeight: project.realWorldHeight,
      isFavorite: project.isFavorite,
    };
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

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name="hourglass-empty" size={64} color="#48484A" />
      <Text style={styles.emptyStateTitle}>Loading Projects</Text>
      <Text style={styles.emptyStateSubtitle}>
        Please wait while we load your projects...
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
      <Text style={styles.emptyStateTitle}>Error Loading Projects</Text>
      <Text style={styles.emptyStateSubtitle}>
        {error || 'Failed to load projects'}
      </Text>
      <Pressable
        style={styles.retryButton}
        onPress={loadProjectsFromStorage}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  // Render project item
  const renderProjectItem = ({ item }: { item: any }) => (
    <HistoryCard
      project={convertToProjectData(item)}
      viewMode={viewMode}
      onPress={handleProjectPress}
      onDelete={handleDeleteProject}
      onMoreOptions={handleMoreOptions}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : projects.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={[
            styles.listContainer,
            viewMode === 'grid' && styles.gridContainer
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadProjectsFromStorage}
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
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});