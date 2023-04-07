import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect } from "react"
import { Pressable } from "react-native"

import { uq_purple } from "../../../constants/Colors"
import useDebounce from "../../../hooks/useDebounce"
import useSearch from "../../../hooks/useSearch"
import usePongoStore from "../../../state/usePongoState"
import { SearchType } from "../../../types/Pongo"
import { ONE_SECOND } from "../../../util/time"
import Row from "../../spacing/Row"
import { TextInput } from "../../Themed"
import { isWeb } from "../../../constants/Layout"

interface SearchHeaderProps {
  searchType?: SearchType
  chatId?: string
}

export function OpenSearch() {
  const { set } = usePongoStore()

  return (
    <Pressable onPress={() => set({ isSearching: true, searchResults: [] })}>
      <Ionicons name='search' size={24} color='white' style={{ padding: 4, paddingRight: isWeb ? 20 : 4 }} />
    </Pressable>
  )
}

export function CloseSearch() {
  const { set } = usePongoStore()

  return (
    <Pressable onPress={() => set({ isSearching: false, searchResults: [], searchTerm: '' })}>
      <Ionicons name='close-circle-outline' color='white' style={{ padding: 4, paddingRight: isWeb ? 20 : 4  }} size={24} />
    </Pressable>
  )
}

export default function SearchHeader({ searchType = 'ship', chatId }: SearchHeaderProps) {
  const { set, searchTerm } = usePongoStore()
  const { search } = useSearch()

  useEffect(() => {
    if (searchType === 'ship') {
      set({ searchTerm: '' })
    }

    return () => {
      set({ isSearching: false, searchResults: [], searchTerm: '', messageSearchResults: [] })
    }
  }, [])

  useDebounce(() => search(searchType, searchTerm, chatId), [searchTerm, searchType, search], ONE_SECOND * 0.2)

  const updateSearch = useCallback((searchTerm: string) => set({ searchTerm }), [])

  const placeholder = searchType === 'chat' ? 'Search chats' :
    searchType === 'ship' ? 'Search users' :
    searchType === 'message' ? 'Search messages' :
    searchType === 'tag' ? 'Search posse tags' : 'Search'

  return (
    <Row style={{ width: '75%', right: 0 }}>
      <TextInput
        autoFocus
        value={searchTerm}
        placeholder={placeholder}
        onChangeText={updateSearch}
        style={{ height: 44, width: '100%', borderColor: uq_purple, borderRadius: 0 }}
        autoCorrect={false}
        autoCapitalize='none'
        autoComplete='off'
      />
    </Row>
  )
}
