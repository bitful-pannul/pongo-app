import { deSig } from '@urbit/api';
import { configureApi } from '@uqbar/react-native-api/configureApi'
import * as Notifications from 'expo-notifications';
import { DM_DIVIDER } from '../constants/Pongo';
import { NotifPayload } from '../types/Pongo';
import { isWeb } from '../constants/Layout';
import { Platform } from 'react-native';

export const getPushNotificationToken = async () => {
  let token;

  if (!isWeb) {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          // vibrationPattern: [0, 250, 250, 250],
          // lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
    
      if (existingStatus !== 'denied') {
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: true,
            },
          });
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } catch (err) {
      console.warn('Must use physical device for Push Notifications');
    }
  }

  return token;
}

export interface NotificationInfo { notification: {convo_name: string; author: string; content: string} }

export const showNotification = async (payload: NotifPayload) => {
  const { ship, ship_url, conversation_id, message_id } = payload
  const api = configureApi(ship, ship_url)
  const { notification: { convo_name, author, content } } =
    await api.scry<NotificationInfo>({ app: 'pongo', path: `/notification/${conversation_id}/${message_id}` })

  const dmName = convo_name.split(DM_DIVIDER)
  const isDm = Boolean(dmName.find(n => deSig(n) === deSig(author)))
  const title = isDm ? author : convo_name
  const body = isDm ? content.slice(0, 100) : `~${author}: ${content.slice(0, 90)}`

  Notifications.scheduleNotificationAsync({
    identifier: `${conversation_id}-${message_id}`,
    content: {
      title,
      body,
      data: payload as any,
      badge: 1,
      priority: Notifications.AndroidNotificationPriority.MAX
    },
    trigger: null,
  })
}

export const getNotificationData = (notification?: Notifications.Notification): NotifPayload => {
  console.log('NOTIFICATION:', notification?.request?.content?.data)
  const ship = notification?.request?.content?.data?.ship as string;
  const ship_url = notification?.request?.content?.data?.ship_url as string;
  const conversation_id = notification?.request?.content?.data?.conversation_id as string;
  const message_id = notification?.request?.content?.data?.message_id as (string | undefined);
  return { ship, ship_url, conversation_id, message_id };
}

export const showWebNotification = async (message: string) => {
  if (isWeb && window.Notification) {
    if (Notification.permission === 'granted') {
      new Notification(message)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          new Notification(message)
        }
      })
    }
  }
}
