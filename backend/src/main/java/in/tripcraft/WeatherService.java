package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WeatherService {
  private final ProviderHttp http;
  private final String url, key;

  public WeatherService(
      ProviderHttp http,
      @Value("${tripcraft.weather-url}") String url,
      @Value("${tripcraft.weather-key:}") String key) {
    this.http = http;
    this.url = url;
    this.key = key;
  }

  public ObjectNode missing() {
    return obj(
        "condition",
        "Forecast unavailable",
        "icon",
        "cloudy",
        "temperatureC",
        null,
        "precipitationChance",
        null,
        "aqi",
        null,
        "advisory",
        "Forecast unavailable or outside the 16-day horizon. Conditions are unknown.",
        "status",
        "UNKNOWN",
        "sourceTimestamp",
        "",
        "risk",
        "UNKNOWN",
        "risks",
        arr(),
        "sourceUrl",
        "https://open-meteo.com/");
  }

  private Double number(JsonNode daily, String key, int i) {
    var n = daily.path(key).path(i);
    return n.isNumber() ? n.asDouble() : null;
  }

  private boolean atLeast(Double n, double limit) {
    return n != null && n >= limit;
  }

  public ObjectNode normalize(JsonNode daily, String date, String at, String source) {
    int i = -1;
    for (int k = 0; k < daily.path("time").size(); k++)
      if (daily.path("time").path(k).asText().equals(date)) i = k;
    if (i < 0) return missing();
    Double temp = number(daily, "temperature_2m_max", i),
        rain = number(daily, "precipitation_probability_max", i),
        mm = number(daily, "precipitation_sum", i),
        wind = number(daily, "wind_speed_10m_max", i),
        code = number(daily, "weather_code", i);
    if (temp == null && rain == null && mm == null && wind == null && code == null)
      return missing();
    var risks = arr();
    boolean thunder = atLeast(code, 95);
    if (thunder) risks.add("Thunderstorms forecast");
    if (atLeast(mm, 50)) risks.add("High daily rainfall forecast");
    else if (atLeast(rain, 60)) risks.add("Rain may disrupt outdoor stops");
    if (atLeast(wind, 50)) risks.add("Strong wind forecast");
    if (atLeast(temp, 38)) risks.add("High daytime temperature forecast");
    boolean high = thunder || atLeast(mm, 50) || atLeast(wind, 60) || atLeast(temp, 42);
    return obj(
        "condition",
        risks.isEmpty() ? "Weather outlook" : risks.get(0).asText(),
        "icon",
        thunder ? "thunder" : atLeast(rain, 60) ? "rainy" : "cloudy",
        "temperatureC",
        temp,
        "precipitationChance",
        rain,
        "rainMm",
        mm,
        "windKph",
        wind,
        "weatherCode",
        code,
        "aqi",
        null,
        "risk",
        high ? "HIGH" : risks.isEmpty() ? "LOW" : "CAUTION",
        "risks",
        risks,
        "status",
        "SOURCED",
        "sourceTimestamp",
        at,
        "sourceUrl",
        source,
        "advisory",
        high
            ? "App screening flag, not an official warning. Consider postponing outings and check"
                  + " local authorities. Indoor venues are not guaranteed safe during a disaster."
            : risks.isEmpty()
                ? "No weather threshold triggered. This is not an all-clear or a disaster forecast."
                : "Consider sheltered alternatives and less outdoor exposure. Confirm access before"
                      + " leaving.");
  }

  public ArrayNode forecast(double lat, double lng, List<String> dates) {
    var result = arr();
    try {
      String source =
          ProviderHttp.query(
              url,
              Map.of(
                  "latitude",
                  "" + lat,
                  "longitude",
                  "" + lng,
                  "daily",
                  "temperature_2m_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,weather_code",
                  "timezone",
                  "Asia/Kolkata",
                  "forecast_days",
                  "16"));
      // Keep credentials out of source links returned to the browser and saved plans.
      String requestUrl = key.isBlank() ? source : ProviderHttp.query(source, Map.of("apikey", key));
      var data = http.get(requestUrl);
      String at = now();
      dates.forEach(d -> result.add(normalize(data.path("daily"), d, at, source)));
    } catch (Exception e) {
      dates.forEach(d -> result.add(missing()));
    }
    return result;
  }
}
