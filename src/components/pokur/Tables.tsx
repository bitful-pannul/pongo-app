import React, { useCallback, useMemo, useState } from 'react'
import cn from 'classnames'
import { useWalletStore } from '@uqbar/wallet-ui'
import usePokurStore from '../../store/pokurStore'
import { Table } from '../../types/Table'
import { formatTimeLimit } from '../../utils/format'
import { getGameType } from '../../utils/game'
import Button from '../form/Button'
import Col from '../spacing/Col'
import Row from '../spacing/Row'
import Text from '../text/Text'
import Player from './Player'
import { fromUd, tokenAmount } from '../../utils/number'
import { POKUR_CHAT } from '../../utils/constants'
import CreateTableModal from './CreateTableModal'
import JoinTableModal from './JoinTableModal'

import './Tables.scss'

const TableRow = ({ table, selected, onClick }: { table: Table, selected: boolean, onClick: () => void }) => {
  const { id, leader, game_type, players, max_players, tokenized, turn_time_limit } = table
  const buyIn = tokenized ? (
    game_type.type === 'cash' ? `${tokenAmount(game_type.min_buy)} - ${tokenAmount(game_type.max_buy)} ${tokenized.symbol}` :
    `${tokenAmount(tokenized?.amount)} ${tokenized.symbol}`
  ) : 'none'

  const startingStack = game_type.starting_stack ? game_type.starting_stack : `x${game_type.chips_per_token}`

  const blindDisplay = 'blinds_schedule' in game_type ?
    `${game_type.blinds_schedule[0][0]} / ${game_type.blinds_schedule[0][1]} ${game_type.round_duration}` :
    `${game_type.small_blind} / ${game_type.big_blind}`
  return (
    <tr className={cn('table', selected && 'selected', !table.public && 'private')} onClick={onClick}>
      <td className='field'>{leader}...{id.slice(-4)}</td>
      <td className='field'>{getGameType(game_type.type)}</td>
      <td className='field'>{buyIn}</td>
      <td className='field'>{startingStack}</td>
      <td className='field'>{blindDisplay}</td>
      <td className='field'>{players.length} / {max_players}</td>
      <td className='field'>{formatTimeLimit(turn_time_limit)}</td>
    </tr>
  )
}

interface TablesProps {
  tables: Table[]
}

