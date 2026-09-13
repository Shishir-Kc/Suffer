import type { GPSLog } from "@/types";

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineDistanceMeters(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return Math.round(EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function isInsideGeofence(position: Pick<GPSLog, "lat" | "lng">, target: { lat: number; lng: number; radiusMeters: number }) {
  return haversineDistanceMeters(position, target) <= target.radiusMeters;
}

export function watchGps(onPosition: (position: GPSLog) => void, onError?: (error: GeolocationPositionError) => void) {
  if (typeof navigator === "undefined" || !navigator.geolocation) return () => undefined;
  const watchId = navigator.geolocation.watchPosition(
    ({ coords, timestamp }) => onPosition({ playerId: "local", lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, timestamp: new Date(timestamp).toISOString() }),
    onError,
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}

