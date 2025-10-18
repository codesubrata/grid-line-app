import React from 'react';
import { StyleSheet, View } from 'react-native';
import HistoryList from '../../components/HistoryList';

const History = () => {
  return (
    <View style={styles.container}>
      <HistoryList />
    </View>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