const Tables = ({ tables }: TablesProps) => {
  const { setJoinTableId, joinTable, setSecondaryLoading, spectateTable } = usePokurStore()
  const { assets, selectedAccount, setMostRecentTransaction, setInsetView } = useWalletStore()
  const [selected, setSelected] = useState<Table | undefined>()
  const [showJoinTableModal, setShowJoinTableModal] = useState(false)
  const [showCreateTableModal, setShowCreateTableModal] = useState(false)
  const [spectate, setSpectate] = useState(false)

  const join = useCallback((t: Table) => async () => {
    setSecondaryLoading('Waiting on transaction confirmation to join table...')
    setMostRecentTransaction(undefined)
    setInsetView('confirm-most-recent')
    setJoinTableId(t.id)
    await joinTable(t.id, '0', t.public)
  }, [joinTable, setMostRecentTransaction, setInsetView, setJoinTableId, setSecondaryLoading])

  const joinAsSpectator = useCallback((t: Table) => async () => {
    setSecondaryLoading('Joining as a spectator...')
    setJoinTableId(t.id)
    await spectateTable(t.id, t.public)
  }, [spectateTable, setJoinTableId, setSecondaryLoading])

  const hasAsset = useMemo(() => Object.keys(assets).reduce((hasAccount, account) => {
    return hasAccount || Object.values(assets[account]).reduce((acc, asset) => {
      return acc || (asset?.data.metadata === selected?.tokenized?.metadata
        && fromUd(asset?.data.balance) >= fromUd(selected?.tokenized?.amount) ? 
        account : '')
    }, '')
  }, ''), [assets, selected])

  const disableJoin = selected && (!hasAsset || hasAsset !== selectedAccount?.rawAddress || selected.players.length >= Number(selected.max_players))

  return (
    <div className='tables'>
      <Col style={{ width: '75%', justifyContent: 'space-between' }}>
        <Col>
          <Row className="activity-buttons">
            {Object.values(assets[selectedAccount?.rawAddress || '0x0'] || {}).length > 0 && (
              <Button variant='dark' onClick={() => setShowCreateTableModal(true)}>
                Create Table
              </Button>
            )}
            <Button variant='dark' onClick={() => setShowJoinTableModal(true)}>
              Join Table
            </Button>
            <Button variant='dark' onClick={() => { setShowJoinTableModal(true); setSpectate(true) } }>
              Spectate Table
            </Button>
          </Row>
          <table className='grid-display'>
            <tbody>
              <tr className='fields'>
                <td className='field'>Game</td>
                <td className='field'>Type</td>
                <td className='field'>Buy-in</td>
                <td className='field'>Stack</td>
                <td className='field'>Blinds</td>
                <td className='field'>Plrs</td>
                <td className='field'>Turn Time</td>
              </tr>
              {tables.map(t => <TableRow key={t.id} table={t} selected={selected?.id === t.id} onClick={() => setSelected(t)} />)}
            </tbody>
          </table>
        </Col>
        {/* <iframe title='Pokur Chat' src={window.location.origin + POKUR_CHAT} className='pokur-chat' /> */}
      </Col>
      <Col className='table-details'>
        {selected && (
          <>
            <h3 style={{ marginBottom: 24 }}>
              {/* Table: {table.id.slice(0, 11)}...{table.id.slice(-4)} */}
              Table: {selected.id}
            </h3>
            {!selected.public && <Row className='invite'>Private invite</Row>}
            <Row className='table-info' style={{ alignItems: 'center' }}>
              <h4>Organizer:</h4>
              <Player ship={selected.leader} />
            </Row>
            <Row className='table-info'>
              <h4>Type:</h4>
              <Text>{getGameType(selected.game_type.type)}</Text>
            </Row>
            <Row className='table-info'>
              <h4>Buy-in:</h4>
              <Text>{selected?.tokenized ? `${tokenAmount(selected?.tokenized?.amount)} ${selected.tokenized.symbol}` : 'none'}</Text>
            </Row>
            {!hasAsset && <Text style={{ color: 'red' }}>You do not have enough assets</Text>}
            {hasAsset && hasAsset !== selectedAccount?.rawAddress &&
              <Text style={{ color: 'darkorange' }}>Change to account starting with {hasAsset.slice(0, 11)}</Text>
            }
            <Row className='table-info'>
              <h4>Starting Stack:</h4>
              <Text>{selected.game_type.starting_stack}</Text>
            </Row>
            {'blinds_schedule' in selected.game_type && <Row className='table-info'>
              <h4>Starting Blinds:</h4>
              <Col style={{ alignItems: 'flex-start' }}>
                <Text style={{ whiteSpace: 'nowrap' }}>
                  {selected.game_type.blinds_schedule[0][0]} / {selected.game_type.blinds_schedule[0][1]}
                </Text>
              </Col>
            </Row>}
            {'round_duration' in selected.game_type && <Row className='table-info'>
              <h4>Blinds Increase:</h4>
              <Text>{formatTimeLimit(selected.game_type.round_duration)}</Text>
            </Row>}
            {'small_blind' in selected.game_type && <Row className='table-info'>
              <h4>Small Blind:</h4>
              <Text>{selected.game_type.small_blind}</Text>
            </Row>}
            {'big_blind' in selected.game_type && <Row className='table-info'>
              <h4>Big Blind:</h4>
              <Text>{selected.game_type.big_blind}</Text>
            </Row>}
            <Row className='table-info'>
              <h4>Turn Time:</h4>
              <Text>{formatTimeLimit(selected.turn_time_limit)}</Text>
            </Row>
            <Row className='table-info'>
              <h4>Spectators:</h4>
              <Text>{selected.spectators_allowed ? 'Yes' : 'No'}</Text>
            </Row>
            <div className='players'>
              <h4 style={{ margin: '4px 0' }}>Players: {selected.players.length}/{selected.max_players}</h4>
              {selected.players.map(ship => <Player key={ship} ship={ship} className='mt-8' />)}
            </div>
            <div className='table-menu'>

            </div>
            <Button disabled={disableJoin}
              variant='dark' style={{ marginTop: 16, alignSelf: 'center' }} onClick={join(selected)}>
              Join
            </Button>
            {selected?.spectators_allowed && (
              <Button disabled={disableJoin}
                variant='dark' style={{ marginTop: 16, alignSelf: 'center' }} onClick={joinAsSpectator(selected)}>
                Spectate
              </Button>
            )}
          </>
        )}
      </Col>
      <CreateTableModal show={showCreateTableModal} hide={() => setShowCreateTableModal(false)} />
      <JoinTableModal show={showJoinTableModal} hide={() => { setShowJoinTableModal(false); setSpectate(false) }} spectate={spectate} />
    </div>
  )
}

export default Tables
