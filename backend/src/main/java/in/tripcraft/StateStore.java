package in.tripcraft;

import static in.tripcraft.Json.*;

import com.fasterxml.jackson.databind.node.*;
import jakarta.annotation.PreDestroy;
import java.io.*;
import java.nio.channels.*;
import java.nio.file.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** One process owns the file. Snapshots are saved before publishing in-memory changes. */
@Component
public class StateStore {
  private final Path file;
  private ObjectNode state;
  private final FileChannel channel;
  private final FileLock lock;
  public final String secret;

  public StateStore(
      @Value("${tripcraft.data-dir}") String directory,
      @Value("${tripcraft.session-secret}") String configuredSecret)
      throws Exception {
    Path dir = Path.of(directory).toAbsolutePath();
    Files.createDirectories(dir);
    file = dir.resolve("state.json");
    channel =
        FileChannel.open(
            dir.resolve("server.lock"), StandardOpenOption.CREATE, StandardOpenOption.WRITE);
    lock = channel.tryLock();
    if (lock == null)
      throw new IOException("Data directory already belongs to another running server");
    Path secretPath = dir.resolve("session-secret");
    if (!Files.exists(secretPath))
      Files.writeString(secretPath, id() + id(), StandardOpenOption.CREATE_NEW);
    secret = configuredSecret.isBlank() ? Files.readString(secretPath).trim() : configuredSecret;
    state =
        Files.exists(file)
            ? (ObjectNode) M.readTree(Files.readString(file))
            : obj("trips", arr(), "jobs", arr(), "keys", obj());
    for (var job : objects(state.path("jobs")))
      if (running(job)) {
        job.put("status", "FAILED");
        job.put(
            "error", "Server restarted. Retry generation; incomplete plans were not activated.");
      }
    save(state);
  }

  public static boolean running(ObjectNode j) {
    return str(j, "status").equals("RUNNING") || str(j, "status").equals("QUEUED");
  }

  public synchronized ObjectNode snapshot() {
    return state.deepCopy();
  }

  public synchronized <T> T write(java.util.function.Function<ObjectNode, T> operation) {
    var next = state.deepCopy();
    T result = operation.apply(next);
    save(next);
    state = next;
    return result;
  }

  private void save(ObjectNode data) {
    try {
      Path tmp = file.resolveSibling("state.json.tmp");
      byte[] bytes = M.writeValueAsBytes(data);
      try (var out =
          FileChannel.open(
              tmp,
              StandardOpenOption.CREATE,
              StandardOpenOption.TRUNCATE_EXISTING,
              StandardOpenOption.WRITE)) {
        var buffer = java.nio.ByteBuffer.wrap(bytes);
        while (buffer.hasRemaining()) out.write(buffer);
        out.force(true);
      }
      try {
        Files.move(tmp, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
      } catch (AtomicMoveNotSupportedException e) {
        Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (IOException e) {
      throw new ApiException(
          503, "Could not save changes. Check disk space and data-directory permissions.");
    }
  }

  public static ObjectNode trip(ObjectNode state, String id, String owner) {
    return objects(state.path("trips")).stream()
        .filter(t -> str(t, "id").equals(id) && str(t, "userId").equals(owner))
        .findFirst()
        .orElseThrow(() -> new ApiException(404, "Trip not found."));
  }

  public static ObjectNode job(ObjectNode state, String id, String owner) {
    return objects(state.path("jobs")).stream()
        .filter(t -> str(t, "jobId").equals(id) && str(t, "owner").equals(owner))
        .findFirst()
        .orElseThrow(() -> new ApiException(404, "Job not found."));
  }

  public static ObjectNode active(ObjectNode t) {
    return objects(t.path("versions")).stream()
        .filter(v -> str(v, "versionId").equals(str(t, "activeVersionId")))
        .findFirst()
        .orElse(null);
  }

  public static ObjectNode commit(ObjectNode t, ObjectNode v) {
    ((ArrayNode) t.path("versions")).add(v);
    t.put("activeVersionId", str(v, "versionId"));
    t.put("revision", t.path("revision").asInt() + 1);
    t.put("updatedAt", now());
    return obj("trip", t, "activeVersion", v);
  }

  @PreDestroy
  public void close() throws IOException {
    lock.release();
    channel.close();
  }
}
