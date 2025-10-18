import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'

type Props = {
    onPress: () => void
};

export default function FabImagePickerIcon({ onPress }: Props) {
    return (
        <View>
            <TouchableOpacity style={styles.fab} onPress={onPress}>
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    )
}


const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        bottom: 90,
        right: 10,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#007AFF",
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
})