import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import * as Haptics from 'expo-haptics'
import { NavigationProp, RouteProp } from '@react-navigation/native'
import { Token, Transaction } from '@uqbar/wallet-ui'

import { PongoStackParamList } from '../../types/Navigation'
import Col from '../../components/spacing/Col'
import H2 from '../../components/text/H2'
import H3 from '../../components/text/H3'
import { Text, View, TextInput } from '../../components/Themed'
import useNimiState from '../../state/useNimiState'
import Row from '../../components/spacing/Row'
import Button from '../../components/form/Button'
import { light_gray } from '../../constants/Colors'
import { addSig } from '../../util/string'
import { useWalletStore } from "../../wallet-ui"
import DropDownPicker from 'react-native-dropdown-picker'
import useDimensions from '../../hooks/useDimensions'
import { isWeb } from '../../constants/Layout'
import { ZIGS_CONTRACT } from '../../wallet-ui/utils/constants'
import { fromUd } from '../../util/number'
import { UQNAMES_CONTRACT_ADDRESS, MINT_COST } from '../../constants/Nimi'
import ConfirmTxnModal from '../../components/pongo/Wallet/ConfirmTxnModal'

const CONFIRMATION_TEXT = 'Please note that you will have to confirm a transaction to update your profile.'

interface EditProfileScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'EditProfile'>
}

