import React, { useCallback, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useWalletStore } from '../store/walletStore';

import { Token } from '../types/Token'
import { displayTokenAmount } from '../utils/number';
import { removeDots } from '../utils/format';
import Col from './spacing/Col';
import Row from './spacing/Row'
import Field from './spacing/Field';
import Divider from './spacing/Divider';
import Entry from './spacing/Entry';
import NftImage from './NftImage';
import HexNum from './text/HexNum';

import { Text } from '../../components/Themed';
import Button from '../../components/form/Button';
import { window } from '../../constants/Layout';
import useColors from '../../hooks/useColors';

interface TokenDisplayProps {
  token: Token
  selectToken: (tokenId: string, nftIndex?: number) => void
  small?: boolean
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({
  token,
  selectToken,
  small = false,
}) => {
  const { metadata } = useWalletStore()
  const tokenMetadata = metadata[token.data.metadata]
  const { contract, id, data } = token
  const balance = +removeDots(String(data.balance!))
  const [open, setOpen] = useState(false)
  const isToken = token.token_type === 'token'
  const { color } = useColors()

  const styles = StyleSheet.create({
    displayStyle: {
      padding: 8,
      paddingBottom: 0,
      margin: 8,
      borderRadius: 4,
      flex: 1,
      marginRight: 0,
      borderWidth: 1,
      borderColor: color,
    },
    smallStyle: small ? {
      margin: 0,
      borderRadius: 0,
      fontSize: 14,
    } : {},
    tokenName: {
      paddingLeft: 8,
      marginRight: 8,
      fontWeight: '600',
      fontSize: 16,
    },
    tokenClosedDetails: open ? {} : {
      height: 0,
      opacity: 0,
      overflow: 'hidden',
      margin: 0,
      padding: 0,
    },
    tokenDetails: {
      paddingLeft: 24,
      paddingTop: 8,
    }
  })

  const select = useCallback(() => {
    selectToken(id, data.id)
  }, [id, data.id])

  const { width } = window

  return (
    <Pressable onPress={() => !open && setOpen(true)}>
      <Col style={[styles.displayStyle, styles.smallStyle]}>
        <Pressable onPress={() => setOpen(!open)}>
          <Row between>
            <Row style={{ flex: 1 }}>
              <Row style={{ padding: 2, paddingHorizontal: 4 }}>
                <FontAwesome5 name={open ? 'caret-down' : 'caret-right'} size={24} style={{ marginRight: 12, marginLeft: 8 }} />
                <FontAwesome5 name={isToken ? 'coins' : 'portrait'} size={24} />
              </Row>
              <Text style={styles.tokenName}>
                {(isToken ? tokenMetadata?.data?.symbol : tokenMetadata?.data?.name) || <HexNum num={contract} />} -
              </Text>
              {isToken ? (
                <Text>{displayTokenAmount(balance, tokenMetadata?.data?.decimals || 1, open ? tokenMetadata?.data?.decimals || 8 : 8)}</Text>
                ) : (
                <Text># {data.id || ''}</Text>
              )}
            </Row>
            <Button onPress={select} style={{ marginLeft: 16, marginRight: 8, width: 80 }} small title='Send' />
          </Row>
        </Pressable>
        <Col style={[styles.tokenDetails, styles.tokenClosedDetails]}>
          <Divider />
          {isToken && tokenMetadata?.data?.name && (
            <Entry>
              <Field name='Name:'>
                <Text mono>{tokenMetadata?.data?.name}</Text>
              </Field>
            </Entry>
          )}
          {isToken && tokenMetadata?.data?.decimals && (
            <Entry>
              <Field name='Decimals:'>
                <Text style={{ fontSize: 18 }} numberOfLines={1} mono>{tokenMetadata?.data?.decimals}</Text>
              </Field>
            </Entry>
          )}
          <Entry>
            <Field column name='Contract:'>
              <HexNum copy mono num={contract} style={{ maxWidth: width * 0.6, marginLeft: width * -0.25 }} />
            </Field>
          </Entry>
          <Entry>
            <Field name='Item:' column>
              <HexNum copy mono num={id} style={{ maxWidth: width * 0.6, marginLeft: width * -0.25 }} />
            </Field>
          </Entry>
          {!isToken && token.data.properties && (
            <Entry>
              <Field name='Properties:' column>
                <Row style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Col style={{ marginRight: 16 }}>
                    {Object.keys(token.data.properties).map((prop) => (
                      <Text key={prop} mono>{prop}: {token.data.properties ? token.data.properties[prop] : 'unknown'}</Text>
                    ))}
                  </Col>
                  {token.data.uri && <NftImage nftInfo={data} />}
                </Row>
              </Field>
            </Entry>
          )}
        </Col>
      </Col>
    </Pressable>
  )
}

export default TokenDisplay
