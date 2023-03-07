import { NavigationProp, useNavigation } from "@react-navigation/native"
import { useCallback } from "react"
import { Pressable, View } from "react-native"
import { PongoStackParamList } from "../../../types/Navigation"
import usePongoStore from "../../../state/usePongoState"
import useStore from "../../../state/useStore"
import { checkIsDm, getChatName } from "../../../util/ping"
import ProfileHeader from "./ProfileHeader"
import SearchHeader from "./SearchHeader"

interface ChatHeaderProps {
  chatId: string
}

export default function ChatHeader({ chatId }: ChatHeaderProps) {
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const { ship } = useStore()
  const { chats, isSearching, set } = usePongoStore()
  const chat = chats[chatId]
  const chatName = getChatName(ship, chat)
  const isDm = checkIsDm(chat)

  const onPress = useCallback(() => {
    set({ isSearching: false, searchResults: [] })
    if (isDm) {
      navigation.navigate('Profile', { ship: chatName })
    } else {
      navigation.navigate('Group', { id: chat.conversation.id })
    }
  }, [navigation, isDm, chatName])

  return (
    isSearching ? <SearchHeader searchType='message' /> :
      (
        <Pressable onPress={onPress}>
          <ProfileHeader name={chatName} showAvatar={isDm} />
        </Pressable>
      )
  )
}
