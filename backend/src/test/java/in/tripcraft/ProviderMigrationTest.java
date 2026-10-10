package in.tripcraft;

import static in.tripcraft.Json.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class ProviderMigrationTest {
  @Test
  void groqRequestUsesBearerAndChatCompletionFormat() throws Exception {
    var request = new AtomicReference<JsonNode>();
    var auth = new AtomicReference<String>();
    var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/chat/completions", exchange -> {
      auth.set(exchange.getRequestHeaders().getFirst("Authorization"));
      request.set(M.readTree(exchange.getRequestBody()));
      byte[] response = obj("choices", arr(obj("message", obj("content",
          obj("orderedIds", arr("b", "a")).toString())))).toString().getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(200, response.length);
      exchange.getResponseBody().write(response);
      exchange.close();
    });
    server.start();
    try {
      var discovery = new DiscoveryService(new ProviderHttp(), null, "", "", "test-key",
          "openai/gpt-oss-120b", "http://127.0.0.1:" + server.getAddress().getPort() + "/chat/completions");
      var ranked = discovery.rank(obj(), arr(obj("id", "a"), obj("id", "b")));
      assertEquals("b", ranked.get(0).path("id").asText());
      assertEquals("Bearer test-key", auth.get());
      assertEquals("openai/gpt-oss-120b", request.get().path("model").asText());
      assertEquals("json_object", request.get().path("response_format").path("type").asText());
      assertEquals("system", request.get().path("messages").get(0).path("role").asText());
    } finally { server.stop(0); }
  }

  @Test
  void rejectsInvalidOrInventedRankings() {
    var http = mock(ProviderHttp.class);
    var discovery = new DiscoveryService(http, null, "", "", "key", "model", "https://example.test");
    for (String content : List.of("not json", "{}", "{\"orderedIds\":[\"a\",\"a\"]}",
        "{\"orderedIds\":[\"a\",\"invented\"]}")) {
      when(http.post(anyString(), anyString(), any())).thenReturn(
          obj("choices", arr(obj("message", obj("content", content)))));
      assertThrows(ApiException.class, () -> discovery.rank(obj(), arr(obj("id", "a"), obj("id", "b"))));
    }
  }

  @Test
  void weatherKeyStaysOutOfReturnedSourcesAndFailuresRemainUnknown() {
    var http = mock(ProviderHttp.class);
    when(http.get(anyString())).thenReturn(obj("daily", obj("time", arr("2026-10-09"),
        "temperature_2m_max", arr(25), "precipitation_probability_max", arr(10),
        "precipitation_sum", arr(0), "wind_speed_10m_max", arr(5), "weather_code", arr(0))));
    var weather = new WeatherService(http, "https://customer-api.open-meteo.com/v1/forecast", "secret-key");
    var result = weather.forecast(12, 77, List.of("2026-10-09", "2027-01-01"));
    verify(http).get(contains("apikey=secret-key"));
    assertEquals("SOURCED", result.get(0).path("status").asText());
    assertFalse(result.toString().contains("secret-key"));
    assertFalse(result.toString().contains("apikey"));
    assertEquals("UNKNOWN", result.get(1).path("status").asText());
    clearInvocations(http);
    new WeatherService(http, "https://api.open-meteo.com/v1/forecast", "")
        .forecast(12, 77, List.of("2026-10-09"));
    verify(http).get(argThat(url -> !url.contains("apikey")));
    when(http.get(anyString())).thenThrow(new ApiException(502, "unavailable"));
    assertEquals("UNKNOWN", weather.forecast(12, 77, List.of("2026-10-09")).get(0).path("status").asText());
  }
}
