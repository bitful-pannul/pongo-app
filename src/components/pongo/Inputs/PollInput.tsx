import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import useColors from '../../../hooks/useColors'
import usePongoStore from '../../../state/usePongoState'
import useStore from '../../../state/useStore'
import Button from '../../form/Button'

import Modal from '../../popup/Modal'
import Col from '../../spacing/Col'
import { Text } from '../../Themed'
import useDimensions from '../../../hooks/useDimensions'

interface PollInputProps {
  convo: string
  show: boolean
  hide: () => void
}

const PollInput = ({ convo, show, hide }: PollInputProps) => {
  const { ship: self } = useStore()
  const { sendMessage } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const { height } = useDimensions()

  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [questions, setOptions] = useState(['', ''])
  const [sending, setSending] = useState(false)

  const addOption = useCallback(() => {
    setError(null)
    if (questions.length < 8) {
      setOptions([...questions, ''])
    }
  }, [questions])

  const removeOption = useCallback((index: number) => () => {
    const newOptions = questions.filter((_, i) => i !== index)
    setOptions(newOptions)
    setError(null)
  }, [questions])

  const updateOption = useCallback((index: number) => (text: string) => {
    setError(null)
    const newOptions = questions.map((question, i) =>
      i === index ? text : question,
    )
    setOptions(newOptions)
  }, [questions, setError])

  const handleSubmit = useCallback(async () => {
    if (!title) {
      setError('Title is required')
    } else if (questions.find((question) => !question)) {
      setError('Each option must have some text')
    } else {
      // Handle form submission here
      setSending(true)
      const content = title + '\n' + questions.join('\n')
      try {
        await sendMessage({ self, convo, kind: 'poll', content })
        setTitle('')
        setOptions(['', ''])
        hide()
      } catch {
        setError('Failed to create poll, please try again')
      }
      setSending(false)
    }
  }, [title, questions, convo, self, sendMessage, hide])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 8,
      backgroundColor,
      flex: 1,
      flexShrink: 1,
    },
    contentContainer: { alignItems: 'center', display: 'flex', flexDirection: 'column', width: '100%' },
    title: { marginTop: -4 },
    label: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    questionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 240,
      backgroundColor: 'white',
      color: 'black',
    },
    button: {
      marginTop: 16,
      width: 200,
      alignSelf: 'center',
    },
    error: { color: 'red' },
  }), [])

  return (
    <Modal show={show} hide={hide}>
      <KeyboardAvoidingView style={{ flex: 0 }}>
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.container} contentContainerStyle={styles.contentContainer}>
          {sending ? (
            <ActivityIndicator size='large' style={{ marginTop: 40 }} />
          ) : (
            <>
                <Text style={[styles.label, styles.title]}>Poll Title:</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={text => { setTitle(text); setError(null) }}
                  placeholder="Enter poll title"
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Options (max 7):</Text>
                {questions.map((question, index) => (
                  <View key={index} style={styles.questionContainer}>
                    <TextInput
                      style={styles.input}
                      value={question}
                      onChangeText={updateOption(index)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <TouchableOpacity style={{ padding: 4, marginLeft: 8 }} onPress={removeOption(index)}>
                      <Ionicons name='close-circle-outline' color={color} size={24} />
                    </TouchableOpacity>
                  </View>
                ))}
              {Boolean(error) && <Text style={styles.error}>{error}</Text>}

              {questions.length < 8 && <Button title='Add Option' onPress={addOption} small style={styles.button} />}

              <Button title='Create Poll' onPress={handleSubmit} small style={styles.button} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default PollInput