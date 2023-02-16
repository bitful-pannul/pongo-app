import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'
import { NavigationProp, useNavigation } from '@react-navigation/native'

import { useWalletStore } from '../../store/walletStore'
import Row from '../spacing/Row'
import Col from '../spacing/Col'
import CopyIcon from '../text/CopyIcon'
import { TransactionArgs } from '../../types/Transaction'
import { Token } from '../../types/Token'
import { displayTokenAmount } from '../../utils/number'
import { displayPubKey } from '../../utils/account'
import { abbreviateHex, addHexDots, removeDots, addDecimalDots } from '../../utils/format'
import { ADDRESS_REGEX, NON_HEX_REGEX, NON_NUM_REGEX } from '../../utils/regex'
import { DEFAULT_TXN_COST, getStatus } from '../../utils/constants'
import Pill from '../text/Pill'
import { Text } from '../../../components/Themed'
import { WalletTabParamList } from '../../../types/Navigation'
import Button from '../../../components/form/Button'
import Input from './Input'
import { ActionDisplay } from '../ActionDisplay'

export interface SendFormValues { to: string; rate: string; bud: string; amount: string; contract: string; town: string; action: string; }
export type SendFormField = 'to' | 'rate' | 'bud' | 'amount' | 'contract' | 'town' | 'action'
export type SendFormType = 'tokens' | 'nft' | 'custom';

export const BLANK_FORM_VALUES = { to: '', rate: '1', bud: '1000000', amount: '', contract: '', town: '', action: '' }

interface SendTransactionFormProps {
  setFormValues: (values: SendFormValues) => void
  setFormValue: (key: SendFormField, value: string) => void
  onSubmit?: () => void
  onDone: () => void
  formValues: SendFormValues
  id: string
  unsignedTransactionHash?: string
  nftIndex?: number
  from?: string
  formType?: SendFormType
}

