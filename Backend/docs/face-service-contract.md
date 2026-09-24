# Private face service contract

The Worker calls this HTTPS service with `Authorization: Bearer <FACE_SERVICE_TOKEN>`. Configure the URL as `FACE_SERVICE_URL`; the Worker callback URL is configured independently as `FACE_CALLBACK_URL`. Configure `FACE_CALLBACK_TOKEN` with the same value on the service. Do not log image bodies, reference vectors, or either token.

## Enroll one account

`POST /v1/enroll` receives the selfie as the raw request body, with its image MIME type in `Content-Type`. The service must run the pretrained detector/embedding model without retaining the image, reject zero or multiple faces, and return:

```json
{ "faceCount": 1, "embedding": [0.01, -0.02] }
```

The embedding array represents the single reference vector. The Worker stores only that vector. Non-1 face counts are returned to the user as a retryable enrollment error.

## Process a gallery photo

`POST /v1/jobs` receives JSON containing `jobId`, `imageUrl` (a 10-minute, single-file B2 download URL), `contentType`, `references` (`userId` and `embedding` pairs), `callbackUrl`, and `callbackToken`. Return 2xx once accepted. Repeated submissions of the same `jobId` must be idempotent. Download the image using the supplied URL before its expiry; process it in memory and do not persist it. Process faces with the pretrained model, compare embeddings to the supplied references using cosine similarity, silently omit unmatched faces, and POST a result to `callbackUrl`:

```http
Authorization: Bearer <callbackToken>
Content-Type: application/json
```

```json
{ "jobId": "<UUID>", "status": "complete", "matchedUserIds": ["<UUID>"] }
```

On an inference failure, call back with `{ "jobId": "<UUID>", "status": "failed" }`. The Worker resubmits up to three total attempts. Duplicate callbacks are safe; completion is idempotent. Do not retain submitted images or embeddings after processing. Return an error status for a job that could not be accepted so the Worker can retry.
