export async function cacheTripTiles(onProgress?: (progress: number) => void) {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const cache = await caches.open("suffer-map-v1");
  const urls = ["/tiles/trip-area.pmtiles", "/manifest.json"];
  for (let index = 0; index < urls.length; index += 1) {
    try { await cache.add(urls[index]); } catch { /* Optional tile bundle may be added before launch. */ }
    onProgress?.((index + 1) / urls.length);
  }
}

