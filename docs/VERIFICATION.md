# Java migration verification — 8 October 2026

The project uses Java 17 + Spring Boot 3.5.16. Maven compiles and packages an executable JAR. Verification uses the actual Spring HTTP server and Java business logic; local HTTP fixtures stand in for credentialed providers during deterministic tests.

## Checks

- Java planner tests: group budget/food arithmetic, fixed anchors, nonoverlapping schedules, severe-weather pause, selected-day isolation and locked-outing protection.
- Persistence test: state survives reopening, signing secret persists and interrupted jobs become failed after restart.
- Spring integration test: validation, session ownership, rejected cross-origin writes, asynchronous generation and idempotency, live adapter normalization, hotels/flights/news/weather calls, selected-day replanning, stale-version conflicts, extension without duplicate places, date/budget restoration, postponement, lock protection, JSON export and deletion.
- TypeScript check and Vite production build for the retained React frontend.
- Browser flow: real Java backend + React, desktop/mobile rendering, image loading, trip generation, weather refresh and pause, history restoration, extension, postponement, mobile itinerary, export/PDF, saved reload and menu navigation.

Provider fixtures are not real travel quotes. Screenshot/PDF artifacts under `docs/screenshots` are test output only. No credentials or guest data are included in the ZIP.

A real HTTP request from the Java WeatherService to Open-Meteo succeeded on 8 October 2026, returning a sourced forecast with a retrieval timestamp. No fixture was used for that smoke check.

## Limits

SerpApi and Groq production credentials were not supplied; authenticated live-provider smoke tests remain pending. The API integrations are implemented and tested against representative HTTP responses. Road times, full venue-hours validation, booking-price basis, live AQI and accessibility guarantees are not implemented. No full accessibility, security or production-load audit is claimed.

## Animated UI update — 2026-10-08

TypeScript validation and production build passed. Browser checks against the Java backend passed for desktop/mobile loading layouts, pause control, reduced-motion preference, no horizontal overflow, and the existing planning/replanning/extension/saved-plan flow. Screenshots are in `screenshots/planning-desktop.png` and `screenshots/planning-mobile.png`. Provider fixtures are used only by tests.

## Route refinement — 2026-10-09

Added hash routes: `#/`, `#/plan`, `#/saved`, `#/itinerary`, `#/trips/{id}` and `#/jobs/{id}`. Trip/job links require the same browser session; they are not public share links. Refresh restores saved plans; browser Back/Forward restores navigation. Unknown frontend routes recover to Home with a message; unavailable trip links recover to Saved trips. Skip navigation preserves the current URL. Background generation no longer forces navigation from another page. Drafts without plans open for review instead of automatically regenerating.

API route audit: frontend adjustment names match the Java controller and planner actions (conditions, replans, extend, reschedule, edit, replacements, trim-extras, restore). Unknown endpoints return JSON 404; unsupported HTTP methods return JSON 405.

Validation: six Java tests passed; TypeScript check and production build passed. Browser checks passed, including trip URL refresh, Back/Forward, API 404/405, desktop/mobile navigation, animated loading, planning, weather replan, extension, reschedule, export and saved reload. External provider responses in automated tests use fixtures; real SerpApi credentials were not tested in this run.

## Open destination search and local gems

Replaced fixed landing-page origin/destination selects with free-text fields and removed demo-only destination messaging. Dedicated SerpApi Maps queries now search local food and markets/lesser-known places for the entered destination. Up to six candidates receive web corroboration searches; duplicates retain local-search evidence. Uncorroborated candidates carry LOW confidence; no fictional picks are substituted. Coverage depends on SerpApi results. Existing saved plans are unchanged; create a new plan to use the updated discovery.

Validation passed: TypeScript, production build, six Java tests, browser custom-origin/destination handoff, local-pick presence/LOW confidence for uncorroborated fixtures, and existing end-to-end flows. Live SerpApi credentials were not supplied for production validation.

## Supplied logo and additional 3D accents

Used the supplied original PNG in the header/footer and favicon. Added CSS perspective map, compass/bookmark token and plane illustrations to planner, itinerary and saved plans. Entrance animations finish within three seconds; reduced-motion disables them. Decorative artwork is hidden from assistive technology and print output. TypeScript, production build and desktop/mobile end-to-end checks passed.

## Welcome experience

Added first-visit welcome screen with CSS 3D compass globe, passport, ticket and plane entrance animation, Enter and Skip controls, Escape handling, initial keyboard focus and reduced-motion support. Shown once per tab session on the home URL; deep links bypass it. Added perspective hover effects to destination cards. TypeScript, build and desktop/mobile browser flow passed. Screenshots: welcome-desktop.png and welcome-mobile.png.

## Groq migration and weather configuration (2026-10-09)

- Frontend TypeScript check and production build passed.
- Nine Java tests passed, including three new provider migration tests.
- Groq HTTP test checks Bearer authorization, model selection, JSON object requests, and chat completion parsing. Invalid JSON, repeated IDs, and invented IDs are rejected.
- Weather tests cover free requests, paid API key attachment, credential-free source links, forecast dates outside available data, and provider failure.
- Tests use local fixtures/mocks. Live authenticated Groq and SerpApi calls still require user keys.
