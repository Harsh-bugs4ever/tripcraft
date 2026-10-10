package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Typed HTTP boundary; persistent JSON retains the existing frontend/export contract. */
public record TripInput(
    @NotBlank @Size(max = 120) String originCity,
    @NotBlank @Size(max = 120) String destinationCity,
    @NotBlank String startDate,
    @NotBlank String endDate,
    @NotNull @Valid Budget budget,
    @Min(1) @Max(20) int adultCount,
    @Min(0) @Max(10) int childCount,
    @NotNull @Size(max = 10) List<@Min(0) @Max(17) Integer> childAges,
    @Min(1) @Max(20) int roomCount,
    @NotNull @Size(max = 15) List<@NotBlank @Size(max = 120) String> interests,
    @NotNull Pace pace,
    @NotNull @Size(max = 15) List<@NotBlank @Size(max = 120) String> dietary,
    @NotNull @Size(max = 15) List<@NotBlank @Size(max = 120) String> accessibility,
    @NotNull WeatherPreference weatherPreference,
    @Size(max = 100) String arrivalConstraint,
    @Size(max = 100) String departureConstraint,
    boolean foodFirst,
    @Size(max = 15) List<@NotBlank @Size(max = 120) String> cuisines,
    @Min(50) @Max(10000) Integer mealBudgetINR,
    @Min(0) @Max(30) Double maxWalkingKm,
    @Min(15) @Max(120) Integer breakMinutes,
    @Valid Anchor anchor,
    @Pattern(regexp = "[A-Z]{3}") String departureAirport,
    @Pattern(regexp = "[A-Z]{3}") String arrivalAirport) {
  public enum Pace {
    RELAXED,
    BALANCED,
    PACKED
  }

  public enum WeatherPreference {
    AUTO,
    STAY_BACK,
    LOW_EFFORT,
    FULL_ADJUSTED_DAY
  }

  public enum Basis {
    PER_PERSON,
    PER_GROUP
  }

  public record Budget(
      @DecimalMin("1000") @DecimalMax("10000000") double amountINR,
      @NotNull Basis basis,
      boolean includeMajorTransport) {}

  public record Anchor(
      @NotBlank @Size(max = 120) String name,
      @Min(1) @Max(14) int day,
      @NotNull @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d") String time,
      @Min(15) @Max(360) int durationMinutes) {}

  public ObjectNode normalized() {
    long days = ChronoUnit.DAYS.between(date(startDate), date(endDate)) + 1;
    require(days >= 1 && days <= 14, "Choose a trip of 1–14 days.");
    require(childAges.size() == childCount, "Enter an age for every child.");
    require(anchor == null || anchor.day <= days, "Anchor day must be within the trip.");
    var n = (ObjectNode) M.valueToTree(this);
    n.put("originCity", originCity.trim());
    n.put("destinationCity", destinationCity.trim());
    n.put("durationDays", days);
    n.put("mealBudgetINR", mealBudgetINR == null ? 350 : mealBudgetINR);
    n.put("maxWalkingKm", maxWalkingKm == null ? 3 : maxWalkingKm);
    n.put("breakMinutes", breakMinutes == null ? 30 : breakMinutes);
    if (cuisines == null) n.set("cuisines", arr());
    return n;
  }
}
