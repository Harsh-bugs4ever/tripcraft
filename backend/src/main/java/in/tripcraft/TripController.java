package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.node.*;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class TripController {
  private final StateStore store;
  private final PlannerService planner;
  private final DiscoveryService discovery;
  private final ThreadPoolExecutor executor =
      new ThreadPoolExecutor(2, 4, 30, TimeUnit.SECONDS, new ArrayBlockingQueue<>(16));

  public TripController(StateStore store, PlannerService planner, DiscoveryService discovery) {
    this.store = store;
    this.planner = planner;
    this.discovery = discovery;
  }

  private String owner(HttpServletRequest req) {
    return (String) req.getAttribute("owner");
  }

  @GetMapping("/health")
  public ObjectNode health() {
    return obj("status", "UP", "backend", "Java Spring Boot");
  }

  @GetMapping("/mode")
  public ObjectNode mode() {
    return obj(
        "mode",
        "LIVE",
        "hasSerpApi",
        discovery.configured(),
        "hasGroq",
        discovery.aiConfigured(),
        "weatherProvider",
        "Open-Meteo",
        "setupRequired",
        !discovery.configured(),
        "backend",
        "Java Spring Boot");
  }

  @GetMapping("/cities")
  public ObjectNode cities() {
    return obj("hubs", arr());
  } // Free-text city input; no fabricated route catalogue.

  @GetMapping("/trips")
  public ObjectNode list(HttpServletRequest req) {
    return obj(
        "trips",
        array(
            objects(store.snapshot().path("trips")).stream()
                .filter(t -> str(t, "userId").equals(owner(req)))
                .sorted(Comparator.comparing((ObjectNode t) -> str(t, "updatedAt")).reversed())
                .toList()));
  }

  @PostMapping("/trips")
  public ResponseEntity<ObjectNode> create(
      @Valid @RequestBody TripInput input, HttpServletRequest req) {
    var trip = input.normalized();
    trip.put("id", id());
    trip.put("userId", owner(req));
    trip.put("revision", 1);
    trip.put("createdAt", now());
    trip.put("updatedAt", now());
    trip.set("destinationCoords", obj("lat", 0, "lng", 0));
    trip.set("versions", arr());
    return ResponseEntity.status(201)
        .body(
            store.write(
                state -> {
                  ((ArrayNode) state.path("trips")).add(trip);
                  return trip.deepCopy();
                }));
  }

  @GetMapping("/trips/{id}")
  public ObjectNode read(@PathVariable String id, HttpServletRequest req) {
    var t = StateStore.trip(store.snapshot(), id, owner(req));
    return obj("trip", t, "activeVersion", StateStore.active(t));
  }

  @DeleteMapping("/trips/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest req) {
    store.write(
        state -> {
          StateStore.trip(state, id, owner(req));
          state.set(
              "trips",
              array(
                  objects(state.path("trips")).stream()
                      .filter(t -> !str(t, "id").equals(id))
                      .toList()));
          objects(state.path("jobs")).stream()
              .filter(j -> str(j, "tripId").equals(id) && StateStore.running(j))
              .forEach(j -> j.put("status", "CANCELLED"));
          return null;
        });
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/trips/{id}/generations")
  public ResponseEntity<ObjectNode> generate(
      @PathVariable String id,
      @RequestBody(required = false) ObjectNode body,
      @RequestHeader(value = "Idempotency-Key", required = false) String requestKey,
      HttpServletRequest req) {
    String owner = owner(req), key = owner + ":" + (requestKey == null ? Json.id() : requestKey);
    if (key.length() > 250) throw new ApiException(422, "Idempotency key too long.");
    String hash = hash(id + (body == null ? "{}" : body.toString()));
    var created =
        store.write(
            state -> {
              var t = StateStore.trip(state, id, owner);
              var old = state.path("keys").path(key);
              if (!old.isMissingNode()) {
                if (!str(old, "hash").equals(hash))
                  throw new ApiException(409, "Idempotency key belongs to another request.");
                return obj(
                    "existing",
                    true,
                    "job",
                    StateStore.job(state, str(old, "jobId"), owner).deepCopy());
              }
              if (objects(state.path("jobs")).stream()
                  .anyMatch(j -> str(j, "owner").equals(owner) && StateStore.running(j)))
                throw new ApiException(
                    429, "A plan is already generating. Wait or cancel it first.");
              var job =
                  obj(
                      "owner",
                      owner,
                      "jobId",
                      Json.id(),
                      "tripId",
                      id,
                      "status",
                      "QUEUED",
                      "currentStage",
                      "Validating your trip",
                      "completedStages",
                      arr(),
                      "warnings",
                      arr(),
                      "resultVersionId",
                      null,
                      "createdAt",
                      now(),
                      "updatedAt",
                      now());
              ((ArrayNode) state.path("jobs")).add(job);
              ((ObjectNode) state.path("keys"))
                  .set(key, obj("hash", hash, "jobId", job.path("jobId")));
              return obj("existing", false, "job", job.deepCopy(), "trip", t.deepCopy());
            });
    var job = copy(created.path("job"));
    if (created.path("existing").asBoolean()) return ResponseEntity.ok(job);
    var trip = copy(created.path("trip"));
    String jobId = str(job, "jobId");
    try {
      executor.execute(() -> runGeneration(owner, trip, jobId));
    } catch (RejectedExecutionException e) {
      fail(owner, jobId, "Planner busy. Retry shortly.");
      throw new ApiException(503, "Planner busy. Retry shortly.");
    }
    return ResponseEntity.status(202).body(job);
  }

  private void runGeneration(String owner, ObjectNode trip, String jobId) {
    try {
      boolean run =
          store.write(
              state -> {
                var job = StateStore.job(state, jobId, owner);
                if (!StateStore.running(job)) return false;
                job.put("status", "RUNNING");
                job.put("currentStage", "Searching places, stays and weather in Java");
                job.put("updatedAt", now());
                return true;
              });
      if (!run) return;
      var version = planner.generate(trip);
      store.write(
          state -> {
            var job = StateStore.job(state, jobId, owner);
            if (!StateStore.running(job)) return null;
            var current = StateStore.trip(state, str(trip, "id"), owner);
            if (current.path("revision").asInt() != trip.path("revision").asInt())
              throw new ApiException(
                  409, "Trip changed while planning. Retry using the latest version.");
            StateStore.commit(current, version);
            job.put("status", "SUCCEEDED");
            job.put("resultVersionId", str(version, "versionId"));
            job.put("currentStage", "Ready");
            job.set("warnings", version.path("warnings"));
            job.put("updatedAt", now());
            return null;
          });
    } catch (Exception e) {
      fail(
          owner,
          jobId,
          e instanceof ApiException
              ? e.getMessage()
              : "Generation failed. Check provider connectivity and retry.");
    }
  }

  private void fail(String owner, String id, String message) {
    store.write(
        state -> {
          var j = StateStore.job(state, id, owner);
          if (StateStore.running(j)) {
            j.put("status", "FAILED");
            j.put("error", message);
            j.put("updatedAt", now());
          }
          return null;
        });
  }

  @GetMapping("/jobs/{id}")
  public ObjectNode job(@PathVariable String id, HttpServletRequest req) {
    return StateStore.job(store.snapshot(), id, owner(req));
  }

  @PostMapping("/jobs/{id}/cancel")
  public ObjectNode cancel(@PathVariable String id, HttpServletRequest req) {
    return store.write(
        state -> {
          var j = StateStore.job(state, id, owner(req));
          if (Set.of("SUCCEEDED", "FAILED").contains(str(j, "status")))
            throw new ApiException(409, "Job already finished.");
          j.put("status", "CANCELLED");
          j.put("updatedAt", now());
          return j.deepCopy();
        });
  }

  @PostMapping("/trips/{id}/{action}")
  public ObjectNode adjust(
      @PathVariable String id,
      @PathVariable String action,
      @RequestBody ObjectNode input,
      HttpServletRequest req) {
    String owner = owner(req);
    var trip = StateStore.trip(store.snapshot(), id, owner);
    var current = StateStore.active(trip);
    if (current == null) throw new ApiException(409, "Generate a plan first.");
    if (!str(input, "baseVersionId").equals(str(current, "versionId")))
      throw new ApiException(409, "Plan changed. Refresh before editing.");
    var change = planner.adjust(trip, current, action, input);
    return store.write(
        state -> {
          var t = StateStore.trip(state, id, owner);
          if (t.path("revision").asInt() != trip.path("revision").asInt())
            throw new ApiException(409, "Plan changed during this request. Refresh and retry.");
          for (String field : List.of("startDate", "endDate", "durationDays", "budget"))
            t.set(field, change.draft().path(field));
          return StateStore.commit(t, change.plan()).deepCopy();
        });
  }

  @GetMapping("/trips/{id}/export")
  public ResponseEntity<ObjectNode> export(@PathVariable String id, HttpServletRequest req) {
    var t = StateStore.trip(store.snapshot(), id, owner(req));
    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=tripcraft-plan.json")
        .body(obj("trip", t, "plan", StateStore.active(t)));
  }

  private String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @PreDestroy
  public void stop() {
    executor.shutdownNow();
    try {
      executor.awaitTermination(5, TimeUnit.SECONDS);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }
}
