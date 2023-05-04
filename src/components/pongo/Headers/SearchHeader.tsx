import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo } from "react"
import { NativeSyntheticEvent, Pressable, TextInputKeyPressEventData, View } from "react-native"

import { uq_lightpink, uq_pink, uq_purple } from "../../../constants/Colors"
import useDebounce from "../../../hooks/useDebounce"
import useSearch from "../../../hooks/useSearch"
import usePongoStore from "../../../state/usePongoState"
import { SearchType } from "../../../types/Pongo"
import { ONE_SECOND } from "../../../util/time"
import Row from "../../spacing/Row"
import { TextInput } from "../../Themed"
import { isWeb } from "../../../constants/Layout"
import { StyleSheet } from "react-native"
import useDimensions from "../../../hooks/useDimensions"

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
  const { isLargeDevice, width } = useDimensions()

  useEffect(() => {
    if (searchType === 'ship') {
      set({ searchTerm: '' })
    }

    return () => {
      set({ isSearching: false, searchResults: [], searchTerm: '', messageSearchResults: [] })
    }
  }, [])

  const autoSearch = searchType !== 'message'

  useDebounce(() => search(searchType, searchTerm, chatId), [searchTerm, searchType, chatId, search], ONE_SECOND * 0.5, autoSearch)

  const executeSearch = useCallback(() => {
    set({ searchStatus: 'loading', messageSearchResults: [] })
    search(searchType, searchTerm, chatId)
  }, [searchTerm, searchType, chatId, search])

  const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter' && !(e.nativeEvent as any).shiftKey && isLargeDevice) {
      e.preventDefault()
      e.stopPropagation()
      executeSearch()
    }
  }, [executeSearch, isLargeDevice])

  const updateSearch = useCallback((searchTerm: string) => set({ searchTerm }), [])

  const styles = useMemo(() => StyleSheet.create({
    searchButtonContainer: {  },
    textInput: { height: 44, width: width * 0.5, borderColor: uq_purple, borderRadius: 0 },
    searchButton: { width: 42, height: 42, padding: 9, paddingTop: 7, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: uq_pink }
  }), [width])

  const placeholder = searchType === 'chat' ? 'Search chats' :
    searchType === 'ship' ? 'Search users' :
    searchType === 'message' ? 'Search messages' :
    searchType === 'tag' ? 'Search posse tags' : 'Search'

  return (
    <Row style={{ width: '80%', right: 0, backgroundColor: uq_purple }}>
      <TextInput
        autoFocus
        value={searchTerm}
        placeholder={placeholder}
        onChangeText={updateSearch}
        style={styles.textInput}
        autoCorrect={false}
        autoCapitalize='none'
        autoComplete='off'
        onKeyPress={onKeyPress}
      />
      {!autoSearch &&
        <Pressable onPress={executeSearch} style={styles.searchButtonContainer}>
          <View style={styles.searchButton}>
            <Ionicons name='search' size={24} color='white' />
          </View>
        </Pressable>
      }
    </Row>
  )
}
