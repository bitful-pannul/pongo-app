import { useCallback } from 'react'
import { HeaderBackButton } from '@react-navigation/elements'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'

import useStore from "../../state/useStore"
import usePongoStore from '../../state/usePongoState'
import { PongoStackParamList } from '../../types/Navigation'

export default function NavBackButton() {
  const { ship: self } = useStore()
  const { set, sendMessage } = usePongoStore()
  const navigation = useNavigation()
  const route = useRoute<RouteProp<PongoStackParamList>>()

  const goBack = useCallback(() => {
    set({ isSearching: false, searchResults: [], messageSearchResults: [], searchTerm: '' })
    navigation.goBack()
    if (route.name === 'Call') {
      sendMessage({ self, convo: (route as RouteProp<PongoStackParamList, 'Call'>).params.chatId, kind: 'webrtc-call', content: 'end' })
    }
  }, [set, navigation, route])

  return (
    <HeaderBackButton labelVisible={false} tintColor={'white'} onPress={goBack} />
  )
}
