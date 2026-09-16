# Suffer

Suffer is a mobile-first frontend prototype for a six-person trip game travelling from Itahari to Bhedetar and Namje. It is intentionally UI-only: every route is powered by local sample data and browser state.

## What is here

- Next.js App Router frontend with thin route pages and reusable components under `components/`.
- Claymorphism design system in `styles/globals.css` and `styles/clay.css`.
- Local mock data in `lib/mockData.ts`, GPS/Haversine logic in `lib/gps.ts`, and unlock rules in `lib/questEngine.ts`.
- MapLibre GL JS wrapper with a trip-area map shell, 3D pitch, day/night styles, and a local demo map-ready interaction.

## Run the frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000/join](http://localhost:3000/join). The sample trip in `lib/mockData.ts` lets every route be explored without a network connection.

## Prepare a quest plan

Organizers can explore the guided trip wizard at `/create`. Its JSON import/export controls are local browser interactions for prototyping the flow.

## Prototype data

All trips, players, quests, completions, and assignments are hardcoded in `lib/mockData.ts`. Screens read this module directly and use local React state for interactions.

## Deploy

### Vercel

Import the repository into Vercel with this folder as the project root:

- Build command: `npm run build`
- Output: `.next`
- Node.js: 20+

## Checks

```bash
npm run lint
npm run build
```
