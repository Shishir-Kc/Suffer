import { Hono } from 'hono'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware } from '../../middleware/auth'
import type { Env } from '../../types/env'

const users = new Hono<{ Bindings: Env }>()
const playerFields = `u.id,u.name,u.trip_id,u.is_organizer,u.created_at,COALESCE(SUM(p.minutes),0) penalties,f.started_at final_quest_start,f.completed_at final_quest_complete`
const playerDto = (u:any) => ({id:u.id,tripId:u.trip_id,name:u.name,isOrganizer:u.is_organizer===1,penalties:u.penalties,finalQuestStartTime:u.final_quest_start==null?null:new Date(u.final_quest_start).toISOString(),finalQuestCompleteTime:u.final_quest_complete==null?null:new Date(u.final_quest_complete).toISOString(),joinedAt:new Date(u.created_at).toISOString()})
users.get('/me', authMiddleware, async c => {
  const session=c.get('user'),user=await getDB(c.env).prepare(`SELECT ${playerFields} FROM users u LEFT JOIN penalties p ON p.user_id=u.id LEFT JOIN final_quest_assignments f ON f.user_id=u.id AND f.trip_id=u.trip_id WHERE u.id=? GROUP BY u.id`).bind(session.id).first<any>()
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Account not found')
  return c.json({data:playerDto(user)})
})
users.get('/', authMiddleware, async c => {
  const session=c.get('user'),{results}=await getDB(c.env).prepare(`SELECT ${playerFields} FROM users u LEFT JOIN penalties p ON p.user_id=u.id LEFT JOIN final_quest_assignments f ON f.user_id=u.id AND f.trip_id=u.trip_id WHERE u.trip_id=? GROUP BY u.id ORDER BY u.created_at,u.id`).bind(session.tripId).all<any>()
  return c.json({data:results.map(playerDto)})
})
export default users
