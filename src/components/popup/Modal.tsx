import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Pressable } from "react-native";

import useColors from "../../hooks/useColors"
import Col from '../spacing/Col'
import H3 from '../text/H3'
import { ViewProps } from '../Themed'
import useDimensions from "../../hooks/useDimensions";
import { useMemo } from "react";

interface ModalOptions {
  show: boolean
  hide: () => void
  title?: string
}

type ModalProps = ModalOptions & ViewProps;

const Modal = ({
  show,
  hide,
  title,
  ...props
}: ModalProps) => {
  const { color, backgroundColor, shadedBackground } = useColors()
  const { cWidth, height, width, isLargeDevice } = useDimensions()
  const offset = useMemo(() => cWidth / 2 - 160, [cWidth])

  if (!show) {
    return null
  }

  return (
    <Pressable onPress={hide} style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      height,
      zIndex: 10,
    }}>
      <Col style={{
        position: 'absolute',
        top: 0,
        width,
        height,
        backgroundColor: shadedBackground,
      }}>
        <Pressable onPress={e => e.stopPropagation()}>
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
            },
            props.style
          ]}>
            <TouchableOpacity onPress={hide} style={{ padding: 4, alignSelf: 'flex-end' }}>
            {Boolean(title) && <H3 text={title!} />}
              <Ionicons name='close' size={20} color={color} />
            </TouchableOpacity>
            <Col>
              {props.children}
            </Col>
          </Col>
        </Pressable>
      </Col>
    </Pressable>
  )
}

export default Modal
