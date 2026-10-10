# Migration traceability

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Java + Spring Boot backend | backend Maven project; Express removed | Java build and executable JAR |
| React interface retained | src/components and Vite proxy | TypeScript/build/browser checks |
| Real travel APIs | DiscoveryService and ProviderHttp | HTTP provider fixtures; production key needed |
| Live weather | WeatherService | normalization, risk and HTTP behavior |
| Disruption information | source-linked Google News reports | integration test; not official active alerts |
| Weather replanning | PlannerService and ScheduleService | selected-day, locks and severe-risk tests |
| Trip extension | extend action, up to 14 total days | original days/date/cost and duplicate checks |
| Saved trips | StateStore, compatible session signatures | integration and reopen tests |
| Versions/postponement | settings snapshots, restore/reschedule | date and budget restoration tests |
| Optional AI | Groq ranking restricted to retrieved IDs | invalid data falls back; credentialed smoke pending |
| Distributed microservices | not implemented | modular Spring Boot application, documented honestly |
