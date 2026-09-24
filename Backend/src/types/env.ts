export type Env = CloudflareBindings & {
  JWT_SECRET: string
  B2_BUCKET_NAME: string
  B2_APPLICATION_KEY_ID: string
  B2_APPLICATION_KEY: string
  FACE_SERVICE_URL: string
  FACE_SERVICE_TOKEN: string
  FACE_CALLBACK_TOKEN: string
}
