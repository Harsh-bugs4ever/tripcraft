import React, { useState } from "react";
import {
  Clock,
  MapPin,
  IndianRupee,
  Star,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Car,
  Sparkles,
  Info,
} from "lucide-react";
import { TripStop } from "../types/trip";

interface StopCardProps {
  stop: TripStop;
  dietaryPreferences?: string[];
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onLockToggle: () => void;
  onReplaceWithAlternative: (altId: string) => void;
  onViewSources: () => void;
  onCompleteToggle?: () => void;
}

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  dietaryPreferences = [],
  index,
  isSelected,
  onSelect,
  onLockToggle,
  onReplaceWithAlternative,
  onViewSources,
  onCompleteToggle,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);

  // Format currency text
  const costText =
    stop.cost.minMinor === 0
      ? "₹0 in demo / check entry price"
      : stop.cost.minMinor !== null
        ? `₹${(stop.cost.minMinor / 100).toLocaleString("en-IN")}${
            stop.cost.maxMinor && stop.cost.maxMinor !== stop.cost.minMinor
              ? ` – ₹${(stop.cost.maxMinor / 100).toLocaleString("en-IN")}`
              : ""
          } (${stop.cost.basis === "PER_PERSON" ? "per person" : "group"})`
        : "Price unverified";

  return (
    <div
      id={stop.id}
      onClick={onSelect}
      className={`relative neymo-card p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? "ring-2 ring-[var(--primary)] border-[var(--primary)] shadow-lg"
          : "hover:shadow-md"
      }`}
    >
      {/* Travel Leg Header if coming from previous stop */}
      {stop.travelLegFromPrevious && index > 0 && (
        <div className="mb-4 pb-3 border-b border-[#cbd7cf]/70 flex items-center justify-between text-[11px] text-[#425d52]">
          <div className="flex items-center gap-1.5 font-medium">
            <Car className="w-3.5 h-3.5 text-[#245c4f]" />
            <span>
              {stop.travelLegFromPrevious.durationMinutes} min{" "}
              {stop.travelLegFromPrevious.mode.toLowerCase()} leg
            </span>
            <span>·</span>
            <span>{stop.travelLegFromPrevious.distanceKm} km transit</span>
          </div>
          <span className="text-[10px] bg-[#dbe8df] px-1.5 py-0.5 rounded text-[#245c4f] font-semibold">
            {stop.travelLegFromPrevious.status}
          </span>
        </div>
      )}

      {/* Main Stop Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#dbe6df] text-[11px] font-bold text-[#245c4f]">
              {stop.timeSlot}
            </span>
            <span className="text-xs font-semibold text-[#b95d36] capitalize">
              {stop.category.replace("_", " ")}
            </span>
            {stop.indoorVenue && (
              <span className="text-[10px] font-semibold bg-[#e0eaef] text-[#135fd1] px-1.5 py-0.5 rounded">
                Indoor candidate
              </span>
            )}
          </div>
          <h4 className="font-display font-bold text-lg text-[var(--text)] mt-1">
            {stop.name}
          </h4>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#b95d36] shrink-0" />
            <span>{stop.area}</span>
          </p>
        </div>

        {/* Lock Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLockToggle();
          }}
          title={
            stop.isLocked
              ? "Stop is locked (protected during weather replanning)"
              : "Lock stop to preserve during replans"
          }
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            stop.isLocked
              ? "bg-[#245c4f] text-white border-[#245c4f]"
              : "bg-[#e5ede6] text-[#49655b] border-[#cbd8cf] hover:bg-[#d8e4db]"
          }`}
        >
          {stop.isLocked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {onCompleteToggle && (
        <label
          className="flex gap-2 items-center text-xs mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!!stop.isCompleted}
            onChange={onCompleteToggle}
          />{" "}
          {stop.isCompleted
            ? "Visited — preserved in your history"
            : "Mark as visited"}
        </label>
      )}
      {/* Selection Reason */}
      <p className="text-xs text-[var(--text)] mt-3 leading-relaxed">
        {stop.reason}
      </p>

      {stop.category === "food" && dietaryPreferences.filter(Boolean).length > 0 && (
        <p className="mt-3 rounded-lg bg-[#e8eddf] p-3 text-xs">
          Meal preference: {dietaryPreferences.filter(Boolean).join(", ")}. Confirm menu options and dietary requirements with the restaurant.
        </p>
      )}
      {/* Fact Badges Row */}
      <div className="mt-3 pt-3 border-t border-[#cbd7cf]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          {/* Rating */}
          {stop.rating.value && (
            <div className="flex items-center gap-1 font-semibold text-[var(--text)] text-xs">
              <Star className="w-3.5 h-3.5 fill-[#d97706] text-[#d97706]" />
              <span>{stop.rating.value.toFixed(1)}</span>
              {stop.reviewCount.value && (
                <span className="text-[11px] text-[var(--text-muted)] font-normal">
                  ({stop.reviewCount.value.toLocaleString("en-IN")})
                </span>
              )}
            </div>
          )}

          {/* Cost */}
          <div className="flex items-center gap-1 text-[var(--text)] font-semibold text-xs">
            <IndianRupee className="w-3.5 h-3.5 text-[#245c4f]" />
            <span>{costText}</span>
          </div>
        </div>

        {/* Hours confidence */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#425d52]">
          <Clock className="w-3 h-3 text-[#245c4f]" />
          <span>
            {stop.openingHours.value || "Hours unknown — check before visiting"}
          </span>
        </div>
      </div>

      {/* Expandable Details Section */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-[#cbd7cf] space-y-3 text-xs bg-[#e4ede7] p-3 rounded-xl">
          <div>
            <span className="font-semibold text-[#245c4f] block">
              Accessibility Note:
            </span>
            <p className="text-[var(--text-muted)]">
              {stop.accessibility.value ||
                "Accessibility not verified; contact venue"}
            </p>
          </div>
          {stop.dietaryMatch && stop.dietaryMatch.length > 0 && (
            <div>
              <span className="font-semibold text-[#245c4f] block">
                Dietary Suitability:
              </span>
              <p className="text-[var(--text-muted)]">
                {stop.dietaryMatch.join(" · ")}
              </p>
            </div>
          )}
          <div>
            <span className="font-semibold block">Timing & crowds</span>
            <p>
              Proposed visit slot: {stop.timeSlot}.{" "}
              {stop.openingHours.value
                ? "Compare with the listed hours and check holiday exceptions."
                : "Opening hours are not verified."}{" "}
              Live queue and crowd information unavailable.
            </p>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-[#476258]">
            <span>Freshness: {stop.sourceFreshness}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewSources();
              }}
              className="text-[#245c4f] font-semibold underline cursor-pointer"
            >
              Inspect Sources ({stop.sourceIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Alternative Drawer Preview */}
      {showAlternative && stop.alternative && (
        <div className="mt-4 p-4 rounded-xl bg-[#e8f1eb] border border-[#245c4f]/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#b95d36]">
                Plan B candidate
              </span>
              <h5 className="font-bold text-sm text-[var(--text)]">
                {stop.alternative.name}
              </h5>
              <p className="text-[11px] text-[var(--text-muted)]">
                {stop.alternative.area} · {stop.alternative.reason}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold text-[#245c4f]">
                {stop.alternative.rating
                  ? `★ ${stop.alternative.rating}`
                  : "Unrated"}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <a
              href={stop.alternative.publicMapLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-[#245c4f] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Map</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    `Replace ${stop.name} with ${stop.alternative!.name}? Prices, route and opening times need verification.`,
                  )
                )
                  onReplaceWithAlternative(stop.alternative!.id);
                setShowAlternative(false);
              }}
              disabled={stop.isLocked}
              className="neymo-button-primary px-3 py-1 text-xs font-semibold cursor-pointer"
            >
              Swap to this Alternative
            </button>
          </div>
        </div>
      )}

      {!stop.alternative && !stop.isAnchor && (
        <p className="text-[11px] mt-3 text-[var(--text-muted)]">
          No unused alternative found within 5 km straight-line distance.
        </p>
      )}
      {/* Action Row */}
      <div className="mt-4 pt-3 border-t border-[#cbd7cf]/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {stop.alternative && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAlternative(!showAlternative);
              }}
              className="neymo-button px-2.5 py-1 text-xs font-semibold text-[#245c4f] cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>
                {showAlternative ? "Hide Alternative" : "Nearby Alternative"}
              </span>
            </button>
          )}

          <a
            href={stop.publicMapLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="neymo-button px-2.5 py-1 text-xs font-semibold text-[#245c4f] cursor-pointer flex items-center gap-1"
          >
            <span>Directions</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-semibold flex items-center gap-0.5 cursor-pointer"
        >
          <span>{expanded ? "Less" : "Details"}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
