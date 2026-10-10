import React, { useRef, useEffect, useState } from "react";
import { X, Download, Printer, Copy } from "lucide-react";
import type { TripDraft, TripPlanVersion } from "../types/trip";
export function ExportModal({
  trip,
  version,
  onClose,
}: {
  trip: TripDraft;
  version: TripPlanVersion;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const json = JSON.stringify({ trip, plan: version }, null, 2);
  useEffect(() => {
    ref.current?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `TripCraft-${trip.destinationCity}-${trip.startDate}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="export-dialog rounded-2xl border-0 p-0 m-auto w-[min(700px,94vw)] bg-[#f7f9f2] text-[var(--text)] backdrop:bg-black/40"
    >
      <div className="no-print p-5 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your weekend, to take along.</h2>
        <button aria-label="Close export" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="print-plan p-6 max-h-[65vh] overflow-auto">
        <h2 className="text-2xl font-semibold">
          {trip.originCity} → {trip.destinationCity}
        </h2>
        <p className="text-sm my-2">
          {trip.startDate} – {trip.endDate} ·{" "}
          {trip.adultCount + trip.childCount} travelers · {version.dataMode}{" "}
          plan
        </p>
        <p className="text-xs mb-4">
          Provisional estimate: ₹
          {(version.budgetBreakdown.plannedTotalPaise / 100).toLocaleString(
            "en-IN",
          )}
          . Unknown transport, fees and unquoted stays excluded.
        </p>
        {version.days.map((d) => (
          <section key={d.dayNumber} className="py-3 border-t">
            <h3 className="font-semibold">
              Day {d.dayNumber} · {d.date} · {d.title}
            </h3>
            {d.stops.length ? (
              d.stops.map((s) => (
                <div className="my-3 text-xs" key={s.id}>
                  <strong>
                    {s.timeSlot} — {s.name}
                  </strong>
                  <p>{s.area}</p>
                  <p>{s.reason}</p>
                  <p>
                    Hours:{" "}
                    {s.openingHours.value || "Unknown; verify before visiting"}
                  </p>
                  <p>{s.publicMapLink}</p>
                </div>
              ))
            ) : (
              <p className="text-sm mt-2">Stay back. No outings scheduled.</p>
            )}
            <p className="text-xs text-[var(--text-muted)]">{d.notes}</p>
          </section>
        ))}
        <h3 className="font-semibold mt-5">Budget breakdown</h3>
        {version.budgetBreakdown.items.map((i) => (
          <p className="text-xs mt-2" key={i.category}>
            {i.label}: ₹{(i.amountPaise / 100).toLocaleString("en-IN")} ·{" "}
            {i.notes}
          </p>
        ))}
        <h3 className="font-semibold mt-5">Sources & limitations</h3>
        {version.warnings?.map((w) => (
          <p key={w} className="text-xs mt-2">
            {w}
          </p>
        ))}
        {version.sources.map((s) => (
          <p key={s.id} className="text-xs mt-2">
            {s.title} — {s.url}
          </p>
        ))}
      </div>
      <div className="no-print p-5 flex flex-wrap gap-3 border-t">
        <button
          className="neymo-button px-3 text-xs"
          onClick={() => window.print()}
        >
          <Printer size={16} /> Print / PDF
        </button>
        <button
          className="neymo-button px-3 text-xs"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(json);
              setCopied(true);
            } catch {
              setCopyError(true);
            }
          }}
        >
          <Copy size={16} />
          {copied ? "Copied" : copyError ? "Use Download JSON" : "Copy JSON"}
        </button>
        <button className="primary-btn" onClick={download}>
          <Download size={16} /> Download JSON
        </button>
      </div>
    </dialog>
  );
}
