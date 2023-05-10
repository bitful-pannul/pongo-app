import { useCallback } from "react"
import * as ImagePicker from "expo-image-picker"
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

import { isIos } from "../constants/Layout"
import { Message } from "../types/Pongo"
import { fetchFileFromUri, getFileExt, getImageExt, uploadFile } from "../util/file-upload"
import usePongoStore from "../state/usePongoState"
import useSettingsState from "../state/useSettingsState"

interface UseMediaProps {
  ship: string
  chatId: string
  reply: Message
  setUploading: (uploading: boolean) => void
  setAudioLength: (length: number) => void
}

export default function useMedia({ ship, chatId, reply, setUploading, setAudioLength } : UseMediaProps) {
  const { sendMessage, setReply } = usePongoStore()
  const { s3Creds, s3Config } = useSettingsState()

  const pickImage = useCallback((useCamera?: boolean) => async () => {
    if (isIos) {
      const permission = await (useCamera ? ImagePicker.requestCameraPermissionsAsync() : ImagePicker.requestMediaLibraryPermissionsAsync()) 
      if (permission.status !== "granted") {
        return
      }
    }

    try {
      const result = await (
        useCamera ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          aspect: [4, 3],
          quality: 1,
        }) : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          aspect: [4, 3],
          quality: 1,
        })
      )

      if (!result.canceled) {
        setUploading(true)
        const imgInfo = result.assets?.[0]
        if (imgInfo) {
          const ext = getImageExt(imgInfo)
          const resizedWidth = imgInfo.width > 900 ? 900 : imgInfo.width

          let imgBlob: Blob = await (
            ext === 'gif' ?
            fetchFileFromUri(imgInfo.uri) :
            manipulateAsync(
              imgInfo.uri,
              [{ resize: { width: resizedWidth }}],
              { compress: 1, format: ext === 'png' ? SaveFormat.PNG : ext === 'webp' ? SaveFormat.WEBP : SaveFormat.JPEG }
            ).then(({ uri }) => fetchFileFromUri(uri))
          )

          const filename = `${chatId.slice(2, 10).replace(/\./g, '')}${Date.now()}.${ext}`

          const uploadUrl = await uploadFile(imgBlob, filename, ext, s3Creds, s3Config)
          console.log('FILE URL:', uploadUrl)
          // I need to somehow push the message in before the image is actually uploaded
          await sendMessage({ self: ship, convo: chatId, kind: 'text', content: uploadUrl, ref: reply?.id })
          setReply(chatId, undefined)
        }
      }
    } catch (e) {
      console.log('UPLOAD ERROR:', e)
    }
    setUploading(false)
  }, [ship, reply, chatId, s3Creds, s3Config])

  const storeAudio = useCallback(async (audioUri: string, audioLength: number) => {
    setAudioLength(audioLength)
    setUploading(true)
    try {
      const imgBlob = await fetchFileFromUri(audioUri)
      const filename = `${ship}${Date.now()}.${getFileExt(audioUri)}` 
      const uploadUrl = await uploadFile(imgBlob, filename, 'm4a', s3Creds, s3Config)
      console.log('FILE URL:', uploadUrl)
      await sendMessage({ self: ship, convo: chatId, kind: 'text', content: uploadUrl, ref: reply?.id })
      setReply(chatId, undefined)
    } catch (e) {
      console.log('UPLOAD ERROR:', e)
    }
    setUploading(false)
    setAudioLength(0)
  }, [ship, reply, chatId, s3Creds, s3Config, setAudioLength, setUploading])

  return { pickImage, storeAudio }
}
