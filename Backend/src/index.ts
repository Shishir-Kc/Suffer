import app from './app'
import { retryTimedOutJobs } from './modules/photos/routes'
import type { Env } from './types/env'

export default {
  fetch: app.fetch,
  scheduled(_controller: { cron: string; scheduledTime: number }, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }) {
    ctx.waitUntil(retryTimedOutJobs(env))
  },
}
