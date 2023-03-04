import { useCallback, useEffect, useMemo, useState } from "react"
import { isValidPatp } from 'urbit-ob'

import usePongoStore from "../../state/usePongoState"
import { useWalletStore } from "../../wallet-ui"
import { Token } from "../../wallet-ui/types/Token"
import { displayTokenAmount, numToUd } from "../../wallet-ui/utils/number"
import { NON_NUM_REGEX } from "../../wallet-ui/utils/regex"
import Button from "../form/Button"
import Modal from "../popup/Modal"
import Col from "../spacing/Col"
import { ScrollView, Text, TextInput } from "../Themed"
import TokenDisplay from '../../wallet-ui/components/TokenDisplay'
import { addSig, deSig } from "../../util/string"
import { DEFAULT_TXN_COST, ZIGS_CONTRACT } from "../../wallet-ui/utils/constants"
import { addDecimalDots } from "../../wallet-ui/utils/format"
import useStore from "../../state/useStore"
import { ActivityIndicator, View } from "react-native"
import useColors from "../../hooks/useColors"
import { ONE_SECOND } from "../../util/time"
import { fromUd } from "../../util/number"

interface SendTokensModalProps {
  show: boolean
  hide: () => void
  convo: string
}

export default function SendTokensModal({ show, hide, convo }: SendTokensModalProps) {
  const { ship: self } = useStore()
  const { set, sendTokens, chats } = usePongoStore()
  const { assets, selectedAccount } = useWalletStore()
  const { color } = useColors()
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [asset, setAsset] = useState<Token | undefined>()

  const allAssets = useMemo(
    () => Object.values(assets).reduce((acc: Token[], cur) => acc.concat(Object.values(cur)), [])
      .filter(({ token_type }) => token_type === 'token')
  , [assets])

  const zigsBalance = fromUd(
    Object.values(assets[selectedAccount?.rawAddress || ''] || {})?.find(({ contract }) => contract === ZIGS_CONTRACT)
      ?.data.balance || '0'
  )
  const tokenBalance = useMemo(() => Number((asset?.data.balance ?? '0').replace(/\./gi, '')), [asset])
  const amountDiff = useMemo(
    () => tokenBalance - (Number(amount) * Math.pow(10, 18) + (asset?.contract === ZIGS_CONTRACT ? DEFAULT_TXN_COST : 0))
    , [amount, tokenBalance]
  )
  const isNft = useMemo(() => asset?.token_type === 'nft', [asset])

  const chat = useMemo(() => chats[convo], [chats, convo])
  const dm = Boolean(chat?.conversation.dm)

  useEffect(() => {
    if (dm) {
      const dmCounterparty = chats[convo].conversation.members.find(s => deSig(s) !== deSig(self))
      if (dmCounterparty) {
        setRecipient(dmCounterparty)
      }
    }
  }, [dm, self])

  const send = useCallback(async () => {
    if (zigsBalance < DEFAULT_TXN_COST) {
      setError('Your acount does not have enough zigs to pay the transaction fee.')
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
          to: addSig(recipient),
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

  return (
    <Modal show={show} hide={hide}>
      <ScrollView style={{ minHeight: 200 }}>
        <Col style={{ alignItems: "center", minHeight: 200, justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            Send Tokens
          </Text>
          {Boolean(error) && <Text style={{ fontSize: 16, color: 'red', marginTop: 12, width: '80%' }}>{error}</Text>}
          {loading ? (
            <>
              <ActivityIndicator size='large' color={color} style={{ marginTop: 48 }} />
              <Text style={{ fontSize: 18, marginBottom: 24 }}>Sending tokens...</Text>
            </>
          ) : !asset ? (
            <>
              <Col style={{ width: '100%', alignItems: "center" }}>
                {!allAssets.length && <Text style={{ fontSize: 16, marginHorizontal: '10%', textAlign: 'center' }}>No assets to show, please check your Uqbar Wallet.</Text>}
                {allAssets.map(t => <TokenDisplay key={t.id} token={t} selectToken={selectToken} small />)}
              </Col>
              <Button title='Cancel' onPress={hide} style={{ marginVertical: 16 }} />
            </>
          ) : (
            <>
              <Text style={{ alignSelf: 'flex-start', fontSize: 16, marginTop: 12, marginLeft: '10%' }}>To:</Text>
              <TextInput
                placeholder="Recipient"
                value={recipient}
                onChangeText={(text) => { setRecipient(text.toLowerCase().replace(/[^~a-z-]/, '')); setError('') }}
                autoFocus={!dm}
                style={{ marginTop: 4, width: '80%' }}
              />
              {!isNft && <Text style={{ alignSelf: 'flex-start', fontSize: 16, marginTop: 12, marginLeft: '10%' }}>Amount:</Text>}
              <TextInput
                placeholder="Amount"
                value={amount}
                onChangeText={(text) => { setAmount(text.replace(NON_NUM_REGEX, '')); setError('') }}
                style={{ marginTop: 4, width: '80%' }}
                autoFocus={dm}
              />
              {Number(amount) <= 0 || isNaN(Number(amount)) ? null : amountDiff < 0 ? (
                <Text style={{ marginTop: 2, fontSize: 14, color: 'red' }}>Not enough assets: {displayTokenAmount(tokenBalance, 18, 18)}</Text>
              ) : (
                <Text style={{ marginTop: 2, fontSize: 14, color: '#444' }}>({addDecimalDots(Number(amount) * Math.pow(10, 18))})</Text>
              )}
              <Button title='Send' onPress={send} style={{ marginTop: 16 }} />
              <Button title='Back' onPress={() => setAsset(undefined)} style={{ marginVertical: 16 }} />
            </>
          )}
        </Col>
      </ScrollView>
    </Modal>
  )
}
