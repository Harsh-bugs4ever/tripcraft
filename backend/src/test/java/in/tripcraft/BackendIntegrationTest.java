package in.tripcraft;

import static in.tripcraft.Json.*;
import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.node.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendIntegrationTest {
  static Path data;
  static HttpServer provider;
  static volatile boolean storm = false;
  static Set<String> engines = ConcurrentHashMap.newKeySet();
  static volatile CountDownLatch providerEntered, providerRelease;

  static {
    try {
      data = Files.createTempDirectory("tripcraft-java-test-");
      provider = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      provider.setExecutor(
          Executors.newCachedThreadPool(
              r -> {
                Thread t = new Thread(r);
                t.setDaemon(true);
                return t;
              }));
      provider.createContext(
          "/",
          exchange -> {
            try {
              var query = new HashMap<String, String>();
              String raw = exchange.getRequestURI().getRawQuery();
              if (raw != null)
                for (String part : raw.split("&")) {
                  String[] p = part.split("=", 2);
                  query.put(
                      URLDecoder.decode(p[0], StandardCharsets.UTF_8),
                      URLDecoder.decode(p.length > 1 ? p[1] : "", StandardCharsets.UTF_8));
                }
              String engine = query.getOrDefault("engine", "");
              engines.add(engine);
              if (engine.equals("google_maps") && providerEntered != null) {
                providerEntered.countDown();
                providerRelease.await(10, TimeUnit.SECONDS);
              }
              ObjectNode response;
              if (exchange.getRequestURI().getPath().equals("/weather")) {
                var dates = arr();
                var temp = arr();
                var rain = arr();
                var mm = arr();
                var wind = arr();
                var code = arr();
                for (int i = 0; i < 16; i++) {
                  dates.add(
                      java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"))
                          .plusDays(i)
                          .toString());
                  temp.add(25);
                  rain.add(storm ? 95 : 10);
                  mm.add(storm ? 80 : 0);
                  wind.add(10);
                  code.add(storm ? 95 : 0);
                }
                response =
                    obj(
                        "daily",
                        obj(
                            "time",
                            dates,
                            "temperature_2m_max",
                            temp,
                            "precipitation_probability_max",
                            rain,
                            "precipitation_sum",
                            mm,
                            "wind_speed_10m_max",
                            wind,
                            "weather_code",
                            code));
              } else if (engine.equals("google_maps")) {
                var places = arr();
                boolean food = query.getOrDefault("q", "").contains("restaurants");
                for (int i = 0; i < 20; i++)
                  places.add(
                      obj(
                          "place_id",
                          (food ? "f" : "m") + i,
                          "title",
                          (food ? "Test Cafe " : "Test Museum ") + i,
                          "address",
                          "Jaipur",
                          "type",
                          food ? "Restaurant" : "Museum",
                          "rating",
                          4.2,
                          "reviews",
                          70,
                          "gps_coordinates",
                          obj("latitude", 26.9 + i * .001, "longitude", 75.8)));
                response = obj("local_results", places);
              } else if (engine.equals("google_hotels"))
                response =
                    obj(
                        "properties",
                        arr(
                            obj(
                                "name",
                                "Test Hotel",
                                "property_token",
                                "test-hotel",
                                "total_rate",
                                obj("extracted_lowest", 8000),
                                "link",
                                "https://example.org/hotel")));
              else if (engine.equals("google_news"))
                response =
                    obj(
                        "news_results",
                        arr(
                            obj(
                                "title",
                                "Jaipur storm warning disrupts roads",
                                "link",
                                "https://example.org/report",
                                "date",
                                "1 hour ago",
                                "source",
                                obj("name", "Test publisher"))));
              else if (engine.equals("google_flights"))
                response = obj("best_flights", arr(obj("price", 5000, "total_duration", 120)));
              else response = obj("organic_results", arr());
              byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
              exchange.getResponseHeaders().add("Content-Type", "application/json");
              exchange.sendResponseHeaders(200, bytes.length);
              exchange.getResponseBody().write(bytes);
            } catch (Exception ignored) {
            } finally {
              exchange.close();
            }
          });
      provider.start();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry r) {
    String base = "http://127.0.0.1:" + provider.getAddress().getPort();
    r.add("tripcraft.data-dir", () -> data.toString());
    r.add("tripcraft.serp-key", () -> "test-only-key");
    r.add("tripcraft.serp-url", () -> base + "/search");
    r.add("tripcraft.weather-url", () -> base + "/weather");
    r.add("tripcraft.weather-key", () -> "");
    r.add("tripcraft.groq-key", () -> "");
  }

  @LocalServerPort int port;
  @Autowired StateStore store;
  @Autowired WeatherService weather;
  @Autowired DiscoveryService discovery;
  HttpClient client = HttpClient.newHttpClient();
  String cookie = "";

  record Result(int status, ObjectNode body) {}

  Result call(String method, String route, ObjectNode body, String... extra) throws Exception {
    var b =
        HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/v1" + route))
            .header("Content-Type", "application/json");
    if (!cookie.isBlank()) b.header("Cookie", cookie);
    for (int i = 0; i < extra.length; i += 2) b.header(extra[i], extra[i + 1]);
    b.method(
        method,
        body == null
            ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(body.toString()));
    var r = client.send(b.build(), HttpResponse.BodyHandlers.ofString());
    r.headers().firstValue("Set-Cookie").ifPresent(c -> cookie = c.split(";")[0]);
    return new Result(
        r.statusCode(), r.body().isBlank() ? obj() : (ObjectNode) M.readTree(r.body()));
  }

  ObjectNode input() {
    var start = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).plusDays(1);
    return obj(
        "originCity",
        "Mumbai",
        "destinationCity",
        "Jaipur",
        "startDate",
        start.toString(),
        "endDate",
        start.plusDays(1).toString(),
        "budget",
        obj("amountINR", 30000, "basis", "PER_GROUP", "includeMajorTransport", true),
        "adultCount",
        2,
        "childCount",
        0,
        "childAges",
        arr(),
        "roomCount",
        1,
        "interests",
        arr("heritage"),
        "pace",
        "BALANCED",
        "dietary",
        arr(),
        "accessibility",
        arr(),
        "weatherPreference",
        "AUTO",
        "departureAirport",
        "BOM",
        "arrivalAirport",
        "JAI");
  }

  @Test
  void acceptsLongTripsAndRejectsBeyondFourteenDays() throws Exception {
    var request = input();
    var start = java.time.LocalDate.parse(str(request, "startDate"));
    request.put("endDate", start.plusDays(13).toString());
    var validated = M.treeToValue(request, TripInput.class).normalized();
    assertEquals(14, validated.path("durationDays").asInt());
    request.put("endDate", start.plusDays(14).toString());
    assertThrows(ApiException.class, () -> M.treeToValue(request, TripInput.class).normalized());
  }

  ObjectNode generate(String id) throws Exception {
    var queued =
        call("POST", "/trips/" + id + "/generations", obj(), "Idempotency-Key", "gen-" + id);
    assertEquals(202, queued.status);
    String job = str(queued.body, "jobId");
    for (int i = 0; i < 100; i++) {
      var j = call("GET", "/jobs/" + job, null).body;
      if (str(j, "status").equals("SUCCEEDED")) return call("GET", "/trips/" + id, null).body;
      assertNotEquals("FAILED", str(j, "status"), j.toString());
      Thread.sleep(25);
    }
    fail("Generation timed out");
    return null;
  }

  @Test
  void fullApiPreservesContractsAndVersionedActions() throws Exception {
    assertEquals("Java Spring Boot", str(call("GET", "/health", null).body, "backend"));
    var bad = input();
    bad.put("endDate", date(str(bad, "startDate")).plusDays(14).toString());
    assertEquals(422, call("POST", "/trips", bad).status);
    var created = call("POST", "/trips", input());
    assertEquals(201, created.status);
    String id = str(created.body, "id");
    String session = cookie;
    cookie = "";
    assertEquals(404, call("GET", "/trips/" + id, null).status);
    cookie = session;
    assertEquals(403, call("POST", "/trips", input(), "Origin", "https://evil.example").status);
    var result = generate(id);
    var p = copy(result.path("activeVersion"));
    String original = str(p, "versionId");
    assertEquals("LIVE", str(p, "dataMode"));
    assertEquals("SOURCED", p.path("days").path(0).path("weather").path("status").asText());
    assertEquals("REPORTS_FOUND", p.path("disruptions").path("status").asText());
    assertTrue(
        engines.containsAll(
            Set.of("google_maps", "google_hotels", "google_news", "google_flights")));
    var repeated =
        call("POST", "/trips/" + id + "/generations", obj(), "Idempotency-Key", "gen-" + id);
    assertEquals(200, repeated.status);
    var pause =
        call(
            "POST",
            "/trips/" + id + "/replans",
            obj("baseVersionId", original, "weatherPreference", "STAY_BACK", "dayNumber", 1));
    assertEquals(200, pause.status, pause.body.toString());
    assertEquals(0, pause.body.path("activeVersion").path("days").path(0).path("stops").size());
    assertEquals(
        p.path("days").path(1).path("stops"),
        pause.body.path("activeVersion").path("days").path(1).path("stops"));
    assertEquals(
        409,
        call("POST", "/trips/" + id + "/edit", obj("baseVersionId", original, "bufferPercent", 20))
            .status);
    var restored =
        call(
            "POST",
            "/trips/" + id + "/restore",
            obj(
                "baseVersionId",
                pause.body.path("activeVersion").path("versionId"),
                "versionId",
                original));
    assertEquals(200, restored.status);
    var restoredPlan = restored.body.path("activeVersion");
    var extended =
        call(
            "POST",
            "/trips/" + id + "/extend",
            obj(
                "baseVersionId",
                restoredPlan.path("versionId"),
                "endDate",
                date(str(created.body, "endDate")).plusDays(2).toString(),
                "budgetINR",
                40000));
    assertEquals(200, extended.status, extended.body.toString());
    assertEquals(4, extended.body.path("trip").path("durationDays").asInt());
    assertEquals(
        restoredPlan.path("days").path(0),
        extended.body.path("activeVersion").path("days").path(0));
    var names = new HashSet<String>();
    for (var day : objects(extended.body.path("activeVersion").path("days")))
      for (var stop : objects(day.path("stops"))) assertTrue(names.add(str(stop, "name")));
    assertEquals(3, extended.body.path("activeVersion").path("stay").path("nights").asInt());
    var undo =
        call(
            "POST",
            "/trips/" + id + "/restore",
            obj(
                "baseVersionId",
                extended.body.path("activeVersion").path("versionId"),
                "versionId",
                original));
    assertEquals(created.body.path("endDate"), undo.body.path("trip").path("endDate"));
    assertEquals(30000, undo.body.path("trip").path("budget").path("amountINR").asInt());
    var shifted =
        call(
            "POST",
            "/trips/" + id + "/reschedule",
            obj(
                "baseVersionId",
                undo.body.path("activeVersion").path("versionId"),
                "startDate",
                date(str(created.body, "startDate")).plusDays(3).toString()));
    assertEquals(200, shifted.status, shifted.body.toString());
    var sp = shifted.body.path("activeVersion");
    String stopId = sp.path("days").path(0).path("stops").path(0).path("id").asText();
    var lock =
        call(
            "POST",
            "/trips/" + id + "/edit",
            obj("baseVersionId", sp.path("versionId"), "stopId", stopId, "locked", true));
    assertEquals(200, lock.status);
    assertEquals(
        422,
        call(
                "POST",
                "/trips/" + id + "/replans",
                obj(
                    "baseVersionId",
                    lock.body.path("activeVersion").path("versionId"),
                    "dayNumber",
                    1,
                    "weatherPreference",
                    "STAY_BACK"))
            .status);
    var exported = call("GET", "/trips/" + id + "/export", null);
    assertEquals(200, exported.status);
    assertEquals(id, exported.body.path("trip").path("id").asText());
    assertTrue(Files.readString(data.resolve("state.json")).contains(id));
    assertEquals(204, call("DELETE", "/trips/" + id, null).status);
  }

  @Test
  void forecastMissingValuesAndSevereRisk() {
    var w =
        weather.normalize(
            obj(
                "time",
                arr("2026-11-01"),
                "temperature_2m_max",
                arr((Object) null),
                "precipitation_probability_max",
                arr(95),
                "precipitation_sum",
                arr(80),
                "wind_speed_10m_max",
                arr(70),
                "weather_code",
                arr(95)),
            "2026-11-01",
            now(),
            "https://open-meteo.com/");
    assertTrue(w.path("temperatureC").isNull());
    assertEquals("HIGH", str(w, "risk"));
    assertEquals("UNKNOWN", str(weather.normalize(obj(), "2028-01-01", now(), ""), "status"));
  }

  @AfterAll
  static void cleanup() {
    provider.stop(0);
  }
}
