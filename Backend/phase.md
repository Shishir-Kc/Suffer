# Suffer Backend - Implementation Plan (Phase Document)

## Session Summary

This document captures the complete implementation plan for the **Suffer** backend API, a location-based, quest-driven group travel app that gamifies trips with progressive quest unlocking, penalties, and a final quest punishment system.

---

## Tech Stack (Fixed)

- **Runtime/Package Manager**: Bun
- **Framework**: Hono
- **Language**: TypeScript (strict mode)
- **Deployment**: Cloudflare Workers (`wrangler.jsonc` present)
- **Database**: Cloudflare D1 (SQLite) - raw prepared statements only, NO ORM
- **Migrations**: Plain `.sql` files under `migrations/`, run via `wrangler d1 execute`

---

## Current Project State

### Existing Files
```
src/
  index.ts              # Minimal Hono app (Hello World)
  app.ts                # Empty
  types/env.ts          # Basic Env type with DB binding
  db/client.ts          # Simple getDB() accessor
  db/schema.ts          # Empty
  middleware/
    error-handler.ts    # Basic error handler
    auth.ts             # Empty
  modules/
    trips/              # Empty types.ts, service.ts, routes.ts
    users/              # Empty types.ts, service.ts, routes.ts
    quests/             # Empty types.ts, service.ts, routes.ts
    penalties/          # Missing entirely
    reports/            # Empty types.ts, service.ts, routes.ts
migrations/
  0001_init_sql         # Only trips + users (missing final_quest_trigger)
package.json            # hono + wrangler only
tsconfig.json           # Strict mode configured
wrangler.jsonc          # No D1 binding configured
bun.lock                # Present
```

### Missing
- Complete database schema (9 tables per spec)
- All business logic in service layers
- Auth system (JWT + HTTP-only cookies)
- Validation (zod)
- Haversine distance calculation
- Testable random selection helper
- Constants file (no magic numbers)
- Route wiring in app.ts
- Penalties module (shared service)

---

## Domain Specification (Core Rules)

### Quest Tracks
- Two independent tracks per participant: **Individual** and **Group**
- Quests unlock progressively (never all at once)
- **Unlock Condition (AND)**: Previous quest in same track complete **AND** trigger point reached
- Tracks unlock independently
- Non-final quests: no completion timer, can be done anytime once unlocked

### Trigger Points
- Scheduled earliest-unlock time per quest
- **Minimum 4-hour gap** between trigger points in same track - validate at creation

### Quest Types
| Type | Verification |
|------|--------------|
| **LBQ** (Location-Based) | Haversine distance vs target coordinates |
| **VBQ** (Voting-Based) | Majority vote from other participants |
| **TBQ** (Timing-Based) | Countdown from unlock; failure → Penalty (+2 min) |

### Quest Assignment Model (Theme + Randomized Variant Pool)
- **Theme**: Ordered slot in track (same for all participants)
- **Variant**: Concrete task within theme (differs per participant)
- **Assignment Logic**:
  1. When theme unlocks for participant → find unassigned variants in pool
  2. Pick randomly from unassigned variants
  3. If pool exhausted → pick from full pool (duplicates allowed only after exhaustion)
  4. Assignment is permanent (no reroll)

### Final Quest
- Exactly one per trip
- Organizer pre-selects 10-15 candidates of equal difficulty
- Each participant randomly assigned ONE from pool
- At scheduled time, stopwatch starts for all simultaneously (stored timestamps)
- Latest completion → **Punishment** (sponsors food/drinks)

### Punishment vs Penalty (Distinct Systems)
| System | Trigger | Effect |
|--------|---------|--------|
| **Punishment** | Last to finish Final Quest | Sponsors group food/drinks (flag only) |
| **Penalty** | Failed TBQ (+2 min) OR Report 4 approvals (+5 min) | Stackable delay added to Final Quest start |

- Penalties accumulate per participant
- Actual Final Quest start = base trigger + SUM(penalty minutes)
- Penalty creation logic in **ONE shared place** (`penalties/service.ts`)

### Reporting System
- Any participant can report another (bribing, sabotage, unfair VBQ, etc.)
- Others approve; track approvers to prevent duplicates
- At **exactly 4 approvals** → resolves → triggers penalty via shared service

