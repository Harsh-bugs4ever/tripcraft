import { LocationField, AirportField } from "./LocationFields";
import { JourneyAccent } from "./JourneyAccent";
import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  MapPin,
  CloudSun,
  Utensils,
  Flag,
} from "lucide-react";
import type { TripDraft, WeatherPreferenceType, PaceType } from "../types/trip";
export function TripWizard({
  initialDraft,
  onSubmitTrip,
  onCancel,
}: {
  initialDraft?: Partial<TripDraft>;
  onSubmitTrip: (d: Partial<TripDraft>) => Promise<void> | void;
  onCancel: () => void;
}) {
  const today = new Date();
  today.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  const saturday = today.toISOString().slice(0, 10);
  const sunday = new Date(today.getTime() + 86400000)
    .toISOString()
    .slice(0, 10);
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<Partial<TripDraft>>({
    originCity: "Mumbai",
    destinationCity: "Alibaug",
    startDate: saturday,
    endDate: sunday,
    budget: {
      amountINR: 18000,
      basis: "PER_GROUP",
      includeMajorTransport: true,
    },
    adultCount: 2,
    childCount: 0,
    childAges: [],
    roomCount: 1,
    interests: ["Food", "Heritage"],
    pace: "BALANCED",
    dietary: [],
    accessibility: [],
    weatherPreference: "AUTO",
    foodFirst: false,
    cuisines: [],
    mealBudgetINR: 350,
    maxWalkingKm: 3,
    breakMinutes: 30,
    arrivalConstraint: "Morning Arrival (~10:00 AM)",
    departureConstraint: "Late Evening Return (~06:00 PM)",
    ...initialDraft,
  });
  const [anchorOn, setAnchorOn] = useState(!!initialDraft?.anchor),
    [anchor, setAnchor] = useState(
      initialDraft?.anchor || {
        name: "",
        day: 1,
        time: "11:00",
        durationMinutes: 90,
      },
    );
  const update = (v: Partial<TripDraft>) => setDraft((d) => ({ ...d, ...v }));
  const days =
    (Date.parse(draft.endDate || "") - Date.parse(draft.startDate || "")) /
      86400000 +
    1;
  const mealOptions = ["Vegetarian", "Non-vegetarian", "Veg & non-veg"];
  const mealPreference = draft.dietary?.find(value => mealOptions.includes(value)) || "";
  const validate = () => {
    if (step === 0 && (draft.departureAirport || draft.arrivalAirport) &&
        (!/^[A-Z]{3}$/.test(draft.departureAirport || "") ||
         !/^[A-Z]{3}$/.test(draft.arrivalAirport || "") ||
         draft.departureAirport === draft.arrivalAirport))
      return "Choose two different airports with valid 3-letter codes, or clear both for no flight search.";
    if (
      step === 0 &&
      (!draft.originCity?.trim() ||
        !draft.destinationCity?.trim() ||
        !Number.isFinite(days) ||
        days < 1 ||
        days > 14)
    )
      return "Enter both cities and choose a trip of 1–14 days.";
    if (
      step === 1 &&
      (!(draft.budget!.amountINR >= 1000) ||
        !draft.adultCount ||
        draft.childAges?.length !== draft.childCount)
    )
      return "Enter a budget of at least ₹1,000 and all traveler ages.";
    if (step === 2 && anchorOn && (!anchor.name.trim() || anchor.day > days))
      return "Add a must-do name and a day within your trip.";
    return "";
  };
  async function next() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await onSubmitTrip({
        ...draft,
        dietary: draft.dietary?.map(value => value.trim()).filter(Boolean),
        accessibility: draft.accessibility?.map(value => value.trim()).filter(Boolean),
        cuisines: draft.cuisines?.map(value => value.trim()).filter(Boolean),
        durationDays: days,
        anchor: anchorOn ? anchor : undefined,
      });
    } finally {
      setBusy(false);
    }
  }
  const input = (name: string, label: string, type = "text") => (
    <label>
      <span className="field-label">{label}</span>
      <input
        className="form-field"
        type={type}
        value={String((draft as any)[name] ?? "")}
        onChange={(e) =>
          update({
            [name]: type === "number" ? Number(e.target.value) : e.target.value,
          })
        }
      />
    </label>
  );
  return (
    <section className="max-w-4xl mx-auto px-5 py-10">
      <JourneyAccent kind="plan" />
      <button onClick={onCancel} className="text-link mb-6">
        <ArrowLeft size={16} /> Back to discovering
      </button>
      <p className="eyebrow">A LITTLE ESCAPE, YOUR WAY</p>
      <h1 className="text-3xl sm:text-4xl font-semibold mt-3 mb-3">
        Let’s craft your weekend.
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-7">
        A few details now. A little more freedom later.
      </p>
      <div className="flex gap-2 mb-8">
        {[
          "Where & when",
          "People & budget",
          "Your kind of trip",
          "Review & go",
        ].map((s, i) => (
          <button
            key={s}
            disabled={i > step}
            onClick={() => setStep(i)}
            className={`flex-1 p-3 rounded-xl text-xs font-semibold ${i === step ? "bg-[var(--primary)] text-white" : "bg-[#e8eddf]"}`}
          >
            {i < step ? "✓" : i + 1}
            <span className="hidden sm:inline ml-2">{s}</span>
          </button>
        ))}
      </div>
      <div className="neymo-card p-6 sm:p-8 space-y-6">
        {step === 0 && (
          <>
            <h2 className="text-xl font-semibold">Where are we heading?</h2>
            <div className="feature-grid">
              <LocationField label="Leaving from" value={draft.originCity || ""} onChange={originCity => update({originCity})} />
              <LocationField label="Destination" value={draft.destinationCity || ""} onChange={destinationCity => update({destinationCity})} />
              {input("startDate", "First day", "date")}
              {input("endDate", "Last day", "date")}
              <label>
                <span className="field-label">Arrival at destination</span>
                <select
                  className="form-field"
                  value={draft.arrivalConstraint}
                  onChange={(e) =>
                    update({ arrivalConstraint: e.target.value })
                  }
                >
                  {[
                    "Morning Arrival (~10:00 AM)",
                    "Afternoon Arrival (~02:00 PM)",
                    "Evening Arrival (~05:00 PM)",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Leave destination</span>
                <select
                  className="form-field"
                  value={draft.departureConstraint}
                  onChange={(e) =>
                    update({ departureConstraint: e.target.value })
                  }
                >
                  {[
                    "Early Return (~02:00 PM)",
                    "Late Evening Return (~06:00 PM)",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Enter any origin and destination. Add the state or country for places
              with similar names. Results depend on live search coverage. Transport to your
              destination is separate from arrival time.
            </p>
            <details>
              <summary className="text-sm font-semibold cursor-pointer">
                Optional flight search
              </summary>
              <div className="feature-grid mt-4">
                <AirportField label="Departure airport" value={draft.departureAirport} onChange={departureAirport => update({departureAirport})} />
                <AirportField label="Arrival airport" value={draft.arrivalAirport} onChange={arrivalAirport => update({arrivalAirport})} />
              </div>
            </details>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold">
              Good company. A comfortable budget.
            </h2>
            <label className="block">
              <span className="field-label">Budget range - INR {draft.budget!.amountINR.toLocaleString("en-IN")}</span>
              <input type="range" aria-label="Budget range" min={1000} max={Math.max(200000, draft.budget!.amountINR)} step={500}
                className="w-full accent-[var(--primary)]" value={draft.budget!.amountINR}
                onChange={e => update({budget: {...draft.budget!, amountINR: Number(e.target.value)}})} />
              <span className="flex justify-between text-xs text-[var(--text-muted)]"><span>INR 1,000</span><span>INR {Math.max(200000, draft.budget!.amountINR).toLocaleString("en-IN")}</span></span>
              <span className="text-xs text-[var(--text-muted)]">Choose your spending limit, or enter an exact amount below.</span>
            </label>
            <div className="feature-grid">
              <label>
                <span className="field-label">Budget (₹)</span>
                <input
                  type="number"
                  min={1000}
                  className="form-field"
                  value={draft.budget!.amountINR}
                  onChange={(e) =>
                    update({
                      budget: {
                        ...draft.budget!,
                        amountINR: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                <span className="field-label">Budget is for</span>
                <select
                  className="form-field"
                  value={draft.budget!.basis}
                  onChange={(e) =>
                    update({
                      budget: {
                        ...draft.budget!,
                        basis: e.target.value as "PER_PERSON" | "PER_GROUP",
                      },
                    })
                  }
                >
                  <option value="PER_GROUP">The whole group</option>
                  <option value="PER_PERSON">Each person</option>
                </select>
              </label>
              <label>
                <span className="field-label">Adults</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="form-field"
                  value={draft.adultCount}
                  onChange={(e) =>
                    update({ adultCount: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                <span className="field-label">Children</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="form-field"
                  value={draft.childCount}
                  onChange={(e) => {
                    const n = Math.min(10, Math.max(0, Number(e.target.value)));
                    update({
                      childCount: n,
                      childAges: Array.from(
                        { length: n },
                        (_, i) => draft.childAges?.[i] ?? 8,
                      ),
                    });
                  }}
                />
              </label>
              {input("roomCount", "Rooms", "number")}
              {input(
                "mealBudgetINR",
                "Meal allowance / person / meal (₹)",
                "number",
              )}
            </div>
            {!!draft.childCount && (
              <div className="feature-grid">
                {draft.childAges?.map((age, i) => (
                  <label key={i}>
                    <span className="field-label">Child {i + 1} age</span>
                    <input
                      type="number"
                      min={0}
                      max={17}
                      className="form-field"
                      value={age}
                      onChange={(e) =>
                        update({
                          childAges: draft.childAges!.map((a, j) =>
                            j === i ? Number(e.target.value) : a,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.budget!.includeMajorTransport}
                onChange={(e) =>
                  update({
                    budget: {
                      ...draft.budget!,
                      includeMajorTransport: e.target.checked,
                    },
                  })
                }
              />{" "}
              Include major transport in the budget
            </label>
            <p className="text-xs text-[var(--text-muted)]">
              Unknown fares and fees stay visible as exclusions. Your
              contingency buffer defaults to 10%.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold">
              What makes a good weekend for you?
            </h2>
            <div>
              <span className="field-label">Pick your interests</span>
              <div className="filter-row flex-wrap">
                {[
                  "Food",
                  "Heritage",
                  "Nature",
                  "Shopping",
                  "Nightlife",
                  "Adventure",
                  "Relaxation",
                  "Family-friendly",
                ].map((x) => (
                  <button
                    key={x}
                    aria-pressed={draft.interests?.includes(x)}
                    className={draft.interests?.includes(x) ? "active" : ""}
                    onClick={() =>
                      update({
                        interests: draft.interests?.includes(x)
                          ? draft.interests.filter((i) => i !== x)
                          : [...draft.interests!, x],
                      })
                    }
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
            <div className="feature-grid">
              <label>
                <span className="field-label">Your pace</span>
                <select
                  className="form-field"
                  value={draft.pace}
                  onChange={(e) => update({ pace: e.target.value as PaceType })}
                >
                  <option value="RELAXED">Relaxed — room to breathe</option>
                  <option value="BALANCED">
                    Balanced — a little of everything
                  </option>
                  <option value="PACKED">Packed — make the most of it</option>
                </select>
              </label>
              {input(
                "breakMinutes",
                "Break between activities (minutes)",
                "number",
              )}
              {input(
                "maxWalkingKm",
                "Preferred daily walking limit (km)",
                "number",
              )}
              <label>
                <span className="field-label">Weather preference</span>
                <select
                  className="form-field"
                  value={draft.weatherPreference}
                  onChange={(e) =>
                    update({
                      weatherPreference: e.target
                        .value as WeatherPreferenceType,
                    })
                  }
                >
                  <option value="AUTO">Adapt to the outlook</option>
                  <option value="STAY_BACK">Stay back / no outings</option>
                  <option value="LOW_EFFORT">Low-effort outing</option>
                  <option value="FULL_ADJUSTED_DAY">Indoor-first day</option>
                </select>
              </label>
              <label>
                <span className="field-label">Meal preference</span>
                <select aria-label="Meal preference" className="form-field" value={mealPreference} onChange={e => update({dietary: [...(draft.dietary || []).filter(value => !mealOptions.includes(value)), ...(e.target.value ? [e.target.value] : [])]})}>
                  <option value="">No preference</option>
                  <option value="Vegetarian">Veg - vegetarian</option>
                  <option value="Non-vegetarian">Non-veg</option>
                  <option value="Veg & non-veg">Both veg and non-veg</option>
                </select>
              </label>
              <label>
                <span className="field-label">
                  Additional dietary needs (comma separated)
                </span>
                <input
                  className="form-field"
                  placeholder="Jain, nut allergy"
                  value={draft.dietary?.filter(value => !mealOptions.includes(value)).join(",")}
                  onChange={(e) =>
                    update({ dietary: [...(mealPreference ? [mealPreference] : []), ...e.target.value.split(",")] })
                  }
                />
              </label>
              <label>
                <span className="field-label">Accessibility needs</span>
                <input
                  className="form-field"
                  placeholder="Step-free access, frequent seating"
                  value={draft.accessibility?.join(",")}
                  onChange={(e) =>
                    update({ accessibility: e.target.value.split(",") })
                  }
                />
              </label>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Walking distance and accessibility cannot be guaranteed without
              route and venue evidence. Check these before travel.
            </p>
            <div className="rounded-xl bg-[#e8eddf] p-4 space-y-4">
              <label className="flex gap-3 items-center text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={draft.foodFirst}
                  onChange={(e) => update({ foodFirst: e.target.checked })}
                />
                <Utensils size={17} /> Make this a food-first trip
              </label>
              {draft.foodFirst && (
                <label>
                  <span className="field-label">Cuisines you love</span>
                  <input
                    className="form-field"
                    placeholder="Rajasthani, street food, cafés"
                    value={draft.cuisines?.join(",")}
                    onChange={(e) =>
                      update({ cuisines: e.target.value.split(",") })
                    }
                  />
                </label>
              )}
            </div>
            <div className="rounded-xl bg-[#e8eddf] p-4 space-y-4">
              <label className="flex gap-3 items-center text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={anchorOn}
                  onChange={(e) => setAnchorOn(e.target.checked)}
                />
                <Flag size={17} /> Plan around one must-do
              </label>
              {anchorOn && (
                <div className="feature-grid">
                  <label>
                    <span className="field-label">
                      Activity / event / meeting
                    </span>
                    <input
                      className="form-field"
                      value={anchor.name}
                      onChange={(e) =>
                        setAnchor({ ...anchor, name: e.target.value })
                      }
                      placeholder="Museum visit, family lunch…"
                    />
                  </label>
                  <label>
                    <span className="field-label">Day</span>
                    <input
                      className="form-field"
                      type="number"
                      min={1}
                      max={days}
                      value={anchor.day}
                      onChange={(e) =>
                        setAnchor({ ...anchor, day: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label">Start time</span>
                    <input
                      className="form-field"
                      type="time"
                      value={anchor.time}
                      onChange={(e) =>
                        setAnchor({ ...anchor, time: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label">Duration (minutes)</span>
                    <input
                      className="form-field"
                      type="number"
                      min={15}
                      max={360}
                      value={anchor.durationMinutes}
                      onChange={(e) =>
                        setAnchor({
                          ...anchor,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold">
              A weekend that feels like you.
            </h2>
            <div className="rounded-2xl p-6 bg-[#e8eddf] space-y-3">
              <h3 className="text-2xl">
                {draft.originCity} → {draft.destinationCity}
              </h3>
              <p>
                {draft.startDate} – {draft.endDate} · {days} days
              </p>
              <p>
                {draft.adultCount} adults · {draft.childCount} children ·{" "}
                {draft.roomCount} rooms
              </p>
              <p>
                ₹{draft.budget!.amountINR.toLocaleString("en-IN")}{" "}
                {draft.budget!.basis === "PER_GROUP"
                  ? "for the group"
                  : "per person"}
              </p>
              <p className="capitalize">
                {draft.pace?.toLowerCase()} pace · {draft.interests?.join(", ")}
              </p>
              <p>Meals: {draft.dietary?.filter(Boolean).join(", ") || "No preference"}</p>
              {draft.departureAirport && <p>Flight search: {draft.departureAirport} to {draft.arrivalAirport}</p>}
              {anchorOn && (
                <p>
                  Must-do: {anchor.name}, day {anchor.day} at {anchor.time}
                </p>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              You can swap stops, slow down, and save versions after your plan
              is ready. Prices and timings carry clear evidence labels.
            </p>
          </>
        )}
        {error && (
          <p
            role="alert"
            className="p-3 rounded-xl bg-red-50 text-red-800 text-sm"
          >
            {error}
          </p>
        )}
        <div className="flex justify-between pt-4 border-t border-[#dce4d2]">
          <button
            disabled={step === 0 || busy}
            className="text-link"
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            disabled={busy}
            onClick={() => void next()}
            className="primary-btn"
          >
            {busy ? "Starting…" : step === 3 ? "Craft my weekend" : "Continue"}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