const SendTransactionForm = ({
  setFormValues,
  setFormValue,
  onSubmit,
  onDone,
  formValues,
  id,
  unsignedTransactionHash,
  nftIndex,
  from,
  formType,
}: SendTransactionFormProps) => {
  const {
    assets, metadata, importedAccounts, unsignedTransactions, mostRecentTransaction: txn, selectedAccount,
    sendTokens, sendNft, submitSignedHash, setMostRecentTransaction, getUnsignedTransactions, sendCustomTransaction
  } = useWalletStore()
  const navigation = useNavigation<NavigationProp<WalletTabParamList>>()

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [gasPriceError, setGasPriceError] = useState('')
  const [budgetError, setBudgetError] = useState('')

  const isNft = useMemo(() => formType === 'nft', [formType])
  const isCustom = useMemo(() => formType === 'custom', [formType])
  const { to, rate, bud, amount, contract, town, action } = formValues

  const assetsList = useMemo(() => Object.values(assets)
    .reduce((acc: Token[], cur) => acc.concat(Object.values(cur)), [])
    .filter(t => isNft ? t.token_type === 'nft' : t.token_type === 'token'),
    [assets, isNft]
  )

  const [selectedToken, setSelected] =
    useState<Token | undefined>(assetsList.find(a => a.id === id && (!isNft || a.data.id === Number(nftIndex))))
  const [pendingHash, setPendingHash] = useState<string | undefined>(unsignedTransactionHash)

  const tokenBalance = useMemo(() => Number((selectedToken?.data.balance ?? '0').replace(/\./gi, '')), [selectedToken])
  const amountDiff = useMemo(() => tokenBalance - (Number(amount) * Math.pow(10, 18) + DEFAULT_TXN_COST), [amount, tokenBalance])

  useEffect(() => {
    if (selectedToken === undefined && id) {
      setSelected(assetsList.find(a => a.id === id && (nftIndex === undefined || Number(nftIndex) === a.data.id)))
    }
  }, [assetsList, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearForm = useCallback(() => {
    setSelected(undefined)
    setFormValues(BLANK_FORM_VALUES)
  }, [setSelected, setFormValues])

  const changeValue = useCallback((field: SendFormField) => (value: string) => {
    setFormValue(field, value)
    setAddressError('')
    setAmountError('')
    setGasPriceError('')
    setBudgetError('')
  }, [setFormValue])

  const tokenMetadata = selectedToken && metadata[selectedToken.data.metadata]

  const generateTransaction = useCallback(async () => {
    if (selectedToken?.data?.balance && Number(amount) * Math.pow(10, tokenMetadata?.data?.decimals || 1) > +selectedToken?.data?.balance) {
      Alert.alert('Insufficient Tokens', `You do not have that many tokens. You have ${selectedToken.data?.balance} tokens.`)
    } else if (!selectedToken && !from && !isNft) {
      Alert.alert('Invalid Account', 'You must select a \'from\' account')
    } else if (!ADDRESS_REGEX.test(to)) {
      setAddressError('Invalid address')
    } else if (!isNft && !isCustom && !amount) {
      setAmountError('Please enter an amount')
    } else {
      setMostRecentTransaction(undefined)
      setLoading(true)

      if (selectedToken) {
        const payload = {
          from: selectedToken.holder,
          contract: selectedToken.contract,
          town: selectedToken.town,
          to: addHexDots(to),
          item: selectedToken.id,
        }
        
        if (isNft && selectedToken.data.id) {
          await sendNft(payload)
        } else if (!isNft) {
          await sendTokens({ ...payload, amount: Number(amount) * Math.pow(10, tokenMetadata?.data?.decimals || 18) })
        }
      } else {
        const payload = { from: from || '', contract: addHexDots(contract), town: addHexDots(town), action: action.replace(/\n/g, '') }
        await sendCustomTransaction(payload)
      }

      getUnsignedTransactions()
      const unsigned = await getUnsignedTransactions()
      const mostRecentPendingHash = Object.keys(unsigned)
        .filter(hash => unsigned[hash].from === (selectedToken?.holder || from))
        .sort((a, b) => unsigned[a].nonce - unsigned[b].nonce)[0]
      
      setPendingHash(mostRecentPendingHash)
      setLoading(false)
    }
  }, [to, selectedToken, isNft, isCustom, amount, contract, town, action, tokenMetadata])

  const submitSignedTransaction = useCallback(async () => {
    setLoading(true)
    if (pendingHash && unsignedTransactions[pendingHash]) {
      const fromAddress = unsignedTransactions[pendingHash].from
      let ethHash, sig, hardwareHash
  
      const importedAccount = importedAccounts.find(a => a.rawAddress === fromAddress)

      if (!rate) {
        return setGasPriceError('Must set a gas price')
      } else if (!bud) {
        return setBudgetError('Must set a budget')
      }
      
      if (importedAccount?.type) {
        return Alert.alert('Not Supported', 'Hardware wallets are not yet supported')
        // hardwareHash = pendingHash

        // setLoading(true)

        // const contract = removeDots(unsignedTransactions[pendingHash].contract.slice(2))
        // const to = (unsignedTransactions[pendingHash] as any)?.action?.give?.to ||
        //   (unsignedTransactions[pendingHash] as any)?.action?.['give-nft']?.to ||
        //   `0x${contract}${contract}`

        // const sigResult = await signWithHardwareWallet(
        //   importedAccount.type, removeDots(fromAddress), pendingHash, { ...unsignedTransactions[pendingHash], to }
        // )
        // setLoading(false)
        // ethHash = sigResult.ethHash ? addHexDots(sigResult.ethHash) : undefined
        // sig = sigResult.sig
        // if (!sig)
        //   return Alert.alert('Signing Error', 'There was an error signing the transaction with the hardware wallet')
      }
  
      try {
        setMostRecentTransaction(undefined)
        setSubmitted(true)
        await submitSignedHash(fromAddress, hardwareHash || pendingHash!, Number(rate), Number(bud.replace(/\./g, '')), ethHash, sig)
        clearForm()
        setPendingHash(undefined)
        onSubmit && onSubmit()
      } catch (err) {
        Alert.alert('Signing Error', 'There was an error signing the transaction with the hardware wallet')
        setSubmitted(false)
      }
      finally {
        setLoading(false)
      }
    }
  }, [unsignedTransactions, rate, bud, importedAccounts, pendingHash, onSubmit, clearForm, submitSignedHash, setLoading, setSubmitted, setPendingHash])

  const goToTransaction = useCallback((txnHash?: string) => () => {
    navigation.navigate('Transactions', { txn: txnHash })
  }, [])

  const styles = StyleSheet.create({
    sendTransactionForm: {
      flex: 1,
      borderTopLeftRadius: 0,
      minWidth: 280,
      borderRadius: 4,
      justifyContent: 'space-around',
      paddingLeft: 4,
      paddingRight: 8,
    }
  })

  const tokenDisplay = isNft ? (
    <Row>
      <Text style={{ marginTop: 8, marginRight: 12, fontSize: 16 }}>NFT: </Text>
      <Text mono style={{ marginTop: 10 }}>{`${tokenMetadata?.data?.symbol || displayPubKey(selectedToken?.contract || '')} - # ${selectedToken?.data?.id || ''}`}</Text>
    </Row>
  ) : (
    <Row style={{ marginTop: 8 }}>
      <Text style={{ marginRight: 12, fontSize: 16 }}>Token - Balance: </Text>
      <Text mono style={{ marginTop: 4, fontSize: 16 }}>{tokenMetadata?.data?.symbol || displayPubKey(selectedToken?.contract || '')} - {displayTokenAmount(+removeDots(String(selectedToken?.data?.balance!)), tokenMetadata?.data?.decimals || 1)}</Text>
    </Row>
  )

  if (submitted) {
    return (
      <Col style={{
        padding: 16,
        borderRadius: 4,
        justifyContent: 'center',
      }}>
        <Text style={{ marginTop: 0, marginBottom: 16 }}>Transaction {txn?.status === 0 ? 'Complete' : 'Sent'}!</Text>
        {txn ? (
          <>
            <Row style={{ marginBottom: 8 }}>
              <Text style={{ marginRight: 18 }} bold>Hash: </Text>
              <Pressable onPress={goToTransaction(txn.hash)}>
                <Text mono bold numberOfLines={1}>{abbreviateHex(txn.hash)}</Text>
              </Pressable>
              <CopyIcon text={txn.hash} />
            </Row>
            <Row style={{ marginLeft: -4 }}>
              <Pill label={'Nonce'} value={''+txn.nonce} />
            </Row>
            <Row style={{ marginVertical: 8, marginLeft: -4 }}>
              <Pill label={'Status'} value={getStatus(txn.status)} />
            </Row>
            <View style={{ marginTop: 8, marginBottom: 16, marginHorizontal: 'auto', height: 24 }}>
              {(txn.status === 100 || txn.status === 101) && <ActivityIndicator color='black' />}
            </View>
          </>
        ) : (
          <Pressable onPress={goToTransaction()}>
            <Text style={{ marginBottom: 16 }}>
              Your transaction should show up here in a few seconds. If it does not, please tap here.
            </Text>
          </Pressable>
        )}
        <Button style={{ alignSelf: 'center' }} onPress={onDone} title='Done' />
      </Col>
    )
  } else if (pendingHash) {
    const pendingAction = unsignedTransactions[pendingHash]?.action as TransactionArgs
    const giveAction = pendingAction?.give || (pendingAction && pendingAction['give-nft'])
    const showToAddress = Boolean(to || (tokenMetadata?.data?.symbol && giveAction.to))
    const showAmount = Boolean(!isNft && (amount || (tokenMetadata?.data?.symbol && giveAction.amount)))

    return (
      <Col style={styles.sendTransactionForm}>
        {!isCustom && tokenDisplay}
        {showToAddress ? (
          <Input label='To:' containerStyle={{ marginTop: 12 }} value={to || giveAction.to as any} editable={false} />
        ) : (
          <ActionDisplay action={pendingAction} />
        )}
        {showAmount && (
          <Input label='Amount:' containerStyle={{ marginTop: 12 }} value={amount || displayTokenAmount(+removeDots(''+giveAction.amount), tokenMetadata?.data.decimals || 1)} editable={false} />
        )}
        <Col>
          <Row style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Hash: </Text>
            <CopyIcon text={pendingHash}/>
          </Row>
          <Text style={{ fontSize: 16 }}>{pendingHash}</Text>
        </Col>
        <Row between style={{ marginTop: 12 }}>
          <Input
            label='Gas Price (bar):'
            placeholder='Gas price'
            containerStyle={{ flex: 1, marginRight: 8 }}
            value={rate}
            onChangeText={(text: string) => changeValue('rate')(text.replace(NON_NUM_REGEX, ''))}
            autoFocus
            error={gasPriceError}
          />
          <Input
            label='Budget:'
            placeholder='Budget'
            containerStyle={{ flex: 1, marginLeft: 8 }}
            value={bud}
            onChangeText={(text: string) => changeValue('bud')(text.replace(NON_NUM_REGEX, ''))}
            error={budgetError}
          />
        </Row>
        <Button onPress={submitSignedTransaction} style={{ marginTop: 16, marginBottom: 16 }} disabled={loading} title='Sign & Submit' />
      </Col>
    )
  } else if (isCustom) {
    return (
      <Col style={styles.sendTransactionForm}>
        <Input label='From:' containerStyle={{ marginTop: 12,  }} value={from || ''} editable={false} />
        <Input
          label='Contract:'
          containerStyle={{ marginTop: 12,  }}
          placeholder='Contract Address (@ux)'
          value={contract}
          onChangeText={(text: string) => changeValue('contract')(text.replace(NON_HEX_REGEX, ''))}
        />
        <Input
          label='Town:'
          containerStyle={{ marginTop: 12,  }}
          placeholder='Town (@ux)'
          value={town}
          onChangeText={(text: string) => changeValue('town')(text.replace(NON_HEX_REGEX, ''))}
        />
        <Input
          label='Custom Action:'
          containerStyle={{ marginTop: 12,  }}
          style={{ minHeight: 160 }}
          placeholder='[%give 0xdead 1 0x1.beef `0x1.dead]'
          value={action}
          onChangeText={changeValue('action')}
          multiline
        />
        {loading ? (
          <ActivityIndicator style={{ alignSelf: 'center' }} color='black' />
        ) : (
          <Button onPress={generateTransaction} style={{ marginTop: 16, marginBottom: 16 }} disabled={loading} title='Generate Transaction' />
        )}
      </Col>
    )
  }

  return (
    <Col style={styles.sendTransactionForm}>
      {tokenDisplay}
      <Input
        label='To:'
        placeholder='Destination address'
        containerStyle={{ marginTop: 12 }}
        value={to}
        onChangeText={(text: string) => changeValue('to')(text.replace(NON_HEX_REGEX, ''))}
        error={addressError}
      />
      {!isNft && <Input
        label='Amount (10^18):'
        placeholder='Amount'
        containerStyle={{ marginTop: 12 }}
        value={amount}
        onChangeText={(text: string) => changeValue('amount')(text.replace(NON_NUM_REGEX, ''))}
        error={amountError}
      />}
      {isNft || Number(amount) <= 0 || isNaN(Number(amount)) ? null : amountDiff < 0 ? (
        <Text style={{ marginTop: 2, fontSize: 14, color: 'red' }}>Not enough assets: {displayTokenAmount(tokenBalance, 18, 18)}</Text>
      ) : (
        <Text style={{ marginTop: 2, fontSize: 14, color: '#444' }}>({addDecimalDots(Number(amount) * Math.pow(10, 18))})</Text>
      )}
      {loading ? (
        <ActivityIndicator style={{ alignSelf: 'center' }} color='black' />
      ) : (
        <Button onPress={generateTransaction} style={{ marginTop: 16, marginBottom: 16 }} disabled={loading} title='Generate Transaction' />
      )}
    </Col>
  )
}

export default SendTransactionForm