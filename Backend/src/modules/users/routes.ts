import { Hono } from 'hono'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware } from '../../middleware/auth'
import type { Env } from '../../types/env'

const users = new Hono<{ Bindings: Env }>()
users.get('/me', authMiddleware, async (c) => {
  const session = c.get('user')
  const user = await getDB(c.env).prepare('SELECT id,name,username,trip_id,is_organizer FROM users WHERE id=?').bind(session.id).first()
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Account not found')
  return c.json({ data: user })
})
users.get('/', authMiddleware, async (c) => {
  const session = c.get('user')
  const { results } = await getDB(c.env).prepare('SELECT id,name,is_organizer FROM users WHERE trip_id=? ORDER BY created_at,id').bind(session.tripId).all()
  return c.json({ data: results })
})
export default users
