import { WelcomeExperience } from "./components/WelcomeExperience";
import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { DemoModeBanner } from "./components/DemoModeBanner";
import { HomeHero } from "./components/HomeHero";
import { TripWizard } from "./components/TripWizard";
import { ItineraryWorkspace } from "./components/ItineraryWorkspace";
import { SavedTripsView } from "./components/SavedTripsView";
import { TripAdaptationPanel } from "./components/TripAdaptationPanel";
import { Footer } from "./components/Footer";
import { PlanningLoading } from "./components/PlanningLoading";
import type {
  TripDraft,
  TripPlanVersion,
  GenerationJob,
  WeatherPreferenceType,
} from "./types/trip";
export async function api(url: string, body?: unknown, method?: string) {
  const r = await fetch("/api/v1" + url, {
    method: method || (body !== undefined ? "POST" : "GET"),
    headers:
      body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return null;
  const data = await r
    .json()
    .catch(() => ({
      detail:
        "Unexpected server response. Check the server connection and retry.",
    }));
  if (!r.ok)
    throw new Error(
      data.detail || data.error || "Request failed. Please retry.",
    );
  return data;
}
export default function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !sessionStorage.getItem("tripcraft-welcomed") && (!location.hash || location.hash === "#/"); }
    catch { return !location.hash; }
  });
  const enterWebsite = () => {
    try { sessionStorage.setItem("tripcraft-welcomed", "yes"); } catch {}
    setShowWelcome(false);
    requestAnimationFrame(() => document.getElementById("main-content")?.focus());
  };
  const [view, updateView] = useState<
      "home" | "wizard" | "generation" | "workspace" | "saved"
    >("home"),
    [mode, setMode] = useState<"DEMO" | "LIVE">("LIVE"),
    [setupRequired, setSetupRequired] = useState(false),
    [contrast, setContrast] = useState(false),
    [draft, setDraft] = useState<Partial<TripDraft>>(),
    [trip, setTrip] = useState<TripDraft | null>(null),
    [version, setVersion] = useState<TripPlanVersion | null>(null),
    [trips, setTrips] = useState<TripDraft[]>([]),
    [job, setJob] = useState<GenerationJob | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const setView = (next: typeof view) => {
    const hash =
      next === "workspace" && trip
        ? `#/trips/${trip.id}`
        : next === "generation" && job
          ? `#/jobs/${job.jobId}`
          : `#/${{ home: "", wizard: "plan", saved: "saved", workspace: "itinerary", generation: "planning" }[next]}`;
    window.history.pushState(null, "", hash);
    updateView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    let sequence = 0;
    const restoreRoute = async () => {
      const request = ++sequence;
      const route = window.location.hash.slice(1) || "/";
      const simple = {
        "/": "home",
        "/plan": "wizard",
        "/saved": "saved",
        "/itinerary": "workspace",
      } as const;
      if (route in simple) {
        updateView(simple[route as keyof typeof simple]);
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      const match = route.match(/^\/(trips|jobs)\/([a-zA-Z0-9-]+)$/);
      if (!match) {
        if (["escapes", "questions"].includes(route)) {
          updateView("home");
          requestAnimationFrame(() =>
            document.getElementById(route)?.scrollIntoView(),
          );
          return;
        }
        if (route === "main-content") return;
        updateView("home");
        setMessage(
          "That page is unavailable. Choose a page from the navigation.",
        );
        window.history.replaceState(null, "", "#/");
        return;
      }
      try {
        if (match[1] === "trips") {
          const data = await api("/trips/" + match[2]);
          if (request !== sequence) return;
          accept(data);
          if (data.activeVersion) updateView("workspace");
          else {
            setDraft(data.trip);
            updateView("wizard");
          }
        } else {
          const nextJob = await api("/jobs/" + match[2]);
          const data = await api("/trips/" + nextJob.tripId);
          if (request !== sequence) return;
          accept(data);
          setJob(nextJob);
          updateView(
            ["SUCCEEDED", "PARTIAL"].includes(nextJob.status)
              ? "workspace"
              : "generation",
          );
        }
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch (error) {
        if (request !== sequence) return;
        setMessage((error as Error).message);
        updateView("saved");
        window.history.replaceState(null, "", "#/saved");
      }
    };
    void restoreRoute();
    window.addEventListener("popstate", restoreRoute);
    return () => {
      sequence++;
      window.removeEventListener("popstate", restoreRoute);
    };
  }, []);
  useEffect(() => {
    if (view === "workspace" && trip && version)
      window.history.replaceState(null, "", `#/trips/${trip.id}`);
    if (view === "generation" && job)
      window.history.replaceState(null, "", `#/jobs/${job.jobId}`);
  }, [view, trip?.id, version?.versionId, job?.jobId]);
  const notify = (text: string) => setMessage(text);
  useEffect(() => {
    document.body.classList.toggle("high-contrast", contrast);
  }, [contrast]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    (async () => {
      try {
        const m = await api("/mode");
        setMode(m.mode);
        setSetupRequired(m.setupRequired);
        const t = await api("/trips");
        setTrips(t.trips);
      } catch {
        notify(
          "Could not connect to the server. Check your connection and restart the app.",
        );
      }
    })();
  }, []);
  const accept = (data: {
    trip: TripDraft;
    activeVersion: TripPlanVersion;
  }) => {
    setTrip(data.trip);
    setVersion(data.activeVersion);
    setTrips((p) => [data.trip, ...p.filter((t) => t.id !== data.trip.id)]);
  };
  useEffect(() => {
    if (!job || !["RUNNING", "QUEUED"].includes(job.status)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const j = await api("/jobs/" + job.jobId);
        if (cancelled) return;
        if (["SUCCEEDED", "PARTIAL"].includes(j.status)) {
          const data = await api("/trips/" + j.tripId);
          if (!cancelled) {
            accept(data);
            if (viewRef.current === "generation") setView("workspace");
            setJob(j);
          }
        } else {
          setJob(j);
        }
      } catch (e) {
        notify((e as Error).message);
        setJob((j) =>
          j
            ? {
                ...j,
                status: "FAILED",
                error: "Connection lost. Check Saved trips before retrying.",
              }
            : j,
        );
      }
    }, 650);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [job]);
  const nav = (v: "home" | "wizard" | "workspace" | "saved") => {
    if (v === "wizard") {
      setDraft(undefined);
    }
    setView(v);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  async function submit(d: Partial<TripDraft>) {
    try {
      const clean = {
        ...d,
        dietary: d.dietary?.map((s) => s.trim()).filter(Boolean),
        accessibility: d.accessibility?.map((s) => s.trim()).filter(Boolean),
        cuisines: d.cuisines?.map((s) => s.trim()).filter(Boolean),
      };
      const t = await api("/trips", clean);
      setTrip(t);
      setTrips((p) => [t, ...p]);
      const j = await api(`/trips/${t.id}/generations`, {});
      setJob(j);
      setView("generation");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function mutate(action: string, body: Record<string, unknown>) {
    if (!trip || !version || busy) return;
    setBusy(true);
    try {
      const data = await api(`/trips/${trip.id}/${action}`, {
        baseVersionId: version.versionId,
        ...body,
      });
      accept(data);
      notify("Plan updated. Your previous version is saved.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const load = async (t: TripDraft) => {
    try {
      const data = await api("/trips/" + t.id);
      if (
        mode === "LIVE" &&
        data.activeVersion &&
        data.activeVersion.dataMode !== "LIVE"
      ) {
        setTrip(data.trip);
        setJob(await api(`/trips/${data.trip.id}/generations`, {}));
        setView("generation");
        return;
      }
      accept(data);
      if (data.activeVersion) setView("workspace");
      else {
        setDraft(t);
        setView("wizard");
      }
    } catch (e) {
      notify((e as Error).message);
    }
  };
  if (showWelcome) return <WelcomeExperience onEnter={enterWebsite} />;
  return (
    <div className="min-h-screen flex flex-col">
      <DemoModeBanner mode={mode} />
      <Navbar
        currentView={view}
        onNavigate={nav}
        isHighContrast={contrast}
        onToggleHighContrast={() => setContrast(!contrast)}
        savedTripsCount={trips.length}
      />
      <main tabIndex={-1} id="main-content" className="flex-1">
        {setupRequired && (
          <div
            role="alert"
            className="max-w-7xl mx-auto m-4 p-4 rounded-xl bg-amber-50 text-amber-950"
          >
            <strong>Connect live travel search</strong>
            <p>
              Add SERPAPI_API_KEY to your server’s .env file and restart.
              TripCraft uses real search results and will not generate sample
              plans. Open-Meteo weather requires no key for non-commercial use.
            </p>
          </div>
        )}
        {view === "home" && (
          <HomeHero
            onStartPlanning={() => nav("wizard")}
            onSelectExample={(o, d) => {
              setDraft({ originCity: o, destinationCity: d });
              setView("wizard");
              window.scrollTo(0, 0);
            }}
          />
        )}
        {view === "wizard" && (
          <TripWizard
            key={draft?.id || draft?.destinationCity || "new"}
            initialDraft={draft}
            onSubmitTrip={submit}
            onCancel={() => nav("home")}
          />
        )}
        {view === "generation" && (
          <PlanningLoading
            job={job}
            trip={trip}
            onReview={() => {
              setDraft(trip || undefined);
              setView("wizard");
            }}
            onCancel={async () => {
              try {
                setJob(await api(`/jobs/${job?.jobId}/cancel`, {}));
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          />
        )}
        {view === "workspace" && (!trip || !version) && (
          <div className="empty-state">
            <h2>Your next weekend starts here.</h2>
            <p>Create a trip or open one of your saved plans.</p>
            <button className="primary-btn" onClick={() => nav("wizard")}>
              Plan a weekend
            </button>
          </div>
        )}
        {view === "workspace" && trip && version && (
          <>
            <div className="max-w-7xl mx-auto px-5 pt-6 no-print">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-muted)]">
                  {busy
                    ? "Updating your plan…"
                    : "Saved to this browser’s session. No account required."}
                </p>
                <label className="text-xs flex items-center gap-2">
                  Version history
                  <select
                    aria-label="Version history"
                    className="form-field !w-auto"
                    value={version.versionId}
                    disabled={busy}
                    onChange={(e) =>
                      void mutate("restore", { versionId: e.target.value })
                    }
                  >
                    {trip.versions
                      .filter((v) => mode !== "LIVE" || v.dataMode === "LIVE")
                      .map((v) => (
                        <option key={v.versionId} value={v.versionId}>
                          v{v.revision} · {v.reason.slice(0, 35)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              {version.warnings?.length ? (
                <details className="mt-3 text-xs text-amber-900 bg-amber-50 p-3 rounded-xl">
                  <summary className="cursor-pointer font-semibold">
                    Before you go: {version.warnings.length} data notes
                  </summary>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {version.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {version.changes?.length ? (
                <p
                  className="text-xs mt-3 bg-[#e6eddb] p-3 rounded-lg"
                  role="status"
                >
                  {version.changes.join(" ")}
                </p>
              ) : null}
            </div>
            <div className="max-w-7xl mx-auto px-5 pt-3 no-print">
              <button
                disabled={busy}
                className="text-link"
                onClick={() => {
                  if (
                    confirm(
                      "Remove optional paid activities? Locked and completed stops, meals and contingency will be preserved.",
                    )
                  )
                    void mutate("trim-extras", {});
                }}
              >
                Need a cheaper plan? Remove optional paid activities →
              </button>
            </div>
            <div className="max-w-7xl mx-auto px-5 pt-5">
              <TripAdaptationPanel
                trip={trip}
                version={version}
                busy={busy}
                onAction={mutate}
              />
            </div>
            <fieldset disabled={busy} className="border-0 min-w-0">
              <ItineraryWorkspace
                key={trip.id}
                trip={trip}
                activeVersion={version}
                onLockToggle={(id) =>
                  void mutate("edit", {
                    stopId: id,
                    locked: !version.days
                      .flatMap((d) => d.stops)
                      .find((s) => s.id === id)?.isLocked,
                  })
                }
                onReplaceStop={(id, alt) =>
                  void mutate("replacements", {
                    stopId: id,
                    alternativeId: alt,
                  })
                }
                onWeatherReplan={(pref, day, scenario) =>
                  void mutate("replans", {
                    weatherPreference: pref,
                    dayNumber: day || 1,
                    scenario,
                  })
                }
                onBufferChange={(v) =>
                  void mutate("edit", { bufferPercent: v })
                }
                onCompleteToggle={(id) =>
                  void mutate("edit", {
                    stopId: id,
                    completed: !version.days
                      .flatMap((d) => d.stops)
                      .find((s) => s.id === id)?.isCompleted,
                  })
                }
                onSaveTrip={() =>
                  notify(
                    "This plan is already saved. Find it under Saved trips.",
                  )
                }
              />
            </fieldset>
          </>
        )}
        {view === "saved" && (
          <SavedTripsView
            trips={trips}
            onSelectTrip={(t) => void load(t)}
            onNewTrip={() => nav("wizard")}
            onDeleteTrip={async (id) => {
              if (!confirm("Delete this trip and its saved versions?")) return;
              try {
                await api("/trips/" + id, undefined, "DELETE");
                setTrips((p) => p.filter((t) => t.id !== id));
                if (trip?.id === id) {
                  setTrip(null);
                  setVersion(null);
                }
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          />
        )}
      </main>
      <Footer onNavigate={nav} />
      {message && (
        <div role="status" className="toast" onClick={() => setMessage("")}>
          {message}
        </div>
      )}
    </div>
  );
}
