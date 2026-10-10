import { JourneyAccent } from "./JourneyAccent";
import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  Download,
  Share2,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Bed,
  PieChart,
  CloudSun,
  ShieldCheck,
  ChevronRight,
  Bookmark,
  BookOpen,
} from "lucide-react";
import {
  TripDraft,
  TripPlanVersion,
  TripDay,
  WeatherPreferenceType,
} from "../types/trip";
import { StopCard } from "./StopCard";
import { InteractiveMap } from "./InteractiveMap";
import { StayPanel } from "./StayPanel";
import { BudgetPanel } from "./BudgetPanel";
import { WeatherPanel } from "./WeatherPanel";
import { ExportModal } from "./ExportModal";
import { SourcesModal } from "./SourcesModal";

interface ItineraryWorkspaceProps {
  trip: TripDraft;
  activeVersion: TripPlanVersion;
  onLockToggle: (stopId: string) => void;
  onReplaceStop: (stopId: string, altId?: string) => void;
  onWeatherReplan: (
    pref: WeatherPreferenceType,
    day?: number,
    scenario?: string,
  ) => void;
  onBufferChange: (newBuffer: number) => void;
  onSaveTrip: () => void;
  onCompleteToggle?: (id: string) => void;
}

export const ItineraryWorkspace: React.FC<ItineraryWorkspaceProps> = ({
  trip,
  activeVersion,
  onLockToggle,
  onReplaceStop,
  onWeatherReplan,
  onBufferChange,
  onSaveTrip,
  onCompleteToggle,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<
    "timeline" | "map" | "stay" | "budget"
  >("timeline");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const currentDay =
    activeVersion.days.find((d) => d.dayNumber === selectedDayNumber) ||
    activeVersion.days[0];

  const handleSave = () => {
    onSaveTrip();
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <JourneyAccent kind="itinerary" />
      {/* Top Trip Summary Bar */}
      <div className="neymo-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#dfe8e1] text-[#245c4f]">
              Revision {activeVersion.revision}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {activeVersion.reason}
            </span>
            {activeVersion.weatherAdjustmentApplied && (
              <span className="text-[10px] font-semibold bg-[#f4ded4] text-[#b95d36] px-2 py-0.5 rounded">
                Weather Mode: {activeVersion.weatherAdjustmentApplied}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--text)]">
            {trip.originCity} → {trip.destinationCity} Weekend
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#245c4f]" />
              {trip.startDate} to {trip.endDate} ({trip.durationDays} Days)
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-[#245c4f]" />
              {trip.adultCount} Adults
              {trip.childCount > 0 ? `, ${trip.childCount} Children` : ""}
            </span>
            <span className="flex items-center gap-1 font-semibold text-[var(--text)]">
              <IndianRupee className="w-3.5 h-3.5 text-[#245c4f]" />
              Budget: ₹
              {(
                activeVersion.budgetBreakdown.totalBudgetPaise / 100
              ).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="neymo-button px-3.5 py-2 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <Bookmark className="w-4 h-4 text-[#245c4f]" />
            <span>{savedBadge ? "Saved!" : "Save Version"}</span>
          </button>

          <button
            onClick={() => setShowSourcesModal(true)}
            className="neymo-button px-3.5 py-2 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            title="Inspect Sources & Timetables"
          >
            <BookOpen className="w-4 h-4 text-[#245c4f]" />
            <span className="hidden sm:inline">
              Sources ({activeVersion.sources.length})
            </span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="neymo-button-primary px-4 py-2 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export plan</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs (List / Map / Stay / Budget) */}
      <div className="md:hidden flex rounded-2xl bg-[#dfe7e1] p-1 text-xs font-semibold">
        <button
          onClick={() => setMobileTab("timeline")}
          className={`flex-1 py-2 rounded-xl text-center cursor-pointer transition-all ${
            mobileTab === "timeline"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[#245c4f]"
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setMobileTab("map")}
          className={`flex-1 py-2 rounded-xl text-center cursor-pointer transition-all ${
            mobileTab === "map"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[#245c4f]"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setMobileTab("stay")}
          className={`flex-1 py-2 rounded-xl text-center cursor-pointer transition-all ${
            mobileTab === "stay"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[#245c4f]"
          }`}
        >
          Stay
        </button>
        <button
          onClick={() => setMobileTab("budget")}
          className={`flex-1 py-2 rounded-xl text-center cursor-pointer transition-all ${
            mobileTab === "budget"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[#245c4f]"
          }`}
        >
          Budget
        </button>
      </div>

      {/* Main Two-Column Layout (Desktop: ~60% Itinerary / ~40% Map) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Itinerary Timeline & Details (60%) */}
        <div
          className={`md:col-span-7 space-y-6 ${
            mobileTab !== "timeline" &&
            mobileTab !== "stay" &&
            mobileTab !== "budget"
              ? "hidden md:block"
              : ""
          }`}
        >
          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {activeVersion.days.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDayNumber(day.dayNumber)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  day.dayNumber === selectedDayNumber
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "neymo-card text-[var(--text)] hover:bg-[#e4ede6]"
                }`}
              >
                <span>Day {day.dayNumber}</span>
                <span className="text-[11px] opacity-80 font-normal">
                  ({day.stops.length} stops)
                </span>
              </button>
            ))}
          </div>

          {/* Weather Panel for current selected day */}
          {currentDay && (
            <WeatherPanel
              live={activeVersion.dataMode !== "DEMO"}
              weather={currentDay.weather}
              currentAdjustment={activeVersion.weatherAdjustmentApplied}
              onApplyWeatherAdjustment={onWeatherReplan}
              dayNumber={currentDay.dayNumber}
            />
          )}

          {/* Stops Timeline */}
          {mobileTab === "timeline" || mobileTab === "map" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-[var(--text)]">
                    {currentDay?.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Theme: {currentDay?.theme}
                  </p>
                </div>
                <span className="text-xs text-[#245c4f] font-semibold bg-[#dfe8e1] px-2.5 py-1 rounded-full">
                  {currentDay?.stops.length} Scheduled Stops
                </span>
              </div>

              {currentDay?.isNoPlansDay ? (
                <div className="neymo-card p-8 text-center space-y-2">
                  <h4 className="font-bold text-base text-[var(--text)]">
                    No Scheduled Stops Today
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    No outings scheduled. Read, rest, listen to music, or check
                    food options at your accommodation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentDay?.stops.map((stop, idx) => (
                    <StopCard
                      dietaryPreferences={trip.dietary}
                      key={stop.id}
                      stop={stop}
                      index={idx}
                      isSelected={stop.id === selectedStopId}
                      onSelect={() => setSelectedStopId(stop.id)}
                      onLockToggle={() => onLockToggle(stop.id)}
                      onReplaceWithAlternative={(altId) =>
                        onReplaceStop(stop.id, altId)
                      }
                      onViewSources={() => setShowSourcesModal(true)}
                      onCompleteToggle={
                        onCompleteToggle
                          ? () => onCompleteToggle(stop.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeVersion.intercityTransport && (
            <div className="neymo-card p-5 space-y-2">
              <h3 className="font-semibold">
                {activeVersion.intercityTransport.title || "Getting there"}
              </h3>
              <p className="text-sm">
                {activeVersion.intercityTransport.route}
              </p>
              {activeVersion.intercityTransport.typicalDurationMinutes > 0 && (
                <p className="text-sm">
                  About {activeVersion.intercityTransport.typicalDurationMinutes} minutes
                  {activeVersion.intercityTransport.via
                    ? ` · ${activeVersion.intercityTransport.via}`
                    : ""}
                </p>
              )}
              {activeVersion.intercityTransport.observedQuoteINR != null && (
                <p className="text-sm">
                  Provider-displayed price: ₹
                  {activeVersion.intercityTransport.observedQuoteINR.toLocaleString(
                    "en-IN",
                  )}
                </p>
              )}
              <p className="text-xs">
                {activeVersion.intercityTransport.sourceNotes}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <a
                  className="text-xs underline"
                  href={activeVersion.intercityTransport.providerLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {activeVersion.intercityTransport.mode === "TRAIN"
                    ? "Check transit route ↗"
                    : activeVersion.intercityTransport.mode === "BUS"
                      ? "Check transit route ↗"
                      : "Check flight options ↗"}
                </a>
                {activeVersion.intercityTransport.bookingLink && (
                  <a
                    className="text-xs underline"
                    href={activeVersion.intercityTransport.bookingLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {activeVersion.intercityTransport.mode === "TRAIN"
                      ? "Search trains on IRCTC ↗"
                      : "Search buses on redBus ↗"}
                  </a>
                )}
              </div>
            </div>
          )}
          {/* Stay Panel */}
          {(mobileTab === "stay" || mobileTab === "timeline") && (
            <StayPanel stay={activeVersion.stay} />
          )}

          {/* Budget Breakdown Panel */}
          {(mobileTab === "budget" || mobileTab === "timeline") && (
            <BudgetPanel
              budget={activeVersion.budgetBreakdown}
              onBufferChange={onBufferChange}
            />
          )}

          {/* Local Gems & Plan B Section */}
          <div className="neymo-card p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--text)] border-b border-[#cbd7cf] pb-2">
              Local gems near your destination
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {activeVersion.localGems.length === 0 && <p className="text-sm text-[var(--text-muted)]">No local picks could be verified from this search. We won’t invent recommendations. Try a more specific destination or regenerate with live search available.</p>}
              {activeVersion.localGems.map((gem) => (
                <div
                  key={gem.id}
                  className="p-3.5 bg-[#e5ede6] rounded-xl border border-[#cbd8cf] space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#b95d36]">
                    Local pick · {gem.category}
                  </span>
                  <h5 className="font-bold text-sm text-[var(--text)]">
                    {gem.title}
                  </h5>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {gem.description}
                  </p>
                  <p className="text-[11px] font-semibold">
                    Confidence: {gem.confidence || "LOW"}
                  </p>
                  <ul className="text-[10px] list-disc pl-4">
                    {gem.signals?.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-amber-900">{gem.caution}</p>
                  {gem.publicMapLink && (
                    <a
                      className="text-[11px] underline"
                      href={gem.publicMapLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View location ↗
                    </a>
                  )}
                  <span className="text-[10px] text-[#245c4f] font-semibold block pt-1">
                    Source: {gem.sourceAttribution}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs space-y-1">
              <span className="font-semibold text-[#245c4f] block">
                Contingency Plan B:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] text-[11px]">
                {activeVersion.planBNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Synchronized Interactive Map (40%) */}
        <div
          className={`md:col-span-5 md:sticky md:top-24 space-y-4 ${
            mobileTab !== "map" ? "hidden md:block" : ""
          }`}
        >
          <div className="min-h-[460px]">
            <InteractiveMap
              stops={currentDay?.stops || []}
              selectedStopId={selectedStopId}
              onSelectStop={(id) => {
                setSelectedStopId(id);
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              destinationName={trip.destinationCity}
            />
          </div>

          <div className="p-3.5 bg-[#e4ede6] rounded-2xl border border-[#cbd8cf] text-xs space-y-1 text-[#245c4f]">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#245c4f]" />
              <span>Map & Itinerary Synchronization</span>
            </div>
            <p className="text-[11px] text-[#3e564d] leading-relaxed">
              Click any stop pin above to highlight its schedule card in the
              left timeline. Pins show place locations; road durations are not
              yet verified.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showExportModal && (
        <ExportModal
          trip={trip}
          version={activeVersion}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showSourcesModal && (
        <SourcesModal
          sources={activeVersion.sources}
          onClose={() => setShowSourcesModal(false)}
        />
      )}
    </div>
  );
};
