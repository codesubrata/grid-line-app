import FabImagePicker from "@/components/FabImagePickerIcon";
import ImageSourceOptions from "@/components/ImageSourceOptions";
import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./globals.css";

export default function RootLayout() {
    // Modal states managed at parent level
    const [isSelectRatio, setIsSelectRatio] = useState<boolean>(false);

    // Open image source selection modal
    const openModalOption = () => {
        setIsSelectRatio(true);
    };

    // Handle closing the image source modal (without picking)
    const handleSelectRatioModalClose = () => {
        setIsSelectRatio(false);
    };

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {/* ✅ Wrap everything inside GestureHandlerRootView */}
                <GestureHandlerRootView style={styles.container}>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    </Stack>

                    <FabImagePicker onPress={openModalOption} />

                    {/* Image Source Selection Modal */}
                    {isSelectRatio && (
                        <ImageSourceOptions
                            isSelectRatioModalVisible={isSelectRatio}
                            onClose={handleSelectRatioModalClose}
                        />
                    )}
                </GestureHandlerRootView>
            </PersistGate>
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
