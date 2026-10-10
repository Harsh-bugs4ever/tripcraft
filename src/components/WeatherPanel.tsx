import React, { useState } from "react";
import { CloudSun, CloudRain, ArrowRight } from "lucide-react";
import type { DayWeather, WeatherPreferenceType } from "../types/trip";
export function WeatherPanel({
  weather,
  currentAdjustment,
  onApplyWeatherAdjustment,
  dayNumber,
  live = true,
}: {
  weather: DayWeather;
  currentAdjustment?: WeatherPreferenceType;
  onApplyWeatherAdjustment: (
    p: WeatherPreferenceType,
    day?: number,
    scenario?: string,
  ) => void;
  dayNumber: number;
  live?: boolean;
}) {
  const [scenario, setScenario] = useState("");
  return (
    <div className="neymo-card p-5 space-y-4">
      <div className="flex justify-between gap-3">
        <div>
          <span className="eyebrow">
            MAKE ROOM FOR PLAN B · DAY {dayNumber}
          </span>
          <h3 className="text-lg font-semibold mt-2 flex gap-2 items-center">
            <CloudSun size={22} />
            {weather.condition}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {weather.status === "SOURCED"
              ? `${weather.temperatureC ?? "—"}°C max · ${weather.precipitationChance ?? "—"}% rain chance · Open-Meteo`
              : "No forecast available. Do not assume favorable conditions."}
          </p>
        </div>
      </div>
      {weather.advisory && (
        <p className="text-xs p-3 bg-[#e7edde] rounded-lg">
          {weather.advisory}
        </p>
      )}
      {weather.status === "SOURCED" && (
        <div className="text-xs space-y-2">
          <p>
            Rainfall: {weather.rainMm ?? "—"} mm · Max wind:{" "}
            {weather.windKph ?? "—"} km/h · AQI: unavailable
          </p>
          <p>
            App screening: {weather.risk || "UNKNOWN"} · Updated{" "}
            {new Date(weather.sourceTimestamp).toLocaleString()}
          </p>
          {weather.risks?.map((r) => (
            <p key={r}>• {r}</p>
          ))}
          <a
            className="underline"
            href={weather.sourceUrl || "https://open-meteo.com/"}
            target="_blank"
            rel="noreferrer"
          >
            View forecast source
          </a>
        </div>
      )}
      {!live && (
        <label className="flex flex-wrap gap-3 items-center text-xs font-semibold">
          What if the weather changes?
          <select
            aria-label="Weather scenario"
            className="form-field !w-auto"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          >
            <option value="">Use available forecast</option>
            <option value="rain">Simulate rain</option>
            <option value="heat">Simulate heat</option>
            <option value="poor-air">Simulate poor air quality</option>
            <option value="pleasant">Simulate pleasant weather</option>
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            [
              "AUTO",
              "Adapt my day",
              live ? "Refresh & use live forecast" : "Use outlook / scenario",
            ],
            ["STAY_BACK", "Stay back", "No outings. Just slow down."],
            ["LOW_EFFORT", "Low-effort outing", "One indoor stop & a meal"],
            [
              "FULL_ADJUSTED_DAY",
              "Indoor-first day",
              "A gentler change of scene",
            ],
          ] as const
        ).map(([value, title, sub]) => (
          <button
            key={value}
            aria-pressed={currentAdjustment === value}
            onClick={() =>
              onApplyWeatherAdjustment(
                value,
                dayNumber,
                live ? undefined : scenario || undefined,
              )
            }
            className={`p-3 text-left border rounded-xl text-xs ${currentAdjustment === value ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[#c8d4bf] bg-[#f6f8f0]"}`}
          >
            <strong className="block mb-1">{title}</strong>
            <span className="text-[10px] opacity-80">{sub}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">
        Only day {dayNumber} changes. Locked stops are preserved; unlock outings
        before Stay back. High-risk forecasts pause unlocked outings instead of
        assuming an indoor venue is safe.
      </p>
    </div>
  );
}
