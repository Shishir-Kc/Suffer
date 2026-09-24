import type { Env } from '../../types/env'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { MINUTE_MS } from '../../lib/constants'

export type PenaltySource='tbq_failure'|'report'
export async function applyPenalty(env:Env,tripId:string,userId:string,minutes:number,source:PenaltySource,sourceId:string){
 const db=getDB(env),member=await db.prepare('SELECT 1 FROM users WHERE id=? AND trip_id=?').bind(userId,tripId).first()
 if(!member)throw new AppError(404,'USER_NOT_FOUND','Participant not found')
 await db.prepare('INSERT OR IGNORE INTO penalties(id,trip_id,user_id,minutes,source,source_id,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tripId,userId,minutes,source,sourceId,Date.now()).run()
 const [trip,totals]=await Promise.all([
  db.prepare('SELECT final_quest_trigger FROM trips WHERE id=?').bind(tripId).first<{final_quest_trigger:number|null}>(),
  db.prepare('SELECT COALESCE(SUM(minutes),0) AS total FROM penalties WHERE trip_id=? AND user_id=?').bind(tripId,userId).first<{total:number}>(),
 ])
 if(trip?.final_quest_trigger){
  const [group,individual]=await Promise.all([
   db.prepare('SELECT MAX(g.completed_at) AS latest FROM group_quest_assignments g JOIN quest_themes t ON t.id=g.theme_id WHERE t.trip_id=? AND g.status=\'completed\'').bind(tripId).first<{latest:number|null}>(),
   db.prepare('SELECT MAX(a.completed_at) AS latest FROM quest_assignments a JOIN quest_themes t ON t.id=a.theme_id WHERE t.trip_id=? AND a.status=\'completed\'').bind(tripId).first<{latest:number|null}>(),
  ])
  const base=Math.max(trip.final_quest_trigger,group?.latest??0,individual?.latest??0),start=base+(totals?.total??0)*MINUTE_MS
  await db.prepare('UPDATE final_quest_assignments SET started_at=? WHERE trip_id=? AND user_id=? AND completed_at IS NULL AND started_at>?').bind(start,tripId,userId,Date.now()).run()
 }
}
export async function totalPenaltyMinutes(env:Env,tripId:string,userId:string){
 const row=await getDB(env).prepare('SELECT COALESCE(SUM(minutes),0) AS total FROM penalties WHERE trip_id=? AND user_id=?').bind(tripId,userId).first<{total:number}>()
 return row?.total??0
}
