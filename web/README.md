# Suffer

Suffer is a mobile-first trip game for a six-person crew travelling from Itahari to Bhedetar and Namje. Quests unlock one at a time across independent individual and group tracks, with offline-first progress, GPS verification, friend voting, timed quests, penalties, and a synchronized final race.

## What is here

- Next.js App Router frontend with thin route pages and reusable components under `components/`.
- Claymorphism design system in `styles/globals.css` and `styles/clay.css`.
- IndexedDB helpers in `lib/offlineStore.ts`, GPS/Haversine logic in `lib/gps.ts`, unlock rules in `lib/questEngine.ts`, and offline sync helpers in `lib/syncManager.ts`.
- MapLibre GL JS wrapper with a trip-area map shell, 3D pitch, day/night styles, trail treatment, and tile-cache progress UI.
- FastAPI backend in `backend/` with matching Pydantic models, trip/player/quest/sync/admin/final-quest routes, and a local in-memory hotspot repository ready to swap for PostgreSQL.

## Run the frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000/join](http://localhost:3000/join). Demo data in `lib/demoData.ts` lets every route be explored without a backend connection.

## Run the backend

Python 3.11+ is recommended.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Health check: [http://localhost:8000/health](http://localhost:8000/health).

## Seed a quest JSON file

The organizer flow accepts a JSON upload in `/create`. For the API, post an array matching `types/index.ts` to `/api/quests/seed`:

```bash
curl -X POST http://localhost:8000/api/quests/seed \
  -H 'content-type: application/json' \
  --data @path/to/quests.json
```

The backend validates the four-hour minimum trigger gap per track. Quest JSON should include ISO timestamps, a `targetCoords` object for LBQs, `timerDurationSeconds` for TBQs, and at least ten final candidates for a real trip.

## Offline trip preparation

1. Load the trip and quest configuration while connected to WiFi.
2. Seed quest data into IndexedDB with `seedQuestData` before leaving.
3. Open `/map` on each phone and let the tile-cache progress finish.
4. Connect to the organizer hotspot when voting, syncing positions, or starting the final quest.
5. Add the real PMTiles bundle at `public/tiles/trip-area.pmtiles` before launch. The included map wrapper is intentionally network-independent and can be pointed at the PMTiles source when the bundle is available.

## Deploy

### Vercel

Import the repository into Vercel with this folder as the project root:

- Build command: `npm run build`
- Output: `.next`
- Node.js: 20+

Set `NEXT_PUBLIC_API_URL` to the Railway backend URL when connecting the frontend to the API.

### Railway

Create a Railway service for the backend with this folder as its root directory:

```bash
pip install -r backend/requirements.txt && uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Set `DATABASE_URL` to the Railway PostgreSQL connection string when replacing the local in-memory repository with the production database adapter. Add the deployed API origin to the FastAPI CORS list before launch.

## Checks

```bash
npm run lint
npm run build
python3 -m compileall backend
```

