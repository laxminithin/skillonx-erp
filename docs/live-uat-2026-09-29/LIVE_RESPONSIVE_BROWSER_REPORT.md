# LIVE RESPONSIVE BROWSER REPORT

Evidence: `live-uat-evidence/json/live_probe_latest.json`, `live-uat-evidence/screenshots/login-*.png`.

| Area | Viewports / Browser | Result | Notes |
|---|---|---|---|
| Login responsive overflow | 320, 360, 375, 390, 412, 768, 1024, 1280, 1366, 1440, 1920 px | PASS | No horizontal overflow detected on login page |
| Chromium login smoke | Chromium | PASS | No console errors, failed requests, or API errors during unauthenticated route probe |
| Firefox smoke | Firefox | BLOCKED | Playwright Firefox binary was not installed in the local runner |
| WebKit/Safari smoke | WebKit | BLOCKED | Playwright WebKit binary was not installed in the local runner |
| Authenticated portal responsive matrix | All portals | BLOCKED | Only 1366px authenticated route smoke was captured; full multi-breakpoint portal certification remains open |

