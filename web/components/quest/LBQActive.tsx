"use client";

import { AlertTriangle, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import type { Quest } from "@/types";
import { haversineDistanceMeters, watchGps } from "@/lib/gps";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MapView } from "@/components/map/MapView";

export function LBQActive({ quest, onComplete }: { quest: Quest; onComplete: () => void }) {
  const [distance, setDistance] = useState(340);
  const [accuracy, setAccuracy] = useState(18);
  useEffect(() => watchGps((position) => { setAccuracy(Math.round(position.accuracy)); if (quest.targetCoords) setDistance(haversineDistanceMeters(position, quest.targetCoords)); }), [quest]);
  return <div className="quest-active-layout"><Card className="quest-brief"><span className="eyebrow">Location quest</span><h1>{quest.title}</h1><p>{quest.description}</p><div className="distance-callout"><LocateFixed size={21} aria-hidden="true" /><div><strong>You&apos;re about {distance}m away.</strong><span>Keep walking. You&apos;ve got this.</span></div></div>{accuracy > 50 && <div className="accuracy-warning"><AlertTriangle size={17} aria-hidden="true" /> GPS is a little fuzzy ({accuracy}m). Step outside for a clearer signal.</div>}</Card><MapView target={quest.targetCoords} /><Button onClick={onComplete} className="full-width"><MapPin size={17} aria-hidden="true" /> Mark arrival</Button></div>;
}

