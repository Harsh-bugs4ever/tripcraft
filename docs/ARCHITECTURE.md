# Java backend architecture

TripCraft 2.0 uses Java 17 and Spring Boot 3.5.16 with embedded Tomcat. React 19/Vite remains the frontend. There is no Express API or TypeScript planning backend.

| Java class | Responsibility |
| --- | --- |
| TripCraftApplication | Spring bootstrap and compatible `.env` loading |
| TripController | REST endpoints, asynchronous generation jobs, cancellation/idempotency, optimistic revision commits |
| TripInput | Typed Java records and Jakarta Bean Validation for incoming drafts |
| SessionFilter | Signed guest cookies, origin validation, request body bounds, security headers |
| StateStore | Atomic snapshot writes, process lock, migration-compatible state and signing secret, restart recovery |
| PlannerService | Initial generation, conditions, selected-day replanning, replacement, extension, postponement, history restoration |
| ScheduleService | Pace, rest gaps, meal slots, locked/visited stops, fixed anchors, nearby alternatives |
| BudgetService | Integer-paise group totals, food counted once, buffer and budget basis |
| DiscoveryService | SerpApi normalization, evidence, hotel/flight quotes, disruption reports, optional grounded Groq ranking |
| WeatherService | Real forecast retrieval, missing-data handling and weather-risk screening |
| ProviderHttp | HTTP timeouts, bounded responses, server-side provider calls |
| ApiErrors | Stable `{detail}` error responses without credential leakage |

The frontend `/api/v1` contract is preserved. Vite proxies it to Java during development; the packaged Java process serves both the built React assets and API from port 8080.

This is a modular monolith, not independently deployed microservices. No dummy Java service delegates business logic to Node. Node is only frontend tooling and browser-test tooling.

## Persistence and concurrency

Snapshots use the prior `trips`, `jobs`, `keys` JSON structure so existing data can be retained. The signed `tc_session` cookie and HMAC format also remain compatible. Keep the original data folder/secret/browser cookie when upgrading.

Short state transactions synchronize on StateStore. Each transaction copies the snapshot, writes it to disk, then publishes it in memory. External provider calls occur outside the lock. Their results activate only if the trip revision still matches; deletion, cancellation or intervening edits prevent stale activation. A bounded executor processes generation jobs. A second Java process cannot acquire the same data-folder lock.

This is single-process storage. Database transactions, account recovery, distributed workers and multi-instance operations remain future work. A future microservice split can use these module boundaries, but must replace local-state assumptions with durable service-owned storage and authenticated internal APIs.
