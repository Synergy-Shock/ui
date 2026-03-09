import { useState } from "react";
import { Background } from "@/registry/synergy/background";

export function BackgroundDemo() {
  const [zoom, setZoom] = useState(0.25);
  const [speed, setSpeed] = useState(0.5);

  return (
    <div className="not-content flex flex-col gap-4">
      <div className="border rounded-xl overflow-hidden shadow-sm relative w-full h-[400px]">
        <Background zoom={zoom} speed={speed} className="absolute inset-0" />
      </div>
      <div className="bg-background border rounded-xl p-6 flex flex-col sm:flex-row gap-8 shadow-sm">
        <div className="flex-1">
          <label className="text-sm font-semibold mb-3 flex justify-between">
            <span>Zoom</span>
            <span className="text-muted-foreground">{zoom.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-semibold mb-3 flex justify-between">
            <span>Speed</span>
            <span className="text-muted-foreground">{speed.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
