import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HistoryList from '../../components/HistoryList';

const History = () => {
  const [isSelectRatioModalVisible, setIsSelectRatioModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Handle FAB press to open image source modal
  const handleFabPress = () => {
    setIsSelectRatioModalVisible(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsSelectRatioModalVisible(false);
  };

  // Handle when a new project is created and selected
  const handleImageSelected = (projectId: string) => {
    console.log('New project created with ID:', projectId);
    setIsSelectRatioModalVisible(false);

    // Show success feedback (you can add a toast notification here later)
    // The HistoryList will automatically refresh due to Redux store updates
  };

  // Handle advanced crop if needed (optional)
  const handleAdvancedCrop = (uri: string) => {
    console.log('Advanced crop triggered for URI:', uri);
    // This can be implemented later for advanced cropping features
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
      />

      {/* Main Content Area */}
      <View style={styles.content}>
        <View style={styles.listContainer}>
          <HistoryList />
        </View>
      </View>

      {/* Bottom Safe Area Spacer */}
      <View style={[styles.bottomSpacer, { height: insets.bottom }]} />
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  listContainer: {
    flex: 1,
    // Additional spacing for the list
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  bottomSpacer: {
    backgroundColor: '#000000',
  },

  header: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
});