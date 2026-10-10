package in.tripcraft;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.time.*;
import java.util.*;

public final class Json {
  public static final ObjectMapper M = new ObjectMapper();

  public static ObjectNode obj(Object... pairs) {
    var n = M.createObjectNode();
    for (int i = 0; i < pairs.length; i += 2) n.set(pairs[i].toString(), node(pairs[i + 1]));
    return n;
  }

  public static JsonNode node(Object v) {
    return v == null ? NullNode.instance : v instanceof JsonNode j ? j : M.valueToTree(v);
  }

  public static ArrayNode arr(Object... values) {
    var a = M.createArrayNode();
    for (Object v : values) a.add(node(v));
    return a;
  }

  public static ArrayNode array(Collection<? extends JsonNode> values) {
    var a = M.createArrayNode();
    values.forEach(a::add);
    return a;
  }

  public static List<ObjectNode> objects(JsonNode n) {
    var out = new ArrayList<ObjectNode>();
    if (n != null && n.isArray())
      n.forEach(
          v -> {
            if (v.isObject()) out.add((ObjectNode) v);
          });
    return out;
  }

  public static String str(JsonNode n, String k) {
    return n.path(k).asText("");
  }

  public static String id() {
    return UUID.randomUUID().toString();
  }

  public static String now() {
    return Instant.now().toString();
  }

  public static ObjectNode evidence(Object v, String... ids) {
    return obj(
        "value",
        v,
        "sourceIds",
        arr((Object[]) ids),
        "retrievedAt",
        ids.length > 0 ? now() : null,
        "observedAt",
        null,
        "status",
        v == null ? "UNKNOWN" : ids.length > 0 ? "SOURCED" : "ESTIMATED",
        "assumptions",
        arr());
  }

  public static ObjectNode copy(JsonNode n) {
    return ((ObjectNode) n).deepCopy();
  }

  public static String join(JsonNode n) {
    var v = new ArrayList<String>();
    if (n.isArray()) n.forEach(x -> v.add(x.asText()));
    return String.join(" ", v);
  }

  public static LocalDate date(String s) {
    try {
      if (!s.matches("\\d{4}-\\d{2}-\\d{2}")) throw new Exception();
      return LocalDate.parse(s);
    } catch (Exception e) {
      throw new ApiException(422, "Use a valid YYYY-MM-DD date.");
    }
  }

  public static void require(boolean ok, String message) {
    if (!ok) throw new ApiException(422, message);
  }
}
