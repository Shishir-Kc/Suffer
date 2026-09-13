"use client";

import { Download, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { cacheTripTiles } from "@/lib/tileCache";
import { Card } from "@/components/ui/Card";

export function OfflineDownload() {
  const [progress, setProgress] = useState(0);
  useEffect(() => { cacheTripTiles(setProgress); }, []);
  return <Card className="download-card"><div className="download-icon"><Download size={19} /></div><div><strong>{progress >= 1 ? "Map saved for later." : "Save the map before you hike."}</strong><p>{progress >= 1 ? "You can explore the route without signal." : "Downloading the trip area. Do this now while you have WiFi."}</p><div className="progress-track"><span style={{ width: `${progress * 100}%` }} /></div></div><Wifi size={18} className="wifi-icon" aria-hidden="true" /></Card>;
}

