import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { useWalletStore } from "../../wallet-ui";
import { ScrollView, Text, View } from "../../components/Themed";
import Button from "../../components/form/Button";

import { SendFormType } from "../../wallet-ui/components/form/SendTransactionForm";
import AccountBalance from "../../wallet-ui/components/AccountBalance";
import SendModal from "../../wallet-ui/components/SendModal";
import H3 from "../../components/text/H3";
import useColors from "../../hooks/useColors";

export default function WalletAssets() {
  const { assets, accounts, importedAccounts, loadingText, unsignedTransactions } = useWalletStore()
  const { color, backgroundColor, shadedBackground } = useColors()

  const [selectedAddress, setSelectedAddress] = useState<string | undefined>()
  const [sendFormType, setSendFormType] = useState<SendFormType | undefined>()
  const [id, setId] = useState<string | undefined>()
  const [nftIndex, setNftIndex] = useState<number | undefined>()
  const [customFrom, setCustomFrom] = useState<string | undefined>()

  const accountsList = useMemo(() => {
    return Array.from(new Set(Object.keys(assets).concat((accounts as any[]).concat(importedAccounts).map(a => a.rawAddress))))
  }, [assets, accounts, importedAccounts])

  const selectAddress = (e: any) => {
    setSelectedAddress(e.target.value === 'All addresses' ? undefined : e.target.value)
  }
  const setCustomFromAddress = useCallback((address: string) => {
    setCustomFrom(address)
    setSendFormType('custom')
  }, [setCustomFrom, setSendFormType])

  const setTokenToSend = useCallback((tokenId: string, nftIndex?: number) => {
    setId(tokenId)
    setNftIndex(nftIndex)
    setSendFormType(nftIndex ? 'nft' : 'tokens')
  }, [setNftIndex, setSendFormType])

  const modalTitle = sendFormType === 'custom' ?
    'Send Custom Transaction' :
    sendFormType === 'nft' ?
    'Send NFT' :
    'Send Tokens'

  const hideModal = useCallback(() => {
    setSendFormType(undefined)
    setId(undefined)
    setNftIndex(undefined)
    setCustomFrom(undefined)
  }, [setSendFormType, setId, setNftIndex, setCustomFrom])

  const selectPubkey = useCallback((address: string) => {
    // don't actually need anything here
  }, [])

  return (
    <ScrollView style={{ flex: 1, height: '100%', width: '100%' }} keyboardShouldPersistTaps='handled'>
      <H3 text='Assets' style={{ marginTop: 16, marginLeft: 16 }} />
      {/* <PageHeader title='Assets' >
          <Row style={{marginLeft: 'auto'}}>
            <label style={{ marginRight: 8 }}>Address:</label>
            <select className='address-selector' value={selectedAddress} onChange={selectAddress}>
              <option>{PLACEHOLDER}</option>
              {accountsList.map(rawAddress => (
                <option value={rawAddress} key={rawAddress}>
                  {displayPubKey(rawAddress)}
                </option>
              ))}
            </select>
          </Row>
      </PageHeader> */}
      {(!accountsList.length && !loadingText) && (
        <>
          <Text>You do not have any Uqbar accounts yet.</Text>
          <Button small onPress={() => null} title='Create Account' />
        </>
      )}
      {(selectedAddress ? [selectedAddress] : accountsList).map(a => (
        <AccountBalance
          key={a}
          pubKey={a}
          selectToken={setTokenToSend}
          setCustomFrom={setCustomFromAddress}
          balances={(assets && assets[a] && Object.values(assets[a])) || []}
          selectPubkey={selectPubkey}
        />
      ))}
      <SendModal title={modalTitle} show={Boolean(sendFormType)} id={id} {...{ color, backgroundColor, shadedBackground }}
        nftIndex={nftIndex} from={customFrom} formType={sendFormType} hide={hideModal}/>
    </ScrollView>
  )
}
