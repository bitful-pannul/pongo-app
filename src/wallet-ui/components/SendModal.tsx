import React, { useCallback, useEffect, useState } from 'react'
import SendTransactionForm, { BLANK_FORM_VALUES, SendFormField, SendFormType } from './form/SendTransactionForm'
import Modal, { ModalProps } from './popups/Modal'
import { useWalletStore } from '../store/walletStore'
import { window } from '../../constants/Layout'
 
// .send-view .assets {
//   font-family: monospace monospace;
// }
// .send-view .form-container {
//   width: 100%;
//   max-width: 400px;
// }
// .send-view .form-container .form-selector {
//   background-color: rgba(0, 0, 0, 0.03);
//   width: fit-content;
// }
// .send-view .form-container .form-selector .selector {
//   background: white;
// }
// .send-view .form-container .form-selector .selector span {
//   border-top-left-radius: 4px;
//   border-top-right-radius: 4px;
//   padding: 6px 16px;
//   cursor: pointer;
// }
// .send-view .form-container .form-selector .selector .inactive {
//   background-color: rgba(0, 0, 0, 0.03);
// }
// .send-view .form-container .form-selector .selector .active {
//   background-color: rgba(0, 0, 0, 0.1);
// }


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

  const setFormValue = useCallback((key: SendFormField, value: string) => {
    const newValues = { ...formValues }
    newValues[key] = value
    setFormValues(newValues)
  }, [formValues, setFormValues])

  const hideModal = useCallback(() => {
    hide();
    setFormValues(BLANK_FORM_VALUES)
  }, [hide, setFormValues])

  const { width } = window

  return (
    <Modal title={title} show={show} hide={hideModal} style={{ width: width * 0.8, paddingLeft: 12 }}>
      <SendTransactionForm {...{ id, nftIndex, formType, from, formValues, setFormValue, setFormValues, onDone: hide, onSubmit }} />
    </Modal>
  )
}

export default SendModal
