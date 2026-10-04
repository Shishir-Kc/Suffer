"use client";

import { Check, Download, Wifi } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";

export function OfflineDownload() {
  const [saved, setSaved] = useState(false);
  return (
    <Card className="download-card">
      <div className="download-icon">
        {saved ? <Check size={19} /> : <Download size={19} />}
      </div>
      <div>
        <strong>
          {saved ? "Map marked ready." : "Save the map before you hike."}
        </strong>
        <p>
          {saved
            ? "This demo map is ready to explore without signal."
            : "Keep the trip area handy for the trail."}
        </p>
        {!saved && (
          <button
            type="button"
            className="map-save-action"
            onClick={() => setSaved(true)}
          >
            Mark as ready
          </button>
        )}
      </div>
      <Wifi size={18} className="wifi-icon" aria-hidden="true" />
    </Card>
  );
}
