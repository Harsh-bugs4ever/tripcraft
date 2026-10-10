# Remaining limitations

1. Production SerpApi and Groq credentials were not supplied; authenticated provider smoke tests remain pending.
2. Road routing, full holiday/opening-hour checks, live AQI and crowd forecasts remain unimplemented.
3. Hotel/flight quote bases are not fully normalized; unknown costs remain outside the provisional subtotal.
4. Atomic JSON is single-process guest-session storage. No multi-instance database or cross-device account recovery.
5. External map tiles may fail independently; place lists/directions remain available.
6. Dietary/accessibility preferences and walking limits need venue/routing verification.
7. Disruption watch is an on-demand news search, not an official alert feed or emergency notification system.
8. Extensions stay in the same destination. Insufficient suitable candidates produce clearly empty days, not invented stops.
9. The backend is modular Spring Boot, not a distributed microservice cluster.
