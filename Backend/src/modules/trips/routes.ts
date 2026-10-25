import { Hono } from 'hono'
import { z } from 'zod'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware, issueSession, setSessionCookie } from '../../middleware/auth'
import type { Env } from '../../types/env'

const trips = new Hono<{ Bindings: Env }>()
const candidateSchema = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(1000), type: z.enum(['LBQ','VBQ','TBQ']), targetCoords: z.object({lat:z.number().min(-90).max(90),lng:z.number().min(-180).max(180),radiusMeters:z.number().positive().max(10000).default(50)}).nullable().optional(), timerDurationSeconds: z.number().int().positive().nullable().optional() })
const poolSchema = z.object({ track:z.enum(['individual','group']), order:z.number().int().positive(), triggerTime:z.string().min(1), assignmentMode:z.enum(['per-player','shared']).optional(), candidates:z.array(candidateSchema).min(1).max(100) })
const createSchema = z.object({ name:z.string().trim().min(1).max(120), organizerName:z.string().trim().min(1).max(64), startDate:z.string().min(1), finalQuestTrigger:z.string().optional(), expectedPlayerCount:z.number().int().min(2).max(30), pools:z.array(poolSchema).max(100), finalQuestCandidates:z.array(candidateSchema).min(10).max(15) })
const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function makeCode(){const bytes=crypto.getRandomValues(new Uint8Array(6));return [...bytes].map(b=>codeChars[b%codeChars.length]).join('')}
const iso = (n:unknown) => typeof n==='number' ? new Date(n).toISOString() : n
function tripDto(row:Record<string,unknown>){return {id:row.id,name:row.name,startDate:row.start_date,expectedPlayerCount:row.expected_player_count,status:row.status,organizerId:row.organizer_id,createdAt:iso(row.created_at),joinCode:row.join_code}}

