import { Env } from "../types/env.ts;

export function getDB(env:Env) {
  return env.DB
}
