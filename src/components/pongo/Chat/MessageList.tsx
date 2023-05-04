import moment from 'moment'
import React, { useCallback, useMemo } from 'react'
import { FlatList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent, StyleSheet } from 'react-native'

import { NavigationProp } from '@react-navigation/native'
import { blue_overlay, gray_overlay } from '../../../constants/Colors'
import { isAndroid, isWeb } from '../../../constants/Layout'
import { Message } from '../../../types/Pongo'
import { idNum } from '../../../util/ping'
import { getRelativeDate, ONE_SECOND } from '../../../util/time'
import { Text, View } from '../../Themed'
import { BidirectionalFlatList } from './Bidirectional'
import MessageEntry from './MessageEntry'
import { PongoStackParamList } from '../../../types/Navigation'

interface MessagesListProps {
  messages: Message[]
  self: string
  chatBackground: string
  color: string
  listRef: React.RefObject<FlatList<any>>
  highlighted?: string | null
  unreadInfo: {unreads: number; lastRead: string} | undefined
  initialNumToRender: number
  enableAutoscrollToTop: boolean
  isDm: boolean
  chatId: string
  scrollEnabled?: boolean
  initialScrollIndex?: number
  navigation: NavigationProp<PongoStackParamList>
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: any[] }) => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  getMessagesOnScroll: (options: { prepend?: boolean; append?: boolean }) => () => Promise<void>
  onPressMessage: (item: Message) => (offsetY: number, height: number) => void
  addReaction: (msgId: string) => (emoji: string) => void
  swipeToReply: (msg: Message) => void
  focusReply: (msgId: string | null) => void
}

const MessagesList = React.memo(({
  messages,
  self,
  chatBackground,
  color,
  listRef,
  highlighted,
  unreadInfo,
  initialNumToRender,
  enableAutoscrollToTop,
  isDm,
  chatId,
  scrollEnabled,
  initialScrollIndex,
  navigation,
  onViewableItemsChanged,
  onScroll,
  getMessagesOnScroll,
  onPressMessage,
  addReaction,
  swipeToReply,
  focusReply,
}: MessagesListProps) => {
  const onScrollToIndexFailed = useCallback(({ index }: any) => {
    try {
      setTimeout(() => listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true }), ONE_SECOND)
    } catch {}
  }, [])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      transform: isWeb ? [{scaleY: -1}] : undefined,
      position: 'absolute', top: 0, right: 0, left: 0, bottom: 0,
      backgroundColor: chatBackground,
      height: '100%'
    },
    list: { backgroundColor: 'transparent', borderBottomWidth: 0, height: '100%' },
    contentContainer: { paddingTop: 4, paddingBottom: 12 },
    unread: { /*transform: [{scaleY: -1}],*/ maxWidth: '84%', alignSelf: 'center', marginHorizontal: '8%', marginVertical: 4, backgroundColor: blue_overlay, borderRadius: 8, padding: 4, paddingHorizontal: 32 },
    date: { /*transform: [{scaleY: -1}],*/ maxWidth: '84%', alignSelf: 'center', marginHorizontal: '8%', marginBottom: 4, marginTop: 8, backgroundColor: gray_overlay, borderRadius: 8, padding: 4, paddingHorizontal: 32 },
    indicatorText: { fontSize: 16, color: 'white' },
  }), [])

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const daySent = moment(item.timestamp * ONE_SECOND).format('YYYYMMDD')
    const previous = messages[index + 1] && moment(messages[index + 1].timestamp * ONE_SECOND).format('YYYYMMDD')
    const showDateIndicator = previous !== daySent

    return <>
      <MessageEntry
        onPress={onPressMessage(item)} messages={messages}
        focusReply={focusReply}
        index={index} message={item} self={self}
        highlighted={highlighted === item.id}
        addReaction={addReaction(item.id)}
        isDm={isDm}
        onSwipe={swipeToReply}
        chatId={chatId}
        navigation={navigation}
      />
      {unreadInfo && unreadInfo?.unreads > 0 && idNum(unreadInfo?.lastRead) === idNum(item.id) - 1 && (
        <View id='unread-indicator' style={styles.unread}>
          <Text style={styles.indicatorText}>Unread Messages</Text>
        </View>
      )}
      {showDateIndicator && (
        <View style={styles.date}>
          <Text style={styles.indicatorText}>{getRelativeDate(item.timestamp * ONE_SECOND)}</Text>
        </View>
      )}
    </>
  }, [highlighted, messages, unreadInfo, navigation])

  const keyExtractor = useCallback((item: Message) => `${item?.id || 'missing'}-${item?.timestamp}`, [])

  return (
    <View style={styles.container}>
      {/* {isWeb ? (
        <FlatList
          ref={listRef}
          data={messages}
          contentContainerStyle={styles.contentContainer}
          style={styles.list}
          inverted
          scrollEventThrottle={50}
          onScroll={onScroll}
          windowSize={isWeb ? 31 : 21}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          onEndReached={getMessagesOnScroll({ append: true })}
          onEndReachedThreshold={2}
          initialNumToRender={initialNumToRender}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={onScrollToIndexFailed}
          refreshControl={<RefreshControl refreshing={false} onRefresh={getMessagesOnScroll({ prepend: true })} />}
          maxToRenderPerBatch={isWeb ? 20 : 10}
          updateCellsBatchingPeriod={isWeb ? 40 : 50}
        />
      ) : ( */}
        <BidirectionalFlatList
          ref={listRef}
          data={messages}
          contentContainerStyle={styles.contentContainer}
          style={styles.list}
          inverted
          scrollEventThrottle={50}
          onScroll={onScroll}
          windowSize={isAndroid ? 21 : 15}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          onEndReached={getMessagesOnScroll({ append: true })}
          onEndReachedThreshold={2}
          initialNumToRender={initialNumToRender}
          initialScrollIndex={initialScrollIndex}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={onScrollToIndexFailed}
          refreshControl={<RefreshControl refreshing={false} onRefresh={getMessagesOnScroll({ prepend: true })} />}
          enableAutoscrollToTop={enableAutoscrollToTop}
          autoscrollToTopThreshold={40}
          activityIndicatorColor={color}
          maxToRenderPerBatch={isWeb ? 20 : 10}
          updateCellsBatchingPeriod={isWeb ? 40 : 50}
          disableVirtualization={isWeb}
          removeClippedSubviews
          nestedScrollEnabled
        />
      {/* )} */}
    </View>
  )
}
// , (pP, nP) => pP.messages[0]?.id === nP.messages[0]?.id
)

export default MessagesList
