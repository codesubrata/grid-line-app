import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabWrapperProps {
    children: React.ReactNode;
    backgroundColor?: string;
}

export const TabWrapper: React.FC<TabWrapperProps> = ({
    children,
    backgroundColor = '#ffffff', // default white background
}) => {
    const insets = useSafeAreaInsets();

    // Calculate top padding dynamically for iOS and Android
    // For Android: add StatusBar currentHeight if exists + base padding
    // For iOS: safe area top inset + base padding
    const basePadding = 0; // You can adjust this base padding as needed
    const topPadding =
        Platform.OS === 'android'
            ? (StatusBar.currentHeight || 0) + basePadding
            : insets.top + basePadding;

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor,
                        paddingTop: topPadding,
                    },
                ]}
            >
                {children}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
