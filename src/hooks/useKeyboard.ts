import { useEffect, useState } from "react"
import { Keyboard } from "react-native"

export default function useKeyboard() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardVisible(true) // or some other action
          setKeyboardHeight(e.endCoordinates.height)
        }
      )
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardVisible(false) // or some other action
          setKeyboardHeight(0)
        }
      )

      return () => {
        keyboardDidHideListener.remove()
        keyboardDidShowListener.remove()
      }
    }, [])

  return { isKeyboardVisible, keyboardHeight }
}
