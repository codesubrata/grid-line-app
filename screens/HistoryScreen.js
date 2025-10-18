// screens/HistoryScreen.js
import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppContext } from '../context/AppContext';

const HistoryScreen = () => {
    const { history } = useContext(AppContext);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🕘 History</Text>
            {history.length === 0 ? (
                <Text>No saved projects yet.</Text>
            ) : (
                history.map((item, idx) => <Text key={idx}>Project {idx + 1}</Text>)
            )}
        </View>
    );
};

export default HistoryScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 22, marginBottom: 10 }
});
