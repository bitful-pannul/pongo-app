
import { useCallback } from "react"
import { TouchableHighlight } from "react-native"
import { MENTION_REGEX } from "../../../constants/Regex"
import usePongoStore from "../../../state/usePongoState"
import { addSig } from "../../../util/string"
import Row from "../../spacing/Row"
import Avatar from "../Avatar"
import ShipName from "../ShipName"
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

  const text = drafts[chatId] || ''

  const selectMention = useCallback((ship: string) => () => {
    setDraft(chatId, text.replace(MENTION_REGEX, (match: string) => `${match[0] === ' ' ? ' ' : ''}~${ship} `))
    setShowMentions(false)
  }, [text])

  return (
    <SwipeList style={{ position: 'absolute', bottom: 0, backgroundColor }} minHeight={potentialMentions.length > 1 ? 100 : 50}>
      {potentialMentions.map(mem => (
        <TouchableHighlight onPress={selectMention(mem)}>
          <Row key={`mention-${mem}`} style={{ padding: 4 }}>
            <Avatar size='large' ship={addSig(mem)} />
            <ShipName name={addSig(mem)} style={{ marginLeft: 8, fontSize: 18, color }} />
          </Row>
        </TouchableHighlight>
      ))}
    </SwipeList>
  )
}
