import { NavigationProp, useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import usePongoStore from "../../state/usePongoState";
import { PongoStackParamList } from "../../types/Navigation";
import { Message } from "../../types/Pongo";
import { ONE_SECOND, getRelativeDate } from "../../util/time";
import Col from "../../components/spacing/Col";
import Row from "../../components/spacing/Row";
import H3 from "../../components/text/H3";
import { Text, View } from "../../components/Themed";
import Avatar from "../../components/pongo/Avatar";
import ShipName from "../../components/pongo/ShipName";
import { light_gray } from "../../constants/Colors";
import useColors from "../../hooks/useColors";
import { getShipColor } from "../../util/number";

interface MessageSearchProps {
  focusMessage?: (msgId: string | null) => Promise<void>
}

export default function MessageSearch({
  focusMessage,
}: MessageSearchProps) {
  const { messageSearchResults, searchStatus, set } = usePongoStore()
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const { color, backgroundColor, theme } = useColors()

  const styles = useMemo(() => StyleSheet.create({
    message: {
      padding: 8,
      paddingHorizontal: 12,
      borderBottomColor: light_gray,
      borderBottomWidth: 1,
    },
    header: {
      justifyContent: 'space-between',
      flex: 1,
      marginBottom: 4,
    },
    content: {
      marginLeft: 16,
      flex: 1,
    },
    text: {
      fontSize: 16
    }
  }), [])

  const onPressMessage = useCallback((msg: Message) => () => {
    set({ isSearching: false, searchResults: [] })

    if (focusMessage) {
      focusMessage(msg.id)
    } else if (msg.conversation_id) {
      navigation.navigate('Chat', { id: msg.conversation_id, msgId: msg.id })
    }
  }, [navigation, focusMessage, set])

  const renderSearchResult = useCallback(({ item, index }: { item: Message; index: number }) => {
    // TODO: we need the chat id of each message in order to route to the chat
    return (
      <Pressable onPress={onPressMessage(item)}>
        <Row style={styles.message}>
          <Avatar size='large' ship={item.author} color={getShipColor(item.author, theme)} />
          <Col style={styles.content}>
            <Row style={styles.header}>
              <ShipName ship={item.author} style={{ fontWeight: '600', color }} />
              <Text>{getRelativeDate(item.timestamp * ONE_SECOND)}</Text>
            </Row>
            <Text style={styles.text} numberOfLines={2}>{item.content}</Text>
          </Col>
        </Row>
      </Pressable>
    )
  }, [onPressMessage])

  const keyExtractor = useCallback((item: Message) => `${item?.id || 'missing'}-${item?.timestamp}`, [])

  return (
     searchStatus !== 'complete' || !messageSearchResults.length ? (
      <Col style={{ alignSelf: 'center', alignItems: 'center', marginTop: 32, paddingHorizontal: 16, backgroundColor: 'transparent' }}>
        {searchStatus === 'loading' ? (
          <ActivityIndicator size='large' />
        ) : searchStatus === 'error' ? (
          <H3 text='An error occurred, please try again' />
        ) : (
          <H3 text='No Results' />
        )}
      </Col>
    ) : (
      <FlatList
        data={messageSearchResults}
        contentContainerStyle={{ paddingVertical: 4 }}
        style={{ paddingBottom: 4, borderBottomWidth: 0, backgroundColor }}
        scrollEventThrottle={50}
        windowSize={15}
        renderItem={renderSearchResult}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
      />
    )
  )
}
