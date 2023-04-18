import { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native'

export default function useDimensions() {
  const [width, setWidth] = useState(Dimensions.get('window').width)
  const [height, setHeight] = useState(Dimensions.get('window').height)

  const isLargeDevice = useMemo(() => width > 700, [width])
  const isSmallDevice = useMemo(() => width < 375, [width])
  const cWidth = useMemo(() => isLargeDevice ? (width > 1200 ? Math.min(width - 400, 1200) : width * 2 / 3) : width, [width])

  useEffect(() => {
    const onDimensionsChange = ({ window, screen, }: { window: ScaledSize; screen: ScaledSize; }) => {
      setWidth(window.width)
      setHeight(window.height)
    }

    const listener = Dimensions.addEventListener('change', onDimensionsChange)
    
    return () => {
      listener?.remove()
    }
  }, [])
 
  return { width, height, isLargeDevice, isSmallDevice, cWidth }
}