---

## Auth Strategy (Confirmed)

- **Username + password login** (pre-seeded credentials, mailed manually)
- **JWT issued on login**, stored in **HTTP-only cookie**
- **Session**: 4 days expiry, no refresh token flow
- **Multi-device**: Allowed (stateless JWTs)
- **Library**: `jose` (Edge-compatible)
- **Password hashing**: Web Crypto `subtle.digest` with PBKDF2

---

## Database Schema (Per Spec - Split into 5 Migrations)

### Migration Files (Ordered)

| File | Tables | Notes |
|------|--------|-------|
| `0001_trips_users.sql` | `trips`, `users` | Add `final_quest_trigger` to trips; add `password_hash` to users |
| `0002_quest_themes.sql` | `quest_themes`, `quest_variants` | Theme sequence + variant pools |
| `0003_quest_assignments.sql` | `quest_assignments`, `votes` | Per-participant assignments + VBQ voting |
| `0004_final_quest.sql` | `final_quest_candidates`, `final_quest_assignments` | Final quest pool + per-user assignment |
| `0005_reports_penalties.sql` | `reports`, `report_approvals`, `penalties` | Reporting + penalty system |

### Key Schema Decisions
- All IDs: `TEXT PRIMARY KEY` (UUIDs/ULIDs generated in service)
- Timestamps: `INTEGER` unix **milliseconds**
- `quest_themes.trigger_point`: enforce 4h gap via application validation
- `quest_assignments.status`: `'unlocked' | 'in_progress' | 'completed' | 'failed'`
- `votes.approve`: `INTEGER` 0/1
- Unique constraints prevent duplicate assignments/votes/approvals

---

## Implementation Plan (Phased)

### Phase 1: Configuration & Migrations

#### 1.1 `wrangler.jsonc` - Add D1 Binding
```jsonc
{
  "d1_databases": [
    { "binding": "DB", "database_name": "suffer-db", "database_id": "" }
  ]
}
```
Run `wrangler d1 create suffer-db` to get database_id, then update.

#### 1.2 Create 5 Migration Files (per table above)

---

### Phase 2: Core Infrastructure

| File | Purpose |
|------|---------|
| `src/types/env.ts` | Add `JWT_SECRET`, `COOKIE_NAME` |
| `src/db/client.ts` | Keep simple typed accessor |
| `src/lib/constants.ts` | **No magic numbers** (all constants here) |
| `src/lib/haversine.ts` | Pure function: `haversineDistance(lat1, lng1, lat2, lng2): number` (meters) |
| `src/lib/random.ts` | **Testable randomness**: `pickRandom<T>()`, `pickUnassignedVariant()` - accepts `Random` fn param for testing |
| `src/middleware/error-handler.ts` | Custom error classes (`AppError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ConflictError`) + structured envelope `{ data }` / `{ error: { code, message } }` |
| `src/middleware/auth.ts` | JWT in HTTP-only cookie: login, logout, me, auth middleware |
| `src/app.ts` | Hono instance, global middleware, mount all routes |
| `src/index.ts` | Thin entrypoint: `import app from './app'; export default app;` |

#### Constants (`src/lib/constants.ts`)
```typescript
export const TRIGGER_GAP_HOURS = 4;
export const TRIGGER_GAP_MS = TRIGGER_GAP_HOURS * 60 * 60 * 1000;
export const TBQ_PENALTY_MINUTES = 2;
export const REPORT_PENALTY_MINUTES = 5;
export const REPORT_APPROVAL_THRESHOLD = 4;
export const FINAL_QUEST_CANDIDATE_MIN = 10;
export const FINAL_QUEST_CANDIDATE_MAX = 15;
export const JWT_EXPIRY_DAYS = 4;
export const COOKIE_NAME = "suffer_session";
```

---

### Phase 3: Modules (Dependency Order)

#### 3.1 `modules/trips` - Trip Lifecycle
**Types**: `Trip`, `CreateTripInput`, `JoinTripInput`, `TripWithParticipants`
**Service**:
- `createTrip(name, finalQuestTrigger, organizerId)` → trip + organizer user
- `getTrip(tripId)` → trip with participants
- `joinTrip(tripId, userId, name)` → add participant
- `listParticipants(tripId)`
- `validateTriggerGaps(themes)` → throws if < 4h gap in same track
**Routes**:
- `POST /api/trips`
- `GET /api/trips/:id`
- `POST /api/trips/:id/join`
- `GET /api/trips/:id/participants`

