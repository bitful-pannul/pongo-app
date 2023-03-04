import React from 'react'
import { StyleSheet, View as DefaultView } from 'react-native'

import Col from '../spacing/Col'
import Divider from '../spacing/Divider'
import H3 from '../../../components/text/H3'

interface EntryProps {
  divide? : boolean
  title? : string
  center?: boolean
}

const Entry: React.FC<EntryProps & DefaultView['props']> = ({ center, children, title, divide = false, ...rest }) => {
  const styles = StyleSheet.create({
    entry: {
      paddingTop: 8,
      width: '100%',
    },
    header: {
      marginTop: 0,
      marginBottom: 8,
    },
    field: {
      marginLeft: 16,
    }
  })

  return (
    <>
      <Col center={center} style={[styles.entry]}>
        {title && <H3 text={title} />}
        {children}
      </Col>
      { divide && <Divider />}
    </>
  )
}

export default Entry
