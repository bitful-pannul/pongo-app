import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import React, { useCallback, useMemo, useState } from 'react'
import { TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { BlurView } from "expo-blur"
import EmojiSelector from 'react-native-emoji-selector'

import Row from '../../spacing/Row'
import { Text, View } from '../../Themed'
import { gray_overlay } from '../../../constants/Colors'
import Col from '../../spacing/Col'
import { THUMB_UP, THUMB_DOWN, THANK_YOU, FIRE, LAUGHING, CLAPPING, EYES } from '../../../constants/Emojis'
import { Message } from '../../../types/Pongo'
import { isIos, isWeb } from '../../../constants/Layout'
import useDimensions from '../../../hooks/useDimensions'

interface MessageMenuProps {
  selected?: { msg: Message; offsetY: number; height: number };
  color: string;
  backgroundColor: string;
  canEdit?: boolean;
  canResend?: boolean;
  canDelete?: boolean;
  isOwnMsg?: boolean;
  react: (emoji: string) => () => void;
  interactWithSelected: (act: 'reply' | 'copy' | 'edit' | 'resend' | 'delete') => () => void;
}

const MessageMenu = React.memo(({
  selected, canEdit, canResend, canDelete, isOwnMsg, color, backgroundColor, react, interactWithSelected
}: MessageMenuProps) => {
  const { height } = useDimensions()
  const [showEmojis, setShowEmojis] = useState(false)

  const styles = useMemo(() => StyleSheet.create({
    messageInteractionModal: {
      alignSelf: 'center',
      backgroundColor: 'transparent',
      marginTop: Math.max(
        0,
        Math.min(
          (selected?.offsetY || 200) - (isOwnMsg ? 200 : 240),
          height - 300,
        )
      ),
      marginRight: isOwnMsg ? 0 : '12%',
      marginLeft: isOwnMsg ? '12%' : 0,
    },
    iconButtonContainer: {
      padding: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: 'center',
    },
    iconButton: {
      padding: 6,
    },
    iconButtonText: {
      fontSize: 18,
      marginLeft: 16,
    },
  }), [height])

  const toggleEmojis = useCallback(() => setShowEmojis(!showEmojis), [showEmojis])

  const selectEmoji = useCallback((emoji: string) => react(emoji)(), [react])

  const blurContents = (
    <Col style={styles.messageInteractionModal}>
      {!isOwnMsg && (
        <Row style={{ borderRadius: 8, marginBottom: 4, paddingHorizontal: 4 }}>
          {/* SHOW 6 EMOJIS */}
          {[THUMB_UP, FIRE, EYES, LAUGHING, CLAPPING, THANK_YOU, THUMB_DOWN].map(emoji => (
            <TouchableOpacity onPress={react(emoji)} style={{ padding: 4 }} key={emoji}>
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <Ionicons
            style={{ marginLeft: 8, marginRight: 4 }}
            name={`chevron-${showEmojis ? 'up' : 'down'}-circle-outline`}
            color={color} size={32}
            onPress={toggleEmojis}
          />
        </Row>
      )}
      {showEmojis ? (
        isWeb ? (
          <ScrollView style={[styles.iconButtonContainer, { maxWidth: 320, height: 200, backgroundColor }]}>
            {/* SHOW a react native emoji picker */}
            <EmojiSelector onEmojiSelected={selectEmoji} showTabs={false} />
          </ScrollView>
        ) : (
          <Col style={[styles.iconButtonContainer, { maxWidth: 320, backgroundColor }]}>
            {/* SHOW a react native emoji picker */}
            <EmojiSelector onEmojiSelected={selectEmoji} showTabs={false} />
          </Col>
        )
      ) : (
        <Col style={styles.iconButtonContainer}>
          <TouchableOpacity onPress={interactWithSelected('reply')}>
            <Row style={styles.iconButton}>
              <Ionicons size={22} color={color} name='chatbubble-outline' />
              <Text style={styles.iconButtonText}>Reply</Text>
            </Row>
          </TouchableOpacity>
          <TouchableOpacity onPress={interactWithSelected('copy')}>
            <Row style={styles.iconButton}>
              <Ionicons size={22} color={color} name='copy-outline' />
              <Text style={styles.iconButtonText}>Copy</Text>
            </Row>                  
          </TouchableOpacity>
          {canEdit && <TouchableOpacity onPress={interactWithSelected('edit')}>
            <Row style={styles.iconButton}>
              <MaterialIcons size={22} color={color} name='edit' />
              <Text style={styles.iconButtonText}>Edit</Text>
            </Row>                  
          </TouchableOpacity>}
          {canResend && <TouchableOpacity onPress={interactWithSelected('resend')}>
            <Row style={styles.iconButton}>
              <Ionicons size={22} color={color} name='send' />
              <Text style={styles.iconButtonText}>Resend</Text>
            </Row>                  
          </TouchableOpacity>}
          {canDelete && <TouchableOpacity onPress={interactWithSelected('delete')}>
            <Row style={styles.iconButton}>
              <Ionicons size={22} color={color} name='trash' />
              <Text style={styles.iconButtonText}>Delete</Text>
            </Row>                  
          </TouchableOpacity>}
        </Col>
      )}
    </Col>
  )

  return isIos ? (
    <BlurView style={{ width: '100%', height: '100%', backgroundColor: gray_overlay }} intensity={2}>
      {blurContents}
    </BlurView>
  ) : (
    <View style={{ width: '100%', height: '100%', backgroundColor: gray_overlay }}>
      {blurContents}
    </View>
  )
})

export default MessageMenu
