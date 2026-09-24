export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 310_000, hash: 'SHA-256' }, key, 256)
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function constantTimeEqual(left:string,right:string):boolean {
  if(left.length!==right.length)return false
  let difference=0
  for(let index=0;index<left.length;index++)difference|=left.charCodeAt(index)^right.charCodeAt(index)
  return difference===0
}
