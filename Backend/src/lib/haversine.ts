const EARTH_RADIUS_METERS = 6_371_000
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (degrees: number) => degrees * Math.PI / 180
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
