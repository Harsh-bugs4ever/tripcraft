# Follow-up engineering prompt

Inspect this actual TripCraft 2.0 repository and read README.md, ARCHITECTURE.md, ISSUES.md and VERIFICATION.md. Its backend is Java 17 + Spring Boot 3.5.16; the frontend is React/Vite. Do not reintroduce an Express backend or mislabel the modular app as distributed microservices.

Preserve the frontend API contract, evidence labels, session ownership, saved-state compatibility, atomic/revision-protected writes, jobs, live weather, disruption reports, anchors, food/budget arithmetic, day-specific changes, extensions and date-aware restoration.

Use bounded engineering loops: inspect a concrete gap → specify acceptance behavior → make one coherent change → run focused Java/API/browser checks → fix evidenced failures → record results. Keep credentials server-side. Never invent venue facts, quotes, route times, tests or verification results. Prioritize credentialed provider smoke tests, routing/hours correctness, quote basis normalization, database/account migration, and only then separately deployed microservices if explicitly required.
