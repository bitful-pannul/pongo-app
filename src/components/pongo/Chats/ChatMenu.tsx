// https://www.npmjs.com/package/react-native-popup-menu
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu'
import { isWeb } from '../../../constants/Layout';
import useColors from '../../../hooks/useColors';
import usePongoStore from '../../../state/usePongoState';
import useStore from '../../../state/useStore';
import { PongoStackParamList } from '../../../types/Navigation';
import { checkIsDm, getChatName } from '../../../util/ping';
import Row from '../../spacing/Row';
import { Text } from '../../Themed';
import { Alert } from 'react-native';

interface ChatMenuProps {
  id: string;
}

export default function ChatMenu({ id }: ChatMenuProps) {
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const { api, ship } = useStore()
  const { chats, set, leaveConversation, getChats, toggleMute } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const chat = chats[id]
  const chatName = getChatName(ship, chat)
  const isDm = checkIsDm(chat)

  const leave = useCallback(() => {
    Alert.alert('Leave Chat', 'Are you sure you want to leave this chat?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', onPress: async () => {
        try {
          await leaveConversation(id)
          if (api) {
            getChats(api)
          }
          navigation.goBack()
        } catch {}
      } },
    ])
  }, [id, api, leaveConversation])

  const changeMute = useCallback(() => toggleMute(id), [id])

  const showInfo = useCallback(() => {
    set({ isSearching: false, searchResults: [] })
    if (isDm) {
      navigation.navigate('Profile', { ship: chatName })
    } else {
      navigation.navigate('Group', { id: chat.conversation.id })
    }
  }, [navigation, isDm, chatName])

  return (
    <Menu style={{ marginRight: isWeb ? 16 : undefined }}>
      <MenuTrigger>
        <Ionicons name='menu' size={24} color='white' style={{ padding: 4 }} />
      </MenuTrigger>
      <MenuOptions {...{ style: { backgroundColor } }}>
        <MenuOption onSelect={() => set({ isSearching: true, searchResults: [] })}>
          <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2, paddingTop: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Search</Text>
            <Ionicons name='search' size={24} color={color} style={{ padding: 4 }} />
          </Row>
        </MenuOption>
        <MenuOption onSelect={showInfo} >
          <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Info</Text>
            <Ionicons name='information-circle' size={24} color={color} style={{ padding: 4 }} />
          </Row>
        </MenuOption>
        <MenuOption onSelect={leave} >
          <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Leave</Text>
            <Ionicons name='trash' size={24} color={color} style={{ padding: 4 }} />
          </Row>
        </MenuOption>
        <MenuOption onSelect={changeMute}>
          <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2, paddingBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>{chat.conversation.muted ? 'Unmute' : 'Mute'}</Text>
            <Ionicons name={chat.conversation.muted ? 'volume-high' : 'volume-mute' } size={24} color={color} style={{ padding: 4 }} />
          </Row>
        </MenuOption>
      </MenuOptions>
    </Menu>
  )
}
