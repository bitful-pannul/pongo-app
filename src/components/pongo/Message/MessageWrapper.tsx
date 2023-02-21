import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { capitalize } from "lodash"
import moment from "moment"
import { useCallback, useState } from "react"
import { View, Pressable, Modal } from "react-native"
import * as Haptics from 'expo-haptics'

import { gray_overlay } from "../../../constants/Colors"
import { Message, Reactions } from "../../../types/Pongo"
import { ONE_SECOND } from "../../../util/time"
import Col from "../../spacing/Col"
import Row from "../../spacing/Row"
import ShipName from "../ShipName"
import Avatar from "../Avatar"
import { isIos } from "../../../constants/Layout"
import useColors from "../../../hooks/useColors"
import { Text } from "../../Themed"

interface ReactionProps {
  color: string;
  emoji: string;
  reactions: Reactions;
  addReaction?: (emoji: string) => void;
}

const Reaction = ({ color, emoji, reactions, addReaction }: ReactionProps) => {
  const { color: textColor } = useColors()
  const [showReactors, setShowReactors] = useState(false)

  const onPressReaction = useCallback((emoji: string) => () => {
    addReaction && addReaction(emoji)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [addReaction])

  const onLongPressReaction = useCallback((emoji: string) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setShowReactors(true)
  }, [addReaction])

  const hideReactors = useCallback(() => setShowReactors(false), [])

  const blurContents = (
    <Col style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 24, borderRadius: 8 }}>
      <Text style={{ fontSize: 18, color: textColor, fontWeight: '600', marginBottom: 4 }}>Reacted with {emoji}:</Text>
      {reactions[emoji].map(ship => (
        <Row key={`react=${ship}`} style={{ alignSelf: 'flex-start' }}>
          <Avatar ship={ship} />
          <ShipName name={ship} style={{ color: textColor, fontSize: 16, marginTop: 4 }} />
        </Row>
      ))}
    </Col>
  )

  return (
    <>
      <Pressable onPress={onPressReaction(emoji)} onLongPress={onLongPressReaction(emoji)} key={emoji} style={{ marginRight: 6 }}>
        <Text style={{ color, padding: 4, paddingHorizontal: 6 }}>
          {emoji}{reactions[emoji].length > 1 ? ` ${reactions[emoji].length}`: ''}
        </Text>
      </Pressable>
      {showReactors && (
        <Modal transparent>
          <Pressable onPress={hideReactors} style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {isIos ? (
              <BlurView style={{ width: '100%', height: '100%', backgroundColor: gray_overlay, flex: 1, paddingTop: 400 }} intensity={2}>
                {blurContents}
              </BlurView>
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: gray_overlay, flex: 1, paddingTop: 400 }}>
                {blurContents}
              </View>
            )}
          </Pressable>
        </Modal>
        
      )}
    </>
  )
}

type MessageWrapperProps = View['props'] & {
  color: string;
  message: Message;
  showStatus?: boolean;
  addReaction?: (emoji: string) => void;
}

const MessageWrapper = ({
  color,
  message: {
    edited,
    timestamp,
    reactions,
    status,
  },
  showStatus = false,
  addReaction,
  style,
  ...props
}: MessageWrapperProps) => {
  return (
    <View {...props} style={[style,
      { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }
    ]}>
      {props.children}

      <View style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: Object.keys(reactions).length > 0 ? 'space-between' : 'flex-end',
        flexWrap: 'wrap',
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
        marginTop: 3,
        flexGrow: 1,
        marginLeft: 4,
      }}>
        {Object.keys(reactions).length > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', marginHorizontal: 8 }}>
            {Object.keys(reactions).map(emoji => (
              !reactions[emoji]?.length ? null : <Reaction emoji={emoji} color={color} reactions={reactions} key={emoji} addReaction={addReaction} />
            ))}
          </View>
        )}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }}>
          {edited && <Text style={{ color, marginLeft: 8, marginRight: -2 }}>edited</Text>}
          {status === 'pending' && showStatus ? (
            <Ionicons name='time-outline' size={16} color={color} style={{ marginLeft: 8 }} />
          ) : status === 'failed' ? (
            <Ionicons name='alert-circle' size={16} color={color} style={{ marginLeft: 8 }} />
          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', marginLeft: 8, alignItems: 'flex-end', minWidth: 60 }}>
              <Text style={{ color, fontSize: 12 }}>{moment(timestamp * ONE_SECOND).format('h:mm a')}</Text>
              {showStatus && !!status && <Text style={{ color, alignSelf: 'flex-end', fontSize: 12 }}>{capitalize(status)}</Text>}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default MessageWrapper
