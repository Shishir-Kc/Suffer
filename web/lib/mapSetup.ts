export const TRIP_CENTER = { lat: 26.82, lng: 87.19 };
export const TRIP_BOUNDS: [[number, number], [number, number]] = [[87.1, 26.6], [87.3, 26.93]];

export const outdoorStyle = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#dfe8d6" } }],
} as const;

export const nightStyle = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#18231f" } }],
} as const;

export function isNight(now = new Date()) {
  return now.getHours() >= 18 || now.getHours() < 6;
}
