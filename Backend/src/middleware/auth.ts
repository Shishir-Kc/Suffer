import { jwtVerify, SignJWT } from 'jose'
import type { MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { AppError } from './error-handler'
import { COOKIE_NAME, JWT_EXPIRY_SECONDS } from '../lib/constants'
import type { Env } from '../types/env'
export type AuthUser = { id: string; tripId: string; isOrganizer: boolean }
type Variables = { user: AuthUser }
const secret = (env: Env) => new TextEncoder().encode(env.JWT_SECRET)
const cookieName = (env: Env) => env.COOKIE_NAME || COOKIE_NAME
export async function issueSession(env: Env, user: AuthUser): Promise<string> {
  return new SignJWT({ tripId: user.tripId, isOrganizer: user.isOrganizer }).setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuedAt().setExpirationTime(`${JWT_EXPIRY_SECONDS}s`).sign(secret(env))
}
export function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string, env: Env) {
  setCookie(c, cookieName(env), token, { httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: (c.env.COOKIE_SAME_SITE || 'Lax') as 'Lax' | 'Strict' | 'None', path: '/', maxAge: JWT_EXPIRY_SECONDS })
}
export function clearSessionCookie(c: Parameters<typeof deleteCookie>[0], env: Env) { deleteCookie(c, cookieName(env), { path: '/' }) }
export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const token = getCookie(c, cookieName(c.env))
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
  try {
    const { payload } = await jwtVerify(token, secret(c.env))
    if (!payload.sub || typeof payload.tripId !== 'string') throw new Error('Invalid session')
    c.set('user', { id: payload.sub, tripId: payload.tripId, isOrganizer: payload.isOrganizer === true })
  } catch { throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired session') }
  await next()
}
