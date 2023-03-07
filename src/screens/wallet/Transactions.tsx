import { useCallback, useEffect, useState } from "react";

import H3 from "../../components/text/H3";
import { ScrollView, Text } from "../../components/Themed";
import useColors from "../../hooks/useColors";
import { useWalletStore } from "../../wallet-ui";
import TransactionShort from "../../wallet-ui/components/TransactionShort";
import { addHexDots } from "../../wallet-ui/utils/format";
import { groupTransactions } from "../../wallet-ui/utils/transactions";

const PLACEHOLDER = 'All addresses'

export default function WalletTransactions() {
  const { accounts, transactions, unsignedTransactions } = useWalletStore()
  const [filteredTransactions, setFilteredTransactions] = useState(transactions)
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>()
  const { color } = useColors()

  const filterByAddress = useCallback((address?: string) => {
    if (address) {
      setFilteredTransactions(
        transactions.filter(({ from }) => from === addHexDots(address))
      )
    } else {
      setFilteredTransactions(transactions)
    }
  }, [transactions, setFilteredTransactions])

  const selectAddress = (e: any) => {
    setSelectedAddress(e.target.value === PLACEHOLDER ? undefined : e.target.value)
  }

  useEffect(() => {
    filterByAddress(selectedAddress)
  }, [selectedAddress, transactions, filterByAddress])

  const { pending, rejected, finished } = groupTransactions(filteredTransactions)

  return (
    <ScrollView style={{ flex: 1, height: '100%', width: '100%' }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps='handled'>
      <H3 text='Transaction History' />

      {/* <Row style={{marginLeft: 'auto'}}>
        <label style={{ marginRight: 8 }}>Address:</label>
        <select className='address-selector' value={selectedAddress} onChange={selectAddress}>
          <option>{PLACEHOLDER}</option>
          {accounts.map(({ address, rawAddress }) => (
            <option value={rawAddress} key={address}>
              {displayPubKey(address)}
            </option>
          ))}
        </select>
      </Row> */}

      <Text bold style={{ fontSize: 18, marginTop: 16 }}>Unsigned</Text>
      {Object.keys(unsignedTransactions).length ? (
        Object.values(unsignedTransactions).map((txn: any) => <TransactionShort vertical selectHash={(hash: string) => null} key={txn.hash} txn={txn} />)
      ) : (
        <Text>None</Text>
      )}

      <Text bold style={{ fontSize: 18, marginTop: 16 }}>Pending</Text>
      {pending.length ? (
        pending.map(txn => <TransactionShort vertical selectHash={(hash: string) => null} key={txn.hash} txn={txn} />)
      ) : (
        <Text>None</Text>
      )}

      <Text bold style={{ fontSize: 18, marginTop: 16 }}>Rejected</Text>
      {rejected.length ? (
        rejected.map(txn => <TransactionShort vertical selectHash={(hash: string) => null} key={txn.hash} txn={txn} />)
      ) : (
        <Text>None</Text>
      )}

      <Text bold style={{ fontSize: 18, marginTop: 16 }}>Completed</Text>
      {finished.length ? (
        finished.map(txn => <TransactionShort vertical selectHash={(hash: string) => null} key={txn.hash} txn={txn} />)
      ) : (
        <Text>None</Text>
      )}
    </ScrollView>
  )
}
