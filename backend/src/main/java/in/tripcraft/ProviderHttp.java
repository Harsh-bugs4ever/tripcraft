package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.JsonNode;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class ProviderHttp {
  private final HttpClient client =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

  public static String query(String base, Map<String, String> params) {
    StringJoiner q = new StringJoiner("&");
    params.forEach(
        (k, v) ->
            q.add(
                URLEncoder.encode(k, StandardCharsets.UTF_8)
                    + "="
                    + URLEncoder.encode(v, StandardCharsets.UTF_8)));
    return base + (base.contains("?") ? "&" : "?") + q;
  }

  public JsonNode get(String url) {
    return send(
        HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(20)).GET().build());
  }

  public JsonNode post(String url, String key, JsonNode body) {
    return send(
        HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(25))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + key)
            .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
            .build());
  }

  private JsonNode send(HttpRequest request) {
    try {
      var response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
      try (var body = response.body()) {
        if (response.statusCode() < 200 || response.statusCode() > 299)
          throw new ApiException(
              502,
              "Travel provider unavailable (HTTP "
                  + response.statusCode()
                  + "). Check credentials, quota and connectivity.");
        byte[] bytes = body.readNBytes(4_000_001);
        if (bytes.length > 4_000_000) throw new ApiException(502, "Provider response too large.");
        return M.readTree(bytes);
      }
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      if (e instanceof InterruptedException) Thread.currentThread().interrupt();
      throw new ApiException(502, "Travel provider could not be reached. Please retry.");
    }
  }
}
