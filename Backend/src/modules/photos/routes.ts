import { Hono } from 'hono'
import { z } from 'zod'
import { getDB } from '../../db/client'
import { AppError } from '../../middleware/error-handler'
import { authMiddleware } from '../../middleware/auth'
import { authorizedDownloadUrl, deletePhoto, downloadPhoto, uploadPhoto } from '../../lib/b2'
import type { Env } from '../../types/env'
import { PHOTO_JOB_TIMEOUT_MS, FACE_SERVICE_TIMEOUT_MS, FACE_ENROLL_TIMEOUT_MS, SSE_POLL_INTERVAL_MS } from '../../lib/constants'

type Face={user_id:string;embedding_json:string}
type Photo={id:string;trip_id:string;uploader_id:string;storage_key:string;storage_file_id:string;content_type:string;created_at:number;processing_status:string}
const app=new Hono<{Bindings:Env}>(), imageTypes=new Set(['image/jpeg','image/png','image/webp'])
const auth=(env:Env)=>`Bearer ${env.FACE_SERVICE_TOKEN}`
function configured(env:Env){if(!env.B2_APPLICATION_KEY_ID||!env.B2_APPLICATION_KEY||!env.B2_BUCKET_ID||!env.B2_BUCKET_NAME||!env.FACE_SERVICE_URL||!env.FACE_CALLBACK_URL||!env.FACE_SERVICE_TOKEN||!env.FACE_CALLBACK_TOKEN)throw new AppError(503,'SERVICE_NOT_CONFIGURED','Photo services are not configured')}
function sameSecret(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function dispatch(env:Env,photo:Photo){
 const db=getDB(env),imageUrl=await authorizedDownloadUrl(env,photo.storage_key),{results:faces}=await db.prepare('SELECT user_id,embedding_json FROM face_enrollments WHERE user_id IN (SELECT id FROM users WHERE trip_id=?)').bind(photo.trip_id).all<Face>()
 const job=await db.prepare('SELECT attempts FROM photo_jobs WHERE photo_id=?').bind(photo.id).first<{attempts:number}>();if(!job||!faces.length)return
 for(let attempt=job.attempts+1;attempt<=3;attempt++){
  await db.prepare("UPDATE photo_jobs SET attempts=?,status='processing',updated_at=? WHERE photo_id=?").bind(attempt,Date.now(),photo.id).run()
  try{const response=await fetch(`${env.FACE_SERVICE_URL!.replace(/\/$/,'')}/v1/jobs`,{method:'POST',headers:{Authorization:auth(env),'Content-Type':'application/json'},body:JSON.stringify({jobId:photo.id,imageUrl,contentType:photo.content_type,references:faces.map(f=>({userId:f.user_id,embedding:JSON.parse(f.embedding_json)})),callbackUrl:env.FACE_CALLBACK_URL,callbackToken:env.FACE_CALLBACK_TOKEN}),signal:AbortSignal.timeout(FACE_SERVICE_TIMEOUT_MS)});if(response.ok)return}catch{/* transient failure retries */}
 }
 await db.prepare("UPDATE photo_jobs SET status='abandoned',updated_at=? WHERE photo_id=?").bind(Date.now(),photo.id).run()
}

export async function retryTimedOutJobs(env:Env){
 const db=getDB(env),cutoff=Date.now()-PHOTO_JOB_TIMEOUT_MS
 const {results}=await db.prepare("SELECT j.photo_id,p.id,p.trip_id,p.uploader_id,p.storage_key,p.storage_file_id,p.content_type,p.created_at,p.processing_status FROM photo_jobs j JOIN photos p ON p.id=j.photo_id WHERE j.status IN ('pending','processing') AND j.updated_at<=? ORDER BY j.updated_at LIMIT 8").bind(cutoff).all<Photo>()
 for(const photo of results){try{await dispatch(env,photo)}catch{const state=await db.prepare('SELECT attempts FROM photo_jobs WHERE photo_id=?').bind(photo.id).first<{attempts:number}>();const attempts=(state?.attempts??0)+1;await db.prepare("UPDATE photo_jobs SET attempts=?,status=?,updated_at=? WHERE photo_id=?").bind(attempts,attempts>=3?'abandoned':'pending',Date.now(),photo.id).run()}}
}

app.post('/enrollment',authMiddleware,async c=>{
 configured(c.env);const userId=c.get('user').id;if(await getDB(c.env).prepare('SELECT 1 FROM face_enrollments WHERE user_id=?').bind(userId).first())throw new AppError(409,'ALREADY_ENROLLED','Face enrollment is already complete');const type=(c.req.header('content-type')||'').split(';')[0];if(!imageTypes.has(type))throw new AppError(400,'INVALID_IMAGE_TYPE','Upload a JPEG, PNG, or WebP selfie')
 const response=await fetch(`${c.env.FACE_SERVICE_URL!.replace(/\/$/,'')}/v1/enroll`,{method:'POST',headers:{Authorization:auth(c.env),'Content-Type':type},body:await c.req.arrayBuffer(),signal:AbortSignal.timeout(FACE_ENROLL_TIMEOUT_MS)})
 if(!response.ok)throw new AppError(502,'FACE_SERVICE_ERROR','Face enrollment failed; retry with another selfie')
 const result=z.object({faceCount:z.number().int(),embedding:z.array(z.number().finite()).min(1)}).parse(await response.json())
 if(result.faceCount!==1)throw new AppError(422,'FACE_COUNT_INVALID',result.faceCount===0?'No face found; try a clearer selfie':'More than one face found; use a solo selfie')
 await getDB(c.env).prepare('INSERT INTO face_enrollments(user_id,embedding_json,enrolled_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET embedding_json=excluded.embedding_json,enrolled_at=excluded.enrolled_at').bind(userId,JSON.stringify(result.embedding),Date.now()).run()
 return c.json({data:{enrolled:true}},201)
})
app.get('/enrollment',authMiddleware,async c=>{const exists=await getDB(c.env).prepare('SELECT 1 FROM face_enrollments WHERE user_id=?').bind(c.get('user').id).first();return c.json({data:{enrolled:!!exists}})})
app.post('/',authMiddleware,async c=>{
 configured(c.env);const user=c.get('user'),db=getDB(c.env),type=(c.req.header('content-type')||'').split(';')[0];if(!imageTypes.has(type))throw new AppError(400,'INVALID_IMAGE_TYPE','Upload a JPEG, PNG, or WebP image')
 if(!await db.prepare('SELECT 1 FROM face_enrollments WHERE user_id=?').bind(user.id).first())throw new AppError(428,'ENROLLMENT_REQUIRED','Enroll your face before uploading photos')
 const bytes=await c.req.arrayBuffer(),id=crypto.randomUUID(),key=`${user.tripId}/${id}`,stored=await uploadPhoto(c.env,key,type,bytes),now=Date.now(),photo:Photo={id,trip_id:user.tripId,uploader_id:user.id,storage_key:key,storage_file_id:stored.fileId,content_type:type,created_at:now,processing_status:'processing'}
 try{await db.batch([db.prepare("INSERT INTO photos(id,uploader_id,trip_id,storage_key,storage_file_id,content_type,created_at,processing_status) VALUES(?,?,?,?,?,?,?,'processing')").bind(id,user.id,user.tripId,key,stored.fileId,type,now),db.prepare("INSERT INTO photo_jobs(id,photo_id,attempts,status,created_at,updated_at) VALUES(?,?,0,'pending',?,?)").bind(id,id,now,now)])}catch(error){await deletePhoto(c.env,key,stored.fileId);throw error}
 c.executionCtx.waitUntil(dispatch(c.env,photo))
 return c.json({data:{id,uploaderId:user.id,createdAt:now,processingStatus:'processing'}},201)
})
app.get('/',authMiddleware,async c=>{
 const user=c.get('user'),db=getDB(c.env);if(!await db.prepare('SELECT 1 FROM face_enrollments WHERE user_id=?').bind(user.id).first())throw new AppError(428,'ENROLLMENT_REQUIRED','Enroll your face before opening the gallery');const filter=c.req.query('userId');if(filter&&!await db.prepare('SELECT 1 FROM users WHERE id=? AND trip_id=?').bind(filter,user.tripId).first())throw new AppError(404,'USER_NOT_FOUND','Participant not found')
 const sql=`SELECT p.id,p.content_type,p.created_at,p.processing_status,u.id uploader_id,u.username uploader_username,u.name uploader_name FROM photos p JOIN users u ON u.id=p.uploader_id WHERE p.trip_id=? ${filter?'AND EXISTS(SELECT 1 FROM photo_tags x WHERE x.photo_id=p.id AND x.user_id=?)':''} ORDER BY p.created_at DESC`,query=db.prepare(sql),{results}=filter?await query.bind(user.tripId,filter).all<Record<string,unknown>>():await query.bind(user.tripId).all<Record<string,unknown>>()
 const gallery=[];for(const photo of results){const {results:tags}=await db.prepare('SELECT u.id,u.username,u.name FROM photo_tags t JOIN users u ON u.id=t.user_id WHERE t.photo_id=? ORDER BY u.name').bind(photo.id).all();gallery.push({...photo,tags})}return c.json({data:gallery})
})
app.get('/:id/content',authMiddleware,async c=>{
 configured(c.env);if(!await getDB(c.env).prepare('SELECT 1 FROM face_enrollments WHERE user_id=?').bind(c.get('user').id).first())throw new AppError(428,'ENROLLMENT_REQUIRED','Enroll your face before opening the gallery');const photo=await getDB(c.env).prepare('SELECT storage_file_id,content_type FROM photos WHERE id=? AND trip_id=?').bind(c.req.param('id'),c.get('user').tripId).first<{storage_file_id:string;content_type:string}>();if(!photo)throw new AppError(404,'PHOTO_NOT_FOUND','Photo not found')
 const response=await downloadPhoto(c.env,photo.storage_file_id);return new Response(response.body,{headers:{'Content-Type':photo.content_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
})
app.delete('/:id',authMiddleware,async c=>{
 configured(c.env);const db=getDB(c.env),user=c.get('user'),photo=await db.prepare('SELECT storage_key,storage_file_id FROM photos WHERE id=? AND trip_id=? AND uploader_id=?').bind(c.req.param('id'),user.tripId,user.id).first<{storage_key:string;storage_file_id:string}>();if(!photo)throw new AppError(404,'PHOTO_NOT_FOUND','Photo not found')
 await deletePhoto(c.env,photo.storage_key,photo.storage_file_id);await db.prepare('DELETE FROM photos WHERE id=?').bind(c.req.param('id')).run();return c.json({data:{deleted:true}})
})
app.post('/callback',async c=>{
 if(!c.env.FACE_CALLBACK_TOKEN||!sameSecret(c.req.header('authorization')||'',`Bearer ${c.env.FACE_CALLBACK_TOKEN}`))throw new AppError(401,'UNAUTHORIZED','Invalid face-service callback')
 const input=z.object({jobId:z.string().uuid(),status:z.enum(['complete','failed']),matchedUserIds:z.array(z.string().uuid()).optional()}).parse(await c.req.json()),db=getDB(c.env),photo=await db.prepare('SELECT id,trip_id FROM photos WHERE id=?').bind(input.jobId).first<{id:string;trip_id:string}>();if(!photo)throw new AppError(404,'PHOTO_NOT_FOUND','Photo job not found')
 if(input.status==='failed'){const done=await db.prepare("SELECT 1 FROM photo_jobs WHERE photo_id=? AND status='complete'").bind(photo.id).first();if(done)return c.json({data:{accepted:true}});const [job,stored]=await Promise.all([db.prepare('SELECT attempts FROM photo_jobs WHERE photo_id=?').bind(photo.id).first<{attempts:number}>(),db.prepare('SELECT storage_file_id,content_type,uploader_id,storage_key,created_at,processing_status FROM photos WHERE id=?').bind(photo.id).first<Omit<Photo,'trip_id'>&{trip_id:string}>()]);if(job&&stored&&job.attempts<3){const full={...stored,trip_id:photo.trip_id};c.executionCtx.waitUntil(dispatch(c.env,full))}else await db.prepare("UPDATE photo_jobs SET status='abandoned',updated_at=? WHERE photo_id=?").bind(Date.now(),photo.id).run();return c.json({data:{accepted:true}})}
 const currentJob=await db.prepare('SELECT status FROM photo_jobs WHERE photo_id=?').bind(photo.id).first<{status:string}>();if(currentJob?.status==='complete')return c.json({data:{accepted:true}})
 const now=Date.now();for(const id of new Set(input.matchedUserIds??[])){if(await db.prepare('SELECT 1 FROM users WHERE id=? AND trip_id=?').bind(id,photo.trip_id).first())await db.prepare('INSERT OR IGNORE INTO photo_tags(id,photo_id,user_id,created_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),photo.id,id,now).run()}
 await db.batch([db.prepare("UPDATE photos SET processing_status='complete' WHERE id=?").bind(photo.id),db.prepare("UPDATE photo_jobs SET status='complete',updated_at=? WHERE photo_id=?").bind(now,photo.id),db.prepare("INSERT INTO gallery_events(trip_id,photo_id,event_type,created_at) VALUES(?,?,'photo_tagged',?)").bind(photo.trip_id,photo.id,now)])
 return c.json({data:{accepted:true}})
})
app.get('/events',authMiddleware,async c=>{
 const db=getDB(c.env),tripId=c.get('user').tripId;if(!await db.prepare('SELECT 1 FROM face_enrollments WHERE user_id=?').bind(c.get('user').id).first())throw new AppError(428,'ENROLLMENT_REQUIRED','Enroll your face before opening the gallery');let after=Number(c.req.header('last-event-id')??c.req.query('after')??0);if(!Number.isSafeInteger(after)||after<0)after=0
 let timer:ReturnType<typeof setInterval>|undefined,closed=false
 const stream=new ReadableStream<Uint8Array>({start(controller){const encoder=new TextEncoder();controller.enqueue(encoder.encode('retry: 3000\n\n'));timer=setInterval(async()=>{if(closed)return;try{const {results}=await db.prepare('SELECT id,photo_id FROM gallery_events WHERE trip_id=? AND id>? ORDER BY id LIMIT 50').bind(tripId,after).all<{id:number;photo_id:string}>();for(const event of results){after=event.id;controller.enqueue(encoder.encode(`id: ${event.id}\nevent: photo_tagged\ndata: ${JSON.stringify({photoId:event.photo_id})}\n\n`))}if(!results.length)controller.enqueue(encoder.encode(': keepalive\n\n'))}catch{closed=true;if(timer)clearInterval(timer);try{controller.close()}catch{}}},SSE_POLL_INTERVAL_MS)},cancel(){closed=true;if(timer)clearInterval(timer)}})
 return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'}})
})
export default app
