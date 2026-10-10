# Decisions

- Migrate business logic completely into Java/Spring Boot; preserve React and its HTTP contract.
- Keep existing atomic JSON and signed-cookie formats so saved plans can be retained. Use a process lock and revision checks for correctness.
- Use typed validated draft DTOs at the API boundary and Jackson trees for the existing flexible plan/evidence serialization contract.
- Default exclusively to live provider calls. Provider fixtures belong only to automated tests.
- Rank fetched IDs with optional Groq; validate IDs and let Java own facts, schedules and arithmetic.
- Keep unknown fields unknown. Show news as reports, not verified official emergency warnings.
- Supply a compiled JAR and React build so the user can preview without installing npm dependencies. Include Maven Wrapper and full Java source for rebuilding.
- A modular Spring Boot app is the shipped architecture; independently deployed microservices are not claimed.
