# Frontend API contract

All routes are prefixed with `/api`. Successful responses use `{ "data": ... }`; failures use `{ "error": { "code", "message" } }`. Dates in request and response bodies are ISO 8601 strings. D1 timestamps are Unix milliseconds. Browser requests that use a session must include credentials so the HTTP-only `suffer_session` cookie is sent.

## Lobby and trip

`POST /trips` creates a waiting trip, organizer player, quest pools and final quest candidates, and sets the organizer session cookie.

```json
{
  "name": "Weekend away",
  "organizerName": "Alex",
  "startDate": "2026-10-25",
  "finalQuestTrigger": "2026-10-27T15:30:00.000Z",
  "expectedPlayerCount": 6,
  "pools": [{
    "track": "individual",
    "order": 1,
    "triggerTime": "2026-10-25T08:00:00.000Z",
    "assignmentMode": "per-player",
    "candidates": [{
      "title": "Reach the viewpoint",
      "description": "Go to the marked viewpoint.",
      "type": "LBQ",
      "targetCoords": { "lat": 26.888, "lng": 87.31, "radiusMeters": 100 },
      "timerDurationSeconds": null
    }]
  }],
  "finalQuestCandidates": [
    { "title": "Final 1", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 2", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 3", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 4", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 5", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 6", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 7", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 8", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 9", "description": "Candidate description.", "type": "VBQ" },
    { "title": "Final 10", "description": "Candidate description.", "type": "VBQ" }
  ]
}
```

`finalQuestCandidates` must contain 10–15 candidates. Each candidate has the same title, description, type, optional `targetCoords`, and optional `timerDurationSeconds` fields as a pool candidate. Pools must have at least one candidate. `expectedPlayerCount` includes the organizer and is the hard lobby capacity. Pool `order` is sequential within each track.

Creation returns `{ trip, player, joinCode }` and sets the organizer cookie. Join with `POST /trips/:sixCharacterCode/join` and `{ "name": "Sam" }`. Joining at capacity or after start returns `TRIP_FULL` or `TRIP_ALREADY_STARTED`. Joining again with the same name (case insensitive) restores that player's cookie and identity. The name and code together are the player identity.

`POST /trips/:tripId/start` requires the organizer session and a full lobby. It changes status from `waiting` to `active` and permanently locks joining. `GET /trips/current` returns camelCase trip fields; `GET /trips/participants` returns the roster.

## Quests and rules

`GET /users/me/next-quest?track=individual|group` returns `null` until the trip is active or the next pool is unlocked. Otherwise it returns `{ theme, assignment }`. A theme has `id`, `tripId`, `track`, `order`, `triggerTime`, `type`, and `title`; the assignment includes the chosen variant's title, description, target coordinates, timer, status, and ISO timestamps. Individual variants are assigned without reuse until a pool is exhausted; group pools have one shared variant and assignment.

Use `POST /assignments/:assignmentId/start` to start a TBQ timer. Use `POST /assignments/:assignmentId/complete` with `{ "latitude": ..., "longitude": ... }` for LBQ GPS verification or `{}` for a started TBQ. VBQ uses `POST /assignments/:assignmentId/votes` with `{ "approve": true|false }`; the owner cannot vote, and a majority of the other roster members must approve. Group VBQs use `POST /group-themes/:themeId/votes`; a majority of the full roster must approve. A failed TBQ applies two minutes to its owner; a failed shared TBQ applies two minutes to every roster member.

Final quest candidates can also be set with organizer-only `POST /trips/:tripId/final-quest/candidates` and `{ "candidates": [...] }` when they were not included at creation. `GET /trips/:tripId/final-quest` unlocks when the scheduled time has passed and every regular quest is complete. Assignment is per player; that player's penalties delay their start. `POST /final-quest/complete` records completion. A tie for latest completion marks all tied players punished once everyone has finished.

## Reports

File with `POST /trips/current/reports` and `{ "reportedUserId": "uuid", "reason": "..." }`. The filer and reported player cannot vote. Approvals are cast with `POST /reports/:reportId/approve`. Resolution requires `floor(eligible roster / 2) + 1` approvals, where eligible players exclude both the filer and target; resolution adds five minutes to the target. `GET /trips/current/reports` returns the report list and approval counts.

## Existing services

Authentication login/logout/me and the gallery/photo routes retain their existing contracts. Face service callbacks and gallery storage are documented in [face-service-contract.md](face-service-contract.md).
