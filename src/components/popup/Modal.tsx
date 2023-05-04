import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Pressable } from "react-native";

import useColors from "../../hooks/useColors"
import Col from '../spacing/Col'
import H3 from '../text/H3'
import { ViewProps, ScrollView } from '../Themed'
import useDimensions from "../../hooks/useDimensions";
import { useCallback, useMemo } from "react";

interface ModalOptions {
  show: boolean
  hide: () => void
  title?: string
  dismissable?: boolean
}

type ModalProps = ModalOptions & ViewProps;

const Modal = ({
  show,
  hide,
  title,
  dismissable = true,
  ...props
}: ModalProps) => {
  const { color, backgroundColor, shadedBackground } = useColors()
  const { cWidth, height, width, isLargeDevice } = useDimensions()
  const offset = useMemo(() => cWidth / 2 - 160, [cWidth])

  const dismiss = useCallback(() => {
    if (dismissable) hide()
  }, [hide, dismissable])

  if (!show) {
    return null
  }

  return (
    <Pressable onPress={dismiss} style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      height,
      zIndex: 10,
      flex: 1,
    }}>
      <Col style={{
        position: 'absolute',
        top: 0,
        width,
        height,
        backgroundColor: shadedBackground,
        flex: 1,
      }}>
        <Pressable onPress={e => e.stopPropagation()} style={{ flex: 1 }}>
          <Col {...props} style={[
            {
              position: 'absolute',
              left: offset,
              right: offset,
              width: 320,
              backgroundColor,
              borderRadius: 8,
              marginTop: isLargeDevice ? 48 : 24,
              paddingBottom: 8,
              maxHeight: height - (isLargeDevice ? 96 : 48),
              flex: 1,
            },
            props.style
          ]}>
            <TouchableOpacity onPress={hide} style={{ padding: 4, alignSelf: 'flex-end' }}>
              <Ionicons name='close' size={20} color={color} />
            </TouchableOpacity>
            {Boolean(title) && <H3 text={title!} style={{ textAlign: 'center', alignSelf: 'center', marginTop: -8 }} />}
            {props.children}
          </Col>
        </Pressable>
      </Col>
    </Pressable>
  )
}

export default Modal
