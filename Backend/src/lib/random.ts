export type Random = () => number
export function pickRandom<T>(items: readonly T[], random: Random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 0x1_0000_0000): T {
  if (!items.length) throw new Error('Cannot pick from an empty list')
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}
