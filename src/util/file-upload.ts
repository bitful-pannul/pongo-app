import AWS from 'aws-sdk'

import { ACCESS_KEY, BUCKET_NAME, SECRET_KEY } from '../s3-creds'
import { S3Config, S3Creds } from '../state/useSettingsState'

export const uploadFile = async (blob: Blob, filename: string, s3Creds?: S3Creds, s3Config?: S3Config) => {
  const s3 = new AWS.S3({
    accessKeyId: s3Creds?.credentials.accessKeyId || ACCESS_KEY,
    secretAccessKey: s3Creds?.credentials.secretAccessKey || SECRET_KEY,
  })

  const uploadedImage = await s3.upload({
    Bucket: s3Config?.configuration.currentBucket || BUCKET_NAME,
    Key: filename,
    Body: blob,
    ACL: 'public-read'
  }).promise()

  return uploadedImage.Location
}

export const fetchFileFromUri = async (uri: string) => {
  const response = await fetch(uri)
  const blob = await response.blob()
  return blob
}

export const getFileExt = (filename?: string | null) => !filename ? '' : filename.substring(filename.lastIndexOf('.')+1, filename.length)
