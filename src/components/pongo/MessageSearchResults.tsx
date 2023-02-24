import { NavigationProp, useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import usePongoStore from "../../state/usePongoState";
import { PongoStackParamList } from "../../types/Navigation";
import { Message } from "../../types/Pongo";
import { ONE_SECOND } from "../../util/time";
import Col from "../spacing/Col";
import Row from "../spacing/Row";
import H3 from "../text/H3";
import { Text, View } from "../Themed";

interface MessageSearchResultsProps {

}

export default function MessageSearchResults({}: MessageSearchResultsProps) {
  const { messageSearchResults } = usePongoStore()
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()

  const styles = useMemo(() => StyleSheet.create({
    message: {
      padding: 2,
      paddingHorizontal: 4,
    },
    header: {
      justifyContent: 'space-between'
    },
    author: {
      fontWeight: '600',
    },
  }), [])

  const renderSearchResult = useCallback(({ item, index }: { item: Message; index: number }) => {
    // TODO: we need the chat id of each message in order to route to the chat
    return (
      <Pressable onPress={() => navigation.navigate('Chat', { id: '0x', msgId: item.id })}>
        <Col style={styles.message}>
          <Row style={styles.header}>
            <Text style={styles.author}>{item.author}</Text>
            <Text>{moment(item.timestamp * ONE_SECOND).format('DD MMM YYYY - h:mm a')}</Text>
          </Row>
          <Text numberOfLines={2}>{item.content}</Text>
        </Col>
      </Pressable>
    )
  }, [])

  const keyExtractor = useCallback((item: Message) => `${item?.id || 'missing'}-${item?.timestamp}`, [])

  return (
    !messageSearchResults.length ? (
      <Col style={{ alignSelf: 'center', alignItems: 'center', marginTop: 32 }}>
        <H3 text='No Results' />
      </Col>
    ) : (
      <FlatList
        data={messageSearchResults}
        contentContainerStyle={{ paddingVertical: 4 }}
        style={{ paddingBottom: 4, borderBottomWidth: 0 }}
        scrollEventThrottle={50}
        windowSize={15}
        renderItem={renderSearchResult}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        // initialNumToRender={initialNumToRender}
        // onViewableItemsChanged={onViewableItemsChanged}
        // onScrollToIndexFailed={onScrollToIndexFailed}
      />
    )
  )
}
