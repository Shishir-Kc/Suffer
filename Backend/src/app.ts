import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { errorHandler } from './middleware/error-handler'
import type { Env } from './types/env'
import authRoutes from './modules/auth/routes'
import tripRoutes from './modules/trips/routes'
import userRoutes from './modules/users/routes'
import photoRoutes from './modules/photos/routes'
import questRoutes from './modules/quests/routes'
import reportRoutes from './modules/reports/routes'

const app = new Hono<{ Bindings: Env }>()
app.onError(errorHandler)
app.use('/api/*',cors({origin:(origin,c)=>origin===c.env.FRONTEND_ORIGIN?origin:'',credentials:true,allowHeaders:['Content-Type','Last-Event-ID'],allowMethods:['GET','POST','DELETE','OPTIONS']}))
app.get('/', (c) => c.json({ data: { name: 'Suffer API', status: 'ok' } }))
app.get('/health', (c) => c.json({ data: { status: 'ok' } }))
app.route('/api/auth', authRoutes)
app.route('/api/trips', tripRoutes)
app.route('/api/users', userRoutes)
app.route('/api/photos', photoRoutes)
app.route('/api', questRoutes)
app.route('/api', reportRoutes)
export default app
