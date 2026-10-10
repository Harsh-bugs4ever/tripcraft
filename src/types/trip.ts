/**
 * TripCraft Core Types & Evidence Contract
 */

export type EvidenceStatus =
  | "SOURCED"
  | "ESTIMATED"
  | "UNKNOWN"
  | "CONFLICTING";

export interface Evidence<T> {
  value: T | null;
  sourceIds: string[];
  retrievedAt: string | null; // ISO-8601 UTC
  observedAt: string | null;
  status: EvidenceStatus;
  assumptions: string[];
}

export interface Source {
  id: string;
  provider: string; // e.g. 'Google Places', 'SerpApi Hotels', 'IRCTC', 'ASI Heritage'
  url: string; // safe public source link, never a credential
  title: string | null;
  retrievedAt: string;
}

export interface MoneyRange {
  currency: "INR";
  minMinor: number | null; // integer paise (e.g. 250000 = ₹2,500)
  maxMinor: number | null;
  basis: "PER_PERSON" | "PER_GROUP" | "PER_ROOM_NIGHT" | "TOTAL_STAY";
  taxes: "INCLUDED" | "EXCLUDED" | "UNKNOWN";
}

export type PaceType = "RELAXED" | "BALANCED" | "PACKED";
export type WeatherPreferenceType =
  | "AUTO"
  | "STAY_BACK"
  | "LOW_EFFORT"
  | "FULL_ADJUSTED_DAY";
export type StopPeriod = "MORNING" | "AFTERNOON" | "EVENING";
export type StopCategory =
  | "heritage"
  | "nature"
  | "food"
  | "adventure"
  | "shopping"
  | "relaxation"
  | "nightlife"
  | "indoor_culture"
  | "scenic_view";

export interface TravelLeg {
  durationMinutes: number;
  mode: "DRIVE" | "WALK" | "FERRY" | "AUTO_RICKSHAW" | "METRO";
  distanceKm: number;
  status: EvidenceStatus;
  notes?: string;
}

export interface StopAlternative {
  id: string;
  name: string;
  area: string;
  category: StopCategory;
  reason: string;
  cost: MoneyRange;
  rating: number;
  sourceIds: string[];
  publicMapLink: string;
}

export interface TripStop {
  localEvidence?: { title: string; url: string; sourceId: string }[];
  timingAdvice?: string;
  durationMinutes?: number;
  startMinute?: number;
  endMinute?: number;
  isCompleted?: boolean;
  isAnchor?: boolean;
  dataMode?: "DEMO" | "LIVE";
  id: string;
  providerIds: Record<string, string>;
  name: string;
  category: StopCategory;
  area: string;
  coordinates: { lat: number; lng: number };
  reason: string;
  timeSlot: string; // e.g. "09:30 AM - 11:30 AM"
  period: StopPeriod;
  cost: MoneyRange;
  rating: Evidence<number>;
  reviewCount: Evidence<number>;
  scheduledHoursConfidence: "HIGH" | "MEDIUM" | "LOW";
  openingHours: Evidence<string>;
  accessibility: Evidence<string>; // unknown must remain unknown
  sourceFreshness: string;
  travelLegFromPrevious: TravelLeg | null;
  sourceIds: string[];
  publicMapLink: string;
  imageUrl: string;
  alternative: StopAlternative | null;
  isLocked: boolean;
  dietaryMatch?: string[];
  indoorVenue?: boolean;
}

export interface DisruptionReport {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  kind: "NEWS_REPORT";
  verification: "UNVERIFIED";
}
export interface DisruptionContext {
  status: "REPORTS_FOUND" | "NO_MATCHES" | "UNAVAILABLE";
  checkedAt: string;
  reports: DisruptionReport[];
  note: string;
}
export interface DayWeather {
  rainMm?: number | null;
  windKph?: number | null;
  weatherCode?: number | null;
  risk?: "LOW" | "CAUTION" | "HIGH" | "UNKNOWN";
  risks?: string[];
  sourceUrl?: string;

  simulated?: boolean;
  condition: string;
  icon: "sunny" | "rainy" | "cloudy" | "thunder" | "hazy";
  temperatureC: number | null;
  precipitationChance: number | null;
  aqi: number | null;
  advisory: string | null;
  status: EvidenceStatus;
  sourceTimestamp: string;
}

export interface TripDay {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  title: string;
  theme: string;
  weather: DayWeather;
  stops: TripStop[];
  isNoPlansDay?: boolean;
  notes?: string;
}

