import { Hono } from 'hono'
import { z } from 'zod'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware } from '../../middleware/auth'
import { haversineDistance } from '../../lib/haversine'
import { pickRandom } from '../../lib/random'
import { TRIGGER_GAP_MS, TBQ_PENALTY_MINUTES, FINAL_QUEST_CANDIDATE_MIN, FINAL_QUEST_CANDIDATE_MAX, FIXED_GROUP_SIZE, MINUTE_MS } from '../../lib/constants'
import { applyPenalty, totalPenaltyMinutes } from '../penalties/service'
import type { Env } from '../../types/env'

type Track='individual'|'group'
type Theme={id:string;trip_id:string;track:Track;sequence_order:number;trigger_point:number;type:'LBQ'|'VBQ'|'TBQ';title:string}
type Variant={id:string;description:string;target_lat:number|null;target_lng:number|null;radius_meters:number;timer_seconds:number|null}
const app=new Hono<{Bindings:Env}>(),trackSchema=z.enum(['individual','group']),themeInput=z.object({track:trackSchema,sequenceOrder:z.number().int().positive(),triggerPoint:z.number().int().positive(),type:z.enum(['LBQ','VBQ','TBQ']),title:z.string().trim().min(1).max(160)}),variantInput=z.object({description:z.string().trim().min(1).max(1000),targetLat:z.number().min(-90).max(90).nullable().optional(),targetLng:z.number().min(-180).max(180).nullable().optional(),radiusMeters:z.number().positive().max(10000).default(50),timerSeconds:z.number().int().positive().optional()})
function organizer(c:{get:(key:'user')=>{tripId:string;isOrganizer:boolean}}){const user=c.get('user');if(!user.isOrganizer)throw new AppError(403,'FORBIDDEN','Organizer access required');return user}
async function theme(db:D1Database,id:string,tripId:string){const result=await db.prepare('SELECT id,trip_id,track,sequence_order,trigger_point,type,title FROM quest_themes WHERE id=? AND trip_id=?').bind(id,tripId).first<Theme>();if(!result)throw new AppError(404,'THEME_NOT_FOUND','Quest theme not found');return result}
app.post('/trips/:tripId/themes',authMiddleware,async c=>{
 const user=organizer(c),tripId=c.req.param('tripId');if(user.tripId!==tripId)throw new AppError(403,'FORBIDDEN','Trip access denied')
 const input=themeInput.parse(await c.req.json()),db=getDB(c.env),{results}=await db.prepare('SELECT sequence_order,trigger_point FROM quest_themes WHERE trip_id=? AND track=? ORDER BY sequence_order DESC LIMIT 1').bind(tripId,input.track).all<{sequence_order:number;trigger_point:number}>(),previous=results[0]
 if(input.sequenceOrder!==(previous?.sequence_order??0)+1)throw new AppError(400,'INVALID_SEQUENCE','Quest themes must be added in sequence order')
 if(previous&&input.triggerPoint<previous.trigger_point+TRIGGER_GAP_MS)throw new AppError(400,'TRIGGER_GAP_TOO_SHORT','Quest trigger points on the same track need at least four hours between them')
 const id=crypto.randomUUID();await db.prepare('INSERT INTO quest_themes(id,trip_id,track,sequence_order,trigger_point,type,title) VALUES(?,?,?,?,?,?,?)').bind(id,tripId,input.track,input.sequenceOrder,input.triggerPoint,input.type,input.title).run();return c.json({data:{id,...input}},201)
})
app.post('/themes/:themeId/variants',authMiddleware,async c=>{
 const user=organizer(c),db=getDB(c.env),t=await theme(db,c.req.param('themeId'),user.tripId),input=variantInput.parse(await c.req.json())
 if(t.type==='LBQ'&&(!Number.isFinite(input.targetLat)||!Number.isFinite(input.targetLng)))throw new AppError(400,'LOCATION_REQUIRED','Location quests need target coordinates')
 if(t.type==='TBQ'&&!input.timerSeconds)throw new AppError(400,'TIMER_REQUIRED','Timing quests need a timer duration')
 const id=crypto.randomUUID();await db.prepare('INSERT INTO quest_variants(id,theme_id,description,target_lat,target_lng,radius_meters,timer_seconds) VALUES(?,?,?,?,?,?,?)').bind(id,t.id,input.description,input.targetLat??null,input.targetLng??null,input.radiusMeters,input.timerSeconds??null).run();return c.json({data:{id,...input}},201)
})
app.get('/trips/:tripId/themes',authMiddleware,async c=>{
 const user=c.get('user'),tripId=c.req.param('tripId');if(user.tripId!==tripId)throw new AppError(403,'FORBIDDEN','Trip access denied')
 const track=trackSchema.parse(c.req.query('track')),db=getDB(c.env),{results}=await db.prepare('SELECT id,track,sequence_order,trigger_point,type,title FROM quest_themes WHERE trip_id=? AND track=? ORDER BY sequence_order').bind(tripId,track).all();return c.json({data:results})
})
app.get('/users/me/next-quest',authMiddleware,async c=>{
 const user=c.get('user'),track=trackSchema.parse(c.req.query('track')),db=getDB(c.env),{results:themes}=await db.prepare('SELECT id,trip_id,track,sequence_order,trigger_point,type,title FROM quest_themes WHERE trip_id=? AND track=? ORDER BY sequence_order').bind(user.tripId,track).all<Theme>()
 for(let i=0;i<themes.length;i++){
  const t=themes[i],prev=themes[i-1];let priorCompletedAt:number|null=null
  if(prev){const done=track==='group'?await db.prepare("SELECT completed_at FROM group_quest_assignments WHERE theme_id=? AND status='completed'").bind(prev.id).first<{completed_at:number}>():await db.prepare("SELECT completed_at FROM quest_assignments WHERE theme_id=? AND user_id=? AND status='completed'").bind(prev.id,user.id).first<{completed_at:number}>();if(!done)return c.json({data:null});priorCompletedAt=done.completed_at}
  const now=Date.now(),unlockedAt=Math.max(t.trigger_point,priorCompletedAt??t.trigger_point);if(unlockedAt>now)return c.json({data:null})
  if(track==='group'){
   let assignment=await db.prepare('SELECT g.theme_id,g.variant_id,g.status,g.started_at,g.completed_at,v.description,v.target_lat,v.target_lng,v.radius_meters,v.timer_seconds FROM group_quest_assignments g JOIN quest_variants v ON v.id=g.variant_id WHERE g.theme_id=?').bind(t.id).first()
   if(assignment?.status==='completed')continue
   if(!assignment){const {results:pool}=await db.prepare('SELECT id FROM quest_variants WHERE theme_id=?').bind(t.id).all<{id:string}>();if(!pool.length)throw new AppError(409,'QUEST_VARIANTS_MISSING','This quest has no variants');const v=pickRandom(pool);await db.prepare("INSERT OR IGNORE INTO group_quest_assignments(theme_id,variant_id,status,started_at) VALUES(?,?,'unlocked',?)").bind(t.id,v.id,unlockedAt).run();assignment=await db.prepare('SELECT g.theme_id,g.variant_id,g.status,g.started_at,g.completed_at,v.description,v.target_lat,v.target_lng,v.radius_meters,v.timer_seconds FROM group_quest_assignments g JOIN quest_variants v ON v.id=g.variant_id WHERE g.theme_id=?').bind(t.id).first()}
   return c.json({data:{theme:t,assignment}})
  }
  let assignment=await db.prepare('SELECT q.id,q.variant_id,q.status,q.started_at,q.completed_at,v.description,v.target_lat,v.target_lng,v.radius_meters,v.timer_seconds FROM quest_assignments q JOIN quest_variants v ON v.id=q.variant_id WHERE q.theme_id=? AND q.user_id=?').bind(t.id,user.id).first()
  if(assignment?.status==='completed')continue
  if(!assignment){const {results:pool}=await db.prepare('SELECT id FROM quest_variants WHERE theme_id=?').bind(t.id).all<{id:string}>();if(!pool.length)throw new AppError(409,'QUEST_VARIANTS_MISSING','This quest has no variants');const {results:used}=await db.prepare('SELECT variant_id FROM quest_assignments WHERE theme_id=?').bind(t.id).all<{variant_id:string}>();const taken=new Set(used.map(v=>v.variant_id)),available=pool.filter(v=>!taken.has(v.id)),chosen=pickRandom(available.length?available:pool);const id=crypto.randomUUID();await db.prepare("INSERT OR IGNORE INTO quest_assignments(id,theme_id,variant_id,user_id,status,started_at) VALUES(?,?,?,?,'unlocked',?)").bind(id,t.id,chosen.id,user.id,unlockedAt).run();assignment=await db.prepare('SELECT q.id,q.variant_id,q.status,q.started_at,q.completed_at,v.description,v.target_lat,v.target_lng,v.radius_meters,v.timer_seconds FROM quest_assignments q JOIN quest_variants v ON v.id=q.variant_id WHERE q.id=?').bind(id).first()}
  return c.json({data:{theme:t,assignment}})
 }
 return c.json({data:null})
})
app.post('/assignments/:assignmentId/votes',authMiddleware,async c=>{
 const user=c.get('user'),db=getDB(c.env),input=z.object({approve:z.boolean()}).parse(await c.req.json()),assignment=await db.prepare('SELECT a.id,a.user_id,a.theme_id,t.trip_id,t.type FROM quest_assignments a JOIN quest_themes t ON t.id=a.theme_id WHERE a.id=?').bind(c.req.param('assignmentId')).first<{id:string;user_id:string;theme_id:string;trip_id:string;type:string}>()
 if(!assignment||assignment.trip_id!==user.tripId)throw new AppError(404,'ASSIGNMENT_NOT_FOUND','Quest assignment not found');if(assignment.type!=='VBQ')throw new AppError(400,'NOT_VOTING_QUEST','This quest does not use peer voting');if(assignment.user_id===user.id)throw new AppError(403,'FORBIDDEN','You cannot vote on your own quest')
 const complete=await db.prepare("SELECT 1 FROM quest_assignments WHERE id=? AND status='completed'").bind(assignment.id).first();if(complete)return c.json({data:{completed:true}})
 await db.prepare('INSERT OR IGNORE INTO votes(id,assignment_id,voter_id,approve,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),assignment.id,user.id,input.approve?1:0,Date.now()).run()
 const eligible=await db.prepare('SELECT COUNT(*) AS count FROM users WHERE trip_id=? AND id<>?').bind(user.tripId,assignment.user_id).first<{count:number}>(),votes=await db.prepare('SELECT SUM(approve) AS yes,COUNT(*) AS total FROM votes WHERE assignment_id=?').bind(assignment.id).first<{yes:number|null;total:number}>()
 const majority=Math.floor((eligible?.count??0)/2)+1,done=(votes?.yes??0)>=majority;if(done)await db.prepare("UPDATE quest_assignments SET status='completed',completed_at=? WHERE id=?").bind(Date.now(),assignment.id).run();else if(votes?.total===eligible?.count)await db.prepare("UPDATE quest_assignments SET status='failed',completed_at=? WHERE id=?").bind(Date.now(),assignment.id).run()
 return c.json({data:{completed:done,approvalCount:votes?.yes??0,required:majority}})
})
app.post('/group-themes/:themeId/votes',authMiddleware,async c=>{
 const user=c.get('user'),db=getDB(c.env),input=z.object({approve:z.boolean()}).parse(await c.req.json()),theme=await db.prepare("SELECT t.id,t.trip_id,t.type,g.status FROM quest_themes t JOIN group_quest_assignments g ON g.theme_id=t.id WHERE t.id=?").bind(c.req.param('themeId')).first<{id:string;trip_id:string;type:string;status:string}>()
 if(!theme||theme.trip_id!==user.tripId)throw new AppError(404,'QUEST_NOT_FOUND','Group quest not found');if(theme.type!=='VBQ')throw new AppError(400,'NOT_VOTING_QUEST','This quest does not use peer voting');if(theme.status==='completed')return c.json({data:{completed:true}})
 await db.prepare('INSERT OR IGNORE INTO group_votes(id,theme_id,voter_id,approve,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),theme.id,user.id,input.approve?1:0,Date.now()).run()
 const counts=await db.prepare('SELECT SUM(approve) AS yes,COUNT(*) AS total FROM group_votes WHERE theme_id=?').bind(theme.id).first<{yes:number|null;total:number}>(),required=FIXED_GROUP_SIZE-1,completed=(counts?.yes??0)>=required
 if(completed)await db.prepare("UPDATE group_quest_assignments SET status='completed',completed_at=? WHERE theme_id=?").bind(Date.now(),theme.id)
 else if((counts?.total??0)>=FIXED_GROUP_SIZE)await db.prepare("UPDATE group_quest_assignments SET status='failed',completed_at=? WHERE theme_id=?").bind(Date.now(),theme.id)
 return c.json({data:{completed,approvalCount:counts?.yes??0,required}})
})
app.post('/assignments/:assignmentId/complete',authMiddleware,async c=>{
 const user=c.get('user'),db=getDB(c.env),input=z.object({latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional()}).parse(await c.req.json().catch(()=>({}))),id=c.req.param('assignmentId')
 const indiv=await db.prepare('SELECT q.id,q.theme_id,q.user_id,q.status,q.started_at,t.trip_id,t.type,v.target_lat,v.target_lng,v.radius_meters,v.timer_seconds FROM quest_assignments q JOIN quest_themes t ON t.id=q.theme_id JOIN quest_variants v ON v.id=q.variant_id WHERE q.id=?').bind(id).first<{id:string;theme_id:string;user_id:string;status:string;started_at:number;trip_id:string;type:string;target_lat:number|null;target_lng:number|null;radius_meters:number;timer_seconds:number|null}>()
 const group=indiv?null:await db.prepare('SELECT g.theme_id,g.status,g.started_at,t.trip_id,t.type,v.target_lat,v.target_lng,v.radius_meters,v.timer_seconds FROM group_quest_assignments g JOIN quest_themes t ON t.id=g.theme_id JOIN quest_variants v ON v.id=g.variant_id WHERE g.theme_id=?').bind(id).first<{theme_id:string;status:string;started_at:number;trip_id:string;type:string;target_lat:number|null;target_lng:number|null;radius_meters:number;timer_seconds:number|null}>()
 const row=indiv??group;if(!row||row.trip_id!==user.tripId)throw new AppError(404,'ASSIGNMENT_NOT_FOUND','Quest assignment not found');if(indiv&&indiv.user_id!==user.id)throw new AppError(403,'FORBIDDEN','This is another participant’s quest');if(row.status==='completed')return c.json({data:{completed:true}})
 if(row.type==='VBQ')throw new AppError(400,'VOTES_REQUIRED','Voting quests are completed by peer votes')
 let completed=true
 if(row.type==='LBQ'){
  if(input.latitude===undefined||input.longitude===undefined||row.target_lat===null||row.target_lng===null)throw new AppError(400,'LOCATION_REQUIRED','Current coordinates are required')
  completed=haversineDistance(input.latitude,input.longitude,row.target_lat,row.target_lng)<=row.radius_meters
  if(!completed)throw new AppError(422,'TOO_FAR_FROM_TARGET','You are not close enough to the quest location')
 }
 if(row.type==='TBQ'&&Date.now()>row.started_at+(row.timer_seconds??0)*1000){
  if(indiv)await db.prepare("UPDATE quest_assignments SET status='failed',completed_at=? WHERE id=?").bind(Date.now(),indiv.id).run();else await db.prepare("UPDATE group_quest_assignments SET status='failed',completed_at=? WHERE theme_id=?").bind(Date.now(),group!.theme_id).run()
  if(group){const {results:members}=await db.prepare('SELECT id FROM users WHERE trip_id=?').bind(user.tripId).all<{id:string}>();for(const member of members)await applyPenalty(c.env,user.tripId,member.id,TBQ_PENALTY_MINUTES,'tbq_failure',`${id}:${member.id}`)}else await applyPenalty(c.env,user.tripId,user.id,TBQ_PENALTY_MINUTES,'tbq_failure',id)
  throw new AppError(409,'TIMING_QUEST_FAILED','The timer expired; a two-minute Final Quest penalty was added')
 }
 if(indiv)await db.prepare("UPDATE quest_assignments SET status='completed',completed_at=? WHERE id=?").bind(Date.now(),indiv.id).run();else await db.prepare("UPDATE group_quest_assignments SET status='completed',completed_at=? WHERE theme_id=?").bind(Date.now(),group!.theme_id).run()
 return c.json({data:{completed}})
})
app.post('/trips/:tripId/final-quest/candidates',authMiddleware,async c=>{
 const user=c.get('user'),tripId=c.req.param('tripId');if(!user.isOrganizer||user.tripId!==tripId)throw new AppError(403,'FORBIDDEN','Organizer access required')
 const input=z.object({candidates:z.array(z.string().trim().min(1).max(1000)).min(FINAL_QUEST_CANDIDATE_MIN).max(FINAL_QUEST_CANDIDATE_MAX)}).parse(await c.req.json()),db=getDB(c.env),existing=await db.prepare('SELECT 1 FROM final_quest_candidates WHERE trip_id=? LIMIT 1').bind(tripId).first();if(existing)throw new AppError(409,'CANDIDATES_ALREADY_SET','Final Quest candidates have already been configured')
 await db.batch(input.candidates.map(description=>db.prepare('INSERT INTO final_quest_candidates(id,trip_id,description) VALUES(?,?,?)').bind(crypto.randomUUID(),tripId,description)));return c.json({data:{count:input.candidates.length}},201)
})
app.get('/trips/:tripId/final-quest',authMiddleware,async c=>{
 const user=c.get('user'),tripId=c.req.param('tripId'),db=getDB(c.env);if(user.tripId!==tripId)throw new AppError(403,'FORBIDDEN','Trip access denied')
 const trip=await db.prepare('SELECT final_quest_trigger FROM trips WHERE id=?').bind(tripId).first<{final_quest_trigger:number|null}>();if(!trip?.final_quest_trigger)throw new AppError(409,'FINAL_QUEST_NOT_CONFIGURED','Final Quest time is not configured')
 const {results:themes}=await db.prepare('SELECT id,track FROM quest_themes WHERE trip_id=?').bind(tripId).all<{id:string;track:Track}>();let latestRegularCompletion=trip.final_quest_trigger
 for(const t of themes){
  if(t.track==='group'){const row=await db.prepare("SELECT completed_at FROM group_quest_assignments WHERE theme_id=? AND status='completed'").bind(t.id).first<{completed_at:number}>();if(!row)return c.json({data:{unlocked:false}});latestRegularCompletion=Math.max(latestRegularCompletion,row.completed_at)}
  else{const row=await db.prepare("SELECT COUNT(*) AS count,MAX(completed_at) AS latest FROM quest_assignments WHERE theme_id=? AND status='completed'").bind(t.id).first<{count:number;latest:number|null}>();if((row?.count??0)<FIXED_GROUP_SIZE)return c.json({data:{unlocked:false}});latestRegularCompletion=Math.max(latestRegularCompletion,row?.latest??0)}
 }
 const now=Date.now(),finalBaseTime=Math.max(trip.final_quest_trigger,latestRegularCompletion);if(now<finalBaseTime)return c.json({data:{unlocked:false,availableAt:finalBaseTime}})
 let {results:assignments}=await db.prepare('SELECT f.id,f.user_id,f.candidate_id,f.started_at,f.completed_at,c.description,u.name FROM final_quest_assignments f JOIN final_quest_candidates c ON c.id=f.candidate_id JOIN users u ON u.id=f.user_id WHERE f.trip_id=?').bind(tripId).all<{id:string;user_id:string;candidate_id:string;started_at:number|null;completed_at:number|null;description:string;name:string}>()
 if(!assignments.length){const {results:candidates}=await db.prepare('SELECT id FROM final_quest_candidates WHERE trip_id=?').bind(tripId).all<{id:string}>(),{results:members}=await db.prepare('SELECT id FROM users WHERE trip_id=? ORDER BY id').bind(tripId).all<{id:string}>();if(candidates.length<FINAL_QUEST_CANDIDATE_MIN)throw new AppError(409,'CANDIDATES_REQUIRED','Configure 10–15 Final Quest candidates first');const pool=[...candidates];const statements=[];for(const member of members){if(!pool.length)pool.push(...candidates);const candidate=pickRandom(pool),ix=pool.indexOf(candidate);pool.splice(ix,1);statements.push(db.prepare('INSERT OR IGNORE INTO final_quest_assignments(id,trip_id,user_id,candidate_id,started_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),tripId,member.id,candidate.id,finalBaseTime+await totalPenaltyMinutes(c.env,tripId,member.id)*MINUTE_MS))}await db.batch(statements);assignments=(await db.prepare('SELECT f.id,f.user_id,f.candidate_id,f.started_at,f.completed_at,c.description,u.name FROM final_quest_assignments f JOIN final_quest_candidates c ON c.id=f.candidate_id JOIN users u ON u.id=f.user_id WHERE f.trip_id=?').bind(tripId).all<typeof assignments[number]>()).results}
 const complete=assignments.filter(a=>a.completed_at!==null),latest=Math.max(0,...complete.map(a=>a.completed_at??0)),finishedAll=complete.length===assignments.length;return c.json({data:{unlocked:true,yourQuest:assignments.find(a=>a.user_id===user.id),leaderboard:assignments.map(a=>({...a,isPunished:finishedAll&&a.completed_at!==null&&a.completed_at===latest}))}})
})
app.post('/final-quest/complete',authMiddleware,async c=>{
 const user=c.get('user'),db=getDB(c.env),row=await db.prepare('SELECT id,started_at,completed_at FROM final_quest_assignments WHERE trip_id=? AND user_id=?').bind(user.tripId,user.id).first<{id:string;started_at:number;completed_at:number|null}>();if(!row)throw new AppError(409,'FINAL_QUEST_LOCKED','Your Final Quest is not unlocked');if(Date.now()<row.started_at)throw new AppError(409,'FINAL_QUEST_NOT_STARTED','Your Final Quest has not started');if(row.completed_at)return c.json({data:{completedAt:row.completed_at}})
 const now=Date.now();await db.prepare('UPDATE final_quest_assignments SET completed_at=? WHERE id=? AND completed_at IS NULL').bind(now,row.id).run();return c.json({data:{completedAt:now}})
})
export default app
