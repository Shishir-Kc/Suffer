# Suffer — invitation site

A static, read-only invitation site for the Suffer trip game. It has no backend, database, forms, accounts, RSVP flow, or attendance tracking.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production check:

```bash
npm run lint
npm run build
```

The static output is written to `out`. To preview that output locally, use any static file server, for example `npx serve out`.

## Swap the trip details

All trip-specific placeholders live in [app/content.ts](./app/content.ts). Update `destination`, `dates`, and `finalQuestTime` there. The quest copy, rules, report reasons, and other reusable content are in the same file.

The larger editorial copy is kept close to the layout in [app/page.tsx](./app/page.tsx) so the page structure remains easy to scan and edit.

## Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Plain CSS in `app/globals.css`
- CSS transitions plus `IntersectionObserver` for scroll reveals
- No external runtime services or UI component dependencies

## Static deployment

The site can deploy directly to Vercel or Netlify as a static export. Set the project root to `invite`, use `npm run build` as the build command, and use `out` as the publish/output directory. Vercel can also detect the Next.js setup automatically.

Because this project is read-only, it does not need environment variables or a server-side data service.
