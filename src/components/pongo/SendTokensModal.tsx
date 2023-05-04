import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, StyleSheet, TextInput, ScrollView, View } from "react-native"
import { Token } from "@uqbar/wallet-ui"

import usePongoStore from "../../state/usePongoState"
import { useWalletStore } from "../../wallet-ui"
import { displayTokenAmount, numToUd } from "../../wallet-ui/utils/number"
import { NON_NUM_REGEX } from "../../wallet-ui/utils/regex"
import Button from "../form/Button"
import Modal from "../popup/Modal"
import Col from "../spacing/Col"
import { Text } from "../Themed"
import TokenDisplay from '../../wallet-ui/components/TokenDisplay'
import { addSig, deSig } from "../../util/string"
import { DEFAULT_TXN_COST, ZIGS_CONTRACT } from "../../wallet-ui/utils/constants"
import { addDecimalDots } from "../../wallet-ui/utils/format"
import useStore from "../../state/useStore"
import useColors from "../../hooks/useColors"
import { ONE_SECOND } from "../../util/time"
import { fromUd } from "../../util/number"
import ShipRow from "./ShipRow"
import { keyboardAvoidBehavior, keyboardOffset } from "../../constants/Layout"
import { light_gray } from "../../constants/Colors"
import useDimensions from "../../hooks/useDimensions"

interface SendTokensModalProps {
  show: boolean
  hide: () => void
  convo: string
}

