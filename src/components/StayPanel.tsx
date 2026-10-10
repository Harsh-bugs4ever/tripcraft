import React from "react";
import {
  Bed,
  Star,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Users,
  MapPin,
  Check,
} from "lucide-react";
import { TripStay } from "../types/trip";

interface StayPanelProps {
  stay: TripStay;
}

export const StayPanel: React.FC<StayPanelProps> = ({ stay }) => {
  return (
    <div className="neymo-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#cbd7cf] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#d4e4da] text-[#245c4f] flex items-center justify-center">
            <Bed className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b95d36]">
              Stay / accommodation
            </span>
            <h3 className="font-display font-bold text-lg text-[var(--text)]">
              {stay.name}
            </h3>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-[#dfe8e1] font-semibold text-[#245c4f]">
          {stay.category}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Pricing Column */}
        <div className="space-y-1.5 p-3.5 bg-[#e4ede6] rounded-xl border border-[#cbd8cf]">
          <span className="text-[var(--text-muted)] block">Stay allowance</span>
          <div className="text-base font-extrabold text-[var(--text)]">
            {stay.nightlyRatePaise
              ? `₹${(stay.nightlyRatePaise / 100).toLocaleString("en-IN")}`
              : stay.nights
                ? "Unquoted"
                : "Not needed"}{" "}
            <span className="text-xs font-normal text-[var(--text-muted)]">
              / room / night
            </span>
          </div>
          <div className="text-xs font-semibold text-[#245c4f]">
            {stay.totalStayPaise
              ? `Stay subtotal: ₹${(stay.totalStayPaise / 100).toLocaleString("en-IN")}`
              : "No confirmed stay charge included"}
          </div>
          {stay.observedQuoteINR != null && (
            <p className="text-xs">
              Provider displays ₹{stay.observedQuoteINR.toLocaleString("en-IN")}{" "}
              for the stay search. Room allocation and taxes need confirmation;
              excluded from the total.
            </p>
          )}
          <p className="text-[11px] text-[var(--text-muted)] pt-1">
            Status: GST {stay.taxesStatus.toLowerCase()} · {stay.roomCount}{" "}
            room, {stay.nights} nights
          </p>
        </div>

        {/* Suitability & Area */}
        <div className="space-y-1.5 p-3.5 bg-[#e4ede6] rounded-xl border border-[#cbd8cf]">
          <span className="text-[var(--text-muted)] block">
            Area & Location Fit
          </span>
          <p className="font-medium text-[var(--text)] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#b95d36] shrink-0" />
            <span>{stay.area}</span>
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {stay.areaSuitability}
          </p>
          {stay.rating.value !== null && (
            <div className="flex items-center gap-1 pt-1 text-[#245c4f] font-semibold">
              <Star className="w-3.5 h-3.5 fill-[#d97706] text-[#d97706]" />
              <span>{stay.rating.value}</span>
              <span className="text-[11px] text-[var(--text-muted)]">
                ({stay.reviewCount.value?.toLocaleString("en-IN")} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Cancellation & Provider Link */}
        <div className="space-y-2 p-3.5 bg-[#e4ede6] rounded-xl border border-[#cbd8cf] flex flex-col justify-between">
          <div>
            <span className="text-[var(--text-muted)] block">
              Policy & Flexibility
            </span>
            <p className="text-[11px] font-semibold text-[#245c4f] mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> {stay.cancellationPolicy}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              {stay.occupancyDescription}
            </p>
          </div>

          <a
            href={stay.providerLink}
            target="_blank"
            rel="noreferrer"
            className="neymo-button-primary w-full py-2 text-xs font-semibold cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <span>Check Availability</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
