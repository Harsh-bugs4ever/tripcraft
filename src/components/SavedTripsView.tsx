import { JourneyAccent } from "./JourneyAccent";
import React from "react";
import {
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  ArrowRight,
  Trash2,
  Bookmark,
} from "lucide-react";
import { TripDraft } from "../types/trip";

interface SavedTripsViewProps {
  trips: TripDraft[];
  onSelectTrip: (trip: TripDraft) => void;
  onDeleteTrip: (tripId: string) => void;
  onNewTrip: () => void;
}

export const SavedTripsView: React.FC<SavedTripsViewProps> = ({
  trips,
  onSelectTrip,
  onDeleteTrip,
  onNewTrip,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <JourneyAccent kind="saved" />
      <div className="flex items-center justify-between border-b border-[#cbd7cf] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#b95d36]">
            YOUR NEXT LITTLE ESCAPE
          </span>
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">
            Saved Weekend Plans ({trips.length})
          </h2>
        </div>
        <button
          onClick={onNewTrip}
          className="neymo-button-primary px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Plan New Weekend
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="neymo-card p-12 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-[#245c4f] mx-auto opacity-60" />
          <h3 className="font-bold text-lg text-[var(--text)]">
            No Saved Trips Yet
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Design an itinerary for Alibaug, Jaipur, or Coorg — your plans are
            saved automatically.
          </p>
          <button
            onClick={onNewTrip}
            className="neymo-button-primary px-6 py-2.5 text-xs font-semibold mt-2 cursor-pointer"
          >
            Start First Weekend Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trips.map((trip) => {
            const activeVer = trip.versions[trip.versions.length - 1];
            return (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                className="neymo-card p-5 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#dfe8e1] text-[#245c4f]">
                      {trip.durationDays} Days / {trip.durationDays - 1} Nights
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {trip.versions.length} Saved Versions
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[var(--text)]">
                    {trip.originCity} → {trip.destinationCity}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#245c4f]" />
                      {trip.startDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#245c4f]" />
                      {trip.adultCount} Adults
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[var(--text)]">
                      <IndianRupee className="w-3.5 h-3.5 text-[#245c4f]" />₹
                      {trip.budget.amountINR.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTrip(trip.id);
                    }}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer transition-colors"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrip(trip);
                    }}
                    className="neymo-button px-3.5 py-1.5 text-xs font-semibold text-[#245c4f] flex items-center gap-1"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