#### 3.2 `modules/users` - Participant Identity
**Types**: `User`, `UserInTrip`
**Service**:
- `createUser(tripId, name, isOrganizer?)`
- `getUser(userId)`
- `getUsersByTrip(tripId)`
- `getUserByCredentials(username, password)` - for login
**Routes**:
- `POST /api/trips/:tripId/users`
- `GET /api/trips/:tripId/users/:userId`

#### 3.3 `modules/penalties` - **Shared Service (Built First)**
**Types**: `Penalty`, `PenaltySource` (`'tbq_failure' | 'report'`)
**Service**:
- `applyPenalty(tripId, userId, minutes, source, sourceId)`
- `getUserPenalties(tripId, userId)`
- `getTotalPenaltyMinutes(tripId, userId)` → SUM(minutes)
- `clearUserPenalties(tripId, userId)` (testing only)
**Routes** (internal/admin):
- `POST /api/penalties`
- `GET /api/users/:userId/penalties`
- `GET /api/users/:userId/penalties/total`

#### 3.4 `modules/quests` - **Most Complex Module**
**Types**: `QuestTheme`, `QuestVariant`, `QuestAssignment`, `QuestType`, `QuestTrack`
**Service - Theme/Variant CRUD**:
- `createTheme(tripId, track, sequenceOrder, triggerPoint, type, title)`
- `addVariant(themeId, description, targetLat?, targetLng?, timerSeconds?)`
- `listThemesByTrack(tripId, track)`

**Service - Unlock Logic (Core)**:
```typescript
async function getNextUnlockedTheme(tripId, userId, track): Promise<QuestTheme | null> {
  // 1. Get all themes in track ordered by sequence_order
  // 2. For each theme, check if user has assignment
  // 3. Find first where: (prev theme completed OR is first) AND trigger_point <= now
  // 4. If found and no assignment exists → create assignment (pick variant)
}
```

**Service - Variant Assignment (Core)**:
```typescript
async function assignVariant(themeId, userId): Promise<QuestAssignment> {
  // 1. Get all variants for theme
  // 2. Get variant_ids already assigned to other users in this trip for this theme
  // 3. Filter to unassigned variants
  // 4. If empty, use full pool (duplicates allowed only after exhaustion)
  // 5. Pick random from filtered pool (using lib/random.ts)
  // 6. Insert quest_assignments row with status='unlocked', started_at=now
  // 7. Return assignment with variant data
}
```

**Service - Completion Verification**:
- `completeLBQ(assignmentId, userId, lat, lng)` → haversine check
- `completeVBQ(assignmentId, voterId, approve)` → record vote; check majority
- `completeTBQ(assignmentId, userId)` → check timer; if failed → `penalties.applyPenalty(..., TBQ_PENALTY_MINUTES, 'tbq_failure', assignmentId)`

**Service - Final Quest**:
- `assignFinalQuestCandidates(tripId, candidateDescriptions[])` → validates 10-15
- `assignFinalQuests(tripId)` → random 1 per user from pool
- `startFinalQuest(tripId)` → `started_at = final_quest_trigger + totalPenaltyMinutes*60*1000`
- `completeFinalQuest(userId)` → `completed_at = now`
- `getFinalQuestLeaderboard(tripId)` → order by `completed_at` (last = punishment)

**Routes**:
- `POST /api/trips/:tripId/themes`
- `POST /api/themes/:themeId/variants`
- `GET /api/trips/:tripId/themes?track=individual|group`
- `GET /api/users/:userId/next-quest?track=individual|group`
- `POST /api/assignments/:assignmentId/complete` (body varies by type)
- `POST /api/trips/:tripId/final-quest/candidates` (organizer only)
- `POST /api/trips/:tripId/final-quest/assign` (organizer only)
- `POST /api/trips/:tripId/final-quest/start` (organizer only)
- `POST /api/final-quest/complete`
- `GET /api/trips/:tripId/final-quest/leaderboard`

