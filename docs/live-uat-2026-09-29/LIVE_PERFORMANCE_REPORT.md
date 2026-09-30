# LIVE PERFORMANCE REPORT

Evidence: `live-uat-evidence/json/live_probe_latest.json`.

This was a smoke-level live performance capture, not load testing.

| Area | Observed Timing | Result |
|---|---:|---|
| API health | 230 ms | PASS |
| Login API calls | 145-207 ms | PASS |
| Sampled direct authorization APIs | 51-282 ms | PASS |
| Authenticated route smoke | ~1.6-2.3 s per route in Chromium | PASS for smoke |
| Public protected-route redirects | ~1.0-1.3 s per route | PASS for smoke |

Blocked:

- No load/stress testing was performed against production.
- No N+1 or payload-size analysis was completed.
- Report/export generation timings were not tested because export workflows need module-specific authorization and content verification.

