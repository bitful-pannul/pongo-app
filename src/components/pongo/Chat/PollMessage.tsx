import React, { useCallback, useMemo } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'

import { Message } from "../../../types/Pongo"
import { deSig } from "../../../util/string";
import { uq_pink } from "../../../constants/Colors";
import { isWeb } from "../../../constants/Layout";

interface PollMessageProps {
  message: Message;
  color: string;
  self: string;
  addReaction: (emoji: string) => void;
}

export default function PollMessage({
  message,
  color,
  self,
  addReaction,
}: PollMessageProps) {
  const [title, ...options] = message.content.split('\n')

  const totalVotes = Object.values(message.reactions).reduce((acc, cur) => acc + cur.length, 0)
  const showResults = Object.values(message.reactions).reduce((acc, cur) => acc || cur.includes(deSig(self)), false)

  const castVote = useCallback((option: string) => () => {
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    addReaction(option)
  }, [addReaction])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      minWidth: 200,
      maxWidth: '100%',
    },
    title: {
      color,
      fontSize: 16,
      marginBottom: 8,
      maxWidth: '100%'
    },
    option: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    optionText: {
      color,
      fontWeight: '600',
    },
    optionSelected: {
      color: uq_pink
    },
    optionResult: {
      color,
      marginLeft: 8,
    },
    vote: {
      borderRadius: 8,
      borderColor: uq_pink,
      borderWidth: showResults ? 0 : 1,
      padding: 4,
      paddingHorizontal: 8,
      marginBottom: showResults ? 8 : 12,
    },
    voteText: {
      color: 'white',
    },
    totalVotes: {
      color,
      fontWeight: '600',
      fontSize: 14,
    }
  }), [color, showResults])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {options.map((option, i) =>
        <TouchableOpacity key={option} style={styles.vote} onPress={castVote(option)}>
          <View key={`poll-${i}`} style={styles.option}>
            <Text style={[styles.optionText, message.reactions[option]?.includes(deSig(self)) && styles.optionSelected]}>{i + 1}) {option}</Text>
            {showResults && (
              message.reactions[option]?.length !== undefined ? (
                <Text style={styles.optionResult}>{message.reactions[option]?.length}/{totalVotes} ({(message.reactions[option].length / totalVotes * 100).toFixed(0)}%)</Text>
              ) : (
                <Text style={styles.optionResult}>0/{totalVotes} (0%)</Text>
              )
            )}
          </View>
        </TouchableOpacity>
      )}
      <Text style={styles.totalVotes}>Total Votes: {totalVotes}</Text>
    </View>
  )
}
