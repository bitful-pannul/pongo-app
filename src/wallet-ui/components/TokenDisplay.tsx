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
      padding: 4,
      paddingBottom: 0,
      marginTop: 12,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: color,
    },
    smallStyle: small ? {
      margin: 0,
      maxWidth: '94%',
    } : {},
    tokenName: {
      paddingLeft: 4,
      marginRight: 4,
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
      paddingLeft: 8,
      paddingTop: 8,
    }
  })

  const select = useCallback(() => {
    selectToken(id, data.id)
  }, [id, data.id])

  const { width } = window

  const iconName = tokenMetadata?.data?.symbol.toLowerCase() === 'ueth' ? 'ethereum' :
    isToken ? 'coins' : 'portrait'

  return (
    <Pressable onPress={() => !open && setOpen(true)}>
      <Col style={[styles.displayStyle, styles.smallStyle]}>
        <Pressable onPress={() => setOpen(!open)}>
          <Row between>
            <Row>
              <Row style={{ padding: 2, paddingHorizontal: 4 }}>
                <FontAwesome5 name={open ? 'caret-down' : 'caret-right'} size={24} style={{ marginRight: 12, marginLeft: 4 }} />
                <FontAwesome5 name={iconName} size={20} />
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
            <Button onPress={select} style={{ marginLeft: 16, marginRight: 4 }} small title='Send' />
          </Row>
        </Pressable>
        <Col style={[styles.tokenDetails, styles.tokenClosedDetails]}>
          <Divider />
          {isToken && tokenMetadata?.data?.name && (
            <Entry>
              <Field name='Name:'>
                <Text mono style={{ fontSize: 16, marginTop: 2 }}>{tokenMetadata?.data?.name}</Text>
              </Field>
            </Entry>
          )}
          {isToken && tokenMetadata?.data?.decimals && (
            <Entry>
              <Field name='Decimals:'>
                <Text style={{ fontSize: 16, marginTop: 2 }} numberOfLines={1} mono>{tokenMetadata?.data?.decimals}</Text>
              </Field>
            </Entry>
          )}
          <Entry>
            <Field column name='Contract:'>
              <HexNum copy mono num={contract} style={{ maxWidth: '100%', marginLeft: -8, marginRight: 8 }} />
            </Field>
          </Entry>
          <Entry>
            <Field name='Item:' column>
              <HexNum copy mono num={id} style={{ maxWidth: '100%', marginLeft: -8, marginRight: 8 }} />
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
