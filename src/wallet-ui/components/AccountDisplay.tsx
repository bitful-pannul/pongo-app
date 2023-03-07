import React, { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View as DefaultView } from 'react-native'
import { HotWallet, HardwareWallet } from '@uqbar/wallet-ui';

import { useWalletStore } from '../store/walletStore';
import { displayPubKey } from '../utils/account';
import Input from './form/Input';
import Col from './spacing/Col';
import Row from './spacing/Row'
import CopyIcon from './text/CopyIcon';
import { ONE_SECOND, PUBLIC_URL } from '../utils/constants';
import HexNum from './text/HexNum';
import { Text } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';

interface AccountDisplayProps {
  account: HotWallet | HardwareWallet
  color: string
  full?: boolean
}

const AccountDisplay: React.FC<AccountDisplayProps & DefaultView['props']> = ({
  account,
  color,
  full = false,
  ...props
}) => {
  const { nick, address, rawAddress, nonces } = account
  const { deleteAccount, editNickname } = useWalletStore()
  const [newNick, setNewNick] = useState(nick)
  const [nickSaved, setNickSaved] = useState(false)
  const [nickInputFocused, setNickInputFocus] = useState(false)

  useEffect(() => {
    setNewNick(nick)
  }, [nick])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (newNick && newNick !== nick) {
        const nickWithType = 'type' in account && account.type ? `${newNick}//${account.type}` : newNick
        editNickname(rawAddress, nickWithType)
        setNickSaved(true)
        setTimeout(() => setNickSaved(false), ONE_SECOND * 2)
      }
    }, ONE_SECOND)
    return () => clearTimeout(delayDebounceFn)
  }, [newNick]) // eslint-disable-line react-hooks/exhaustive-deps

  const hardware = account as HardwareWallet

  const styles = StyleSheet.create({
    accountDisplay: {
      padding: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: color,
    },
    nickInput: {
      borderColor: color,
      borderWidth: 1,
      borderBottomColor: '#727bf2',
      borderBottomWidth: 3,
      borderRadius: 6,
      fontWeight: '600',
      marginRight: 6,
      width: 160,
      backgroundColor: 'inherit',
    },
    nickInputFocused: {
      borderColor: '#3acfc0',
    },
    nickSaved: {
      borderColor: '#dd7c8a',
    },
  })

  const confirmDelete = useCallback(() => {
    Alert.prompt(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        {
          text: 'Yes',
          onPress: () => deleteAccount(rawAddress),
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
      ]
    )
  }, [])

  return (
    <Col {...props} style={[styles.accountDisplay, props.style]}>
      <Col style={{  }}>
        <Row between>
          <Row>
            {hardware && hardware.type && <Text style={{marginRight: 16}}>{hardware.type}</Text>}
            <Input
              style={[styles.nickInput, nickInputFocused && styles.nickInputFocused, nickSaved && styles.nickSaved]}
              onChange={(e: any) => setNewNick(e.target.value)}
              value={newNick}
              onFocus={() => setNickInputFocus(true)}
              onBlur={() => setNickInputFocus(false)}
            />
          </Row>
          <TouchableOpacity onPress={confirmDelete}>
            <Ionicons name='trash-outline' style={{ padding: 4, paddingRight: 12 }} size={20} color={color} />
          </TouchableOpacity>
        </Row>
        
        <Row between style={{ flex: 1 }}>
          <HexNum num={address} displayNum={displayPubKey(address)} mono bold style={{ width: '80%' }} />
          <CopyIcon color={color} text={rawAddress} style={{ marginRight: 8 }} />
        </Row>
      </Col>
      {full && (
        <Col>
          <Text bold style={{ marginTop: 16 }}>Nonces</Text>
          {Object.entries(nonces).length === 0 && <Text>No nonces to display.</Text>}
          {Object.entries(nonces).map(([k, v], i) => (
            <Row key={i}>
              <Text style={{ marginRight: 8, width: 72 }}>Town: {k}</Text>
              <Text>Nonce: {v}</Text>
            </Row>
          ))}
        </Col>
      )}
    </Col>
  )
}

export default AccountDisplay
