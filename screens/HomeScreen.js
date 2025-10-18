// screens/HomeScreen.js
import * as ImagePicker from 'expo-image-picker';
import { Button, StyleSheet, Text, View } from 'react-native';

const HomeScreen = ({ navigation }) => {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!result.canceled) {
            navigation.navigate('Editor', { imageUri: result.assets[0].uri });
        }
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync();
        if (!result.canceled) {
            navigation.navigate('Editor', { imageUri: result.assets[0].uri });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎨 Welcome to GridLine</Text>
            <Button title="📁 Upload Photo" onPress={pickImage} />
            <Button title="📷 Take Photo" onPress={takePhoto} />
            <Button title="📜 View History" onPress={() => navigation.navigate('History')} />
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', gap: 20, padding: 20 },
    title: { fontSize: 24, textAlign: 'center', marginBottom: 20 }
});
