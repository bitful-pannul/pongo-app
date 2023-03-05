import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Pressable } from "react-native";

import useColors from "../../hooks/useColors"
import Col from '../spacing/Col'
import H3 from '../text/H3'
import { ViewProps } from '../Themed'
import { window } from '../../constants/Layout'

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

  if (!show) {
    return null
  }

  const offset = window.width / 2 - 160

  return (
    <Pressable onPress={hide} style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      height: window.height,
      zIndex: 10,
    }}>
      <Col style={{
        position: 'absolute',
        top: 0,
        width: window.width,
        height: window.height,
        backgroundColor: shadedBackground,
      }}>
        <Col {...props} style={[
          {
            position: 'absolute',
            left: offset,
            right: offset,
            width: 320,
            backgroundColor,
            borderRadius: 8,
            marginTop: 24,
            paddingBottom: 8,
          },
          props.style
        ]}
          onStartShouldSetResponder={(event) => true}
          onTouchEnd={(e) => { e.stopPropagation(); }}
        >
          <TouchableOpacity onPress={hide} style={{ padding: 4, alignSelf: 'flex-end' }}>
          {Boolean(title) && <H3 text={title!} />}
            <Ionicons name='close' size={20} color={color} />
          </TouchableOpacity>
          <Col>
            {props.children}
          </Col>
        </Col>
      </Col>
    </Pressable>
  )
}

export default Modal
