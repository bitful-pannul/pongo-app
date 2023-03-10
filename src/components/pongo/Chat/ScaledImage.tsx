import { useEffect, useState } from "react"
import { ActivityIndicator, Image as DefaultImage } from "react-native"
import { Image } from 'expo-image'

interface ScaledImageProps {
  width: number;
  height: number;
  uri: string;
}

const ScaledImage = ({ width, uri, ...props }: ScaledImageProps) => {
  const [height, setHeight] = useState(props.height)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    DefaultImage.getSize(uri, (width1, height1) => {
        setHeight(width / width1 * height1)
        setImageLoading(false)
      }, (error) => {
        console.log("ScaledImage,Image.getSize failed with error: ", error)
      })
  }, [])

  return (
    height ?
      <Image source={uri} style={{ height, width }} resizeMode='contain' cachePolicy={'disk'} />
      : imageLoading ?
        <ActivityIndicator size="large" />
        : null
  );
}

export default ScaledImage
