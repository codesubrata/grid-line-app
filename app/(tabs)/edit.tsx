import Button from '@/components/Button'
import ImageViewer from '@/components/ImageViewer'
import * as ImagePicker from 'expo-image-picker'
import { StyleSheet, View, Alert } from 'react-native'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setImage, clearImage } from '../store/slices/imageSlice'

export default function Edit() {
  const dispatch = useDispatch()

  const [showAppOptions, setShowAppOptions] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const onReset = () => {
    dispatch(clearImage()) // ✅ reset to default image
    setShowAppOptions(false)
  }

  const onAddSticker = () => {
    setIsVisible(true)
  }

  const onSaveImageAsync = () => {
    // TODO: implement later
  }

  const onModalClose = () => {
    setIsVisible(false)
  }

  const pickImageAsync = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled) {
      dispatch(setImage({ uri: result.assets[0].uri, source: 'gallery' })) // ✅ proper shape
      setShowAppOptions(false)
    } else {
      Alert.alert('No image selected', 'You did not select any image.')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {/* ✅ ImageViewer now always uses Redux state */}
        <ImageViewer />
      </View>

      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            {/* <IconButton icon="refresh" label="Reset" onPress={onReset} /> */}
            {/* <CircleButton onPress={onAddSticker} /> */}
            {/* <IconButton icon="save-alt" label="Save" onPress={onSaveImageAsync} /> */}
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
          <Button label="Use this photo" onPress={() => setShowAppOptions(true)} />
        </View>
      )}


    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    // paddingTop: 28,
    // marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
    marginBottom: 50,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 80,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
})
