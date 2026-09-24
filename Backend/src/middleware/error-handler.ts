import type { ErrorHandler } from 'hono'
import { ZodError } from 'zod'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
export class AppError extends Error {
  constructor(public status: ContentfulStatusCode, public code: string, message: string) { super(message); this.name = 'AppError' }
}
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) return c.json({ error: { code: err.code, message: err.message } }, err.status)
  if (err instanceof ZodError) return c.json({ error: { code: 'VALIDATION_ERROR', message: err.issues.map(x => x.message).join('; ') } }, 400)
  console.error(err)
  return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' } }, 500)
}