export default function EditProfileScreen({ navigation, route }: EditProfileScreenProps) {
  const { selectedAccount, accounts, importedAccounts, assets, getUnsignedTransactions } = useWalletStore()
  const { me, mint, setProfile, getProfile } = useNimiState()
  const { cWidth } = useDimensions()

  const [editName, setEditName] = useState(false)
  const [chooseExisting, setChooseExisting] = useState(false)
  const [walletAddress, setWalletAddress] = useState(selectedAccount?.rawAddress || accounts[0].rawAddress || importedAccounts[0].rawAddress || '')
  const [name, setName] = useState(me?.name || '')
  const [profilePic, setProfilePic] = useState(me?.uri || '')
  const [openDropdown, setOpenDropdown] = useState(false);
  const [txn, setTxn] = useState<Transaction | undefined>();
  const [items, setItems] = useState(
    accounts.map(({ rawAddress }) => rawAddress).concat(importedAccounts.map(({ rawAddress }) => rawAddress)).map((address) => ({ label: address, value: address }))
  );
  const existingAssets = useMemo(() =>
    Object.values(assets || {}).reduce((acc, cur: { [addr: string]: Token }) => acc.concat(Object.values(cur)), [] as Token[])
      .filter(({ token_type }) => token_type === 'nft')
  , [assets])

  const hasZigs = Boolean(Object.values(assets[walletAddress] || {}).find(({ contract, data }) => contract === ZIGS_CONTRACT && data.balance && fromUd(data.balance) > MINT_COST))

  useEffect(() => {
    if (me?.uri) {
      setEditName(false)
      setName(me?.name || '')
      setProfilePic(me?.uri)
    }
  }, [me])

  useEffect(() => {
    if (selectedAccount) setWalletAddress(selectedAccount.rawAddress)
  }, [selectedAccount])

  useEffect(() => {
    setItems(accounts.map(({ rawAddress }) => rawAddress).concat(importedAccounts.map(({ rawAddress }) => rawAddress)).map((address) => ({ label: address, value: address })))
  }, [accounts, importedAccounts])

  const startSelection = useCallback(() => setChooseExisting(true), [])
  const cancelSelection = useCallback(() => setChooseExisting(false), [])
  const selectNft = useCallback((nft: Token) => () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    setProfile(nft.id, nft.holder)
      .then(() => getProfile())
    setChooseExisting(false)
  }, [])
  const clearProfile = useCallback(() => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    setProfile('0x0', '0x0')
      .then(() => getProfile())
  }, [])
  
  const startEditName = useCallback(() => {
    if (hasZigs) {
      setEditName(true)
    } else {
      if (isWeb) {
        window.alert('You do not have enough zigs to mint a new NFT for your profile.')
      } else {
        Alert.alert('Not enough zigs', 'You do not have enough zigs to mint a new NFT for your profile.')
      }
    }
  }, [hasZigs])
  const cancelEditName = useCallback(() => {
    setName(me?.name || '')
    setProfilePic(me?.uri || '')
    setEditName(false)
  }, [])

  const updateProfile = useCallback(async () => {
    if (name !== me?.name || profilePic !== me?.uri) {
      if (isWeb && window.confirm(CONFIRMATION_TEXT)) {
        mint({ name, uri: profilePic, address: walletAddress, nft: UQNAMES_CONTRACT_ADDRESS, ship: true })
        setEditName(false)
        const txns = await getUnsignedTransactions()
        setTxn(Object.values(txns).findLast(({ from }) => from === walletAddress))
      } else if (!isWeb) {
        Alert.prompt('Update Profile', CONFIRMATION_TEXT, [
          { text: 'Update', onPress: async () => {
             mint({ name, uri: profilePic, address: walletAddress, nft: UQNAMES_CONTRACT_ADDRESS, ship: true })
             setEditName(false)
             const txns = await getUnsignedTransactions()
             setTxn(Object.values(txns).findLast(({ from }) => from === walletAddress))
          } },
          { text: 'Cancel', style: 'cancel' },
        ])
      }
    }
  }, [name, me, profilePic, walletAddress])

  const styles = useMemo(() => StyleSheet.create({
    label: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
    text: { fontSize: 16, marginBottom: 4, marginLeft: 8 },
    pfp: { height: 200, width: 200, borderRadius: 8 },
    mt16: { marginTop: 16 },
    textInput: { borderRadius: 4, borderColor: light_gray, borderWidth: 1, padding: 4, paddingHorizontal: 8 },
    button: { marginTop: 16, marginHorizontal: isWeb ? 'auto' : undefined },
    existingNft: { height: 100, width: 100, margin: 8, borderRadius: 8 },
    nftLabel: { fontSize: 16, textAlign: 'center', marginBottom: 4, fontWeight: '600' },
  }), [])

  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Col style={{ width: '100%', alignItems: 'center', paddingVertical: 24 }}>
        <H2 text={addSig(ship)} />

        {chooseExisting ? (
          <Col style={[styles.mt16, { paddingHorizontal: 16 }]}>
            <H3 text='Choose Existing NFT' style={{ marginLeft: 8 }} />
            <Row style={{ flexWrap: 'wrap', flex: 1 }}>
              {existingAssets.map(nft => (
                <TouchableOpacity key={nft.id} onPress={selectNft(nft)}>
                  <Col>
                    <Image source={{ uri: nft.data.uri }} style={styles.existingNft} />
                    <Text style={[styles.nftLabel, { fontWeight: nft.data.properties?.name ? '600' : '300' }]}>{nft.data.properties?.name || addSig(ship)}</Text>
                  </Col>
                </TouchableOpacity>
              ))}
            </Row>
            <Button title='Cancel' style={styles.button} onPress={cancelSelection} />
          </Col>
        ) : editName ? (
          <Col style={styles.mt16}>
            <H3 text='Update Profile' />
            <Text style={[styles.label, styles.mt16]}>Nickname:</Text>
            <TextInput autoFocus value={name} onChangeText={setName} style={styles.textInput} />
            <Text style={[styles.label, styles.mt16]}>Picture:</Text>
            <TextInput value={profilePic} onChangeText={setProfilePic} style={styles.textInput} />
            <Text style={[styles.label, styles.mt16]}>Wallet Address:</Text>
            <DropDownPicker
              style={{ width: cWidth * 0.8 }}
              open={openDropdown}
              value={walletAddress}
              items={items}
              setOpen={setOpenDropdown}
              setValue={setWalletAddress}
              setItems={setItems}
            />
            <Button title='Mint New NFT' style={styles.button} onPress={updateProfile} />
            {Boolean(me?.uri) && <Button title='Cancel' style={styles.button} onPress={cancelEditName} />}
          </Col>
        ) : (
          <>
            {me?.uri && (
              <>
                <Row style={styles.mt16}>
                  <Text style={styles.label}>Nickname:</Text>
                  <Text style={styles.text}>{me?.name}</Text>
                </Row>
                <Col style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={[styles.label, { marginBottom: 8 }]}>Profile Pic:</Text>
                  <Image style={styles.pfp} source={{ uri: me?.uri }} />
                </Col>
                
              </>
            )}
            <Text style={[styles.text, styles.mt16]}>Mint a new NFT for your profile pic and nickname or select an existing one</Text>
            <Button style={styles.button} title='Mint NFT' onPress={startEditName} />
            <Button style={styles.button} title='Select NFT' onPress={startSelection} />
            {Boolean(me?.uri) && <Button style={styles.button} title='Clear Profile' onPress={clearProfile} />}
          </>
        )}
      </Col>
      <ConfirmTxnModal {...{ txn, setTxn }} />
    </View>
  )
}
