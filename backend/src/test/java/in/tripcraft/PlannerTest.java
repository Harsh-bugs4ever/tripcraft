package in.tripcraft;

import static in.tripcraft.Json.*;
import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class PlannerTest {
  ObjectNode draft() {
    return obj(
        "startDate",
        "2026-11-01",
        "endDate",
        "2026-11-02",
        "durationDays",
        2,
        "adultCount",
        2,
        "childCount",
        0,
        "roomCount",
        1,
        "budget",
        obj("amountINR", 30000, "basis", "PER_GROUP", "includeMajorTransport", true),
        "pace",
        "BALANCED",
        "interests",
        arr(),
        "breakMinutes",
        30,
        "mealBudgetINR",
        350);
  }

  ObjectNode stop(String name) {
    return obj(
        "id",
        name,
        "name",
        name,
        "category",
        "heritage",
        "coordinates",
        obj("lat", 20, "lng", 73),
        "cost",
        DiscoveryService.unknownCost(),
        "sourceIds",
        arr(),
        "rating",
        evidence(null),
        "reviewCount",
        evidence(null),
        "indoorVenue",
        true);
  }

  @Test
  void budgetCountsFoodOnce() {
    var d = draft();
    var food = stop("Meal");
    food.put("category", "food");
    food.set("cost", obj("minMinor", 50000, "maxMinor", 50000, "basis", "PER_PERSON"));
    var b =
        new BudgetService()
            .calculate(
                d,
                arr(obj("stops", arr(food))),
                obj("nights", 1, "totalStayPaise", 500000),
                null,
                10);
    assertEquals(420000, b.path("items").path(2).path("amountPaise").asLong());
    assertEquals(1220000, b.path("plannedTotalPaise").asLong());
    assertEquals(0, b.path("items").path(3).path("amountPaise").asLong());
  }

  @Test
  void schedulerPreservesAnchorAndAvoidsOverlaps() {
    var d = draft();
    d.set("anchor", obj("day", 1, "name", "My meeting", "time", "12:00", "durationMinutes", 60));
    var schedule =
        new ScheduleService()
            .schedule(d, 1, List.of(stop("Museum"), stop("Park"), stop("Gallery")), List.of());
    assertEquals(3, schedule.size());
    assertTrue(
        objects(schedule).stream()
            .anyMatch(s -> s.path("isAnchor").asBoolean() && s.path("startMinute").asInt() == 720));
    var stops = objects(schedule);
    for (int i = 1; i < stops.size(); i++)
      assertTrue(
          stops.get(i - 1).path("endMinute").asInt() <= stops.get(i).path("startMinute").asInt());
  }

  @Test
  void highRiskPausesOnlySelectedDayAndProtectsLocks() {
    var service = new PlannerService(null, new ScheduleService(), new BudgetService());
    var d = draft();
    var s = stop("Museum");
    s.put("startMinute", 600);
    s.put("endMinute", 690);
    var plan =
        obj(
            "days",
            arr(
                obj("dayNumber", 1, "weather", obj("risk", "HIGH"), "stops", arr(s)),
                obj("dayNumber", 2, "weather", obj("risk", "LOW"), "stops", arr(stop("Other")))),
            "candidatePool",
            arr(stop("Indoor")),
            "stay",
            obj("nights", 1, "totalStayPaise", 0),
            "intercityTransport",
            null,
            "budgetBreakdown",
            obj("bufferPercent", 10));
    var adjusted = service.replan(d, plan, "AUTO", 1);
    assertEquals(0, adjusted.path("days").path(0).path("stops").size());
    assertEquals(plan.path("days").path(1), adjusted.path("days").path(1));
    s.put("isLocked", true);
    assertThrows(ApiException.class, () -> service.replan(d, plan, "AUTO", 1));
  }

  @Test
  void persistenceSurvivesReopenAndRestartFailsRunningJob() throws Exception {
    var dir = java.nio.file.Files.createTempDirectory("state-reopen");
    var store = new StateStore(dir.toString(), "");
    String key = store.secret;
    store.write(
        s -> {
          ((ArrayNode) s.path("trips")).add(obj("id", "saved"));
          ((ArrayNode) s.path("jobs")).add(obj("status", "RUNNING"));
          return null;
        });
    store.close();
    var reopened = new StateStore(dir.toString(), "");
    assertEquals("saved", reopened.snapshot().path("trips").path(0).path("id").asText());
    assertEquals("FAILED", reopened.snapshot().path("jobs").path(0).path("status").asText());
    assertEquals(key, reopened.secret);
    reopened.close();
  }
}
