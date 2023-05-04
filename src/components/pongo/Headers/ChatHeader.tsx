import { NavigationProp, useNavigation } from "@react-navigation/native"
import { useCallback } from "react"
import { Pressable, View } from "react-native"
import { PongoStackParamList } from "../../../types/Navigation"
import usePongoStore from "../../../state/usePongoState"
import useStore from "../../../state/useStore"
import { checkIsDm, getChatName, getDmCounterparty } from "../../../util/ping"
import ProfileHeader from "./ProfileHeader"
import SearchHeader from "./SearchHeader"
import useNimiState from "../../../state/useNimiState"

interface ChatHeaderProps {
  chatId: string
}

export default function ChatHeader({ chatId }: ChatHeaderProps) {
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const { ship } = useStore()
  const { chats, isSearching, set } = usePongoStore()
  const profiles = useNimiState(s => s.profiles)
  const chat = chats[chatId]
  const chatName = getChatName(ship, chat, profiles)
  const isDm = checkIsDm(chat)

  const onPress = useCallback(() => {
    set({ isSearching: false, searchResults: [] })
    if (isDm) {
      navigation.navigate('Profile', { ship: getDmCounterparty(ship, chat) })
    } else {
      navigation.navigate('Group', { id: chat.conversation.id })
    }
  }, [navigation, isDm, chatName, ship, chat])

  return (
    isSearching ? <SearchHeader searchType='message' chatId={chatId} /> :
      (
        <Pressable onPress={onPress}>
          <ProfileHeader name={chatName} showAvatar={isDm}  />
        </Pressable>
      )
  )
}
