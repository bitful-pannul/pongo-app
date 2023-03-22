import React, { useCallback, useEffect, useState } from 'react'
import SendTransactionForm, { BLANK_FORM_VALUES, SendFormField, SendFormType } from './form/SendTransactionForm'
import Modal, { ModalProps } from './popups/Modal'
import { useWalletStore } from '../store/walletStore'
import useDimensions from '../../hooks/useDimensions'
import useColors from '../../hooks/useColors'
 
interface SendModalProps extends ModalProps {
  id?: string
  from?: string
  nftIndex?: number
  formType?: SendFormType
  show: boolean
  title: string
  unsignedTransactionHash?: string
  onSubmit?: () => void
  hide: () => void
}

const SendModal = ({
  id = '',
  from = '',
  nftIndex,
  show,
  formType,
  title,
  onSubmit,
  hide,
}: SendModalProps) => {
  const { mostRecentTransaction: txn } = useWalletStore()
  const [formValues, setFormValues] = useState(BLANK_FORM_VALUES)
  const { cWidth } = useDimensions()
  const { color, backgroundColor, shadedBackground } = useColors()

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
    <Modal title={title} show={show} hide={hideModal} style={{ width: cWidth * 0.8, paddingLeft: 12 }} {...{ color, backgroundColor, shadedBackground }}>
      <SendTransactionForm {...{ id, nftIndex, formType, from, formValues, setFormValue, setFormValues, onDone: hide, onSubmit, color }} />
    </Modal>
  )
}

export default SendModal
