import AWS from 'aws-sdk'
import * as ImagePicker from "expo-image-picker"

import { ACCESS_KEY, BUCKET_NAME, SECRET_KEY } from '../s3-creds'
import { S3Config, S3Creds } from '../state/useSettingsState'

export const uploadFile = async (blob: Blob, filename: string, ext: string, s3Creds?: S3Creds, s3Config?: S3Config) => {
  const s3 = new AWS.S3({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  })

  const uploadedImage = await s3.upload({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: blob,
    ContentType: `image/${ext}`,
    // ContentDisposition: `inline; filename=${filename}`,
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

export const getImageExt = (imgInfo: ImagePicker.ImagePickerAsset) => {
  const fn = imgInfo.fileName
  if (fn) {
    return fn.substring(fn.lastIndexOf('.')+1, fn.length) || 'jpeg'
  } else if (/^data:image\//.test(imgInfo.uri)) {
    return imgInfo.uri.match(/^data:image\/.+?;/)?.[0].slice(11, -1) || 'jpeg'
  }

  return 'jpeg'
}

// import AWS from 'aws-sdk'

// import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { URL } from 'react-native-url-polyfill';

// import { ACCESS_KEY, BUCKET_NAME, SECRET_KEY, ENDPOINT, REGION } from '../s3-creds'
// import { S3Config, S3Creds } from '../state/useSettingsState'

// export function prefixEndpoint(endpoint: string) {
//   return endpoint.match(/https?:\/\//) ? endpoint : `https://${endpoint}`;
// }

// export const uploadFile = async (blob: Blob, filename: string, s3Creds?: S3Creds, s3Config?: S3Config) => {

//   const defaultCredentials = {
//     accessKeyId: ACCESS_KEY,
//     endpoint: ENDPOINT,
//     secretAccessKey: SECRET_KEY,
//   }

//   const defaultConfiguration = {
//     buckets: [BUCKET_NAME],
//     currentBucket: BUCKET_NAME,
//     region: REGION,
//   }

//   const credentials = s3Creds?.credentials || defaultCredentials
//   const configuration = s3Config?.configuration || defaultConfiguration

//   console.log(1, credentials.endpoint)
//   const endpoint = new URL(prefixEndpoint(credentials.endpoint))
//   console.log(2, endpoint)

//   const client = new S3Client({
//     endpoint: {
//       protocol: endpoint.protocol.slice(0, -1),
//       hostname: endpoint.host,
//       path: endpoint.pathname || '/',
//     },
//     // us-east-1 is necessary for compatibility with other S3 providers (i.e., filebase)
//     region: s3Config?.configuration.region || 'us-east-1',
//     credentials: s3Creds?.credentials || defaultCredentials,
//     forcePathStyle: true,
//   });

//   const command = new PutObjectCommand({
//     Bucket: configuration.currentBucket,
//     Key: filename,
//     Body: blob,
//     // ContentType: file.type,
//     // ContentLength: file.size,
//     ACL: 'public-read',
//   });

//   const url = await getSignedUrl(client, command)

//   console.log('HERE', url)

//   await client.send(command)
//     .then(() => {
//       const fileUrl = url.split('?')[0];
//       imageSize(fileUrl).then((s) =>
//         updateFile(uploader, key, {
//           size: s,
//           url: fileUrl,
//         })
//       );
//     })
//     .catch((error: any) => {
//       updateStatus(
//         uploader,
//         key,
//         'error',
//         `S3 upload error: ${error.message}, check your S3 configuration.`
//       );
//       console.log({ error });
//     });


//   return url
// }

// export const fetchFileFromUri = async (uri: string) => {
//   const response = await fetch(uri)
//   const blob = await response.blob()
//   return blob
// }

// export const getFileExt = (filename?: string | null) => !filename ? '' : filename.substring(filename.lastIndexOf('.')+1, filename.length)

