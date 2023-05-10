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
import { Device } from 'mediasoup-client'
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
import { Consumers } from '../../types/WebRTC'
import Col from '../../components/spacing/Col'
import Button from '../../components/form/Button'
import { getChatName } from '../../util/ping'
import H3 from '../../components/text/H3'
import Avatar from '../../components/pongo/Avatar'
import { getShipColor } from '../../util/number'
import UserFeed from '../../components/pongo/Call/UserFeed'
import useNimiState from '../../state/useNimiState'
import useWebRtcState from '../../state/useWebRtcState'

registerGlobals()

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

const serverUrl = __DEV__ && false ? 'http:/localhost:3000' : 'https://webrtc.labwet.art'
const websocketServer = __DEV__ && false ? 'ws:/localhost:3000' : 'wss://webrtc-ws.labwet.art'

const iceServers = [ { urls: 'stun:65.21.6.180:3478' }, {
  urls: 'turn:65.21.6.180:3478?transport=udp',
  username: 'timtime',
  credential: 'blahblah',
}]
const mediaConstraints = { audio: true, video: { frameRate: 30, facingMode: 'user' } }
const postReqOptions = { method: 'POST', headers: { "Content-Type": "application/json" } }

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
  const { sendMessage, chats, incomingCall } = usePongoStore()
  const { consumers, streams, addConsumer, removeConsumer, setConsumers, clearState: clearWebRtcState } = useWebRtcState()
  const { color, backgroundColor, theme } = useColors()
  const headerHeight = useHeaderHeight()
  const { cWidth } = useDimensions()
  const profiles = useNimiState(s => s.profiles)
  const { chatId, answering } = route.params

  const chat = chats[chatId]
  const chatName = getChatName(self, chat, profiles)
  const dmShip = deSig(chat.conversation.dm && chat.conversation.members.find((m) => deSig(m) !== deSig(self)) || '')

  const [micPermissioned, setMicPermissioned] = useState(false)
  const [cameraPermissioned, setCameraPermissioned] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [waiting, setWaiting] = useState(true)
  const [loading, setLoading] = useState(true)
  const [callStarted, setCallStarted] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [counterpartyMuted, setCounterpartyMuted] = useState(false)
  const [counterpartyVideoDisabled, setCounterpartyVideoDisabled] = useState(false)
  const [localStream, setLocalMediaStream] = useState<MediaStream | undefined>(undefined)
  const [displayStream, setDisplayStream] = useState<MediaStream | undefined>(undefined)
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | undefined>(undefined)
  const [cameraCount, setCameraCount] = useState(0)
  const [displayText, setDisplayText] = useState('Initializing...')
  const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined)

  const endCall = useCallback((pc?: RTCPeerConnection) => async () => {
    setCallEnded(true)
    pc?.close()
    localStream?.getTracks().forEach((track: any) => track.stop())
    displayStream?.getTracks().forEach((track: any) => track.stop())
    setPeerConnection(undefined)
    setLocalMediaStream(undefined)
    setDisplayStream(undefined)
    setDisplayText('Call ended')
  }, [localStream, displayStream])

  const hangUp = useCallback(() => {
    console.log(peerConnection)
    endCall(peerConnection)()
    sendMessage({ self, convo: chatId, kind: 'webrtc-call', content: 'end' })
  }, [peerConnection, endCall])

  const startConference = useCallback(async () => {
    // Create a device (use browser auto-detection).
    setLoading(true)
    setCallStarted(true)
    console.log(0)
    const device = new Device();

    // Communicate with our server app to retrieve router RTP capabilities.
    const { routerRtpCapabilities } = await fetch(`http://localhost:3000/capabilities`).then(response => response.json())
    console.log(1, routerRtpCapabilities)

    // Load the device with the router RTP capabilities.
    await device.load({ routerRtpCapabilities });
    console.log(2, chatId)

    // Check whether we can produce video to the router.
    if (!device.canProduce('video')) {
      console.log(2.1)
      return
    }

    const { rtpCapabilities } = device

    const { transport } = await fetch(`http://localhost:3000/rooms`, { ...postReqOptions, body: JSON.stringify({ roomId: chatId }) })
      .then(response => response.json())
    console.log(3, transport)

    // Create the local representation of our server-side transport.
    const sendTransport = device.createSendTransport(transport);
    console.log(4)

    // Set transport "connect" event handler.
    sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      console.log('CONNECT PRODUCER')
      try {
        // Here we must communicate our local parameters to our remote transport.
        const { id } = await fetch(`http://localhost:3000/rooms/${chatId}/transports/${sendTransport.id}/connect`, { ...postReqOptions, body: JSON.stringify({ ship: self, dtlsParameters, rtpCapabilities }) })
          .then(response => response.json())
        // Done in the server, tell our transport.
        callback();
      } catch (error) {
        // Something was wrong in server side.
        console.warn(error);
      }
    });

    // Set transport "produce" event handler.
    sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      console.log('PRODUCE')
      // Here we must communicate our local parameters to our remote transport.
      try {
        const { id } = await fetch(`http://localhost:3000/rooms/${chatId}/transports/${sendTransport.id}/produce`, { ...postReqOptions, body: JSON.stringify({ ship: self, kind, rtpParameters, appData }) })
          .then(response => response.json())
        // Done in the server, pass the response to our transport.
        callback({ id });
      } catch (error) {
        // Something was wrong in server side.
        console.warn(error);
      }
    });

    // Set transport "producedata" event handler.
    sendTransport.on('producedata', async ({ sctpStreamParameters, label, protocol, appData }, callback, errback) => {
        // Here we must communicate our local parameters to our remote transport.
        console.log('PRODUCE DATA')
      try {
        const { id } = await fetch(`http://localhost:3000/rooms/${chatId}/transports/${sendTransport.id}/${self}/producedata`, { ...postReqOptions, body: JSON.stringify({ ship: self, sctpStreamParameters, label, protocol, appData }) })
          .then(response => response.json())

        // Done in the server, pass the response to our transport.
        callback({ id });
      } catch (error) {
        // Something was wrong in server side.
        console.warn(error);
      }
    });

    // Produce our webcam video and audio.
    const localMediaStream = await mediaDevices.getUserMedia(mediaConstraints);
    const devices: any = await mediaDevices.enumerateDevices();
    setCameraCount(devices.reduce((acc: number, device: string) => acc + (device === 'videoinput' ? 1 : 0), 0))
    setCameraPermissioned(true)
    setMicPermissioned(true)

    const webcamTrack = localMediaStream.getVideoTracks()[0];
    const webcamProducer = await sendTransport.produce({ track: webcamTrack});
    const micTrack = localMediaStream.getAudioTracks()[0];
    const micProducer = await sendTransport.produce({ track: micTrack });
    setLocalMediaStream(localMediaStream)
    setLoading(false)

    // Create the local representation of our server-side transport.
    const recvTransport = device.createRecvTransport(transport);

    console.log(5)

    // Set transport "connect" event handler
    recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      // Here we must communicate our local parameters to our remote transport.
      console.log('CONNECT RECEIVER')
      try {
        const { id } = await fetch(`http://localhost:3000/rooms/${chatId}/transports/${recvTransport.id}/connect`, { ...postReqOptions, body: JSON.stringify({ ship: self, dtlsParameters, rtpCapabilities }) })
          .then(response => response.json())
        // Done in the server, tell our transport.
        callback();
      } catch (error) {
        // Something was wrong in server side.
        console.warn(error);
      }
    });

    // get all of the remote consumers, then call transport.consume() on each one
    const { consumers }: { consumers: Consumers } = await fetch(`http://localhost:3000/rooms/${chatId}/peers/${self}/consumers`).then(response => response.json())
    console.log(6, consumers)
    Object.keys(consumers).forEach(async (ship: string) => {
      const { audio, video } = consumers[ship]
      console.log(10, ship)
      if (audio) {
        const consumer = await recvTransport.consume(audio);
        consumers[ship].audio = consumer
      }
      if (video) {
        const { id, kind, rtpParameters, appData } = video
        const consumer = await recvTransport.consume(video);
        consumers[ship].video = consumer
      }
    });

    setConsumers(consumers)

    const websocket = new WebSocket(websocketServer)
    websocket.onopen = () => websocket.send(JSON.stringify({ id: deSig(self) }))
    websocket.onmessage = async (event: WebSocketMessageEvent) => {
      const message = JSON.parse(event.data)
      if (typeof message === 'object') {
        if (message.addConsumer) {
          addConsumer(message.addConsumer.ship, message.addConsumer.kind, message.addConsumer.consumer)
        } else if (message.removeConsumer) {
          removeConsumer(message.removeConsumer.ship)
        }
      }
    }
    websocket.onclose = () => {}
    setWebSocket(websocket)
    setWaiting(false)

    // once everything is connected, set up the page and start the call
    return () => {
      websocket.close()
      localMediaStream?.getVideoTracks().forEach((track: any) => track.stop())
      clearWebRtcState()
    }
  }, [])

  const startDmCall = useCallback(async () => {
    let localMediaStream: any
    let pcRef: RTCPeerConnection | null = null
    let websocketRef: WebSocket | null = null
    setLoading(true)
    setCallStarted(true)
    setCallEnded(false)

    // TODO: check if we have a message of kind "webrtc-call" and content "start" in the last 60 seconds without a corresponding "end"
    console.log(0)
    if (chats[chatId]?.last_message?.id && api) {
      const { message_list } = await api.scry<{ message_list: Message[] }>(
        { app: 'pongo', path: `/messages/${chatId}/${chats[chatId]?.last_message!.id}/60/60` }
      )
      const startIndex = message_list.findIndex(m => m.kind === 'webrtc-call' && m.content === 'request' && deSig(m.author) !== deSig(self) && m.timestamp > ((Date.now() / ONE_SECOND) - 20))
      const endIndex = message_list.findIndex(m => m.kind === 'webrtc-call' && m.content === 'end')

      console.log(1, message_list, startIndex, endIndex)
      if (startIndex === -1) {
        console.log(2)
        // we're gonna start the call
        setDisplayText(`Calling ${addSig(dmShip)}...`)
        sendMessage({ self, convo: chatId, kind: 'webrtc-call', content: 'request' })
      } else if (endIndex === -1 || startIndex < endIndex) {
        console.log(3)
        // we're gonna join the call (send a WEBRTC offer)
        setDisplayText('Connecting...')
        offerRef.current = true
      }
    }

    let remoteMediaStream: MediaStream | undefined
    let isVoiceOnly = false
    
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

    const pc = new RTCPeerConnection({ iceServers })
    pcRef = pc

    const websocket = new WebSocket(websocketServer)

    websocket.onopen = () => websocket.send(JSON.stringify({ id: deSig(self) }))

    websocket.onmessage = async (event: WebSocketMessageEvent) => {
      const message = JSON.parse(event.data)

      if (typeof message === 'object') {
        if (message['webrtc-offer']) {
          setDisplayText('Connecting...')
          await pc.setRemoteDescription(new RTCSessionDescription(message['webrtc-offer']))
          const answerDescription = await pc.createAnswer()
          await pc.setLocalDescription(answerDescription)
          websocket.send(JSON.stringify({ target: deSig(dmShip), content: { 'webrtc-answer': answerDescription } }))

        } else if (message['webrtc-answer']) {
          if (!gotAnswer.current) {
            setDisplayText(addSig(dmShip))
            gotAnswer.current = true
            console.log('SENDING START')
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
      if (pc.connectionState === 'closed') endCall(pc)()
    })
    
    pc.addEventListener('icecandidate', (event: any) => {
      // When you find a null candidate then there are no more candidates.
      if ( !event.candidate ) return
      iceCandidates.push(event.candidate)
    })
    
    pc.addEventListener('icecandidateerror', (event: any) => {
      console.log('ICE CANDIDATE ERROR:', event)
    })

    pc.addEventListener('icegatheringstatechange', (event: any) => {
      // Send all candidates
      if (pc.iceGatheringState === 'complete') {
        const interval = setInterval(() => {
          try {
            iceCandidates.forEach(candidate => websocket.send(JSON.stringify({ target: deSig(dmShip), content: { 'webrtc-candidate': candidate } })))
            clearInterval(interval)
          } catch {}
        }, ONE_SECOND * 0.5)
      }
    })
    
    pc.addEventListener('iceconnectionstatechange', (event: any) => {
      switch( pc.iceConnectionState ) {
        case 'connected':
        case 'completed':
          setDisplayText(addSig(dmShip))
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
              websocket.send(JSON.stringify({ target: deSig(dmShip), content: { 'webrtc-offer': offerDescription } }))
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
      if (pc.signalingState === 'closed') endCall(pc)()
    })

    pc.addEventListener('track', (event: any) => {
      // Grab the remote track from the connected participant.
      remoteMediaStream = remoteMediaStream || (isWeb ? new MediaStream() : new MediaStream(remoteMediaStream)) 
      if (remoteMediaStream) {
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

    return () => {
      pcRef?.close()
      websocketRef?.close()
      localMediaStream?.getVideoTracks().forEach((track: any) => track.stop())
      displayStream?.getVideoTracks()?.forEach((track: any) => track.stop())
      clearInterval(answerInterval.current)
    }
  }, [])

  const startCall = useCallback(() => {
    setCallStarted(true)
    setCallEnded(false)
    setWaiting(true)
    if (chat.conversation.dm) {
      startDmCall()
    } else {
      startConference()
    }
  }, [chat, startConference, startDmCall])

  useEffect(() => () => {
    endCall(peerConnection)()
  }, [])
    
  useEffect(() => {
    const end = endCall(peerConnection)

    if (answering && !incomingCall) {
      if (chat.conversation.dm) {
        const call = startDmCall()
        return () => {
          call.then(callback => callback && callback())
          end()
        }
      } else {
        const call = startConference()
        return () => {
          call.then(callback => callback && callback())
          end()
        }
      }
    } else {
      setLoading(false)
    }
  }, [answering, incomingCall])

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
                setCallEnded(true)
                peerConnection?.close()
                localStream?.getTracks().forEach((track: any) => track.stop())
                displayStream?.getTracks().forEach((track: any) => track.stop())
                Toast.show('Call ended', { ...defaultOptions, position: Toast.positions.CENTER })
              } else if (message.content === 'start') {
                console.log('GOT START')
                setDisplayText(addSig(dmShip))
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

  const goBack = useCallback(() => navigation.goBack(), [navigation])

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoText: { fontSize: 18, marginTop: 32 },
    videoContainer: { height: '90%', width: cWidth, marginTop: 16, marginBottom: 'auto' },
    counterpartyVideoDisabled: { height: '90%', width: cWidth, marginTop: 16, marginBottom: 'auto', backgroundColor: 'black' },
    video: { flex: 1, width: '100%', height: '100%' },
    cameraInset: { height: 120, width: 120, position: 'absolute', top: 0, right: 0 },
    videoInset: { height: 120, width: 120 },
    callButtons: { width: '100%', position: 'absolute', bottom: 0, left: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    counterpartyMuted: { position: 'absolute', top: 16, left: 16, backgroundColor: 'white', padding: 12, height: 48, width: 48, borderRadius: 24 },
    shipLabelContainer: { position: 'absolute', top: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center' },
    shipLabel: { padding: 8, paddingHorizontal: 12, borderBottomRightRadius: 8, borderBottomLeftRadius: 8 },
    shipLabelText: { fontSize: 16, fontWeight: '600' },
  }), [cWidth])

  // console.log('CONSUMERS:', consumers)

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
      ) : !callStarted || callEnded ? (
        <Col style={styles.container}>
          {chat.conversation.dm && (
            <Avatar ship={dmShip} size='quarter-screen' color={getShipColor(dmShip, theme)} />
          )}
          <H3 style={{ marginVertical: 16 }} text={chatName} />
          {callEnded && <Text style={{ marginBottom: 16, fontSize: 16 }}>Call ended</Text>}
          {!callEnded && <Button style={{ marginBottom: 16 }} title={callEnded ? 'Call Again' : 'Start Call'} onPress={startCall} />}
          <Button title='Go Back' onPress={goBack} />
        </Col>
      ) : !micPermissioned || !cameraPermissioned ? (
        <View style={styles.container}>
          <Text>Please enable camera and microphone in your Settings to continue.</Text>
        </View>
      ) : waiting ? (
        <View style={styles.container}>
          <Text style={styles.infoText}>{displayText}</Text>
          <View style={styles.videoContainer}>
            {isWeb ? (
              <RTCView mirror objectFit={'contain'} stream={localStream} zOrder={0} style={styles.video} />
            ) : (
              <RTCView mirror objectFit={'contain'} streamURL={(localStream as any)?.toURL()} zOrder={0} style={styles.video} />
            )}
            <DefaultView style={styles.callButtons}>
              <CallButtons {...{ micEnabled, cameraEnabled, changeCamera, toggleMic, toggleCamera, endCall: hangUp, showChangeCamera: cameraCount > 1, callEnded }} />
            </DefaultView>
          </View>
        </View>
      ) : chat.conversation.dm && displayStream !== null ? (
        <View style={styles.container}>
          <Text style={styles.infoText}>{displayText}</Text>
          <View style={styles.videoContainer}>
            {counterpartyVideoDisabled ? (
              <DefaultView style={styles.counterpartyVideoDisabled} />
            ) : isWeb ? (
              <RTCView objectFit={'contain'} stream={displayStream} zOrder={0} style={styles.video} />
            ) : (
              <RTCView objectFit={'contain'} streamURL={(displayStream as any)?.toURL()} zOrder={0} style={styles.video} />
            )}
            <DefaultView style={styles.callButtons}>
              <CallButtons {...{ micEnabled, cameraEnabled, changeCamera, toggleMic, toggleCamera, endCall: hangUp, showChangeCamera: cameraCount > 1, callEnded }} />
            </DefaultView>
            {counterpartyMuted && <DefaultView style={styles.counterpartyMuted}>
              <Ionicons name='mic-off' color='black' size={24} />
            </DefaultView>}
          </View>
          <DefaultView style={styles.cameraInset}>
            {isWeb ? (
              <RTCView mirror objectFit={'contain'} stream={localStream} zOrder={0} style={styles.videoInset} />
            ) : (
              <RTCView mirror objectFit={'contain'} streamURL={(localStream as any)?.toURL()} zOrder={0} style={styles.videoInset} />
            )}
          </DefaultView>
        </View>
      ) : !chat.conversation.dm ? (
        <View style={styles.container}>
          <Text style={styles.infoText}>{displayText}</Text>
          {!Object.keys(streams).length ? (
            Object.keys(streams).map((ship) => <UserFeed ship={ship} feed={streams[ship]} />)
          ) : (
            <Text>Waiting for other participants to join...</Text>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <Text>There was an error with the call, please go back and try again.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
