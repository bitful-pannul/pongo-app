import React, { useCallback, useEffect, useState } from 'react'
import Button from './Button'
import Loader from '../popups/Loader'
import Col from '../spacing/Col'
import Row from '../spacing/Row'
import Text from '../text/Text'
import { abbreviateHex } from '../../utils/format'
import CopyIcon from '../text/CopyIcon';
import { getStatus } from '../../utils/constants'
import SendTransactionForm, { BLANK_FORM_VALUES, SendFormField, SendFormType } from './SendTransactionForm'
import Modal, { ModalProps } from '../popups/Modal'
import { useWalletStore } from '../../store/walletStore'
import { watchTabClose } from '../../utils/nav'
import CustomLink from '../nav/Link'
 
import './SendTransactionModal.css'

interface SendTransactionModalProps extends ModalProps {
  id?: string
  from?: string
  nftIndex?: number
  formType?: SendFormType
  show: boolean
  title: string
  unsignedTransactionHash: string
  hide: () => void
  onSubmit: () => void
}

const SendTransactionModal = ({
  id = '',
  from = '',
  nftIndex,
  show,
  formType,
  title,
  unsignedTransactionHash,
  hide,
  onSubmit,
}: SendTransactionModalProps) => {
  const { mostRecentTransaction: txn } = useWalletStore()
  const [formValues, setFormValues] = useState(BLANK_FORM_VALUES)

  useEffect(() => {
    if (show) watchTabClose()
  }, [show])

  const setFormValue = useCallback((key: SendFormField, value: string) => {
    const newValues = { ...formValues }
    newValues[key] = value
    setFormValues(newValues)
  }, [formValues, setFormValues])

  const hideModal = useCallback(() => {
    hide();
    setFormValues(BLANK_FORM_VALUES)
  }, [hide, setFormValues])

  return (
    <Modal 
      title={title}
      show={show} 
      hide={hideModal}
      style={{ width: '40%', minWidth: 350 }}
    >
      <SendTransactionForm
        {...{ id, nftIndex, formType, from, formValues, setFormValue, setFormValues, onSubmit, unsignedTransactionHash, onDone: hide }}
      />
    </Modal>
  )
}

export default SendTransactionModal
