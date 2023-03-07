import moment from 'moment'
import React, { useCallback } from 'react'
import { FlatList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { blue_overlay, gray_overlay } from '../../../constants/Colors'
import { Message } from '../../../types/Pongo'
import { idNum } from '../../../util/ping'
import { getRelativeDate, ONE_SECOND } from '../../../util/time'
import { Text, View } from '../../Themed'

import { BidirectionalFlatList } from './Bidirectional'
import MessageEntry from './MessageEntry'

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
      />
      {unreadInfo && unreadInfo?.unreads > 0 && Number(unreadInfo?.lastRead) === idNum(item.id) - 1 && (
        <View style={{ maxWidth: '84%', alignSelf: 'center', marginHorizontal: '8%', marginVertical: 4, backgroundColor: blue_overlay, borderRadius: 8, padding: 4, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 16, color: 'white' }}>{unreadInfo?.unreads} Unread{unreadInfo?.unreads && unreadInfo?.unreads > 1 ? 's' : ''}</Text>
        </View>
      )}
      {showDateIndicator && (
        <View style={{ maxWidth: '84%', alignSelf: 'center', marginHorizontal: '8%', marginBottom: 4, marginTop: 8, backgroundColor: gray_overlay, borderRadius: 8, padding: 4, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 16, color: 'white' }}>{getRelativeDate(item.timestamp * ONE_SECOND)}</Text>
        </View>
      )}
    </>
  }, [highlighted, messages, unreadInfo])

  const keyExtractor = useCallback((item: Message) => `${item?.id || 'missing'}-${item?.timestamp}`, [])

  console.log('RERENDER')

  return (
    <BidirectionalFlatList
      ref={listRef}
      data={messages}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }}
      style={{ backgroundColor: chatBackground, borderBottomWidth: 0 }}
      inverted
      scrollEventThrottle={50}
      onScroll={onScroll}
      windowSize={15}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      onEndReached={getMessagesOnScroll({ append: true })}
      onEndReachedThreshold={2}
      initialNumToRender={initialNumToRender}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollToIndexFailed={onScrollToIndexFailed}
      refreshControl={<RefreshControl refreshing={false} onRefresh={getMessagesOnScroll({ prepend: true })} />}
      enableAutoscrollToTop={enableAutoscrollToTop}
      autoscrollToTopThreshold={40}
      activityIndicatorColor={color}
    />
  )
}
// , (pP, nP) => pP.messages[0]?.id === nP.messages[0]?.id
)

export default MessagesList