#### 3.5 `modules/reports` - Reporting System
**Types**: `Report`, `ReportApproval`, `ReportReason`
**Service**:
- `createReport(tripId, reportedUserId, filedByUserId, reason)`
- `approveReport(reportId, approverUserId)` → inserts approval; checks count
- `checkAndResolveReport(reportId)` → if approvals >= 4: update status, call `penalties.applyPenalty(..., REPORT_PENALTY_MINUTES, 'report', reportId)`
**Routes**:
- `POST /api/trips/:tripId/reports`
- `POST /api/reports/:reportId/approve`
- `GET /api/trips/:tripId/reports`

---

### Phase 4: Validation & Dependencies

#### 4.1 Add Dependencies
```bash
bun add zod jose
bun add -D @types/node  # if needed for crypto types
```

#### 4.2 Zod Schemas
- In each module's `types.ts` or separate `validators.ts`
- Validate all request bodies before service calls
- Return 400 with clear messages on failure

#### 4.3 Auth Integration
- Protect routes requiring authentication
- Organizer-only routes check `user.isOrganizer` or `user.id === trip.organizerId`

---

## Clarifying Questions (To Resolve Before Implementation)

1. **Organizer identification**: Schema lacks `organizer_id` on `trips`. Add it? Or first user to join = organizer?

2. **Password storage**: `users` table has no password field. Add `password_hash TEXT NOT NULL` to `users`, or separate `credentials` table?

3. **Username vs name**: Auth spec says "username + password" but `users` only has `name`. Is `name` the username (unique per trip)? Or add separate `username` column?

4. **Quest theme creation**: One-by-one API or bulk upload? Trigger points provided by organizer.

5. **VBQ "witnessed it" tracking**: "Majority vote among other participants who witnessed it." Implicit (anyone can vote) or explicit witness designation? *Assumption: implicit for now.*

6. **Final quest candidate descriptions**: Just text descriptions, or do they have types/coordinates/timers like regular quests? *Schema shows only `description TEXT` - will follow that.*

7. **Trip join mechanism**: Just `tripId`? Or join code?

---

## File Creation Order (For Implementation)

1. `wrangler.jsonc` (add D1 binding)
2. Migration files (5 files)
3. `src/types/env.ts`, `src/db/client.ts`
4. `src/lib/constants.ts`, `src/lib/haversine.ts`, `src/lib/random.ts`
5. `src/middleware/error-handler.ts`, `src/middleware/auth.ts`
6. `src/app.ts`, `src/index.ts`
7. `modules/trips` (types, service, routes)
8. `modules/users` (types, service, routes)
9. `modules/penalties` (types, service, routes)
10. `modules/quests` (types, service, routes)
11. `modules/reports` (types, service, routes)
12. Run migrations, test endpoints

---

## Professional Coding Guidelines (Enforced Throughout)

1. **TypeScript strict mode** - No `any` unless unavoidable (comment why)
2. **Separation of concerns** - Routes never touch DB; services never touch `Context`/`c`
3. **Input validation** - Zod schemas, reject invalid with 400 + clear message
4. **Consistent error handling** - All errors through global `onError`; typed descriptive errors
5. **Consistent response shape** - `{ data }` success, `{ error: { code, message } }` failure
6. **No magic numbers** - All constants in `constants.ts`
7. **Testable randomness** - Isolate in `lib/random.ts`, accept `Random` fn param
8. **Naming** - camelCase functions/vars, PascalCase types, snake_case DB columns
9. **No cross-module DB reach-through** - Call other module's service, not raw SQL
10. **Idempotent migrations** - Never edit applied migration; add new numbered file
11. **Comment "why," not "what"** - Especially unlock logic and penalty stacking
12. **No in-memory state** - Workers is request-scoped; everything persists in D1

---

## Notes for Implementer

- This plan follows the **exact schema and domain rules** specified
- The `penalties` module is built **before** `quests` and `reports` so they can call into it
- Variant assignment logic is the **most subtle part** - implements "unassigned-first random pick, duplicates only after pool exhaustion"
- Final quest penalty calculation: `started_at = final_quest_trigger + (totalPenaltyMinutes * 60 * 1000)`
- All timestamps in **milliseconds** for precision
- Use `crypto.randomUUID()` for ID generation (available in Workers)

---

*This phase.md is intentionally left uncommitted per user request.*
