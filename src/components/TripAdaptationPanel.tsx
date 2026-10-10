import React, { useState, useEffect } from "react";
import type { TripDraft, TripPlanVersion } from "../types/trip";
const addDays = (date: string, n: number) =>
  new Date(Date.parse(date) + n * 86400000).toISOString().slice(0, 10);
export function TripAdaptationPanel({
  trip,
  version,
  busy,
  onAction,
}: {
  trip: TripDraft;
  version: TripPlanVersion;
  busy: boolean;
  onAction: (action: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const [end, setEnd] = useState(addDays(trip.endDate, 1)),
    [start, setStart] = useState(trip.startDate),
    [budget, setBudget] = useState(trip.budget.amountINR);
  useEffect(() => {
    setEnd(addDays(trip.endDate, 1));
    setStart(trip.startDate);
    setBudget(trip.budget.amountINR);
  }, [trip.endDate, trip.startDate, trip.budget.amountINR]);
  const context = version.disruptions;
  return (
    <section
      className="neymo-card p-5 space-y-5 no-print"
      aria-label="Live conditions and trip changes"
    >
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div>
          <span className="eyebrow">A PLAN THAT CAN CHANGE WITH YOU</span>
          <h2 className="text-xl font-semibold mt-2">
            Live conditions & more time to explore
          </h2>
        </div>
        <button
          disabled={busy}
          className="primary-btn"
          onClick={() => void onAction("conditions", {})}
        >
          {busy ? "Updating…" : "Refresh live conditions"}
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        {version.plannerMode === "GROQ"
          ? "AI-assisted ranking of sourced places"
          : "Constraint-based planner · optional Groq ranking can be configured"}
        . Refresh checks the forecast and recent disruption reports. Changes to
        bookings are never automatic.
      </p>
      <div className="p-4 rounded-xl bg-amber-50 text-amber-950 space-y-2">
        <h3 className="font-semibold">Disruption watch</h3>
        <p className="text-sm">
          {context?.status === "REPORTS_FOUND"
            ? "Potential disruptions reported — verify affected areas and dates before travel."
            : context?.status === "NO_MATCHES"
              ? "No matching recent reports returned. This is not an all-clear."
              : "Disruption information unavailable. Refresh or check official advisories."}
        </p>
        {context && (
          <p className="text-xs">
            Checked {new Date(context.checkedAt).toLocaleString()} ·{" "}
            {context.note}
          </p>
        )}
        <ul className="space-y-3">
          {context?.reports.map((r) => (
            <li key={r.id} className="border-t border-amber-200 pt-2">
              <a
                className="underline font-medium"
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                {r.title}
              </a>
              <p className="text-xs">
                {r.publisher} · Published:{" "}
                {r.publishedAt || "date not provided"} · Report, not a verified
                active alert
              </p>
            </li>
          ))}
        </ul>
        <p className="text-xs">
          <a
            href="https://mausam.imd.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            IMD weather advisories
          </a>{" "}
          ·{" "}
          <a
            href="https://ndma.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            NDMA guidance
          </a>
        </p>
        <p className="text-xs">
          For a reported disaster, consider postponing and follow local
          authority directions. Indoor alternatives are for weather
          inconvenience, not guaranteed disaster shelters.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              confirm(
                `Extend through ${end}? Existing days will remain. New places and date-specific stays will be searched; no bookings are changed.`,
              )
            )
              void onAction("extend", { endDate: end, budgetINR: budget });
          }}
        >
          <h3 className="font-semibold">Extend your trip</h3>
          <p className="text-xs">
            Add new places in {trip.destinationCity}, without repeating
            scheduled stops. Up to 14 total days. Existing days stay intact.
          </p>
          <label className="block text-sm">
            New end date
            <input
              aria-label="Extension end date"
              className="form-field mt-1"
              type="date"
              required
              min={addDays(trip.endDate, 1)}
              max={addDays(trip.startDate, 13)}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Revised total budget ₹ (
            {trip.budget.basis === "PER_PERSON" ? "per person" : "whole group"})
            <input
              aria-label="Extension budget"
              className="form-field mt-1"
              type="number"
              min="1000"
              max="10000000"
              required
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </label>
          <button
            className="primary-btn"
            disabled={busy || trip.durationDays >= 14}
          >
            Find places for extra days
          </button>
        </form>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              confirm(
                `Rebuild the trip from ${start}? Current bookings will not change. Locked or completed trips cannot be moved.`,
              )
            )
              void onAction("reschedule", { startDate: start });
          }}
        >
          <h3 className="font-semibold">Postpone & rebuild</h3>
          <p className="text-xs">
            Choose new dates after reviewing conditions. Re-search places, stays
            and forecasts for the same trip length. New dates are not guaranteed
            safe.
          </p>
          <label className="block text-sm">
            New start date
            <input
              aria-label="Reschedule start date"
              className="form-field mt-1"
              type="date"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <button className="primary-btn" disabled={busy}>
            Reschedule my plan
          </button>
          <p className="text-xs">
            For changes to just one day, use Adapt my day, Stay back or
            Indoor-first below. Previous versions remain available.
          </p>
        </form>
      </div>
    </section>
  );
}
