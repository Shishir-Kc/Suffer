import { Hono } from 'hono'
import { z } from 'zod'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware } from '../../middleware/auth'
import { applyPenalty } from '../penalties/service'
import { REPORT_APPROVAL_THRESHOLD, REPORT_PENALTY_MINUTES } from '../../lib/constants'
import type { Env } from '../../types/env'

const app=new Hono<{Bindings:Env}>()
app.post('/trips/current/reports',authMiddleware,async c=>{
 const user=c.get('user'),input=z.object({reportedUserId:z.string().uuid(),reason:z.string().trim().min(3).max(1000)}).parse(await c.req.json()),db=getDB(c.env)
 if(input.reportedUserId===user.id)throw new AppError(400,'SELF_REPORT','You cannot report yourself')
 if(!await db.prepare('SELECT 1 FROM users WHERE id=? AND trip_id=?').bind(input.reportedUserId,user.tripId).first())throw new AppError(404,'USER_NOT_FOUND','Participant not found')
 const duplicate=await db.prepare("SELECT id FROM reports WHERE trip_id=? AND reported_user_id=? AND filed_by_user_id=? AND status='open'").bind(user.tripId,input.reportedUserId,user.id).first()
 if(duplicate)throw new AppError(409,'REPORT_ALREADY_OPEN','You already have an open report for this participant')
 const id=crypto.randomUUID(),now=Date.now()
 await db.batch([
  db.prepare("INSERT INTO reports(id,trip_id,reported_user_id,filed_by_user_id,reason,status,created_at) VALUES(?,?,?,?,?,'open',?)").bind(id,user.tripId,input.reportedUserId,user.id,input.reason,now),
  db.prepare('INSERT INTO report_approvals(id,report_id,approver_user_id,created_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),id,user.id,now),
 ])
 return c.json({data:{id,status:'open',approvalCount:1}},201)
})
app.post('/reports/:reportId/approve',authMiddleware,async c=>{
 const user=c.get('user'),db=getDB(c.env),report=await db.prepare('SELECT id,trip_id,reported_user_id,status FROM reports WHERE id=?').bind(c.req.param('reportId')).first<{id:string;trip_id:string;reported_user_id:string;status:string}>()
 if(!report||report.trip_id!==user.tripId)throw new AppError(404,'REPORT_NOT_FOUND','Report not found');if(report.status==='resolved')return c.json({data:{status:'resolved'}});if(report.reported_user_id===user.id)throw new AppError(403,'FORBIDDEN','The reported participant cannot approve this report')
 await db.prepare('INSERT OR IGNORE INTO report_approvals(id,report_id,approver_user_id,created_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),report.id,user.id,Date.now()).run()
 const count=await db.prepare('SELECT COUNT(*) AS count FROM report_approvals WHERE report_id=?').bind(report.id).first<{count:number}>();if((count?.count??0)>=REPORT_APPROVAL_THRESHOLD){await db.prepare("UPDATE reports SET status='resolved' WHERE id=? AND status='open'").bind(report.id).run();await applyPenalty(c.env,user.tripId,report.reported_user_id,REPORT_PENALTY_MINUTES,'report',report.id)}
 return c.json({data:{status:(count?.count??0)>=REPORT_APPROVAL_THRESHOLD?'resolved':'open',approvalCount:count?.count??0,required:REPORT_APPROVAL_THRESHOLD}})
})
app.get('/trips/current/reports',authMiddleware,async c=>{
 const user=c.get('user'),{results}=await getDB(c.env).prepare('SELECT r.id,r.reported_user_id,reported.name reported_name,r.filed_by_user_id,filed.name filed_by_name,r.reason,r.status,r.created_at,COUNT(a.id) approval_count FROM reports r JOIN users reported ON reported.id=r.reported_user_id JOIN users filed ON filed.id=r.filed_by_user_id LEFT JOIN report_approvals a ON a.report_id=r.id WHERE r.trip_id=? GROUP BY r.id ORDER BY r.created_at DESC').bind(user.tripId).all();return c.json({data:results})
})
export default app