trips.post('/', async c => {
  const input=createSchema.parse(await c.req.json()),db=getDB(c.env),tripId=crypto.randomUUID(),organizerId=crypto.randomUUID(),now=Date.now()
  const orders=new Set<string>(),lastByTrack=new Map<string,{order:number;trigger:number}>();for(const pool of input.pools){const key=`${pool.track}:${pool.order}`,trigger=Date.parse(pool.triggerTime);if(orders.has(key))throw new AppError(400,'INVALID_SEQUENCE','Pool order must be unique within each track');orders.add(key);if(!Number.isFinite(trigger))throw new AppError(400,'INVALID_DATE','Quest trigger times must be valid date strings');const previous=lastByTrack.get(pool.track);if(pool.order!==(previous?.order??0)+1)throw new AppError(400,'INVALID_SEQUENCE','Pool orders must be sequential within each track');if(previous&&trigger<previous.trigger+4*60*60*1000)throw new AppError(400,'TRIGGER_GAP_TOO_SHORT','Quest triggers on the same track need at least four hours between them');lastByTrack.set(pool.track,{order:pool.order,trigger})}
  let code=''; for(let i=0;i<8;i++){const candidate=makeCode();if(!await db.prepare('SELECT 1 FROM trips WHERE join_code=?').bind(candidate).first()){code=candidate;break}}
  if(!code)throw new AppError(503,'CODE_GENERATION_FAILED','Could not allocate a trip code')
  const finalTrigger=Date.parse(input.finalQuestTrigger??input.startDate);if(!Number.isFinite(finalTrigger))throw new AppError(400,'INVALID_DATE','Trip dates must be valid date strings')
  const stmts=[db.prepare("INSERT INTO trips(id,name,created_at,organizer_id,join_code,final_quest_trigger,start_date,expected_player_count,status) VALUES(?,?,?,NULL,?,?,?,?, 'waiting')").bind(tripId,input.name,now,code,finalTrigger,input.startDate,input.expectedPlayerCount),db.prepare('INSERT INTO users(id,name,trip_id,created_at,username,password_hash,is_organizer) VALUES(?,?,?, ?,NULL,NULL,1)').bind(organizerId,input.organizerName,tripId,now),db.prepare('UPDATE trips SET organizer_id=? WHERE id=?').bind(organizerId,tripId)]
  for(const pool of input.pools){const trigger=Date.parse(pool.triggerTime);if(!Number.isFinite(trigger))throw new AppError(400,'INVALID_DATE','Quest trigger times must be valid date strings');const themeId=crypto.randomUUID(),trackOrder=pool.order;stmts.push(db.prepare('INSERT INTO quest_themes(id,trip_id,track,sequence_order,trigger_point,type,title) VALUES(?,?,?,?,?,?,?)').bind(themeId,tripId,pool.track,trackOrder,trigger,pool.candidates[0].type,pool.candidates[0].title));for(const item of pool.candidates){const coords=item.targetCoords;stmts.push(db.prepare('INSERT INTO quest_variants(id,theme_id,description,target_lat,target_lng,radius_meters,timer_seconds,title,type,pool_id) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),themeId,item.description,coords?.lat??null,coords?.lng??null,coords?.radiusMeters??50,item.timerDurationSeconds??null,item.title,item.type,themeId))}}
  for(const item of input.finalQuestCandidates)stmts.push(db.prepare('INSERT INTO final_quest_candidates(id,trip_id,description,title,type,target_lat,target_lng,radius_meters,timer_seconds) VALUES(?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tripId,item.description,item.title,item.type,item.targetCoords?.lat??null,item.targetCoords?.lng??null,item.targetCoords?.radiusMeters??50,item.timerDurationSeconds??null))
  await db.batch(stmts)
  if(!c.env.JWT_SECRET)throw new AppError(500,'CONFIGURATION_ERROR','JWT_SECRET is not configured')
  const token=await issueSession(c.env,{id:organizerId,tripId,isOrganizer:true});setSessionCookie(c,token,c.env)
  return c.json({data:{trip:{id:tripId,name:input.name,startDate:input.startDate,expectedPlayerCount:input.expectedPlayerCount,status:'waiting',organizerId,createdAt:new Date(now).toISOString(),joinCode:code},player:{id:organizerId,tripId,name:input.organizerName,isOrganizer:true,penalties:0,finalQuestStartTime:null,finalQuestCompleteTime:null,joinedAt:new Date(now).toISOString()},joinCode:code}},201)
})
trips.post('/:code/join',async c=>{
  const code=c.req.param('code').toUpperCase(),input=z.object({name:z.string().trim().min(1).max(64)}).parse(await c.req.json()),db=getDB(c.env)
  const trip=await db.prepare('SELECT id,status,expected_player_count FROM trips WHERE join_code=?').bind(code).first<{id:string;status:string;expected_player_count:number}>();if(!trip)throw new AppError(404,'TRIP_NOT_FOUND','Trip code not found')
  const existing=await db.prepare('SELECT id,name,is_organizer FROM users WHERE trip_id=? AND name=? COLLATE NOCASE').bind(trip.id,input.name).first<{id:string;name:string;is_organizer:number}>()
  if(existing){const token=await issueSession(c.env,{id:existing.id,tripId:trip.id,isOrganizer:existing.is_organizer===1});setSessionCookie(c,token,c.env);return c.json({data:{player:{id:existing.id,tripId:trip.id,name:existing.name,isOrganizer:existing.is_organizer===1},restored:true}})}
  if(trip.status!=='waiting')throw new AppError(409,'TRIP_ALREADY_STARTED','This trip no longer accepts players')
  const count=await db.prepare('SELECT COUNT(*) count FROM users WHERE trip_id=?').bind(trip.id).first<{count:number}>();if((count?.count??0)>=trip.expected_player_count)throw new AppError(409,'TRIP_FULL','This trip is at capacity')
  const playerId=crypto.randomUUID(),now=Date.now();await db.prepare('INSERT INTO users(id,name,trip_id,created_at,is_organizer) VALUES(?,?,?, ?,0)').bind(playerId,input.name,trip.id,now).run()
  const token=await issueSession(c.env,{id:playerId,tripId:trip.id,isOrganizer:false});setSessionCookie(c,token,c.env);return c.json({data:{player:{id:playerId,tripId:trip.id,name:input.name,isOrganizer:false,joinedAt:new Date(now).toISOString()},restored:false}},201)
})
trips.post('/:tripId/start',authMiddleware,async c=>{
  const user=c.get('user'),tripId=c.req.param('tripId');if(user.tripId!==tripId||!user.isOrganizer)throw new AppError(403,'FORBIDDEN','Organizer access required')
  const db=getDB(c.env),trip=await db.prepare('SELECT expected_player_count,status FROM trips WHERE id=?').bind(tripId).first<{expected_player_count:number;status:string}>();if(!trip)throw new AppError(404,'TRIP_NOT_FOUND','Trip not found');if(trip.status!=='waiting')throw new AppError(409,'TRIP_ALREADY_STARTED','Trip has already started')
  const count=await db.prepare('SELECT COUNT(*) count FROM users WHERE trip_id=?').bind(tripId).first<{count:number}>();if(count?.count!==trip.expected_player_count)throw new AppError(409,'LOBBY_NOT_FULL','The lobby must be full before the trip starts')
  await db.prepare("UPDATE trips SET status='active' WHERE id=? AND status='waiting'").bind(tripId).run();return c.json({data:{status:'active'}})
})
trips.get('/current', authMiddleware, async c => {
  const { tripId } = c.get('user'),row = await getDB(c.env).prepare('SELECT id,name,created_at,organizer_id,final_quest_trigger,start_date,expected_player_count,status,join_code FROM trips WHERE id=?').bind(tripId).first<Record<string,unknown>>()
  if (!row) throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found')
  return c.json({ data: tripDto(row) })
})
trips.get('/participants', authMiddleware, async c => {
  const { tripId } = c.get('user'),{ results } = await getDB(c.env).prepare('SELECT id,name,is_organizer,created_at FROM users WHERE trip_id=? ORDER BY created_at,id').bind(tripId).all<{id:string;name:string;is_organizer:number;created_at:number}>()
  return c.json({ data: results.map(p=>({id:p.id,tripId,name:p.name,isOrganizer:p.is_organizer===1,joinedAt:new Date(p.created_at).toISOString()})) })
})
export default trips
