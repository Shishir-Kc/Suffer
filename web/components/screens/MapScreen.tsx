"use client";

import { Compass, MapPinned } from "lucide-react";
import { RouteShell } from "@/components/RouteShell";
import { MapView } from "@/components/map/MapView";
import { OfflineDownload } from "@/components/map/OfflineDownload";
import { PlayerMarker } from "@/components/map/PlayerMarker";
import { QuestMarker } from "@/components/map/QuestMarker";

export function MapScreen() {
  return <RouteShell title="Trip map" eyebrow="Offline ready"><div className="map-page-heading"><div><span className="eyebrow">Bhedetar → Namje</span><h1>Where are we now?</h1></div><span className="map-mode"><Compass size={15} /> 3D terrain</span></div><OfflineDownload /><MapView fullScreen /><section className="map-legend"><div><MapPinned size={16} /><span>Quest spots</span><QuestMarker /></div><div><span className="legend-players"><PlayerMarker name="A" /><PlayerMarker name="M" color="terracotta" /></span><span>Crew positions</span></div></section><p className="map-note">GPS only wakes up during active quests. Your battery gets to enjoy the view too.</p><div className="sr-only">Map shows the Bhedetar to Namje trail, all quest locations, and synced crew positions.</div></RouteShell>;
}
