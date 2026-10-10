package in.tripcraft;

import java.nio.file.*;
import java.util.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TripCraftApplication {
  public static void main(String[] args) throws Exception {
    // Preserve .env setup across the migration. Environment variables take precedence.
    var defaults = new HashMap<String, Object>();
    Path env = Files.exists(Path.of(".env")) ? Path.of(".env") : Path.of("../.env");
    if (Files.exists(env))
      for (String line : Files.readAllLines(env)) {
        String l = line.trim();
        if (l.startsWith("#") || !l.contains("=")) continue;
        int split = l.indexOf('=');
        String key = l.substring(0, split).trim(), value = l.substring(split + 1).trim();
        if (value.length() > 1
            && ((value.startsWith("\"") && value.endsWith("\""))
                || (value.startsWith("'") && value.endsWith("'"))))
          value = value.substring(1, value.length() - 1);
        if (!value.isEmpty()) defaults.put(key, value);
      }
    var app = new SpringApplication(TripCraftApplication.class);
    app.setDefaultProperties(defaults);
    app.run(args);
  }
}
