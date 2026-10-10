package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Service;

@Service
public class BudgetService {
  public ObjectNode calculate(
      ObjectNode draft, JsonNode days, JsonNode stay, JsonNode transport, int buffer) {
    int people = draft.path("adultCount").asInt() + draft.path("childCount").asInt();
    long cap =
        Math.round(
            draft.path("budget").path("amountINR").asDouble()
                * 100
                * (draft.path("budget").path("basis").asText().equals("PER_PERSON") ? people : 1));
    long meals = 0, activities = 0;
    for (var day : objects(days))
      for (var stop : objects(day.path("stops"))) {
        var cost = stop.path("cost");
        long value =
            cost.path("maxMinor").isNumber()
                ? cost.path("maxMinor").asLong()
                : cost.path("minMinor").asLong();
        value *= cost.path("basis").asText().equals("PER_PERSON") ? people : 1;
        if (str(stop, "category").equals("food")) meals += value;
        else activities += value;
      }
    long allowance =
        Math.round(draft.path("mealBudgetINR").asDouble(350) * 100)
            * people
            * 3
            * draft.path("durationDays").asInt();
    long transportCost = 0;
    if (draft.path("budget").path("includeMajorTransport").asBoolean()
        && transport != null
        && !transport.isNull())
      transportCost =
          transport.path("estimatedCostPaise").asLong()
              * (str(transport, "mode").equals("CAR_DRIVE") ? 1 : people);
    long contingency = Math.round(cap * buffer / 100.0),
        stayCost = stay.path("totalStayPaise").asLong();
    var items =
        arr(
            item(
                "STAY",
                stay.path("nights").asInt() > 0
                    ? "Stay allowance / known subtotal"
                    : "No overnight stay",
                stayCost,
                stayCost == 0 && stay.path("nights").asInt() > 0
                    ? "Unknown: no confirmed stay quote."
                    : "Room/night basis must be confirmed."),
            item(
                "TRANSPORT",
                "Major transport subtotal",
                transportCost,
                "Unquoted fares and local transfers are excluded, not free."),
            item(
                "FOOD",
                "Food allowance (all travelers)",
                Math.max(meals, allowance),
                "Three meals per traveler/day. Scheduled food counted once."),
            item(
                "ACTIVITIES",
                "Known activity subtotal",
                activities,
                "Unknown entry costs are excluded, not free."),
            item("BUFFER", "Contingency (" + buffer + "%)", contingency, "User-selected reserve."));
    long total = stayCost + transportCost + Math.max(meals, allowance) + activities + contingency,
        remaining = cap - total;
    return obj(
        "items",
        items,
        "totalBudgetPaise",
        cap,
        "plannedTotalPaise",
        total,
        "perPersonBudgetPaise",
        Math.round((double) cap / people),
        "perPersonPlannedPaise",
        Math.round((double) total / people),
        "remainingPaise",
        remaining,
        "bufferPaise",
        contingency,
        "bufferPercent",
        buffer,
        "isFeasible",
        remaining >= 0,
        "feasibilityNotes",
        remaining < 0
            ? "Known costs exceed budget. Reduce optional paid activities or increase the budget."
            : "Provisional subtotal only. Unknown transport, entry fees and stay quotes must be"
                  + " added before confirming affordability.");
  }

  private ObjectNode item(String category, String label, long amount, String note) {
    return obj(
        "category",
        category,
        "label",
        label,
        "amountPaise",
        amount,
        "basis",
        "PER_GROUP",
        "isEstimate",
        true,
        "notes",
        note);
  }
}
