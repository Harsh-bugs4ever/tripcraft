package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class PlannerService {
  private final DiscoveryService discovery;
  private final ScheduleService scheduler;
  private final BudgetService budgets;

  public PlannerService(
      DiscoveryService discovery, ScheduleService scheduler, BudgetService budgets) {
    this.discovery = discovery;
    this.scheduler = scheduler;
    this.budgets = budgets;
  }

  public ObjectNode settings(ObjectNode d) {
    return obj(
        "startDate",
        d.path("startDate"),
        "endDate",
        d.path("endDate"),
        "durationDays",
        d.path("durationDays"),
        "budget",
        d.path("budget").deepCopy());
  }

  public ObjectNode generate(ObjectNode draft) {
    var data = discovery.discover(draft);
    var pool = objects(data.path("pool"));
    var days = arr();
    var used = new HashSet<String>();
    var dates = DiscoveryService.dates(draft);
    for (int i = 1; i <= dates.size(); i++) {
      var choices = pool.stream().filter(s -> !used.contains(str(s, "name"))).toList();
      var stops = scheduler.schedule(draft, i, choices, List.of());
      objects(stops).forEach(s -> used.add(str(s, "name")));
      days.add(
          obj(
              "dayNumber",
              i,
              "date",
              dates.get(i - 1),
              "title",
              i == 1
                  ? "Settle in & explore"
                  : i == dates.size()
                      ? "Slow discoveries & homeward"
                      : "A little further off the usual path",
              "theme",
              draft.path("foodFirst").asBoolean()
                  ? "Food-first discoveries"
                  : join(draft.path("interests")),
              "weather",
              data.path("weather").path(i - 1),
              "stops",
              stops,
              "isNoPlansDay",
              stops.isEmpty(),
              "notes",
              "Provisional times. Gaps allow meals, rest and transfers; road travel time is"
                  + " unverified."));
    }
    scheduler.alternatives(days, pool);
    var gems = arr();
    for (var s : pool) {
      if (!s.path("localCandidate").asBoolean()) continue;
      var signals =
          arr(
              "Area: " + str(s, "area"),
              "Found through a destination-specific local-gems search",
              s.path("reviewCount").path("value").isNumber()
                  ? s.path("reviewCount").path("value").asText() + " listing reviews"
                  : "Review count unavailable");
      var sourceIds = ((ArrayNode) s.path("sourceIds")).deepCopy();
      for (var e : objects(s.path("localEvidence"))) {
        signals.add("Web mention: " + str(e, "title"));
        sourceIds.add(e.path("sourceId"));
      }
      boolean corroborated = s.path("localEvidence").size() > 0;
      gems.add(
          obj(
              "id",
              s.path("id"),
              "title",
              s.path("name"),
              "category",
              s.path("category"),
              "description",
              "A local-pick candidate matching your trip. Popularity alone does not prove local"
                  + " endorsement.",
              "sourceAttribution",
              corroborated ? "Maps listing + web mentions" : "Google Maps listing",
              "confidence",
              corroborated
                      && !s.path("openingHours").path("value").isNull()
                      && s.path("reviewCount").path("value").asInt() > 0
                  ? "HIGH"
                  : corroborated ? "MEDIUM" : "LOW",
              "signals",
              signals,
              "caution",
              "Limited online information—verify hours before visiting.",
              "publicMapLink",
              s.path("publicMapLink"),
              "sourceIds",
              sourceIds));
      if (gems.size() == 6) break;
    }
    var warnings = ((ArrayNode) data.path("warnings")).deepCopy();
    warnings.add(
        "Walking preference: "
            + draft.path("maxWalkingKm").asDouble(3)
            + " km/day. Routing distances remain unverified; this limit cannot be guaranteed.");
    if (draft.path("accessibility").size() > 0)
      warnings.add("Confirm accessibility with each venue directly.");
    var plan =
        obj(
            "versionId",
            id(),
            "revision",
            1,
            "createdAt",
            now(),
            "reason",
            "Your trip, arranged from retrieved places",
            "plannerMode",
            data.path("plannerMode"),
            "dataMode",
            "LIVE",
            "tripSettings",
            settings(draft),
            "disruptions",
            data.path("disruptions"),
            "candidatePool",
            data.path("pool"),
            "days",
            days,
            "stay",
            data.path("stay"),
            "intercityTransport",
            data.path("transport"),
            "budgetBreakdown",
            budgets.calculate(draft, days, data.path("stay"), data.path("transport"), 10),
            "localGems",
            gems,
            "planBNotes",
            arr(
                "Use Plan B to preview a replacement. Verify route and hours.",
                "Dietary and accessibility preferences are not venue guarantees.",
                "No live crowd or queue prediction."),
            "sources",
            data.path("sources"),
            "warnings",
            warnings);
    String pref = str(draft, "weatherPreference");
    if (!pref.equals("AUTO")
        || objects(days).stream().anyMatch(d -> weatherRisk(d.path("weather"))))
      plan = replan(draft, plan, pref, 0);
    return plan;
  }

  private boolean weatherRisk(JsonNode w) {
    return w.path("precipitationChance").asDouble() >= 60
        || w.path("temperatureC").asDouble() >= 38
        || Set.of("HIGH", "CAUTION").contains(str(w, "risk"));
  }

  public ObjectNode replan(ObjectNode draft, ObjectNode current, String preference, int dayNumber) {
    require(
        Set.of("AUTO", "STAY_BACK", "LOW_EFFORT", "FULL_ADJUSTED_DAY").contains(preference),
        "Invalid weather preference.");
    var next = current.deepCopy();
    next.put("weatherAdjustmentApplied", preference);
    next.put(
        "reason",
        "Day "
            + (dayNumber == 0 ? "all" : dayNumber)
            + " · "
            + preference.toLowerCase().replace('_', ' '));
    var changes = arr();
    for (var day : objects(next.path("days"))) {
      int number = day.path("dayNumber").asInt();
      if (dayNumber != 0 && number != dayNumber) continue;
      var preserved =
          objects(day.path("stops")).stream()
              .filter(s -> s.path("isLocked").asBoolean() || s.path("isCompleted").asBoolean())
              .toList();
      String effective = preference;
      if (preference.equals("AUTO"))
        effective =
            str(day.path("weather"), "risk").equals("HIGH")
                ? "STAY_BACK"
                : weatherRisk(day.path("weather")) ? "FULL_ADJUSTED_DAY" : "AUTO";
      if (effective.equals("STAY_BACK"))
        require(
            preserved.stream().noneMatch(s -> !s.path("isCompleted").asBoolean()),
            "Locked outings need review. Unlock them before pausing the day; indoor alternatives"
                + " are not guaranteed safe.");
      var used = new HashSet<String>();
      for (var other : objects(next.path("days")))
        if (other.path("dayNumber").asInt() != number)
          objects(other.path("stops")).forEach(s -> used.add(str(s, "name")));
      var available =
          objects(next.path("candidatePool")).stream()
              .filter(s -> !used.contains(str(s, "name")))
              .toList();
      var sheltered = available.stream().filter(s -> s.path("indoorVenue").asBoolean()).toList();
      List<ObjectNode> choices;
      if (effective.equals("AUTO")) choices = available;
      else if (effective.equals("LOW_EFFORT")) {
        choices = new ArrayList<>();
        sheltered.stream()
            .filter(s -> !str(s, "category").equals("food"))
            .findFirst()
            .ifPresent(choices::add);
        sheltered.stream()
            .filter(s -> str(s, "category").equals("food"))
            .findFirst()
            .ifPresent(choices::add);
      } else choices = sheltered;
      int before = day.path("stops").size();
      var d = draft.deepCopy();
      if (effective.equals("LOW_EFFORT")) d.put("pace", "RELAXED");
      var stops =
          effective.equals("STAY_BACK")
              ? array(preserved)
              : scheduler.schedule(d, number, choices, preserved);
      day.set("stops", stops);
      day.put("isNoPlansDay", stops.isEmpty());
      day.put(
          "notes",
          effective.equals("STAY_BACK")
              ? "No new outings. Rest and arrange food at your accommodation. Amenities and"
                    + " delivery are not assumed. Follow local authority directions during"
                    + " disruption."
              : "Weather-aware suggestions. Confirm weather, shelter, hours and routes before"
                    + " leaving.");
      changes.add(
          "Day "
              + number
              + ": "
              + before
              + " stops → "
              + stops.size()
              + ". "
              + preserved.size()
              + " locked/completed stops preserved.");
    }
    next.set("changes", changes);
    scheduler.alternatives(
        array(
            objects(next.path("days")).stream()
                .filter(d -> dayNumber == 0 || d.path("dayNumber").asInt() == dayNumber)
                .toList()),
        objects(next.path("candidatePool")));
    recalculate(draft, next, current);
    return next;
  }

  private void recalculate(ObjectNode d, ObjectNode next, ObjectNode current) {
    next.set(
        "budgetBreakdown",
        budgets.calculate(
            d,
            next.path("days"),
            next.path("stay"),
            next.path("intercityTransport"),
            current.path("budgetBreakdown").path("bufferPercent").asInt(10)));
  }

  public record Adjustment(ObjectNode draft, ObjectNode plan) {}

  public Adjustment adjust(ObjectNode draft, ObjectNode current, String action, ObjectNode input) {
    var updated = draft.deepCopy();
    var next = current.deepCopy();
    switch (action) {
      case "conditions" -> {
        next = discovery.refresh(draft, current);
        next.put("reason", "Live conditions refreshed");
        next.set(
            "changes", arr("Updated forecast and disruption reports. Your stops have not moved."));
      }
      case "replans" -> {
        require(
            !input.hasNonNull("scenario"),
            "Live plans use fetched forecasts, not simulated weather.");
        int day = integer(input, "dayNumber", 1, draft.path("durationDays").asInt());
        var refreshed = discovery.refresh(draft, current);
        next = replan(draft, refreshed, str(input, "weatherPreference"), day);
      }
      case "extend" -> {
        var end = date(str(input, "endDate"));
        require(
            !end.isBefore(LocalDate.now(ZoneId.of("Asia/Kolkata"))),
            "Choose an extension end date today or later.");
        int duration = (int) ChronoUnit.DAYS.between(date(str(draft, "startDate")), end) + 1;
        require(
            duration > draft.path("durationDays").asInt() && duration <= 14,
            "Extend by at least one day, up to 14 total days.");
        require(
            input.path("budgetINR").isNumber()
                && input.path("budgetINR").asDouble() >= 1000
                && input.path("budgetINR").asDouble() <= 10000000,
            "Budget must be between ₹1,000 and ₹10,000,000.");
        updated.put("endDate", end.toString());
        updated.put("durationDays", duration);
        ((ObjectNode) updated.path("budget")).set("amountINR", input.path("budgetINR"));
        var query = updated.deepCopy();
        query.remove("anchor");
        query.put("weatherPreference", "AUTO");
        next = generate(query);
        var used = new HashSet<String>();
        objects(current.path("days"))
            .forEach(d -> objects(d.path("stops")).forEach(s -> used.add(str(s, "name"))));
        var all = ((ArrayNode) current.path("days")).deepCopy();
        var added = arr();
        for (int i = draft.path("durationDays").asInt() + 1; i <= duration; i++) {
          var day = copy(next.path("days").path(i - 1));
          var w = day.path("weather");
          var choices =
              objects(next.path("candidatePool")).stream()
                  .filter(
                      s ->
                          !used.contains(str(s, "name"))
                              && (!weatherRisk(w) || s.path("indoorVenue").asBoolean()))
                  .toList();
          var stops =
              str(w, "risk").equals("HIGH")
                  ? arr()
                  : scheduler.schedule(query, i, choices, List.of());
          objects(stops).forEach(s -> used.add(str(s, "name")));
          day.set("stops", stops);
          day.put("title", "More time to explore");
          day.put("isNoPlansDay", stops.isEmpty());
          day.put(
              "notes",
              stops.isEmpty()
                  ? "No suitable unused places found, or weather risk is high. Keep this day free"
                        + " and verify conditions."
                  : "New sourced places for your extended stay. Verify hours and transfers.");
          added.add(day);
        }
        scheduler.alternatives(added, objects(next.path("candidatePool")));
        all.addAll(added);
        next.set("days", all);
        var pool = objects(next.path("candidatePool"));
        var poolIds = new HashSet<String>();
        pool.forEach(p -> poolIds.add(str(p, "id")));
        for (var p : objects(current.path("candidatePool")))
          if (poolIds.add(str(p, "id"))) pool.add(p.deepCopy());
        next.set("candidatePool", array(pool));
        var sources = ((ArrayNode) current.path("sources")).deepCopy();
        sources.addAll((ArrayNode) next.path("sources"));
        next.set("sources", sources);
        next.put("reason", "Extended through " + end);
        next.set(
            "changes",
            arr(
                added.size()
                    + " days added; original days, locks and visited markers preserved."
                    + " Stay/transport searched again. No bookings changed."));
        recalculate(updated, next, current);
      }
      case "reschedule" -> {
        var start = date(str(input, "startDate"));
        require(
            !start.isBefore(LocalDate.now(ZoneId.of("Asia/Kolkata"))),
            "Choose today or a future start date.");
        for (var day : objects(current.path("days")))
          for (var stop : objects(day.path("stops")))
            require(
                !stop.path("isCompleted").asBoolean()
                    && !stop.path("isLocked").asBoolean()
                    && !stop.path("isAnchor").asBoolean(),
                "Locked or visited outings cannot be moved. Unlock outings or create a new trip to"
                    + " preserve fixed activities and travel history.");
        updated.put("startDate", start.toString());
        updated.put("endDate", start.plusDays(updated.path("durationDays").asInt() - 1).toString());
        next = generate(updated);
        next.put("reason", "Rescheduled to " + start);
        next.set(
            "changes",
            arr(
                "Trip moved to "
                    + start
                    + " – "
                    + str(updated, "endDate")
                    + ". Places, stays and forecasts searched again. Change any existing bookings"
                    + " yourself."));
        recalculate(updated, next, current);
      }
      case "edit" -> {
        if (input.hasNonNull("stopId")) {
          var stop = findStop(next, str(input, "stopId"));
          if (input.has("locked")) {
            require(input.path("locked").isBoolean(), "locked must be true or false.");
            stop.set("isLocked", input.path("locked"));
          }
          if (input.has("completed")) {
            require(input.path("completed").isBoolean(), "completed must be true or false.");
            stop.set("isCompleted", input.path("completed"));
          }
        }
        if (input.has("bufferPercent"))
          next.set(
              "budgetBreakdown",
              budgets.calculate(
                  draft,
                  next.path("days"),
                  next.path("stay"),
                  next.path("intercityTransport"),
                  integer(input, "bufferPercent", 0, 30)));
        next.put("reason", "Preferences updated");
        next.set("changes", arr("Preferences saved."));
      }
      case "replacements" -> {
        var stop = findStop(next, str(input, "stopId"));
        require(
            !stop.path("isLocked").asBoolean() && !stop.path("isCompleted").asBoolean(),
            "Unlock this stop before replacing it.");
        String altId =
            input.path("alternativeId").asText(stop.path("alternative").path("id").asText());
        var alt =
            objects(next.path("candidatePool")).stream()
                .filter(s -> str(s, "id").equals(altId))
                .findFirst()
                .orElseThrow(() -> new ApiException(422, "Alternative is no longer available."));
        for (var d : objects(next.path("days")))
          for (var s : objects(d.path("stops")))
            require(
                !str(s, "name").equals(str(alt, "name")),
                "This place is already scheduled on your trip.");
        var replacement = alt.deepCopy();
        replacement.put("id", id());
        replacement.put("isLocked", false);
        for (String k : List.of("timeSlot", "period", "startMinute", "endMinute"))
          replacement.set(k, stop.path(k));
        for (var d : objects(next.path("days"))) {
          var stops = (ArrayNode) d.path("stops");
          for (int i = 0; i < stops.size(); i++)
            if (str(stops.get(i), "id").equals(str(stop, "id"))) stops.set(i, replacement);
        }
        recalculate(draft, next, current);
        long total = next.path("budgetBreakdown").path("plannedTotalPaise").asLong();
        require(
            total <= next.path("budgetBreakdown").path("totalBudgetPaise").asLong()
                || total <= current.path("budgetBreakdown").path("plannedTotalPaise").asLong(),
            "This alternative increases an over-budget subtotal.");
        next.put("reason", "Replaced " + str(stop, "name"));
        next.set(
            "changes",
            arr(str(stop, "name") + " → " + str(alt, "name") + ". Verify route and hours."));
        scheduler.alternatives((ArrayNode) next.path("days"), objects(next.path("candidatePool")));
      }
      case "trim-extras" -> {
        int removed = 0;
        for (var day : objects(next.path("days"))) {
          var stops = objects(day.path("stops"));
          var keep =
              stops.stream()
                  .filter(
                      s ->
                          s.path("isLocked").asBoolean()
                              || s.path("isCompleted").asBoolean()
                              || str(s, "category").equals("food")
                              || s.path("cost").path("minMinor").asLong() == 0)
                  .toList();
          removed += stops.size() - keep.size();
          day.set("stops", array(keep));
          day.put("isNoPlansDay", keep.isEmpty());
        }
        require(
            removed > 0,
            "No optional priced activities can be removed. Unknown-price stops are not assumed"
                + " free.");
        recalculate(draft, next, current);
        next.put("reason", "Optional paid activities removed");
        next.set(
            "changes", arr(removed + " optional stops removed. Meals and contingency preserved."));
      }
      case "restore" -> {
        var old =
            objects(draft.path("versions")).stream()
                .filter(v -> str(v, "versionId").equals(str(input, "versionId")))
                .findFirst()
                .orElseThrow(() -> new ApiException(422, "Version not found."));
        require(
            str(old, "dataMode").equals("LIVE"),
            "Old sample versions cannot be activated. Generate a live plan instead.");
        next = old.deepCopy();
        var snapshot = old.path("tripSettings");
        if (snapshot.isObject()) {
          for (String field : List.of("startDate", "endDate", "durationDays", "budget"))
            updated.set(field, snapshot.path(field).deepCopy());
        } else {
          var days = objects(old.path("days"));
          updated.put("startDate", str(days.get(0), "date"));
          updated.put("endDate", str(days.get(days.size() - 1), "date"));
          updated.put("durationDays", days.size());
          ((ObjectNode) updated.path("budget"))
              .put(
                  "amountINR",
                  old.path("budgetBreakdown").path("totalBudgetPaise").asDouble()
                      / 100
                      / (draft.path("budget").path("basis").asText().equals("PER_PERSON")
                          ? draft.path("adultCount").asInt() + draft.path("childCount").asInt()
                          : 1));
        }
        next.put("reason", "Restored version " + old.path("revision").asInt());
        next.set(
            "changes",
            arr("Restored itinerary, dates and budget. Refresh conditions before travel."));
      }
      default -> throw new ApiException(404, "Unknown action.");
    }
    next.put("versionId", id());
    next.put("revision", current.path("revision").asInt() + 1);
    next.put("createdAt", now());
    next.set("tripSettings", settings(updated));
    return new Adjustment(updated, next);
  }

  public static int integer(ObjectNode n, String key, int min, int max) {
    var v = n.path(key);
    require(
        v.isIntegralNumber() && v.canConvertToInt() && v.asInt() >= min && v.asInt() <= max,
        "Invalid " + key + ".");
    return v.asInt();
  }

  private ObjectNode findStop(ObjectNode plan, String id) {
    return objects(plan.path("days")).stream()
        .flatMap(d -> objects(d.path("stops")).stream())
        .filter(s -> str(s, "id").equals(id))
        .findFirst()
        .orElseThrow(() -> new ApiException(422, "Stop not found."));
  }
}
