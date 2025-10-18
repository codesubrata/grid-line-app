// screens/EditorScreen.js
import { useState } from 'react';
import { Image, Slider, StyleSheet, View } from 'react-native';
import GridOverlay from '../components/GridOverlay';

const EditorScreen = ({ route }) => {
    const { imageUri } = route.params;
    const [rows, setRows] = useState(4);
    const [cols, setCols] = useState(4);

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <GridOverlay rows={rows} cols={cols} />
            </View>

            <Slider
                minimumValue={2}
                maximumValue={20}
                step={1}
                value={rows}
                onValueChange={setRows}
            />
            <Slider
                minimumValue={2}
                maximumValue={20}
                step={1}
                value={cols}
                onValueChange={setCols}
            />
        </View>
    );
};

export default EditorScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: { width: '100%', height: '100%', position: 'absolute' },
});
