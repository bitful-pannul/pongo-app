import { NavigationProp, RouteProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import DropDownPicker from 'react-native-dropdown-picker'

import { PongoStackParamList } from '../../types/Navigation'
import Col from '../../components/spacing/Col'
import H2 from '../../components/text/H2'
import H3 from '../../components/text/H3'
import { Text, View, ScrollView, TextInput } from '../../components/Themed'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import useStore from '../../state/useStore'
import { NotifLevel } from '../../types/Pongo'
import { getPushNotificationToken } from '../../util/notification'
import { isIos, isWeb } from '../../constants/Layout'

interface SettingsScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Settings'>
}

export default function SettingsScreen({ navigation, route }: SettingsScreenProps) {
  const { ship: self, shipUrl } = useStore()
  const { set, notifLevel, setNotifications } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [notificationLevel, setNotificationLevel] = useState(notifLevel)

  useEffect(() => {
    getPushNotificationToken().then(token => setNotificationsEnabled(Boolean(token)))
  }, [])

  useEffect(() => {
    if (notifLevel !== notificationLevel) {
      setNotifications({ shipUrl, level: notificationLevel })
    }
  }, [notifLevel, notificationLevel])

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'Show message contents', value: 'low' },
    { label: 'Show group name', value: 'medium' },
    { label: 'Display locally', value: 'high' }
  ]);

  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Col style={{ width: '100%', alignItems: 'center', paddingVertical: 24 }}>
        <H2 text='Settings' />
        <Col style={{ marginTop: 16, width: '100%', alignItems: 'center' }}>
          {notificationsEnabled ? (
            <>
              <H3 text='Notification Level:' style={{ marginBottom: 16 }} />
              <DropDownPicker
                style={{ width: '80%', marginHorizontal: '10%' }}
                open={open}
                value={notificationLevel}
                items={items}
                setOpen={setOpen}
                setValue={setNotificationLevel}
                setItems={setItems}
              />
            </>
          ) : (
            <>
              <H3 text='Notfications Disabled' style={{ marginBottom: 8 }} />
              {isWeb ? (
                <Text>Notifications are not enabled in web</Text>
              ) : (
                <Text>Please go to Settings {'>'} Notifications {'>'} Pongo to turn on notifications</Text>
              )}
            </>
          )}
        </Col>
      </Col>
    </View>
  )
}
