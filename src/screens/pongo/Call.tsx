import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, StyleSheet, View as DefaultView } from 'react-native'
import Toast from 'react-native-root-toast'
import { Audio } from 'expo-av'
import {
  ScreenCapturePickerView,
	RTCPeerConnection,
	RTCIceCandidate,
	RTCSessionDescription,
	RTCView,
	MediaStream,
	MediaStreamTrack,
	mediaDevices,
	registerGlobals
// } from 'react-native-webrtc-web-shim'
} from 'react-native-webrtc'
import { NavigationProp, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useHeaderHeight } from '@react-navigation/elements'

import { PongoStackParamList } from '../../types/Navigation'
import { Text, View } from '../../components/Themed'
import { isWeb, keyboardAvoidBehavior, keyboardOffset } from '../../constants/Layout'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import useStore from '../../state/useStore'
import { addSig, deSig } from '../../util/string'
import { defaultOptions } from '../../util/toast'
import { Urbit } from '@uqbar/react-native-api'
import { Message, Update } from '../../types/Pongo'
import { ONE_SECOND } from '../../util/time'
import { ActivityIndicator } from 'react-native'
import CallButtons from '../../components/pongo/Call/CallButtons'
import useDimensions from '../../hooks/useDimensions'

const offerOptions: any = isWeb ? {
  OfferToReceiveAudio: true,
  OfferToReceiveVideo: true,
} : {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true,
    VoiceActivityDetection: true
  }
}

const websocketServer = 'wss://webrtc-ws.labwet.art'

interface CallScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Call'>
}

