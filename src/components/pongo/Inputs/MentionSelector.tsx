
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Easing } from "react-native"
import { Animated, StyleSheet } from "react-native"
import { TouchableHighlight } from "react-native"
import { MENTION_REGEX } from "../../../constants/Regex"
import usePongoStore from "../../../state/usePongoState"
import { createPulse } from "../../../util/animation"
import { addSig } from "../../../util/string"
import Row from "../../spacing/Row"
import { Text } from "../../Themed"
import Avatar from "../Avatar"
import ShipName from "../ShipName"
import ShipRow from "../ShipRow"
import SwipeList from "../SwipeList"

interface MentionSelectorProps {
  chatId: string
  potentialMentions: string[]
  color: string
  backgroundColor: string
  setShowMentions: (value: boolean) => void
}

export default function MentionSelector({ chatId, potentialMentions, color, backgroundColor, setShowMentions }: MentionSelectorProps) {
  const { drafts, setDraft } = usePongoStore()
  const [cancelTranslate] = useState(new Animated.Value(-6))
  const [cancelAnimation, setCancelAnimation] = useState(createPulse(cancelTranslate, 0, -6, Easing.linear))

  useEffect(() => {
    cancelAnimation.start()
  }, [])

  const text = drafts[chatId] || ''

  const selectMention = useCallback((ship: string) => () => {
    setDraft(chatId, text.replace(MENTION_REGEX, (match: string) => `${match[0] === ' ' ? ' ' : ''}~${ship} `))
    setShowMentions(false)
  }, [text])

  const styles = useMemo(() => StyleSheet.create({
    swipeList: { position: 'absolute', bottom: 0, backgroundColor },
    prompt: {
      marginTop: 4,
      display: 'flex',
      flexDirection: 'row',
      alignSelf: 'center',
      marginLeft: -50,
    },
    shipName: { marginLeft: 8, fontSize: 18, color },
    mentionRow: { padding: 4 },
    swipeText: { marginLeft: 8 },
  }), [color])

  const minHeight = useMemo(() => 
    potentialMentions.length > 3 ? 170 : potentialMentions.length > 2 ? 130 : potentialMentions.length > 1 ? 90 : 50,
    [potentialMentions.length]
  )

  return (
    <SwipeList style={styles.swipeList} minHeight={minHeight}>
      {potentialMentions.length > 3 && <Animated.View style={[styles.prompt, { transform: [{ translateY: cancelTranslate }, {perspective: 1000}] }]}>
        <Ionicons name='chevron-up' size={16} color='black' />
        <Text style={styles.swipeText}>Swipe up for more</Text>
      </Animated.View>}
      {potentialMentions.map(mem => <ShipRow ship={mem} onPress={selectMention} />)}
    </SwipeList>
  )
}
