import { Hono } from 'hono'
import { z } from 'zod'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { issueSession, setSessionCookie, clearSessionCookie, authMiddleware } from '../../middleware/auth'
import type { Env } from '../../types/env'
import { hashPassword, constantTimeEqual } from '../../lib/password'

const auth = new Hono<{ Bindings: Env }>()
auth.post('/login', async (c) => {
  const input = z.object({ username: z.string().min(3).max(64), password: z.string().min(1).max(256) }).parse(await c.req.json())
  const user = await getDB(c.env).prepare('SELECT id,trip_id,is_organizer,password_hash FROM users WHERE username=?').bind(input.username).first<{id:string;trip_id:string;is_organizer:number;password_hash:string|null}>()
  const [salt, expected] = user?.password_hash?.split(':') ?? []
  if (!user || !salt || !expected || !constantTimeEqual(await hashPassword(input.password,salt),expected)) throw new AppError(401,'INVALID_CREDENTIALS','Invalid username or password')
  if (!c.env.JWT_SECRET) throw new AppError(500,'CONFIGURATION_ERROR','JWT_SECRET is not configured')
  const token=await issueSession(c.env,{id:user.id,tripId:user.trip_id,isOrganizer:user.is_organizer===1})
  setSessionCookie(c,token,c.env)
  return c.json({data:{id:user.id,tripId:user.trip_id}})
})
auth.post('/logout',(c)=>{clearSessionCookie(c,c.env);return c.json({data:{success:true}})})
auth.get('/me',authMiddleware,(c)=>c.json({data:c.get('user')}))
export default auth
