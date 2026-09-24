import type { Env } from '../types/env'
import { AppError } from '../middleware/error-handler'

type B2Auth = { authorizationToken: string; apiInfo: { storageApi: { apiUrl: string; downloadUrl: string } } }
type UploadTarget = { authorizationToken: string; uploadUrl: string }
async function authorize(env: Env): Promise<B2Auth> {
  const response = await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account', {
    headers: { Authorization: `Basic ${btoa(`${env.B2_APPLICATION_KEY_ID}:${env.B2_APPLICATION_KEY}`)}` },
  })
  if (!response.ok) throw new AppError(502,'STORAGE_ERROR','Photo storage authorization failed')
  return await response.json() as B2Auth
}

export async function authorizedDownloadUrl(env:Env,key:string){
 const auth=await authorize(env)
 const response=await fetch(`${auth.apiInfo.storageApi.apiUrl}/b2api/v4/b2_get_download_authorization`,{
  method:'POST',headers:{Authorization:auth.authorizationToken,'Content-Type':'application/json'},
  body:JSON.stringify({bucketId:env.B2_BUCKET_ID,fileNamePrefix:key,validDurationInSeconds:600}),
 })
 if(!response.ok)throw new AppError(502,'STORAGE_ERROR','Photo processing access could not be prepared')
 const result=await response.json() as {authorizationToken:string}
 return `${auth.apiInfo.storageApi.downloadUrl}/file/${env.B2_BUCKET_NAME}/${encodeURIComponent(key)}?Authorization=${encodeURIComponent(result.authorizationToken)}`
}

export async function uploadPhoto(env: Env, key: string, contentType: string, bytes: ArrayBuffer) {
  const auth = await authorize(env)
  const targetResponse = await fetch(`${auth.apiInfo.storageApi.apiUrl}/b2api/v4/b2_get_upload_url`, {
    method: 'POST', headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: env.B2_BUCKET_ID }),
  })
  if (!targetResponse.ok) throw new AppError(502,'STORAGE_ERROR','Photo upload could not be prepared')
  const target = await targetResponse.json() as UploadTarget
  const sha1 = await crypto.subtle.digest('SHA-1',bytes)
  const checksum = [...new Uint8Array(sha1)].map((byte) => byte.toString(16).padStart(2,'0')).join('')
  const response = await fetch(target.uploadUrl, {
    method: 'POST', headers: { Authorization: target.authorizationToken, 'X-Bz-File-Name': encodeURIComponent(key), 'Content-Type': contentType, 'X-Bz-Content-Sha1': checksum }, body: bytes,
  })
  if (!response.ok) throw new AppError(502,'STORAGE_ERROR','Photo upload failed')
  return await response.json() as { fileId: string; fileName: string }
}
export async function deletePhoto(env: Env, key: string, fileId: string) {
  const auth = await authorize(env)
  const response = await fetch(`${auth.apiInfo.storageApi.apiUrl}/b2api/v4/b2_delete_file_version`, {
    method: 'POST', headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: key, fileId }),
  })
  if (!response.ok) throw new AppError(502,'STORAGE_ERROR','Photo deletion failed')
}
export async function downloadPhoto(env: Env, fileId: string): Promise<Response> {
  const auth = await authorize(env)
  const response = await fetch(`${auth.apiInfo.storageApi.downloadUrl}/b2api/v4/b2_download_file_by_id?fileId=${encodeURIComponent(fileId)}`, {
    headers: { Authorization: auth.authorizationToken },
  })
  if (!response.ok) throw new AppError(502,'STORAGE_ERROR','Photo download failed')
  return response
}
