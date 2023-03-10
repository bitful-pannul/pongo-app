import { Ionicons } from "@expo/vector-icons";
import { Keyboard, Pressable, TouchableOpacity } from "react-native";
import H3 from "../../../components/text/H3";

import { ScrollView, ViewProps } from "../../../components/Themed";
import { window } from "../../../constants/Layout";
import Col from "../spacing/Col";
import Row from "../spacing/Row";

interface ModalOptions {
  show: boolean
  color: string
  backgroundColor: string
  shadedBackground: string
  hide: () => void
  title?: string
}

export type ModalProps = ModalOptions & ViewProps;

const Modal = ({
  show,
  hide,
  title,
  color,
  backgroundColor,
  shadedBackground,
  ...props
}: ModalProps) => {

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
        bottom: 0,
        left: 0,
        right: 0,
        height: window.height,
        backgroundColor: shadedBackground,
      }}>
        <ScrollView {...props} style={[
          {
            position: 'absolute',
            left: offset,
            right: offset,
            backgroundColor,
            borderRadius: 8,
            marginTop: 40,
            padding: 8,
            flex: 1,
          },
          props.style
        ]}
          keyboardShouldPersistTaps='handled'
          onStartShouldSetResponder={(event) => true}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault() }}
        >
          <Row between>
            {Boolean(title) && <H3 text={title!} />}
            <TouchableOpacity onPress={hide} style={{ padding: 4, alignSelf: 'flex-end' }}>
              <Ionicons name='close' size={20} color={color} />
            </TouchableOpacity>
          </Row>
          <Col>
            {props.children}
          </Col>
        </ScrollView>
      </Col>
    </Pressable>
  )
}

export default Modal
