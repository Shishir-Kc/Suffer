import { Hono } from 'hono'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware } from '../../middleware/auth'
import type { Env } from '../../types/env'

const trips = new Hono<{ Bindings: Env }>()
trips.get('/current', authMiddleware, async (c) => {
  const { tripId } = c.get('user')
  const trip = await getDB(c.env).prepare('SELECT id,name,created_at,organizer_id,final_quest_trigger FROM trips WHERE id=?').bind(tripId).first()
  if (!trip) throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found')
  return c.json({ data: trip })
})
trips.get('/participants', authMiddleware, async (c) => {
  const { tripId } = c.get('user')
  const { results } = await getDB(c.env).prepare('SELECT id,name,is_organizer FROM users WHERE trip_id=? ORDER BY created_at,id').bind(tripId).all()
  return c.json({ data: results })
})
export default trips
