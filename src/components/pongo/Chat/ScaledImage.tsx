import { useEffect, useState } from "react"
import { ActivityIndicator, Image as DefaultImage } from "react-native"
import { Image } from "expo-image"
import { isWeb } from "../../../constants/Layout";

interface ScaledImageProps {
  width: number;
  height: number;
  uri: string;
}

const ScaledImage = ({ width, uri, ...props }: ScaledImageProps) => {
  const [displayHeight, setDisplayHeight] = useState(isWeb ? undefined : props.height)
  const [displayWidth, setDisplayWidth] = useState(width)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
      DefaultImage.getSize(uri, (width1, height1) => {
        if (width1 < width) {
          setDisplayWidth(width1)
          setDisplayHeight(height1)
        } else {
          setDisplayHeight(width / width1 * height1)
        }
        setImageLoading(false)
      }, (error) => {
        console.log("ScaledImage,Image.getSize failed with error: ", error)
      })
  }, [])

  return (
    displayHeight ?
      <Image source={uri} style={{ width: displayWidth, height: displayHeight }} contentFit="contain" cachePolicy='disk' />
      : imageLoading ?
        <ActivityIndicator size="large" />
        : null
  );
}

export default ScaledImage
