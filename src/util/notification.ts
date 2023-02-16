import { deSig } from '@urbit/api';
import { configureApi } from '@uqbar/react-native-api/configureApi'
import * as Notifications from 'expo-notifications';
import { DM_DIVIDER } from '../constants/Pongo';
import { NotifPayload } from '../types/Pongo';

export const getPushNotificationToken = async () => {
  let token;
  try {
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