export default function SendTokensModal({ show, hide, convo }: SendTokensModalProps) {
  const recipientRef = useRef<TextInput | null>(null)
  const amountRef = useRef<TextInput | null>(null)
  const { ship: self } = useStore()
  const { sendTokens, chats } = usePongoStore()
  const { assets } = useWalletStore()
  const { color } = useColors()
  const chat = useMemo(() => chats[convo], [chats, convo])
  const { height, isLargeDevice } = useDimensions()
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [asset, setAsset] = useState<Token | undefined>()
  const [showMembersList, setShowMembersList] = useState(false)
  const [displayedMembers, setDisplayedMembers] = useState<string[]>(chat.conversation.members)

  const allAssets = useMemo(
    () => Object.values(assets).reduce((acc: Token[], cur) => acc.concat(Object.values(cur)), [])
      .filter(({ token_type }) => token_type === 'token')
  , [assets])

  const zigsBalance = fromUd(
    Object.values(assets[asset?.holder || ''] || {})?.find(({ contract }) => contract === ZIGS_CONTRACT)
      ?.data.balance || '0'
  )

  const tokenBalance = useMemo(() => Number((asset?.data.balance ?? '0').replace(/\./gi, '')), [asset])
  const amountDiff = useMemo(
    () => tokenBalance - (Number(amount) * Math.pow(10, 18) + (asset?.contract === ZIGS_CONTRACT ? DEFAULT_TXN_COST : 0))
    , [amount, tokenBalance]
  )
  const isNft = useMemo(() => asset?.token_type === 'nft', [asset])

  const dm = Boolean(chat?.conversation.dm)

  useEffect(() => {
    if (dm) {
      const dmCounterparty = chats[convo].conversation.members.find(s => deSig(s) !== deSig(self))
      if (dmCounterparty) {
        setRecipient(dmCounterparty)
      }
    }
  }, [dm, self, chats, convo])

  const send = useCallback(async () => {
    if (zigsBalance < DEFAULT_TXN_COST) {
      setError('Your account does not have enough zigs to pay the transaction fee.')
    } else if (!chat || !chat.conversation.members.includes(deSig(recipient))) {
      setError('The recipient must be a member of this chat.')
    } else if (!amount || isNaN(Number(amount)) || !Number(amount)) {
      setError('Please input an amount.')
    } else if (asset) {
      setLoading(true)
      try {
        const payload = {
          convo,
          from: asset.holder,
          contract: asset.contract,
          town: '0x0',
          to: addSig(recipient.toLowerCase()),
          amount: numToUd(Number(amount) * Math.pow(10, 18)),
          item: asset.id,
        }

        await sendTokens(payload)
        setTimeout(() => {
          hide()
          setLoading(false)
        }, ONE_SECOND * 3)
      } catch (err) {
        setError('Error sending tokens, please try again.')
        console.log('SEND TOKENS ERROR:', err)
        setLoading(false)
      }
    }
  }, [recipient, convo, asset, chat, amount, zigsBalance, hide])

  const selectToken = useCallback((id: string) => setAsset(allAssets.find(a => a.id === id)), [allAssets, setAsset])

  const displayMembersList = useCallback(() => setShowMembersList(true), [setShowMembersList])

  const selectRecipient = useCallback((ship: string) => () => {
    setRecipient(deSig(ship))
    setShowMembersList(false)
  }, [setRecipient, setShowMembersList])

  const changeRecipient = useCallback((text: string) => {
    const cleaned = text.replace(/[^~A-Za-z-]/gi, '')
    setRecipient(cleaned)

    if (chat.conversation.members.includes(deSig(cleaned.toLowerCase()))) {
      setShowMembersList(false)
    }

    setDisplayedMembers(chat.conversation.members.filter(m => deSig(m).includes(cleaned.toLowerCase())))
    setError('')
  }, [setRecipient, setShowMembersList, chat.conversation.members])

  const onBack = useCallback(() => {
    if (amount) {
      setAmount('')
      amountRef.current?.focus()
    } else if (recipient) {
      setRecipient('')
      recipientRef.current?.focus()
    } else {
      setAsset(undefined)
    }
  }, [recipient, amount, setAmount, setRecipient, setAsset])

  const styles = useMemo(() => StyleSheet.create({
    scrollList: { width: '100%', flex: 1, maxHeight: height - 240 },
    textInput: { backgroundColor: 'white', padding: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: light_gray,
    fontSize: 18,
    height: 32,
    borderRadius: 4,
    marginTop: 4, width: '80%' }
  }), [height])

  return (
    <Modal show={show} hide={hide} title='Send Tokens'>
      <ScrollView style={styles.scrollList}>
        <KeyboardAvoidingView behavior={keyboardAvoidBehavior} keyboardVerticalOffset={keyboardOffset} style={{ flex: 1 }}>
          <Col style={{ alignItems: "center", minHeight: 200, justifyContent: 'space-between', flex: 1 }}>
            {Boolean(error) && <Text style={{ fontSize: 16, color: 'red', marginTop: 12, width: '80%' }}>{error}</Text>}
            {loading ? (
              <>
                <ActivityIndicator size='large' color={color} style={{ marginTop: 48 }} />
                <Text style={{ fontSize: 18, marginBottom: 24 }}>Sending tokens...</Text>
              </>
            ) : !asset ? (
              <>
                <ScrollView style={styles.scrollList} contentContainerStyle={{ alignItems: "center" }}>
                  {!allAssets.length && <Text style={{ fontSize: 16, marginHorizontal: '10%', textAlign: 'center' }}>No assets to show, please check your Uqbar Wallet.</Text>}
                  {allAssets.map(t => <TokenDisplay color={color} key={t.id} token={t} selectToken={selectToken} small />)}
                </ScrollView>
                <Button title='Cancel' onPress={hide} style={{ marginVertical: 16 }} />
              </>
            ) : (
              <>
                <Text style={{ alignSelf: 'flex-start', fontSize: 16, marginTop: 12, marginLeft: '10%' }}>To:</Text>
                <TextInput
                  ref={recipientRef}
                  placeholder="Recipient"
                  value={recipient}
                  onChangeText={changeRecipient}
                  autoFocus={!dm}
                  editable={!dm}
                  onFocus={displayMembersList}
                  style={styles.textInput}
                />
                {!isNft && <Text style={{ alignSelf: 'flex-start', fontSize: 16, marginTop: 12, marginLeft: '10%' }}>Amount:</Text>}
                {showMembersList ? (
                  // <ScrollView style={styles.scrollList}>
                  <>
                    {displayedMembers.map(m => <ShipRow key={m} noBorder ship={m} onPress={() => () => null} />)}
                  </>
                  // </ScrollView>
                ) : (
                  <>
                    <TextInput
                      ref={amountRef}
                      value={amount}
                      onChangeText={(text) => { setAmount(text.replace(NON_NUM_REGEX, '')); setError('') }}
                      style={styles.textInput}
                      autoFocus={!!recipient}
                    />
                    {Number(amount) <= 0 || isNaN(Number(amount)) ? null : amountDiff < 0 ? (
                      <Text style={{ marginTop: 2, fontSize: 14, color: 'red' }}>Not enough assets: {displayTokenAmount(tokenBalance, 18, 18)}</Text>
                    ) : (
                      <Text style={{ marginTop: 2, fontSize: 14, color: '#444' }}>({addDecimalDots(Number(amount) * Math.pow(10, 18))})</Text>
                    )}
                    <Button title='Send' onPress={send} style={{ marginTop: 16 }} />
                  </>
                )}
                <Button title='Back' onPress={onBack} style={{ marginVertical: 16 }} />
              </>
            )}
          </Col>
        </KeyboardAvoidingView>
      </ScrollView>
    </Modal>
  )
}
