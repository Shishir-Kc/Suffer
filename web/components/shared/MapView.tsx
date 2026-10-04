"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Mountain, LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Quest } from "@/types";
import { isNight, nightStyle, outdoorStyle, TRIP_CENTER } from "@/lib/mapSetup";

export function MapView({
  target,
  fullScreen = false,
}: {
  target?: Quest["targetCoords"];
  fullScreen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    import("maplibre-gl")
      .then(({ Map }) => {
        if (cancelled || !containerRef.current) return;
        const style = (isNight()
          ? nightStyle
          : outdoorStyle) as unknown as import("maplibre-gl").StyleSpecification;
        map = new Map({
          container: containerRef.current,
          style,
          center: [TRIP_CENTER.lng, TRIP_CENTER.lat],
          zoom: 10.8,
          pitch: 45,
          attributionControl: false,
        });
        map.once("load", () => setReady(true));
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);
  return (
    <div className={`map-frame ${fullScreen ? "map-full" : ""}`}>
      <div
        className="map-grid"
        ref={containerRef}
        aria-label="Offline map for the trip area"
      />
      <div className="map-contours" aria-hidden="true" />
      <div className="map-label map-label-top">Bhedetar</div>
      <div className="map-label map-label-bottom">Namje village</div>
      <div className="map-trail" aria-hidden="true" />
      <div className="user-marker">
        <LocateFixed size={17} />
      </div>
      {target && (
        <div className="target-marker">
          <MapPin size={18} />
        </div>
      )}
      <div className="terrain-chip">
        <Mountain size={14} aria-hidden="true" /> 3D terrain{" "}
        {ready ? "on" : "ready"}
      </div>
    </div>
  );
}
