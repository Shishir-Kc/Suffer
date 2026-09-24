const inputText = await new Response(Bun.stdin.stream()).text()
const input = JSON.parse(inputText)
if (!input || typeof input.name !== 'string' || !Number.isSafeInteger(input.finalQuestTrigger) || !Array.isArray(input.users) || input.users.length !== 4) {
  throw new Error('Input must contain name, finalQuestTrigger (Unix milliseconds), and exactly four users')
}
for (const member of input.users) {
  if (typeof member.username !== 'string' || member.username.length < 3 || typeof member.password !== 'string' || member.password.length < 8) throw new Error('Each user needs a 3+ character username and 8+ character password')
}
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`
async function hash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 310000, hash: 'SHA-256' }, key, 256)
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
const tripId = crypto.randomUUID(), now = Date.now(), users = []
for (let index = 0; index < 4; index++) {
  const member = input.users[index], id = crypto.randomUUID(), salt = crypto.randomUUID()
  users.push({ id, username: member.username, passwordHash: `${salt}:${await hash(member.password, salt)}`, organizer: index === 0 })
}
const sql = [
  `INSERT INTO trips(id,name,created_at,final_quest_trigger) VALUES(${quote(tripId)},${quote(input.name)},${now},${input.finalQuestTrigger});`,
  ...users.map((u) => `INSERT INTO users(id,name,trip_id,created_at,username,password_hash,is_organizer) VALUES(${quote(u.id)},${quote(u.username)},${quote(tripId)},${now},${quote(u.username)},${quote(u.passwordHash)},${u.organizer ? 1 : 0});`),
  `UPDATE trips SET organizer_id=${quote(users[0].id)} WHERE id=${quote(tripId)};`,
]
console.log(sql.join('\n'))
console.error(`Trip ${tripId}; organizer username ${users[0].username}`)
