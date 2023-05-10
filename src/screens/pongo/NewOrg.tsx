import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { isValidPatp } from 'urbit-ob'
import { View, TextInput, Text, StyleSheet, KeyboardAvoidingView } from 'react-native'
import { Transaction } from '@uqbar/wallet-ui'

import { OrgPayload } from '../../types/Orgs'
import useOrgsState from '../../state/useOrgsState'
import { useWalletStore } from '../../wallet-ui'
import { addSig } from '../../util/string'
import { light_gray } from '../../constants/Colors'
import DropDownPicker from 'react-native-dropdown-picker'
import useDimensions from '../../hooks/useDimensions'
import ConfirmTxnModal from '../../components/pongo/Wallet/ConfirmTxnModal'
import Button from '../../components/form/Button'
import { useHeaderHeight } from '@react-navigation/elements'
import { keyboardAvoidBehavior, keyboardOffset } from '../../constants/Layout'
import { NavigationProp, RouteProp } from '@react-navigation/native'
import { PongoStackParamList } from '../../types/Navigation'

interface NewOrgScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'NewOrg'>
}

const NewOrg = ({ navigation, route }: NewOrgScreenProps) => {
  const { createOrg } = useOrgsState()
  const { selectedAccount, accounts, importedAccounts, assets, submitSignedHash, getUnsignedTransactions } = useWalletStore()
  const { cWidth } = useDimensions()

  const parent = route.params?.parent

  const [walletAddress, setWalletAddress] = useState(selectedAccount?.rawAddress || accounts[0].rawAddress || importedAccounts[0].rawAddress || '')
  const [name, setName] = useState('')
  const [parentPath, setParentPath] = useState('') // name of the parent org (if it exists)
  const [desc, setDesc] = useState('')
  const [controller, setController] = useState('')
  const [members, setMembers] = useState('')
  const [error, setError] = useState('')
  const [openDropdown, setOpenDropdown] = useState(false)
  const [txn, setTxn] = useState<Transaction | undefined>()
  const [items, setItems] = useState(
    accounts.map(({ rawAddress }) => rawAddress).concat(importedAccounts.map(({ rawAddress }) => rawAddress)).map((address) => ({ label: address, value: address }))
  )
  const headerHeight = useHeaderHeight()

  useEffect(() => {
    if (selectedAccount) {
      setWalletAddress(selectedAccount.rawAddress)
      setController(selectedAccount.rawAddress)
    }
  }, [selectedAccount])

  useEffect(() => {
    setItems(accounts.map(({ rawAddress }) => rawAddress).concat(importedAccounts.map(({ rawAddress }) => rawAddress)).map((address) => ({ label: address, value: address })))
  }, [accounts, importedAccounts])

  const walletRegex = /^0x[a-fA-F0-9.]+$/

  const onSubmit = useCallback(async () => {
    if (name.length < 3 || !/[A-Za-z-]/.test(name)) {
      return setError('Name must be at least 3 characters and only contain letters and dashes')
    } else if (!controller || !walletRegex.test(controller)) {
      return setError('Controller must be a valid wallet address')
    } else {
      const org: OrgPayload = {
        name,
        'parent-path': parentPath,
        desc,
        controller,
        members: members.split(',').map(member => addSig(member.trim())).filter(member => isValidPatp(member)),
        'sub-orgs': null,
      }
      console.log(org)

      await createOrg(walletAddress, org)
      const txns = await getUnsignedTransactions()
      setTxn(Object.values(txns).findLast(({ from }) => from === walletAddress))
      setName('')
      setParentPath('')
      setDesc('')
      setController('')
      setMembers('')
      setError('')
    }
  }, [walletAddress, name, parentPath, desc, controller, members])

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
    label: { fontSize: 16, fontWeight: '600', marginTop: 8 },
    input: {
      height: 40,
      borderColor: light_gray,
      borderWidth: 1,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
  }), [])

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardAvoidBehavior} keyboardVerticalOffset={keyboardOffset + headerHeight}>
      <View style={styles.container}>
        <Text style={styles.label}>Wallet Address</Text>
        <DropDownPicker
          style={{ width: cWidth * 0.8, marginTop: 4 }}
          open={openDropdown}
          value={walletAddress}
          items={items}
          setOpen={setOpenDropdown}
          setValue={setWalletAddress}
          setItems={setItems}
        />
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setName(text)}
          value={name}
        />

        <Text style={styles.label}>Parent Path (optional)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setParentPath(text)}
          value={parentPath}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setDesc(text)}
          value={desc}
        />

        <Text style={styles.label}>Controller Address</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setController(text)}
          value={controller}
        />

        <Text style={styles.label}>Members (comma-separated)</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setMembers(text)}
          value={members}
        />

        <Button style={{ marginTop: 16 }} title='Create Org' onPress={onSubmit} />

        <ConfirmTxnModal {...{ txn, setTxn }} />
      </View>
    </KeyboardAvoidingView>
  )
}

export default NewOrg
