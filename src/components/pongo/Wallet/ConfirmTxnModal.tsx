import { useCallback, useMemo, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { Transaction } from '@uqbar/wallet-ui'

import { Text } from "../../Themed";
import Modal from "../../popup/Modal";
import Col from "../../spacing/Col";
import Button from "../../form/Button";
import { light_gray } from "../../../constants/Colors";
import { isWeb } from "../../../constants/Layout";
import { useWalletStore } from "../../../wallet-ui";

const DEFAULT_BUDGET = '1000000'

interface ConfirmTxnModalProps {
  txn: Transaction | undefined;
  setTxn: (txn: Transaction | undefined) => void;
}

export default function ConfirmTxnModal({ txn, setTxn }: ConfirmTxnModalProps) {
  const { submitSignedHash } = useWalletStore()
  const [rate, setRate] = useState('1');

  const confirmTxn = useCallback(() => {
    const submittedRate = rate.replace(/[^0-9]/g, '')
    if (txn && submittedRate) {
      submitSignedHash(txn.from, txn.hash, Number(submittedRate), Number(DEFAULT_BUDGET)/*, ethHash, sig*/);
      setTxn(undefined)
    }
  }, [txn, rate])

  const styles = useMemo(() => StyleSheet.create({
    label: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
    text: { fontSize: 16, marginBottom: 4, marginLeft: 8 },
    pfp: { height: 200, width: 200, borderRadius: 8 },
    mt16: { marginTop: 16 },
    textInput: { borderRadius: 4, borderColor: light_gray, borderWidth: 1, padding: 4, paddingHorizontal: 8 },
    button: { marginTop: 16, marginHorizontal: isWeb ? 'auto' : undefined },
  }), [])

  return (
    <Modal title='Confirm Transaction' show={Boolean(txn)} hide={() => setTxn(undefined)}>
      <Col style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 16, marginVertical: 16 }}>Please confirm the transaction to update your profile.</Text>
        <Text style={styles.label}>Gas Price:</Text>
        <TextInput autoFocus value={rate} onChangeText={setRate} style={styles.textInput} />
        <Button style={{ marginTop: 16 }} title='Confirm' onPress={confirmTxn} />
        <Button style={{ marginVertical: 16 }} title='Cancel' onPress={() => setTxn(undefined)} />
      </Col>
    </Modal>
  )
}
