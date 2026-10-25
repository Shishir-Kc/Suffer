# Suffer backend

One Hono API on Cloudflare Workers serves Suffer trips, quests, reports, and the shared vacation gallery. D1 stores trip, quest, auth, embedding, photo metadata, and tag records. Private photos live in Backblaze B2. A separately deployed Python model service runs on your VPS and communicates with the Worker over HTTPS. The frontend remains on demo data; the API contract is documented in [docs/api-contract.md](docs/api-contract.md).

## Local setup

1. Run `bun install`.
2. Put local secrets in ignored `.dev.vars`: `JWT_SECRET`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `FACE_SERVICE_URL`, `FACE_SERVICE_TOKEN`, and `FACE_CALLBACK_TOKEN`.
3. Set non-secret values in `wrangler.jsonc`: `B2_BUCKET_ID`, `B2_BUCKET_NAME`, `FACE_SERVICE_URL`, `FACE_CALLBACK_URL`, and `FRONTEND_ORIGIN`. The callback URL must be reachable from the VPS. For local development, expose the local Worker through a tunnel; expose the VPS through Cloudflare Tunnel if it has no public HTTPS ingress.
4. Create a private B2 bucket and a bucket-scoped application key with `readFiles`, `writeFiles`, `deleteFiles`, and `shareFiles` capabilities. Set the bucket name and ID in Wrangler vars.
5. Apply the schema using `bun run db:migrate:local`.
6. Start the Worker with `bun run dev`.

For production, create a D1 database and replace its placeholder ID in `wrangler.jsonc`. Set `JWT_SECRET`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `FACE_SERVICE_TOKEN`, and `FACE_CALLBACK_TOKEN` with `bunx wrangler secret put NAME` (once per secret, replacing `NAME`). Set the non-secret vars and your actual service, callback, and frontend URLs in Wrangler config. The VPS must be able to make HTTPS requests to the deployed callback URL. Apply migrations using `bun run db:migrate:remote`, then run `bun run deploy`. Never commit `.dev.vars`, account passwords, API tokens, or face embeddings.

## Legacy seeded trips

The seed script remains available for development of the original fixed-account flows. New trips should use `POST /api/trips`; it creates the organizer and lobby directly. For legacy account setup, prepare an ignored `seed-input.json` with four distinct usernames and passwords:

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

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Sessions use a four-day HTTP-only JWT cookie. Trip creation and joining also issue that cookie.
- Lobby: `POST /api/trips`, `POST /api/trips/:code/join`, `POST /api/trips/:tripId/start`, `GET /api/trips/current`, `GET /api/trips/participants`. Capacity includes the organizer; only a full lobby can start; starting locks the roster.
- Quests: `GET /api/users/me/next-quest?track=individual|group`, timer start/completion, server-verified location completion, VBQ votes, and Final Quest routes. Individual variants are assigned without reuse until a pool is exhausted; group quests use a shared assignment. Vote majorities and penalties use the current trip roster. Final Quest waits for its scheduled time and all regular quests, then applies personal penalty delays. A tie for last marks every tied participant as punished.
- Reports: `POST /api/trips/current/reports`, `POST /api/reports/:id/approve`, `GET /api/trips/current/reports`. The filer and target are excluded; approval requires a majority of the remaining eligible roster and applies the five-minute penalty.
- Gallery: `POST /api/photos/enrollment`, `GET /api/photos/enrollment`, `POST /api/photos`, `GET /api/photos`, `GET /api/photos?userId=...`, `GET /api/photos/:id/content`, `DELETE /api/photos/:id`, and `GET /api/photos/events` (SSE).
- Face service contract: [docs/face-service-contract.md](docs/face-service-contract.md).

Success responses are `{ "data": ... }`; errors are `{ "error": { "code", "message" } }`. The browser must capture images, persist offline uploads in IndexedDB, enforce the enrollment gate in the app flow, and refetch the gallery on SSE reconnect.

Migrations are ordered SQL files in `migrations/`. Application timestamps use Unix milliseconds. The original starter migration's defaults use SQLite seconds; the seed script explicitly writes milliseconds for new rows.
