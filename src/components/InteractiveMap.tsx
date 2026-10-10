import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TripStop } from "../types/trip";
export function InteractiveMap({
  stops,
  selectedStopId,
  onSelectStop,
  destinationName,
}: {
  stops: TripStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
  destinationName: string;
}) {
  const root = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layer = useRef<L.LayerGroup | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const callback = useRef(onSelectStop);
  callback.current = onSelectStop;
  useEffect(() => {
    if (!root.current) return;
    const m = L.map(root.current, { scrollWheelZoom: false }).setView(
      [22, 79],
      5,
    );
    map.current = m;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    })
      .on("tileerror", () => setTilesFailed(true))
      .addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current,
      l = layer.current;
    if (!m || !l) return;
    l.clearLayers();
    const valid = stops.filter(
      (s) => !s.isAnchor && Number.isFinite(s.coordinates.lat),
    );
    valid.forEach((s, i) => {
      const marker = L.marker([s.coordinates.lat, s.coordinates.lng], {
        icon: L.divIcon({
          className: "",
          html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px #0004;background:${s.id === selectedStopId ? "#b7774d" : "#2c614a"};color:white;font-size:12px;font-weight:bold">${i + 1}</span>`,
          iconSize: [32, 32],
        }),
      }).addTo(l);
      const tip = document.createElement("span");
      tip.textContent = s.name;
      marker.bindTooltip(tip);
      marker.on("click", () => callback.current(s.id));
    });
    if (valid.length)
      m.fitBounds(
        L.latLngBounds(
          valid.map(
            (s) => [s.coordinates.lat, s.coordinates.lng] as [number, number],
          ),
        ),
        { padding: [40, 40], maxZoom: 13 },
      );
  }, [stops, selectedStopId]);
  return (
    <div className="neymo-card overflow-hidden">
      <div className="p-4 flex justify-between text-sm font-semibold">
        <span>Around {destinationName}</span>
        <span className="text-xs text-[var(--text-muted)]">
          {stops.length} stops
        </span>
      </div>
      <div
        ref={root}
        className="h-[420px] relative z-0"
        aria-label={`Map of ${destinationName}`}
      />
      <div className="p-4 space-y-2">
        <p className="text-[10px] text-[var(--text-muted)]">
          {tilesFailed
            ? "Map tiles could not load. Use the stop links below."
            : "Place locations only, not a verified driving route. User-entered anchors are omitted until their location is verified."}
        </p>
        {stops.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelectStop(s.id)}
            className={`block text-left w-full text-xs p-2 rounded-lg ${selectedStopId === s.id ? "bg-[#e0e9d7]" : "hover:bg-[#edf0e7]"}`}
          >
            {i + 1}. {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
