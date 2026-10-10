package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class ScheduleService {
  public ArrayNode schedule(
      ObjectNode draft, int day, List<ObjectNode> candidates, List<ObjectNode> preserved) {
    int begin =
        day == 1
            ? (str(draft, "arrivalConstraint").contains("Afternoon")
                ? 840
                : str(draft, "arrivalConstraint").contains("Evening") ? 1020 : 600)
            : 540;
    int end =
        day == draft.path("durationDays").asInt()
            ? (str(draft, "departureConstraint").contains("Early") ? 840 : 1080)
            : 1170;
    int
        limit =
            str(draft, "pace").equals("RELAXED") ? 2 : str(draft, "pace").equals("PACKED") ? 5 : 3,
        rest = draft.path("breakMinutes").asInt(30);
    var out = new ArrayList<ObjectNode>();
    var busy = new ArrayList<int[]>();
    for (var p : preserved) {
      out.add(p.deepCopy());
      if (p.has("startMinute"))
        busy.add(new int[] {p.path("startMinute").asInt(), p.path("endMinute").asInt()});
    }
    var anchor = draft.path("anchor");
    if (anchor.isObject()
        && anchor.path("day").asInt() == day
        && out.stream().noneMatch(s -> s.path("isAnchor").asBoolean())) {
      String[] hm = anchor.path("time").asText().split(":");
      int start = Integer.parseInt(hm[0]) * 60 + Integer.parseInt(hm[1]),
          finish = start + anchor.path("durationMinutes").asInt();
      require(
          start >= begin
              && finish <= end
              && busy.stream().noneMatch(b -> start < b[1] && finish > b[0]),
          "Must-do activity conflicts with the day window or a locked stop.");
      var match =
          candidates.stream()
              .filter(s -> str(s, "name").equalsIgnoreCase(anchor.path("name").asText()))
              .findFirst();
      var stop =
          match
              .map(ObjectNode::deepCopy)
              .orElseGet(
                  () ->
                      obj(
                          "providerIds",
                          obj(),
                          "coordinates",
                          obj("lat", 0, "lng", 0),
                          "openingHours",
                          evidence(null),
                          "accessibility",
                          evidence(null),
                          "area",
                          "User-provided location; verify address",
                          "indoorVenue",
                          false,
                          "category",
                          "relaxation",
                          "sourceIds",
                          arr(),
                          "sourceFreshness",
                          "User-provided",
                          "scheduledHoursConfidence",
                          "LOW",
                          "travelLegFromPrevious",
                          null,
                          "imageUrl",
                          ""));
      stop.put("id", "anchor-" + day);
      stop.put("name", anchor.path("name").asText());
      stop.put("isLocked", true);
      stop.put("isAnchor", true);
      stop.put(
          "reason",
          "Your fixed must-do activity. Time and location supplied by you; venue details are"
              + " unverified.");
      stop.set("alternative", node(null));
      stop.put(
          "publicMapLink",
          DiscoveryService.mapLink(
              anchor.path("name").asText() + " " + str(draft, "destinationCity")));
      stop.set("rating", evidence(null));
      stop.set("reviewCount", evidence(null));
      stop.set("cost", DiscoveryService.unknownCost());
      stop.put("dataMode", "LIVE");
      setTime(stop, start, finish);
      out.add(stop);
      busy.add(new int[] {start, finish});
    }
    var sorted = new ArrayList<>(candidates);
    sorted.sort(Comparator.comparingInt((ObjectNode s) -> score(draft, s)).reversed());
    int meals = (int) out.stream().filter(s -> str(s, "category").equals("food")).count();
    for (var candidate : sorted) {
      if (out.stream().filter(s -> !s.path("isCompleted").asBoolean()).count() >= limit) break;
      if (out.stream().anyMatch(s -> str(s, "name").equalsIgnoreCase(str(candidate, "name"))))
        continue;
      boolean food = str(candidate, "category").equals("food");
      int duration = food ? 60 : 90,
          start = food ? Math.max(begin, meals == 0 ? 720 : 1020) : begin;
      while (true) {
        int conflictEnd = -1;
        for (var b : busy)
          if (start < b[1] + rest && start + duration + rest > b[0]) {
            conflictEnd = b[1];
            break;
          }
        if (conflictEnd < 0) break;
        start = conflictEnd + rest;
      }
      if (start + duration > end) continue;
      var stop = candidate.deepCopy();
      stop.put("id", "stop-" + id());
      stop.put("isLocked", false);
      stop.put("isCompleted", false);
      setTime(stop, start, start + duration);
      stop.set("travelLegFromPrevious", node(null));
      out.add(stop);
      busy.add(new int[] {start, start + duration});
      if (food) meals++;
    }
    out.sort(Comparator.comparingInt(s -> s.path("startMinute").asInt()));
    return array(out);
  }

  private int score(ObjectNode d, ObjectNode s) {
    return (d.path("foodFirst").asBoolean() && str(s, "category").equals("food") ? 4 : 0)
        + (join(d.path("interests")).toLowerCase().contains(str(s, "category")) ? 2 : 0);
  }

  private void setTime(ObjectNode s, int start, int end) {
    s.put("startMinute", start);
    s.put("endMinute", end);
    s.put(
        "timeSlot",
        String.format("%02d:%02d – %02d:%02d", start / 60, start % 60, end / 60, end % 60));
    s.put("period", start < 720 ? "MORNING" : start < 1020 ? "AFTERNOON" : "EVENING");
  }

  public double distance(ObjectNode a, ObjectNode b) {
    var x = a.path("coordinates");
    var y = b.path("coordinates");
    double lat1 = Math.toRadians(x.path("lat").asDouble()),
        lat2 = Math.toRadians(y.path("lat").asDouble()),
        dl = lat2 - lat1,
        dg = Math.toRadians(y.path("lng").asDouble() - x.path("lng").asDouble());
    double h =
        Math.pow(Math.sin(dl / 2), 2)
            + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dg / 2), 2);
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  }

  public void alternatives(ArrayNode days, List<ObjectNode> pool) {
    for (var day : objects(days))
      for (var stop : objects(day.path("stops"))) {
        if (stop.path("isAnchor").asBoolean()) continue;
        var candidates =
            pool.stream()
                .filter(
                    p ->
                        !str(p, "name").equals(str(stop, "name"))
                            && objects(day.path("stops")).stream()
                                .noneMatch(s -> str(s, "name").equals(str(p, "name")))
                            && distance(stop, p) <= 5)
                .sorted(
                    Comparator.comparingInt(
                            (ObjectNode p) ->
                                str(p, "category").equals(str(stop, "category")) ? 0 : 1)
                        .thenComparingDouble(p -> distance(stop, p)))
                .toList();
        if (candidates.isEmpty()) {
          stop.set("alternative", node(null));
          continue;
        }
        var alt = candidates.get(0);
        stop.set(
            "alternative",
            obj(
                "id",
                alt.path("id"),
                "name",
                alt.path("name"),
                "area",
                alt.path("area"),
                "category",
                alt.path("category"),
                "reason",
                String.format(
                    "About %.1f km straight-line distance. Verify route, opening hours and price.",
                    distance(stop, alt)),
                "cost",
                alt.path("cost"),
                "rating",
                alt.path("rating").path("value").asDouble(),
                "sourceIds",
                alt.path("sourceIds"),
                "publicMapLink",
                alt.path("publicMapLink")));
      }
  }
}
