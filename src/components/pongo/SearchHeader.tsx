import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useState } from "react"
import { Pressable } from "react-native"
import { uq_purple } from "../../constants/Colors"
import useSearch from "../../hooks/useSearch"
import usePongoStore from "../../state/usePongoState"
import { SearchType } from "../../types/Pongo"
import Row from "../spacing/Row"
import { TextInput } from "../Themed"

interface SearchHeaderProps {
  searchType?: SearchType
}

export function OpenSearch() {
  const { set } = usePongoStore()

  return (
    <Pressable onPress={() => set({ isSearching: true, searchResults: [] })}>
      <Ionicons name='search' size={24} color='white' style={{ padding: 4 }} />
    </Pressable>
  )
}

export function CloseSearch() {
  const { set } = usePongoStore()

  return (
    <Pressable onPress={() => set({ isSearching: false, searchResults: [] })}>
      <Ionicons name='close-circle-outline' color='white' style={{ padding: 4 }} size={24} />
    </Pressable>
  )
}

export default function SearchHeader({ searchType = 'ship' }: SearchHeaderProps) {
  const { set, searchTerm } = usePongoStore()
  const { search } = useSearch()

  useEffect(() => {
    if (searchType === 'ship') {
      set({ searchTerm: '' })
    }

    return () => {
      set({ isSearching: false, searchResults: [] })
    }
  }, [])

  const updateSearch = useCallback((text: string) => {
    search(searchType, text)
  }, [searchType])

  const placeholder = searchType === 'chat' ? 'Search chats' :
    searchType === 'ship' ? 'Search users' :
    searchType === 'message' ? 'Find in chat' :
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
