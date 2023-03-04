import AWS from 'aws-sdk'
import { ACCESS_KEY, BUCKET_NAME, SECRET_KEY } from '../s3-creds'

const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
})

export const uploadFile = async (blob: Blob, filename: string) => {
  const uploadedImage = await s3.upload({
    Bucket: BUCKET_NAME,
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
