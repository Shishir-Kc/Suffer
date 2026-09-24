# Suffer backend

One Hono API on Cloudflare Workers serves the four-person Suffer trip and its shared vacation gallery. D1 stores trip, quest, auth, embedding, photo metadata, and tag records. Private photos live in Backblaze B2. A separately deployed Python model service runs on your VPS and communicates with the Worker over HTTPS. The frontend is outside this repository.

## Local setup

1. Run `bun install`.
2. Put local secrets in ignored `.dev.vars`: `JWT_SECRET`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `FACE_SERVICE_URL`, `FACE_SERVICE_TOKEN`, and `FACE_CALLBACK_TOKEN`.
3. Set non-secret values in `wrangler.jsonc`: `B2_BUCKET_ID`, `B2_BUCKET_NAME`, `FACE_SERVICE_URL`, `FACE_CALLBACK_URL`, and `FRONTEND_ORIGIN`. The callback URL must be reachable from the VPS. For local development, expose the local Worker through a tunnel; expose the VPS through Cloudflare Tunnel if it has no public HTTPS ingress.
4. Create a private B2 bucket and a bucket-scoped application key with `readFiles`, `writeFiles`, `deleteFiles`, and `shareFiles` capabilities. Set the bucket name and ID in Wrangler vars.
5. Apply the schema using `bun run db:migrate:local`, then seed the fixed group as described below.
6. Start the Worker with `bun run dev`.

For production, create a D1 database and replace its placeholder ID in `wrangler.jsonc`. Set `JWT_SECRET`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `FACE_SERVICE_TOKEN`, and `FACE_CALLBACK_TOKEN` with `bunx wrangler secret put NAME` (once per secret, replacing `NAME`). Set the non-secret vars and your actual service, callback, and frontend URLs in Wrangler config. The VPS must be able to make HTTPS requests to the deployed callback URL. Apply migrations using `bun run db:migrate:remote`, then run `bun run deploy`. Never commit `.dev.vars`, account passwords, API tokens, or face embeddings.

## Seed the four accounts

There is no signup or password reset endpoint. Prepare an ignored `seed-input.json` with this shape, using four distinct usernames and passwords:

```json
{
  "name": "Trip name",
  "finalQuestTrigger": 1790000000000,
  "users": [
    { "username": "friend1", "password": "..." },
    { "username": "friend2", "password": "..." },
    { "username": "friend3", "password": "..." },
    { "username": "friend4", "password": "..." }
  ]
}
```

`finalQuestTrigger` is Unix milliseconds. Generate SQL with `bun scripts/seed-group.mjs < seed-input.json > seed-group.sql`, then apply it with `bunx wrangler d1 execute suffer-db --local --file=seed-group.sql` or use `--remote`. The first account is the organizer. The seed is a sequence of D1 SQL statements; if a statement fails, remove the partial trip/users before retrying. Deliver passwords privately and remove the local input/SQL files after applying them.

## Backend API

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Sessions use a four-day HTTP-only JWT cookie.
- Trip/users: `GET /api/trips/current`, `GET /api/trips/participants`, `GET /api/users/me`, `GET /api/users`.
- Quests: organizer creates themes/variants; participants fetch `GET /api/users/me/next-quest?track=individual|group`, complete location/timing quests, and cast VBQ votes. A failed shared Group TBQ gives each of the four members the two-minute penalty. Group themes have one shared variant and one shared completion. The Final Quest waits for the scheduled time and all four participants' individual quests plus all shared group quests. If completion is late, its shared base time is the later of the schedule and the last regular quest completion; personal penalties add delay. A tie for last marks every tied participant as punished.
- Reports: `POST /api/trips/current/reports`, `POST /api/reports/:id/approve`, `GET /api/trips/current/reports`. Filing counts as the first approval; the other two non-target group members can approve. Three approvals (the filer plus two other non-target members) apply the five-minute penalty.
- Gallery: `POST /api/photos/enrollment`, `GET /api/photos/enrollment`, `POST /api/photos`, `GET /api/photos`, `GET /api/photos?userId=...`, `GET /api/photos/:id/content`, `DELETE /api/photos/:id`, and `GET /api/photos/events` (SSE).
- Face service contract: [docs/face-service-contract.md](docs/face-service-contract.md).

Success responses are `{ "data": ... }`; errors are `{ "error": { "code", "message" } }`. The browser must capture images, persist offline uploads in IndexedDB, enforce the enrollment gate in the app flow, and refetch the gallery on SSE reconnect.

Migrations are ordered SQL files in `migrations/`. Application timestamps use Unix milliseconds. The original starter migration's defaults use SQLite seconds; the seed script explicitly writes milliseconds for new rows.
