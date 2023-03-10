import { useCallback, useState } from "react"
import * as ImagePicker from "expo-image-picker"
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator'

import { isIos, window } from "../constants/Layout"
import { Message } from "../types/Pongo"
import { fetchFileFromUri, getFileExt, uploadFile } from "../util/file-upload"
import usePongoStore from "../state/usePongoState"

interface UseMediaProps {
  ship: string
  chatId: string
  reply: Message
  setUploading: (uploading: boolean) => void
}

export default function useMedia({ ship, chatId, reply, setUploading } : UseMediaProps) {
  const { sendMessage, setReply } = usePongoStore()

  const { width } = window

  const pickImage = useCallback(async () => {
    if (isIos) {
      const cameraRollStatus = await ImagePicker.requestMediaLibraryPermissionsAsync()
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync()
      if (cameraRollStatus.status !== "granted" || cameraStatus.status !== "granted") {
        return
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        setUploading(true)
        const imgInfo = result.assets?.[0]
        if (imgInfo) {
          const ext = getFileExt(imgInfo.fileName)
          const resizedWidth = imgInfo.width > 400 ? 400 : imgInfo.width

          const manipResult = await manipulateAsync(
            imgInfo.uri,
            [{ resize: { width: resizedWidth }}],
            { compress: 1, format: ext === 'png' ? SaveFormat.PNG : SaveFormat.JPEG }
          )

          const imgBlob = await fetchFileFromUri(manipResult.uri)
          const filename = `${chatId.slice(2, 10).replace(/\./g, '')}${Date.now()}.${ext || 'jpg'}` 
          const uploadUrl = await uploadFile(imgBlob, filename)
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
  }, [ship, reply, chatId])

  const storeAudio = useCallback(async (audioUri: string) => {
    setUploading(true)
    try {
      const imgBlob = await fetchFileFromUri(audioUri)
      const filename = `${chatId.slice(2, 10).replace(/\./g, '')}${Date.now()}.${getFileExt(audioUri)}` 
      const uploadUrl = await uploadFile(imgBlob, filename)
      console.log('FILE URL:', uploadUrl)
      await sendMessage({ self: ship, convo: chatId, kind: 'text', content: uploadUrl, ref: reply?.id })
      setReply(chatId, undefined)
    } catch (e) {
      console.log('UPLOAD ERROR:', e)
    }
    setUploading(false)
  }, [ship, reply, chatId])

  return { pickImage, storeAudio }
}
