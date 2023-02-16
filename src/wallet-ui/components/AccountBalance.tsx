import React, { useCallback } from 'react'
import { View as DefaultView } from 'react-native';

import { Text, View } from '../../components/Themed'
import Button from '../../components/form/Button';
import { Token } from '../types/Token'
import Row from './spacing/Row'
import Col from './spacing/Col'
import { displayPubKey } from '../utils/account'
import { addHexDots } from '../utils/format'

import TokenDisplay from './TokenDisplay'
import CopyIcon from './text/CopyIcon'
import HexNum from './text/HexNum'

interface AccountBalanceProps {
  pubKey: string
  balances: Token[]
  selectToken: (tokenId: string, nftIndex?: number) => void
  setCustomFrom: (customFrom: string) => void
  selectPubkey: (pubKey: string) => void
}

const AccountBalance: React.FC<AccountBalanceProps & DefaultView['props']> = ({
  balances,
  pubKey,
  selectToken,
  setCustomFrom,
  selectPubkey,
  style,
  ...props
}) => {
  const setCustom = useCallback(() => setCustomFrom(pubKey), [pubKey])

  const selectAddress = useCallback(() => selectPubkey(pubKey), [pubKey])

  return (
    <View {...props} style={[style, { margin: 8, marginRight: 16, marginBottom: balances.length ? 8 : 16 }]}>
      <Row between>
        <Row style={{ alignItems: 'center' }}>
          <Text numberOfLines={1} style={{ margin: 0, fontWeight: '600' }} onPress={selectAddress}>
            <HexNum num={pubKey} displayNum={displayPubKey(pubKey)} />
          </Text>
          <CopyIcon text={addHexDots(pubKey)} />
        </Row>
        <Button small style={{ width: 120, marginHorizontal: 0 }} onPress={setCustom} title='Custom Txn' />
      </Row>
      {balances.length ? (
        balances.map(b => (
          <TokenDisplay token={b} key={b.id} selectToken={selectToken} />
        ))
      ) : (
        <Text style={{ fontSize: 18 }}>There are no assets under this account.</Text>
      )}
    </View>
  )
}

export default AccountBalance
