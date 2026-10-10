import React, { useLayoutEffect, useRef } from "react";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Sparkles,
  Compass,
  AlertCircle,
} from "lucide-react";
import { TravelScene } from "./TravelScene";
import type { GenerationJob, TripDraft } from "../types/trip";
export function PlanningLoading({
  job,
  trip,
  onCancel,
  onReview,
}: {
  job: GenerationJob | null;
  trip: TripDraft | null;
  onCancel: () => void;
  onReview: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, []);
  const failed = job?.status === "FAILED",
    cancelled = job?.status === "CANCELLED",
    stopped = failed || cancelled;
  const queued = job?.status === "QUEUED";
  return (
    <section
      className={`planning-experience ${stopped ? "planning-stopped" : ""}`}
      aria-label="Trip planning progress"
    >
      <div className="planning-grain" aria-hidden="true" />
      <div className="planning-inner">
        <div className="planning-copy">
          <div className="planning-kicker">
            <span className="planning-status-dot" />
            {stopped ? "TAKE A MOMENT" : "YOUR NEXT CHAPTER IS TAKING SHAPE"}
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {failed ? (
              <>
                A small detour.
                <br />
                <em>Let’s try again.</em>
              </>
            ) : cancelled ? (
              <>
                No rush.
                <br />
                <em>We’ll be here.</em>
              </>
            ) : (
              <>
                Good weekends
                <br />
                start with
                <br />
                <em>a little wonder.</em>
              </>
            )}
          </h1>
          <p className="planning-description">
            {stopped
              ? "Your saved plans are still available. Review your details whenever you’re ready."
              : "Finding places you’ll love, checking the forecast, and leaving a little room for the unexpected."}
          </p>
          {trip && (
            <div className="planning-route">
              <span>
                <MapPin size={15} />
                {trip.originCity}
              </span>
              <i />
              <PlaneMark />
              <i />
              <strong>{trip.destinationCity}</strong>
            </div>
          )}
          <div className="planning-progress-card">
            <div className="planning-stage" role="status" aria-live="polite">
              {stopped ? <AlertCircle size={18} /> : <Sparkles size={18} />}
              <span>
                {job?.error ||
                  (cancelled ? "Planning cancelled" : job?.currentStage) ||
                  "Connecting to your trip planner…"}
              </span>
            </div>
            {!stopped && (
              <>
                <div
                  className="planning-progress-track"
                  role="progressbar"
                  aria-label="Building your itinerary"
                  aria-valuetext={job?.currentStage || "Preparing"}
                >
                  <i />
                </div>
                <div className="planning-milestones">
                  <span className="milestone-done">
                    <Check size={13} /> Details received
                  </span>
                  <span className={!queued ? "milestone-current" : ""}>
                    <Compass size={13} />{" "}
                    {queued ? "Waiting to search" : "Searching & arranging"}
                  </span>
                  <span>Ready to explore</span>
                </div>
              </>
            )}
          </div>
          <div className="planning-bottom">
            {stopped ? (
              <button className="planning-review" onClick={onReview}>
                Review trip details <ArrowUpRight size={17} />
              </button>
            ) : (
              <>
                <p>
                  Live searches can take a moment.
                  <br />
                  We’ll open your itinerary when it’s ready.
                </p>
                <button onClick={onCancel}>Cancel planning</button>
              </>
            )}
          </div>
        </div>
        <div className="planning-art">
          <TravelScene loading stopped={stopped} />
          <div className="planning-art-note">
            <span>LESS SCROLLING</span>
            <span>MORE STORIES</span>
          </div>
        </div>
      </div>
      <div className="planning-footline">
        <span>MADE FOR YOUR PACE</span>
        <span>
          tripcraft<span className="brand-dot">.</span>
        </span>
        <span>LET THE GOOD DAYS FIND YOU</span>
      </div>
    </section>
  );
}
function PlaneMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 10 18-7-7 18-3-8-8-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m11 13 10-10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
