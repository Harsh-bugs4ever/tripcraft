// HTTP response fixtures for automated browser tests only. Never imported by the app.
import { createServer } from "node:http";
export async function startProviderFixture({ initialDelayMs = 0 } = {}) {
  let severe = false,
    delayed = false;
  const server = createServer((req, res) => {
    const u = new URL(req.url, "http://localhost");
    const engine = u.searchParams.get("engine");
    let payload = {};
    if (u.pathname === "/weather") {
      const time = Array.from({ length: 16 }, (_, i) =>
        new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      );
      payload = {
        daily: {
          time,
          temperature_2m_max: time.map(() => 25),
          precipitation_probability_max: time.map(() => (severe ? 95 : 10)),
          precipitation_sum: time.map(() => (severe ? 80 : 0)),
          wind_speed_10m_max: time.map(() => 10),
          weather_code: time.map(() => (severe ? 95 : 0)),
        },
      };
    } else if (engine === "google_maps") {
      const food = u.searchParams.get("q").includes("restaurants");
      payload = {
        local_results: Array.from({ length: 20 }, (_, i) => ({
          place_id: `${food ? "food" : "museum"}${i}`,
          title: `Test ${food ? "Cafe" : "Museum"} ${i}`,
          address: "Test address, Alibaug",
          type: food ? "Restaurant" : "Museum",
          rating: 4.2,
          reviews: 70,
          gps_coordinates: { latitude: 18.64 + i * 0.001, longitude: 72.87 },
        })),
      };
    } else if (engine === "google_hotels")
      payload = {
        properties: [
          {
            name: "Test Hotel",
            property_token: "test-hotel",
            total_rate: { extracted_lowest: 8000 },
            link: "https://example.org/hotel",
          },
        ],
      };
    else if (engine === "google_news")
      payload = {
        news_results: [
          {
            title: "Alibaug storm warning disrupts roads",
            link: "https://example.org/report",
            date: "1 hour ago",
            source: { name: "Test publisher" },
          },
        ],
      };
    else payload = { organic_results: [] };
    const send = () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    };
    if (engine === "google_maps" && !delayed && initialDelayMs) {
      delayed = true;
      setTimeout(send, initialDelayMs);
    } else send();
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    setSevere: (value) => {
      severe = value;
    },
    close: () => new Promise((r) => server.close(r)),
  };
}
