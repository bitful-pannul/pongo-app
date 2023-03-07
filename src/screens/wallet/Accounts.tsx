import { useCallback, useEffect, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { DerivedAddressType, HardwareWalletType, Seed } from "@uqbar/wallet-ui";

import Button from "../../components/form/Button";
import H3 from "../../components/text/H3";
import { ScrollView, Text, View } from "../../components/Themed";
import { useWalletStore } from "../../wallet-ui";
import AccountDisplay from "../../wallet-ui/components/AccountDisplay";
import Input from "../../wallet-ui/components/form/Input";
import Modal from "../../wallet-ui/components/popups/Modal";
import Col from "../../wallet-ui/components/spacing/Col";
import Row from "../../wallet-ui/components/spacing/Row";
import { capitalize } from "../../wallet-ui/utils/format";
import { isIos } from "../../constants/Layout";
import useColors from "../../hooks/useColors";
import { Alert } from "react-native";

export default function WalletAccounts() {
  const { accounts, importedAccounts, createAccount, restoreAccount, importAccount, getSeed, deriveNewAddress } = useWalletStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showAddWallet, setShowAddWallet] = useState<'create' | 'restore' | undefined>(undefined)
  const [showImport, setShowImport] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [seedData, setSeed] = useState<Seed | null>(null)
  const [addAddressType, setAddAddressType] = useState<DerivedAddressType | null>(null)
  const [nick, setNick] = useState('')
  const [hdpath, setHdpath] = useState('')
  const [importType, setImportType] = useState<HardwareWalletType | null>(null)

  const { color, backgroundColor, shadedBackground } = useColors()

  const addHardwareAddress = addAddressType && addAddressType !== 'hot'

  useEffect(() => {
    if (!showImport && !showAddWallet && !addAddressType) {
      setNick('')
    }
  }, [showImport, showAddWallet, addAddressType])

  const showSeed = useCallback(() => {
    Alert.prompt(
      'Display Seed Phrase',
      'Are you sure you want to display your seed phrase? Anyone viewing this will have access to your account.',
      [
        {
          text: 'Yes',
          onPress: async () => {
            const seed = await getSeed()
            setSeed(seed)
          },
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
      ],
    )
  }, [getSeed, setSeed])

  const clearForm = useCallback(() => {
    setNick('')
    setHdpath('')
    setPassword('')
    setConfirmPassword('')
    setAddAddressType(null)
  }, [setNick, setHdpath, setPassword, setConfirmPassword, setAddAddressType])

  const create = useCallback(async () => {
    // if (!accounts.length || window.confirm('Please make sure you have backed up your seed phrase and password. This will overwrite your existing account(s), are you sure?')) {
      if (showAddWallet === 'restore') {
        if (!mnemonic) {
          return alert('Mnemonic is required')
        } else {
          restoreAccount(mnemonic, password, nick)
        }
      } else {
        if (password !== confirmPassword) {
          console.log({ password, confirmPassword })
          return alert('Password fields must match')
        } else {
          createAccount(password, nick)
        }
      }
      setShowAddWallet(undefined)
      setShowCreate(false)
      clearForm()
    // }
  }, [mnemonic, password, confirmPassword, nick, showAddWallet, createAccount, restoreAccount, clearForm])

  const doImport = useCallback(() => {
    if (!nick) {
      alert('Nickname is required')
    } else {
      if (importType) {
        importAccount(importType, nick)
      }
      setShowCreate(false)
      setShowAddWallet(undefined)
      setShowImport(false)
      setImportType(null)
      clearForm()
    }
  }, [setShowCreate, setShowAddWallet, setShowImport, importAccount, clearForm, nick, importType])

  const addAddress = () => {
    if (addHardwareAddress) {
      if (!hdpath) {
        return alert('You must supply an HD path')
      }
      deriveNewAddress(hdpath, nick, addAddressType)
    } else if (addAddressType) {
      deriveNewAddress(hdpath, nick)
    }
    clearForm()
  }

  const hideModal = useCallback(() => {
    clearForm()
    setImportType(null)
    setSeed(null)
    setShowAddWallet(undefined)
    setShowCreate(false)
    setShowImport(false)
  }, [clearForm, setImportType, setSeed, setShowAddWallet, setShowCreate, setShowImport])

  const isFirefox = (typeof (window as any).InstallTrigger !== 'undefined') 

  const hardwareWalletTypes: HardwareWalletType[] =
    importedAccounts.reduce((acc, { type }) => !acc.includes(type) ? acc.concat([type]) : acc, [] as HardwareWalletType[])

  return (
    <ScrollView style={{ flex: 1, height: '100%', width: '100%' }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps='handled'>
      <H3 text='Accounts' />
      <Text bold style={{ fontSize: 18, marginVertical: 16 }}>Hot Wallets</Text>
      <Text style={{ marginBottom: 16 }}>
        WARNING: HOT WALLETS ARE NOT SECURE. ALL YOUR OTHER URBIT APPS CAN READ YOUR HOT WALLET PRIVATE KEYS.
      </Text>
      {accounts.map(a => (
        <AccountDisplay color={color} key={a.address} account={a} />
      ))}
      <Col style={{ marginVertical: 16 }}>
        {accounts.length > 0 && (
          <>
            <Button style={{ marginBottom: 16 }} onPress={showSeed} small title='Display Seed Phrase' />
            <Button style={{ marginBottom: 16 }} onPress={() => setAddAddressType('hot')} small title='Derive New Address' />
          </>
        )}
        <Button onPress={() => setShowCreate(true)} small title='New Wallet' />
      </Col>
      {importedAccounts.map(a => (
        <AccountDisplay color={color} key={a.address} account={a} />
      ))}
      <Row>
        {importedAccounts.length > 0 && (
          <Button small onPress={() => setAddAddressType(hardwareWalletTypes[0])} title='Derive New Address' style={{ marginRight: 16, flexShrink: 1 }} />
        )}
        {/* <Button small onPress={() => setShowImport(true)} title='Connect' style={{ marginRight: 0, flexShrink: 1 }} /> */}
      </Row>

      <Modal
        title='Seed:'
        show={Boolean(seedData)} 
        hide={hideModal}
        style={{ minWidth: 300 }}
        color={color}
        backgroundColor={backgroundColor}
        shadedBackground={shadedBackground}
      >
        <Col style={{ justifyContent: 'center', width: 300, marginVertical: 16 }}>
          <Text mono>{seedData?.mnemonic}</Text>
          {seedData?.password && (
            <>
              <Text bold style={{ marginTop: 16 }}>Password:</Text>
              <Text mono>{seedData?.password}</Text>
            </>
          )}
        </Col>
      </Modal>
      <Modal 
        title='Add Wallet'
        show={showCreate} 
        hide={hideModal}
        style={{ minWidth: 300 }}
        color={color}
        backgroundColor={backgroundColor}
        shadedBackground={shadedBackground}
      >
        <Col style={{ justifyContent: 'center', alignItems: 'center', width: '100%', marginVertical: 16 }}>
          <Button style={{  marginBottom: 16 }} onPress={() => setShowAddWallet('create')} title='Create New Wallet' />
          <Button onPress={() => setShowAddWallet('restore')} title='Restore From Seed' />
        </Col>
      </Modal>
      <Modal 
        title={(showAddWallet === 'create' ? 'Create' : 'Restore') + ' Wallet'}
        show={Boolean(showAddWallet)} 
        hide={hideModal}
        style={{ minWidth: 300 }}
        color={color}
        backgroundColor={backgroundColor}
        shadedBackground={shadedBackground}
      >
        <Col style={{ justifyContent: 'center', alignItems: 'center', width: '100%', marginVertical: 16 }}>
          <Input
            onChangeText={(text) => setNick(text)}
            placeholder='Nickname'
            style={{ width: '100%' }}
            containerStyle={{ width: '90%', marginBottom: 8 }}
            value={nick}
            // minLength={3}
            // required
            autoFocus
          />
          {showAddWallet === 'restore' && (<Input
            onChangeText={(text) => setMnemonic(text)}
            placeholder='Enter seed phrase'
            containerStyle={{ width: '90%', marginBottom: 8 }}
            style={{ width: '100%', height: 80 }}
            multiline
          />)}
          <Input
            onChangeText={(text) => setPassword(text)}
            placeholder='Enter password'
            style={{ width: '100%', marginBottom: 8 }}
            containerStyle={{ width: '90%' }}
            keyboardType='visible-password'
            value={password}
            />
          <Input
            onChangeText={(text) => setConfirmPassword(text)}
            placeholder='Confirm password'
            style={{ width: '100%', marginBottom: 8 }}
            containerStyle={{ width: '90%' }}
            keyboardType='visible-password'
            value={confirmPassword}
          />
          <Button onPress={create} title={showAddWallet === 'create' ? 'Create' : 'Restore'} />
        </Col>
      </Modal>
      <Modal
        title='Connect Hardware Wallet'
        show={showImport} 
        hide={hideModal}
        style={{ minWidth: 300 }}
        color={color}
        backgroundColor={backgroundColor}
        shadedBackground={shadedBackground}
      >
        <Col style={{ justifyContent: 'space-evenly', alignItems: 'center', height: '100%', width: '100%' }}>
          {isFirefox && <Col style={{ alignItems:'center', marginBottom: 16 }}>
            <FontAwesome5 name='exclamation-triangle' size={24} color='goldenrod' /> 
            <Text>
              Hardware wallets may not work in Firefox. 
            </Text>
            <Text>
              Please try a different browser if you encounter issues.
            </Text>
          </Col>}
          <Button onPress={() => {
            setShowImport(false)
            setImportType('ledger')
          }} title='Connect Ledger' />
          <Button onPress={() => {
            setShowImport(false)
            setImportType('trezor')
          }} title='Connect Trezor' />
        </Col>
      </Modal>
      <Modal
        title='Set Nickname' 
        show={Boolean(importType)}
        hide={hideModal}
        style={{ minWidth: 300 }}
        color={color}
        backgroundColor={backgroundColor}
        shadedBackground={shadedBackground}
      >
        <Col style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
          <Input
            onChangeText={(text) => setNick(text)}
            placeholder={`Nickname, i.e. ${capitalize(importType || '')} primary`}
            style={{ width: '100%' }}
            containerStyle={{ width: '100%', marginBottom: 16 }}
            value={nick}
          />
          <Button onPress={doImport} style={{ width: '100%' }} title='Connect' />
        </Col>
      </Modal>
      <Modal
        title='Derive New Address' 
        show={Boolean(addAddressType)} 
        hide={hideModal}
        style={{ minWidth: 300 }}
        color={color}
        backgroundColor={backgroundColor}
        shadedBackground={shadedBackground}
      >
        <Col style={{ justifyContent: 'center', alignItems: 'center', width: 300, maxWidth: '100%', backgroundColor: 'white', marginVertical: 16 }}>
          {/* {addHardwareAddress && (
            <Picker style={{ width: '80%', height: isIos ? 100: 32, borderRadius: 8, alignItems: 'center', color }} dropdownIconColor={color} selectedValue={addAddressType}
              itemStyle={{ fontSize: 16, textAlign: 'center', alignSelf: 'center' }}
            onValueChange={(value) => setAddAddressType(value as HardwareWalletType)}>
              {hardwareWalletTypes.map(hwt => (
                <Picker.Item key={hwt} label={capitalize(hwt)} value={hwt} />
              ))}
            </Picker>
          )} */}
          <Input
            onChangeText={(text) => setNick(text)}
            placeholder='Nickname'
            style={{ width: '100%' }}
            containerStyle={{ width: '100%', marginBottom: 16 }}
            value={nick}
            // minLength={3}
            // required
          />
          <Input
            onChangeText={(text) => setHdpath(text)}
            placeholder={`HD Path ${addHardwareAddress ? '(m/44\'/60\'/0\'/0/0)' : '(optional)'}`}
            style={{ width: '100%' }}
            containerStyle={{ width: '100%', marginBottom: 16 }}
            value={hdpath}
            // required={Boolean(addHardwareAddress)}
          />
          <Button onPress={addAddress} title='Derive' />
        </Col>
      </Modal>
    </ScrollView>
  )
}