export interface TripStay {
  observedQuoteINR?: number;
  id: string;
  name: string;
  area: string;
  category:
    | "Heritage Haveli"
    | "Boutique Resort"
    | "Eco Homestay"
    | "City Hotel"
    | "Beachfront Villa";
  rating: Evidence<number>;
  reviewCount: Evidence<number>;
  nightlyRatePaise: number;
  totalStayPaise: number;
  roomCount: number;
  nights: number;
  occupancyDescription: string;
  taxesStatus: "INCLUDED" | "EXCLUDED" | "UNKNOWN";
  cancellationPolicy: string;
  areaSuitability: string;
  providerLink: string; // Outbound link labeled "View provider" or "Check availability"
  sourceIds: string[];
  imageUrl: string;
}

export interface IntercityTransportOption {
  observedQuoteINR?: number;
  mode: "CAR_DRIVE" | "TRAIN_EXP" | "FLIGHT" | "FERRY";
  title: string;
  route: string;
  typicalDurationMinutes: number;
  estimatedCostPaise: number;
  status: EvidenceStatus;
  providerLink: string;
  sourceNotes: string;
}

export interface CostItem {
  category:
    | "STAY"
    | "TRANSPORT"
    | "FOOD"
    | "ACTIVITIES"
    | "BUFFER"
    | "EXCLUDED_UNKNOWN";
  label: string;
  amountPaise: number;
  basis: "PER_PERSON" | "PER_GROUP";
  isEstimate: boolean;
  notes?: string;
}

export interface BudgetBreakdown {
  totalBudgetPaise: number;
  plannedTotalPaise: number;
  perPersonBudgetPaise: number;
  perPersonPlannedPaise: number;
  remainingPaise: number;
  bufferPercent: number; // default 10
  bufferPaise: number;
  isFeasible: boolean;
  feasibilityNotes?: string;
  items: CostItem[];
}

export interface LocalGem {
  id: string;
  title: string;
  category: string;
  description: string;
  sourceAttribution: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  signals?: string[];
  caution?: string;
  publicMapLink?: string;
  sourceIds?: string[];
}

export interface TripPlanVersion {
  disruptions?: DisruptionContext;
  tripSettings?: {
    startDate: string;
    endDate: string;
    durationDays: number;
    budget: TripDraft["budget"];
  };
  plannerMode?: "GROQ" | "RULE_BASED";

  dataMode?: "DEMO" | "LIVE";
  candidatePool?: TripStop[];
  changes?: string[];
  warnings?: string[];
  versionId: string;
  revision: number;
  createdAt: string;
  reason: string;
  weatherAdjustmentApplied?: WeatherPreferenceType;
  days: TripDay[];
  stay: TripStay;
  intercityTransport: IntercityTransportOption | null;
  budgetBreakdown: BudgetBreakdown;
  localGems: LocalGem[];
  planBNotes: string[];
  sources: Source[];
}

export interface TripDraft {
  foodFirst?: boolean;
  cuisines?: string[];
  mealBudgetINR?: number;
  maxWalkingKm?: number;
  breakMinutes?: number;
  anchor?: { name: string; day: number; time: string; durationMinutes: number };
  departureAirport?: string;
  arrivalAirport?: string;
  id: string;
  userId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  originCity: string;
  destinationCity: string;
  destinationCoords: { lat: number; lng: number };
  startDate: string;
  endDate: string;
  durationDays: number;
  arrivalConstraint?: string;
  departureConstraint?: string;
  budget: {
    amountINR: number;
    basis: "PER_PERSON" | "PER_GROUP";
    includeMajorTransport: boolean;
  };
  adultCount: number;
  childCount: number;
  childAges: number[];
  roomCount: number;
  interests: string[];
  pace: PaceType;
  dietary: string[];
  accessibility: string[];
  weatherPreference: WeatherPreferenceType;
  activeVersionId?: string;
  versions: TripPlanVersion[];
}

export type JobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL"
  | "NEEDS_INPUT"
  | "FAILED"
  | "CANCELLED";

export interface GenerationJob {
  jobId: string;
  tripId: string;
  status: JobStatus;
  currentStage: string;
  completedStages: string[];
  warnings: string[];
  resultVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface CityHub {
  id: string;
  name: string;
  state: string;
  region: string;
  coords: { lat: number; lng: number };
  popularWeekendDestinations: {
    destinationId: string;
    name: string;
    distanceKm: number;
    travelDurationMinutes: number;
    primaryMode: "DRIVE" | "TRAIN" | "FERRY";
    tags: string[];
  }[];
}