export default function CallScreen({ navigation, route }: CallScreenProps) {
  const offerRef = useRef(false)
  const answerInterval = useRef<NodeJS.Timer>()
  const gotAnswer = useRef(false)
  const remoteCandidates = useRef<RTCIceCandidate[]>([])
  const { ship: self, api } = useStore()
  const { sendMessage, chats } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const headerHeight = useHeaderHeight()
  const { cWidth } = useDimensions()
  const { ship, chatId } = route.params
  
  const [micPermissioned, setMicPermissioned] = useState(false)
  const [cameraPermissioned, setCameraPermissioned] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [waiting, setWaiting] = useState(true)
  const [loading, setLoading] = useState(true)
  const [callEnded, setCallEnded] = useState(false)
  const [counterpartyMuted, setCounterpartyMuted] = useState(false)
  const [counterpartyVideoDisabled, setCounterpartyVideoDisabled] = useState(false)
  const [localStream, setLocalMediaStream] = useState<MediaStream | null>(null)
  const [displayStream, setDisplayStream] = useState<MediaStream | null>(null)
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null)
  const [cameraCount, setCameraCount] = useState(0)
  const [displayText, setDisplayText] = useState('Initializing...')
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    let localMediaStream: any
    let pcRef: RTCPeerConnection | null = null
    let websocketRef: WebSocket | null = null

    const connectWebRTC = async () => {
      // TODO: check if we have a message of kind "webrtc-call" and content "start" in the last 60 seconds without a corresponding "end"
      // if so, set offerRef.current to true
      if (chats[chatId]?.last_message?.id && api) {
        const { message_list } = await api.scry<{ message_list: Message[] }>(
          { app: 'pongo', path: `/messages/${chatId}/${chats[chatId]?.last_message!.id}/60/0` }
        )
        const startIndex = message_list.findIndex(m => m.kind === 'webrtc-call' && m.content === 'request' && deSig(m.author) !== deSig(self) && m.timestamp > ((Date.now() / ONE_SECOND) - 20))
        const endIndex = message_list.findIndex(m => m.kind === 'webrtc-call' && m.content === 'end')

        if (startIndex === -1) {
          // we're gonna start the call
          setDisplayText(`Calling ${addSig(ship)}...`)
          sendMessage({ self, convo: chatId, kind: 'webrtc-call', content: 'request' })
        } else if (endIndex === -1 || startIndex < endIndex) {
          // we're gonna join the call (send a WEBRTC offer)
          setDisplayText('Connecting...')
          offerRef.current = true
        }
      }

      let remoteMediaStream: MediaStream | undefined
      let isVoiceOnly = false
      const mediaConstraints = { audio: true, video: { frameRate: 30, facingMode: 'user' } }
      
      try {
        const mediaStream = await mediaDevices.getUserMedia(mediaConstraints)
      
        if (isVoiceOnly) {
          let videoTrack = await mediaStream.getVideoTracks()[0]
          videoTrack.enabled = false
        }
      
        localMediaStream = mediaStream
        setCameraPermissioned(true)
        setMicPermissioned(true)

        const devices: any = await mediaDevices.enumerateDevices();
        setCameraCount(devices.reduce((acc: number, device: string) => acc + (device === 'videoinput' ? 1 : 0), 0))
      } catch( err ) {
        // Handle Error
        setCameraPermissioned(false)
        setMicPermissioned(false)

        // TODO: show and Alert.alert that says "You must enable camera and microphone permissions to use this feature."
        return () => {}
      } finally {
        setLoading(false)
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:65.21.6.180:3478' },
          {
            urls: 'turn:65.21.6.180:3478?transport=udp',
            username: 'timtime',
            credential: 'blahblah',
          },
        ],
      })
      pcRef = pc

      const websocket = new WebSocket(websocketServer)

      websocket.onopen = () => {
        websocket.send(JSON.stringify({ id: deSig(self) }))
      }

      websocket.onmessage = async (event: WebSocketMessageEvent) => {
        const message = JSON.parse(event.data)

        if (typeof message === 'object') {
          if (message['webrtc-offer']) {
            setDisplayText('Connecting...')
            await pc.setRemoteDescription(new RTCSessionDescription(message['webrtc-offer']))
            const answerDescription = await pc.createAnswer()
            await pc.setLocalDescription(answerDescription)
            websocket.send(JSON.stringify({ target: deSig(ship), content: { 'webrtc-answer': answerDescription } }))

          } else if (message['webrtc-answer']) {
            if (!gotAnswer.current) {
              setDisplayText(addSig(ship))
              gotAnswer.current = true
              sendMessage({ self, convo: chatId, kind: 'webrtc-call', content: 'start' })
              await pc.setRemoteDescription(new RTCSessionDescription(message['webrtc-answer']))

              if (remoteCandidates.current.length > 0) {
                remoteCandidates.current.forEach(candidate => pc.addIceCandidate(candidate))
                remoteCandidates.current = []
              }
            }
          } else if (message['webrtc-candidate']) {
            const iceCandidate = new RTCIceCandidate(message['webrtc-candidate'])
    
            if (pc.remoteDescription === null) {
              remoteCandidates.current.push(iceCandidate)
            } else {
              pc.addIceCandidate(iceCandidate)
            }
          } else if (message['webrtc-mute'] !== undefined) {
            setCounterpartyMuted(message['webrtc-mute'])
          } else if (message['webrtc-video-disabled'] !== undefined) {
            setCounterpartyVideoDisabled(message['webrtc-video-disabled'])
          }
        }
      }
      websocket.onclose = () => {}
      setWebSocket(websocket)

      const iceCandidates = [] as RTCIceCandidate[]
      
      pc.addEventListener('connectionstatechange', (event: any) => {
        switch( pc.connectionState ) {
          case 'closed':
            setCallEnded(true)
            pc.close()
            setDisplayText('Call ended')
            navigation.goBack()
            break
        }
      })
      
      pc.addEventListener('icecandidate', (event: any) => {
        // When you find a null candidate then there are no more candidates.
        if ( !event.candidate ) return
        iceCandidates.push(event.candidate)
      })
      
      pc.addEventListener('icecandidateerror', (event: any) => {
        console.log('ICE CANDIDATE ERROR:', event)
        // You can ignore some candidate errors, connections can still be made even when errors occur.
      })

      pc.addEventListener('icegatheringstatechange', (event: any) => {
        // Send all candidates
        if (pc.iceGatheringState === 'complete') {
          const interval = setInterval(() => {
            try {
              iceCandidates.forEach(candidate => websocket.send(JSON.stringify({ target: deSig(ship), content: { 'webrtc-candidate': candidate } })))
              clearInterval(interval)
            } catch {}
          }, ONE_SECOND * 0.5)
        }
      })
      
      pc.addEventListener('iceconnectionstatechange', (event: any) => {
        switch( pc.iceConnectionState ) {
          case 'connected':
          case 'completed':
            setDisplayText(addSig(ship))
            setWaiting(false)
            break
        }
      })
      
      pc.addEventListener('negotiationneeded', async (event: any) => {
        if (offerRef.current) {
          try {
            const offerDescription = await pc.createOffer(offerOptions)
            await pc.setLocalDescription(offerDescription)
            const interval = setInterval(() => {
              try {
                websocket.send(JSON.stringify({ target: deSig(ship), content: { 'webrtc-offer': offerDescription } }))
                clearInterval(interval)
              } catch {}
            }, ONE_SECOND * 0.5)
          } catch( err ) {
            console.warn('ERROR CREATING OFFER:', err)
          }
        }

        offerRef.current = false
      })
      
      pc.addEventListener('signalingstatechange', (event: any) => {
        switch( pc.signalingState ) {
          case 'closed':
            setCallEnded(true)
            pc.close()
            localMediaStream?.getVideoTracks().forEach((track: any) => track.stop())
            remoteMediaStream?.getVideoTracks().forEach((track: any) => track.stop())
            navigation.goBack()
            break
        }
      })

      pc.addEventListener('track', (event: any) => {
        // Grab the remote track from the connected participant.
        remoteMediaStream = remoteMediaStream || (isWeb ? new MediaStream() : new MediaStream(remoteMediaStream)) 
        if (remoteMediaStream) {
          console.log(event.track)
          remoteMediaStream.addTrack(event.track)
          setDisplayStream(remoteMediaStream)
        }
      })

      // Add our stream to the peer connection.
      localMediaStream.getTracks().forEach((track: any) => {
        pc.addTrack(track, localMediaStream)
      })
      setLocalMediaStream(localMediaStream)

      setPeerConnection(pc)
    }

    connectWebRTC()

    return () => {
      pcRef?.close()
      websocketRef?.close()
      localMediaStream?.getVideoTracks().forEach((track: any) => track.stop())
      displayStream?.getVideoTracks()?.forEach((track: any) => track.stop())
      clearInterval(answerInterval.current)
    }
  }, [])

  useEffect(() => {
    const subscribeToMessages = async (api: Urbit) => {
      const messageSubscription = await api.subscribe({
        app: 'pongo',
        path: '/updates',
        event: async (update: Update) => {
          if (peerConnection && 'message' in update && update.message.conversation_id === chatId && deSig(update.message.message.author) !== deSig(self)) {
            const { message } = update.message

            if (message.kind === 'webrtc-call') {
              if (message.content === 'request') {
                const offerDescription = await peerConnection.createOffer(offerOptions)
                await peerConnection.setLocalDescription(offerDescription)
                webSocket?.send(JSON.stringify({ target: deSig(ship), content: { 'webrtc-offer': offerDescription } }))
              } else if (message.content === 'end') {
                console.log('GOT END')
                setCallEnded(true)
                peerConnection?.close()
                localStream?.getTracks().forEach((track: any) => track.stop())
                displayStream?.getTracks().forEach((track: any) => track.stop())
                Toast.show('Call ended', { ...defaultOptions, position: Toast.positions.CENTER })
                navigation.goBack()
              } else if (message.content === 'start') {
                console.log('GOT START')
                setDisplayText(addSig(ship))
                clearInterval(answerInterval.current)
                // Audio.Sound.createAsync(require('../../../assets/sounds/beep-07a.mp3'))
                //   .then(({ sound }) => {
                //     sound.playAsync()
                //     setTimeout(() => sound.unloadAsync(), ONE_SECOND)
                //   })
              }
            }
          }
        }
      })

      return messageSubscription
    }

    if (api && peerConnection) {
      const promise = subscribeToMessages(api)
      return () => {
        promise.then((subscription) => api.unsubscribe(subscription))
      }
    }
  }, [api, peerConnection, displayStream, localStream, webSocket])

  const endCall = useCallback(async () => {
    if (peerConnection) {
      sendMessage({ self, convo: chatId, kind: 'webrtc-call', content: 'end' })
      setCallEnded(true)
      peerConnection.close()
      localStream?.getTracks().forEach((track: any) => track.stop())
      displayStream?.getTracks().forEach((track: any) => track.stop())
      navigation.goBack()
    }
  }, [peerConnection])

  const toggleMic = useCallback(async () => {
    try {
      const audioTrack = await localStream?.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        webSocket?.send(JSON.stringify({ target: deSig(ship), content: { 'webrtc-mute': micEnabled } }))
        setMicEnabled(!micEnabled)
      }
    } catch (err) {
      console.warn('ERROR TOGGLING MIC:', err)
    }
  }, [localStream, micEnabled, webSocket, setMicEnabled, sendMessage])

  const toggleCamera = useCallback(async () => {
    try {
      const videoTrack = await localStream?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        webSocket?.send(JSON.stringify({ target: deSig(ship), content: { 'webrtc-video-disabled': cameraEnabled } }))
        setCameraEnabled(!cameraEnabled)
      }
    } catch (err) {
      console.warn('ERROR TOGGLING MIC:', err)
    }
  }, [localStream, cameraEnabled, setCameraEnabled])

  const changeCamera = useCallback(async () => {
    if (cameraCount > 1) {
      try {
        const videoTrack = await localStream?.getVideoTracks()[0];
        if (videoTrack) {
          (videoTrack as any)._switchCamera()
        }
      } catch (err) {
        console.warn('ERROR TOGGLING MIC:', err)
      }
    }
  }, [localStream, cameraCount])

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoText: { fontSize: 18, marginTop: 32 },
    videoContainer: { height: '80%', width: cWidth, marginTop: 16, marginBottom: 'auto' },
    counterpartyVideoDisabled: { height: '80%', width: cWidth, marginTop: 16, marginBottom: 'auto', backgroundColor: 'black' },
    video: { flex: 1, width: '100%', height: '100%' },
    cameraInset: { height: 120, width: 120, position: 'absolute', top: 0, right: 0 },
    videoInset: { height: 120, width: 120 },
    callButtons: { width: '100%', position: 'absolute', bottom: 0, left: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    counterpartyMuted: { position: 'absolute', top: 16, left: 16, backgroundColor: 'white', padding: 12, height: 48, width: 48, borderRadius: 24 },
    shipLabelContainer: { position: 'absolute', top: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center' },
    shipLabel: { padding: 8, paddingHorizontal: 12, borderBottomRightRadius: 8, borderBottomLeftRadius: 8 },
    shipLabelText: { fontSize: 16, fontWeight: '600' },
  }), [cWidth])

  return (
    <KeyboardAvoidingView
      style={{ height: '100%', width: '100%', backgroundColor }}
      behavior={keyboardAvoidBehavior}
      keyboardVerticalOffset={keyboardOffset + headerHeight}
    >
      {loading ? (
        <View style={styles.container}>
          <ActivityIndicator size='large' color={color} />
        </View>
      ) : !micPermissioned || !cameraPermissioned ? (
        <View style={styles.container}>
          <Text>Please enable camera and microphone in your Settings to continue.</Text>
        </View>
      ) : waiting ? (
        <View style={styles.container}>
          <Text style={styles.infoText}>{displayText}</Text>
          <View style={styles.videoContainer}>
            {isWeb ? (
              <RTCView objectFit={'contain'} stream={localStream} zOrder={0} style={styles.video} />
            ) : (
              <RTCView objectFit={'contain'} streamURL={(localStream as any)?.toURL()} zOrder={0} style={styles.video} />
            )}
            <DefaultView style={styles.callButtons}>
              <CallButtons {...{ micEnabled, cameraEnabled, changeCamera, toggleMic, toggleCamera, endCall, showChangeCamera: cameraCount > 1, callEnded }} />
            </DefaultView>
          </View>
        </View>
      ) : displayStream !== null ? (
        <View style={styles.container}>
          <Text style={styles.infoText}>{displayText}</Text>
          <View style={styles.videoContainer}>
            {/* <DefaultView style={styles.shipLabelContainer}>
              <View style={styles.shipLabel}>
                <Text style={styles.shipLabelText}>{addSig(ship)}</Text>
              </View>
            </DefaultView> */}
            {counterpartyVideoDisabled ? (
              <DefaultView style={styles.counterpartyVideoDisabled} />
            ) : isWeb ? (
              <RTCView objectFit={'contain'} stream={displayStream} zOrder={0} style={styles.video} />
            ) : (
              <RTCView objectFit={'contain'} streamURL={(displayStream as any)?.toURL()} zOrder={0} style={styles.video} />
            )}
            <DefaultView style={styles.callButtons}>
              <CallButtons {...{ micEnabled, cameraEnabled, changeCamera, toggleMic, toggleCamera, endCall, showChangeCamera: cameraCount > 1, callEnded }} />
            </DefaultView>
            {counterpartyMuted && <DefaultView style={styles.counterpartyMuted}>
              <Ionicons name='mic-off' color='black' size={24} />
            </DefaultView>}
          </View>
          <DefaultView style={styles.cameraInset}>
            {isWeb ? (
              <RTCView objectFit={'contain'} stream={localStream} zOrder={0} style={styles.videoInset} />
            ) : (
              <RTCView objectFit={'contain'} streamURL={(localStream as any)?.toURL()} zOrder={0} style={styles.videoInset} />
            )}
          </DefaultView>
        </View>
      ) : (
        <View style={styles.container}>
          <Text>There was an error with the call, please go back and try again.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
