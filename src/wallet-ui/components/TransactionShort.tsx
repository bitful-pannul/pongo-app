import React, { useCallback } from 'react'
import moment from 'moment';
import { Alert, View as DefaultView, View } from 'react-native'

import { useWalletStore } from '../store/walletStore';
import { Transaction } from '../types/Transaction';
import { getStatus } from '../utils/constants';
import { abbreviateHex } from '../utils/format';
import Col from './spacing/Col';
import CopyIcon from './text/CopyIcon';
import HexNum from './text/HexNum';
import Row from './spacing/Row';
import Pill from './text/Pill';
import { StyleSheet } from 'react-native';
import Button from '../../components/form/Button';

interface TransactionShortProps {
  txn: Transaction
  selectHash: (hash: string) => void
  vertical?: boolean
  external?: boolean
}

const TransactionShort: React.FC<TransactionShortProps & DefaultView['props']> = ({
  txn,
  selectHash,
  vertical = false,
  external = false,
  ...props
}) => {
  const { deleteUnsignedTransaction } = useWalletStore()

  const unsigned = Number(txn.status) === 100

  const styles = StyleSheet.create({
    transactionShort: {
      padding: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
      background: 'rgba(80, 80, 80, 0.4)',
      borderRadius: 4,
    },
    transactionShortVertical: {
      flex: 1,
      borderRadius: 0,
      margin: 0,
      alignItems: 'flex-start',
    }
  })

  const deleteTransaction = useCallback(() => {
    Alert.prompt(
      'Delete',
      'Are you sure you want to delete this pending transaction?',
      [
        {
          text: 'Yes',
          onPress: () => deleteUnsignedTransaction(txn.from, txn.hash),
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
      ]
    )
  }, [txn])

  return (
      <Col {...props} style={[styles.transactionShort, vertical && styles.transactionShortVertical, props.style]}>
        <Row between style={{ flexDirection: vertical ? 'column' : undefined }}>
          <Row style={[vertical && { flexDirection: 'column', alignItems: 'flex-start' }, { marginLeft: -20 }]}>
            <Row style={{ marginLeft: -4 }}>
              <HexNum mono num={txn.hash} displayNum={abbreviateHex(txn.hash)} />
              <CopyIcon text={txn.hash} />
            </Row>
            {vertical && <View style={{ height: 8 }} />}
            <Pill label={'Nonce'} value={''+txn.nonce} />
            {vertical && <View style={{ height: 8 }} />}
            <Pill label={'Status'} value={getStatus(txn.status)} />
            {Boolean(txn.created) && <>
              {vertical && <View style={{ height: 8 }} />}
              <Pill label='Created'  value={(typeof txn.created === 'string') ? txn.created : moment(txn.created).format()} /> 
            </>}
          </Row>
          {vertical && unsigned && <View style={{ height: 8 }} />}
          <Row>
            {unsigned && (
              <Button style={{ marginLeft: unsigned ? 0 : 8 }} small 
                onPress={() => selectHash(txn.hash)}
                title='Sign & Submit'
              />
            )}
            {unsigned && (
              <Button style={{ marginLeft: 8 }} small 
                onPress={deleteTransaction}
                  title='Delete'
              />
            )}
          </Row>
        </Row>
      </Col>
  )
}

export default TransactionShort
